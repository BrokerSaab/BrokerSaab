import { Router, Response } from 'express';
import { z } from 'zod';
import { Role, QuoteStatus } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { io } from '../app';
import { sendPushNotification } from '../utils/pushNotification';

const router = Router();

// ── Zod schemas ──────────────────────────────────────────────────────────────

const requestQuoteSchema = z.object({
  body: z.object({
    advisorId:     z.string().uuid('Invalid advisor ID'),
    categorySlug:  z.string().optional(),
    clientMessage: z.string().max(1000).optional(),
  }),
});

const submitQuoteSchema = z.object({
  body: z.object({
    lineItems: z.array(z.object({
      description: z.string().min(1, 'Description required'),
      amount:      z.number().positive('Amount must be positive'),
    })).min(1, 'At least one line item required'),
    advisorNote:   z.string().max(1000).optional(),
    validityHours: z.number().int().min(1).max(168).optional(), // 1h–7d
  }),
});

// ── Helper ────────────────────────────────────────────────────────────────────

const QUOTE_INCLUDE = {
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
  advisor: { select: { id: true, fullName: true, avatarUrl: true, pushToken: true } },
  client:  { select: { id: true, fullName: true, phoneNumber: true, pushToken: true } },
};

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /quotes
 * CLIENT requests a fee quote from an advisor.
 */
router.post(
  '/',
  authenticateJWT,
  validateRequest(requestQuoteSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const clientId = req.user!.id;
    if (req.user!.role !== Role.CLIENT) {
      res.status(403).json({ success: false, message: 'Only clients can request quotes' });
      return;
    }

    const { advisorId, categorySlug, clientMessage } = req.body;

    try {
      // Guard: only one open request per (client, advisor) pair
      const existing = await prisma.feeQuote.findFirst({
        where: {
          clientId,
          advisorId,
          status: { in: [QuoteStatus.REQUESTED, QuoteStatus.QUOTED] },
        },
      });
      if (existing) {
        res.status(400).json({
          success: false,
          message: existing.status === QuoteStatus.QUOTED
            ? 'You already have a quote from this advisor. Please view it first.'
            : 'You already have a pending quote request with this advisor.',
        });
        return;
      }

      const advisor = await prisma.advisor.findUnique({ where: { id: advisorId } });
      if (!advisor) {
        res.status(404).json({ success: false, message: 'Advisor not found' });
        return;
      }

      const clientUser = await prisma.user.findUnique({ where: { id: clientId } });

      const quote = await prisma.feeQuote.create({
        data: { clientId, advisorId, categorySlug, clientMessage, status: QuoteStatus.REQUESTED },
      });

      // Create in-app notification for advisor
      await prisma.notification.create({
        data: {
          userId: advisor.phoneNumber
            ? (await prisma.user.findUnique({ where: { phoneNumber: advisor.phoneNumber } }))?.id ?? advisorId
            : advisorId,
          type:  'QUOTE_REQUESTED',
          refId: quote.id,
          title: 'New Fee Quote Request',
          body:  `${clientUser?.fullName ?? 'A client'} has requested a fee quote${categorySlug ? ` for ${categorySlug}` : ''}.`,
        },
      }).catch(() => { /* notification failure is non-fatal */ });

      // Real-time socket event to advisor's room
      io.to(`advisor:${advisorId}`).emit('quote_requested', {
        quoteId:     quote.id,
        clientName:  clientUser?.fullName ?? 'A client',
        categorySlug,
        message: clientMessage,
      });

      // Push notification to advisor
      if (advisor.pushToken) {
        sendPushNotification(
          advisor.pushToken,
          'New Fee Quote Request',
          `${clientUser?.fullName ?? 'A client'} wants a fee breakdown from you.`,
          { quoteId: quote.id, screen: 'QuoteRequests' }
        );
      }

      res.status(201).json({ success: true, data: quote });
    } catch (err) {
      console.error('[POST /quotes]', err);
      res.status(500).json({ success: false, message: 'Failed to create quote request' });
    }
  }
);

/**
 * GET /quotes
 * CLIENT: list their own requests (with advisor info + lineItems).
 * ADVISOR: list incoming requests (with client info + lineItems).
 */
router.get(
  '/',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: userId, role } = req.user!;
    try {
      if (role === Role.CLIENT) {
        const quotes = await prisma.feeQuote.findMany({
          where:   { clientId: userId },
          include: QUOTE_INCLUDE,
          orderBy: { createdAt: 'desc' },
        });
        // Runtime expiry check
        const now = new Date();
        const normalised = quotes.map(q => ({
          ...q,
          status: q.status === QuoteStatus.QUOTED && q.validUntil && q.validUntil < now
            ? QuoteStatus.EXPIRED
            : q.status,
        }));
        res.json({ success: true, data: normalised });
        return;
      }

      if (role === Role.ADVISOR) {
        const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: req.user!.phoneNumber } });
        if (!advisor) { res.status(404).json({ success: false, message: 'Advisor record not found' }); return; }

        const quotes = await prisma.feeQuote.findMany({
          where:   { advisorId: advisor.id },
          include: QUOTE_INCLUDE,
          orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: quotes });
        return;
      }

      res.status(403).json({ success: false, message: 'Forbidden' });
    } catch (err) {
      console.error('[GET /quotes]', err);
      res.status(500).json({ success: false, message: 'Failed to fetch quotes' });
    }
  }
);

/**
 * GET /quotes/unread-count
 * ADVISOR: returns count of REQUESTED quotes directed at them (for badge).
 */
router.get(
  '/unread-count',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.ADVISOR) {
      res.status(403).json({ success: false, message: 'Advisors only' });
      return;
    }
    try {
      const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: req.user!.phoneNumber } });
      if (!advisor) { res.json({ success: true, count: 0 }); return; }

      const count = await prisma.feeQuote.count({
        where: { advisorId: advisor.id, status: QuoteStatus.REQUESTED },
      });
      res.json({ success: true, count });
    } catch (err) {
      console.error('[GET /quotes/unread-count]', err);
      res.status(500).json({ success: false, message: 'Failed to get count' });
    }
  }
);

/**
 * GET /quotes/:id
 * CLIENT or ADVISOR: get a single quote with full line items.
 */
router.get(
  '/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: userId, role } = req.user!;
    try {
      const quote = await prisma.feeQuote.findUnique({
        where:   { id: req.params.id },
        include: QUOTE_INCLUDE,
      });
      if (!quote) { res.status(404).json({ success: false, message: 'Quote not found' }); return; }

      // Access control
      let advisorUserId = '';
      if (role === Role.ADVISOR) {
        const adv = await prisma.advisor.findUnique({ where: { phoneNumber: req.user!.phoneNumber } });
        advisorUserId = adv?.id ?? '';
      }
      const canAccess = (role === Role.CLIENT && quote.clientId === userId) ||
                        (role === Role.ADVISOR && quote.advisorId === advisorUserId);
      if (!canAccess) { res.status(403).json({ success: false, message: 'Access denied' }); return; }

      res.json({ success: true, data: quote });
    } catch (err) {
      console.error('[GET /quotes/:id]', err);
      res.status(500).json({ success: false, message: 'Failed to fetch quote' });
    }
  }
);

/**
 * POST /quotes/:id/submit
 * ADVISOR submits fee breakdown for a REQUESTED quote.
 */
router.post(
  '/:id/submit',
  authenticateJWT,
  validateRequest(submitQuoteSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.ADVISOR) {
      res.status(403).json({ success: false, message: 'Only advisors can submit quotes' });
      return;
    }
    const { lineItems, advisorNote, validityHours = 48 } = req.body;

    try {
      const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: req.user!.phoneNumber } });
      if (!advisor) { res.status(404).json({ success: false, message: 'Advisor not found' }); return; }

      const quote = await prisma.feeQuote.findUnique({ where: { id: req.params.id } });
      if (!quote || quote.advisorId !== advisor.id) {
        res.status(404).json({ success: false, message: 'Quote request not found' });
        return;
      }
      if (quote.status !== QuoteStatus.REQUESTED) {
        res.status(400).json({ success: false, message: 'Quote is no longer in REQUESTED state' });
        return;
      }

      const totalAmount = lineItems.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
      const validUntil = new Date(Date.now() + validityHours * 3_600_000);

      const updated = await prisma.$transaction(async (tx) => {
        // Replace any existing line items (idempotent re-submit)
        await tx.feeQuoteLineItem.deleteMany({ where: { quoteId: quote.id } });
        await tx.feeQuoteLineItem.createMany({
          data: lineItems.map((item: { description: string; amount: number }, i: number) => ({
            quoteId:     quote.id,
            description: item.description,
            amount:      item.amount,
            sortOrder:   i,
          })),
        });
        return tx.feeQuote.update({
          where: { id: quote.id },
          data: { status: QuoteStatus.QUOTED, totalAmount, advisorNote, validUntil },
          include: QUOTE_INCLUDE,
        });
      });

      // In-app notification for client
      const clientUser = await prisma.user.findUnique({ where: { id: quote.clientId } });
      await prisma.notification.create({
        data: {
          userId: quote.clientId,
          type:   'QUOTE_SUBMITTED',
          refId:  quote.id,
          title:  'Your Fee Quote is Ready!',
          body:   `${advisor.fullName} has sent you a fee breakdown of ₹${totalAmount.toLocaleString('en-IN')}.`,
        },
      }).catch(() => { /* non-fatal */ });

      // Socket event to client's room
      io.to(`user:${quote.clientId}`).emit('quote_submitted', {
        quoteId:     quote.id,
        totalAmount: String(totalAmount),
        advisorName: advisor.fullName,
        validUntil:  validUntil.toISOString(),
      });

      // Push notification to client
      if (clientUser?.pushToken) {
        sendPushNotification(
          clientUser.pushToken,
          'Your Fee Quote is Ready!',
          `${advisor.fullName} sent a fee breakdown of ₹${totalAmount.toLocaleString('en-IN')}.`,
          { quoteId: quote.id, screen: 'QuoteView' }
        );
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[POST /quotes/:id/submit]', err);
      res.status(500).json({ success: false, message: 'Failed to submit quote' });
    }
  }
);

/**
 * POST /quotes/:id/view
 * CLIENT marks a quote as viewed (sets viewedAt, status → VIEWED).
 */
router.post(
  '/:id/view',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const clientId = req.user!.id;
    try {
      const quote = await prisma.feeQuote.findUnique({ where: { id: req.params.id } });
      if (!quote || quote.clientId !== clientId) {
        res.status(404).json({ success: false, message: 'Quote not found' });
        return;
      }
      if (quote.status !== QuoteStatus.QUOTED) {
        res.json({ success: true, data: quote }); // already viewed/accepted — no-op
        return;
      }

      const updated = await prisma.feeQuote.update({
        where: { id: quote.id },
        data:  { viewedAt: new Date(), status: QuoteStatus.VIEWED },
      });

      // Notify advisor in real-time
      io.to(`advisor:${quote.advisorId}`).emit('quote_viewed', { quoteId: quote.id });

      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[POST /quotes/:id/view]', err);
      res.status(500).json({ success: false, message: 'Failed to mark quote as viewed' });
    }
  }
);

/**
 * POST /quotes/:id/accept
 * CLIENT accepts a quote (status → ACCEPTED).
 */
router.post(
  '/:id/accept',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const clientId = req.user!.id;
    try {
      const quote = await prisma.feeQuote.findUnique({ where: { id: req.params.id } });
      if (!quote || quote.clientId !== clientId) {
        res.status(404).json({ success: false, message: 'Quote not found' });
        return;
      }
      if (quote.status !== QuoteStatus.QUOTED && quote.status !== QuoteStatus.VIEWED) {
        res.status(400).json({ success: false, message: 'Quote cannot be accepted in its current state' });
        return;
      }

      const updated = await prisma.feeQuote.update({
        where: { id: quote.id },
        data:  { status: QuoteStatus.ACCEPTED },
      });

      io.to(`advisor:${quote.advisorId}`).emit('quote_accepted', { quoteId: quote.id });
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[POST /quotes/:id/accept]', err);
      res.status(500).json({ success: false, message: 'Failed to accept quote' });
    }
  }
);

/**
 * POST /quotes/:id/cancel
 * CLIENT or ADVISOR cancels a quote request.
 */
router.post(
  '/:id/cancel',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: userId, role } = req.user!;
    try {
      const quote = await prisma.feeQuote.findUnique({ where: { id: req.params.id } });
      if (!quote) { res.status(404).json({ success: false, message: 'Quote not found' }); return; }

      let advisorUserId = '';
      if (role === Role.ADVISOR) {
        const adv = await prisma.advisor.findUnique({ where: { phoneNumber: req.user!.phoneNumber } });
        advisorUserId = adv?.id ?? '';
      }
      const canCancel = (role === Role.CLIENT && quote.clientId === userId) ||
                        (role === Role.ADVISOR && quote.advisorId === advisorUserId);
      if (!canCancel) { res.status(403).json({ success: false, message: 'Access denied' }); return; }

      if (quote.status === QuoteStatus.ACCEPTED || quote.status === QuoteStatus.CANCELLED || quote.status === QuoteStatus.EXPIRED) {
        res.status(400).json({ success: false, message: 'Quote cannot be cancelled in its current state' });
        return;
      }

      const updated = await prisma.feeQuote.update({
        where: { id: quote.id },
        data:  { status: QuoteStatus.CANCELLED },
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[POST /quotes/:id/cancel]', err);
      res.status(500).json({ success: false, message: 'Failed to cancel quote' });
    }
  }
);

export default router;
