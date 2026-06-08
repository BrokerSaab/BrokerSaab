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
    validityHours: z.number().int().min(1).max(168).optional(),
  }),
});

const proactiveQuoteSchema = z.object({
  body: z.object({
    clientId:      z.string().uuid('Invalid client ID'),
    categorySlug:  z.string().optional(),
    advisorNote:   z.string().max(1000).optional(),
    lineItems: z.array(z.object({
      description: z.string().min(1, 'Description required'),
      amount:      z.number().positive('Amount must be positive'),
    })).min(1, 'At least one line item required'),
    validityHours: z.number().int().min(1).max(168).optional(),
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
      const existing = await prisma.feeQuote.findFirst({
        where: {
          clientId,
          advisorId,
          status: { in: [QuoteStatus.REQUESTED, QuoteStatus.QUOTED, QuoteStatus.VIEWED] },
        },
      });
      if (existing) {
        res.status(400).json({
          success: false,
          message: existing.status === QuoteStatus.QUOTED || existing.status === QuoteStatus.VIEWED
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
      }).catch(() => {});

      io.to(`advisor:${advisorId}`).emit('quote_requested', {
        quoteId:     quote.id,
        clientName:  clientUser?.fullName ?? 'A client',
        categorySlug,
        message: clientMessage,
      });

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
 * POST /quotes/proactive
 * ADVISOR proactively sends a fee breakdown to a connected client (no prior request needed).
 */
router.post(
  '/proactive',
  authenticateJWT,
  validateRequest(proactiveQuoteSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.ADVISOR) {
      res.status(403).json({ success: false, message: 'Only advisors can send proactive quotes' });
      return;
    }
    const { clientId, categorySlug, advisorNote, lineItems, validityHours = 72 } = req.body;

    try {
      const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: req.user!.phoneNumber } });
      if (!advisor) { res.status(404).json({ success: false, message: 'Advisor not found' }); return; }

      // Verify client has unlocked this advisor
      const unlock = await prisma.contactUnlock.findUnique({
        where: { userId_advisorId: { userId: clientId, advisorId: advisor.id } },
      });
      if (!unlock) {
        res.status(403).json({ success: false, message: 'Client has not connected with you' });
        return;
      }

      const clientUser = await prisma.user.findUnique({ where: { id: clientId } });
      if (!clientUser) { res.status(404).json({ success: false, message: 'Client not found' }); return; }

      // Check no open quote already exists
      const existing = await prisma.feeQuote.findFirst({
        where: {
          clientId,
          advisorId: advisor.id,
          status: { in: [QuoteStatus.REQUESTED, QuoteStatus.QUOTED, QuoteStatus.VIEWED] },
        },
      });
      if (existing) {
        res.status(400).json({ success: false, message: 'An open quote already exists for this client' });
        return;
      }

      const totalAmount = lineItems.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
      const validUntil = new Date(Date.now() + validityHours * 3_600_000);

      const quote = await prisma.$transaction(async (tx) => {
        const q = await tx.feeQuote.create({
          data: {
            clientId,
            advisorId: advisor.id,
            categorySlug,
            status: QuoteStatus.QUOTED,
            advisorNote,
            totalAmount,
            validUntil,
          },
        });
        await tx.feeQuoteLineItem.createMany({
          data: lineItems.map((item: { description: string; amount: number }, i: number) => ({
            quoteId: q.id,
            description: item.description,
            amount: item.amount,
            sortOrder: i,
          })),
        });
        return tx.feeQuote.findUnique({ where: { id: q.id }, include: QUOTE_INCLUDE });
      });

      await prisma.notification.create({
        data: {
          userId: clientId,
          type:   'QUOTE_SUBMITTED',
          refId:  quote!.id,
          title:  'Fee Quote from Your Advisor',
          body:   `${advisor.fullName} has sent you a fee breakdown of ₹${totalAmount.toLocaleString('en-IN')}.`,
        },
      }).catch(() => {});

      io.to(`user:${clientId}`).emit('quote_submitted', {
        quoteId:     quote!.id,
        totalAmount: String(totalAmount),
        advisorName: advisor.fullName,
        validUntil:  validUntil.toISOString(),
      });

      if (clientUser.pushToken) {
        sendPushNotification(
          clientUser.pushToken,
          'New Fee Quote from Your Advisor',
          `${advisor.fullName} sent a fee breakdown of ₹${totalAmount.toLocaleString('en-IN')}.`,
          { quoteId: quote!.id, screen: 'QuoteView' }
        );
      }

      res.status(201).json({ success: true, data: quote });
    } catch (err) {
      console.error('[POST /quotes/proactive]', err);
      res.status(500).json({ success: false, message: 'Failed to send quote' });
    }
  }
);

/**
 * GET /quotes/connected-clients
 * ADVISOR: list clients who have unlocked them (for proactive quote sending).
 */
router.get(
  '/connected-clients',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.ADVISOR) {
      res.status(403).json({ success: false, message: 'Advisors only' });
      return;
    }
    try {
      const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: req.user!.phoneNumber } });
      if (!advisor) { res.json({ success: true, data: [] }); return; }

      const unlocks = await prisma.contactUnlock.findMany({
        where: { advisorId: advisor.id },
        include: {
          user: {
            select: {
              id: true, fullName: true, phoneNumber: true, avatarUrl: true, createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // For each client, check if there's an open quote
      const clientIds = unlocks.map(u => u.userId);
      const openQuotes = await prisma.feeQuote.findMany({
        where: {
          advisorId: advisor.id,
          clientId:  { in: clientIds },
          status:    { in: [QuoteStatus.REQUESTED, QuoteStatus.QUOTED, QuoteStatus.VIEWED] },
        },
        select: { clientId: true, status: true },
      });
      const openQuoteMap = new Map(openQuotes.map(q => [q.clientId, q.status]));

      res.json({
        success: true,
        data: unlocks.map(u => ({
          ...u,
          openQuoteStatus: openQuoteMap.get(u.userId) ?? null,
        })),
      });
    } catch (err) {
      console.error('[GET /quotes/connected-clients]', err);
      res.status(500).json({ success: false, message: 'Failed to fetch clients' });
    }
  }
);

/**
 * GET /quotes
 * CLIENT: list their own requests. ADVISOR: list incoming requests.
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
        const now = new Date();
        const normalised = quotes.map(q => ({
          ...q,
          status: (q.status === QuoteStatus.QUOTED || q.status === QuoteStatus.VIEWED) && q.validUntil && q.validUntil < now
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
 * ADVISOR: returns count of REQUESTED quotes (badge).
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
        include: { ...QUOTE_INCLUDE, serviceTicket: { select: { id: true, ticketNumber: true, status: true } } },
      });
      if (!quote) { res.status(404).json({ success: false, message: 'Quote not found' }); return; }

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
 * ADVISOR submits or re-edits a fee breakdown.
 * Allowed when status is REQUESTED, QUOTED, or VIEWED (not yet accepted).
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

      const editableStatuses: QuoteStatus[] = [QuoteStatus.REQUESTED, QuoteStatus.QUOTED, QuoteStatus.VIEWED];
      if (!editableStatuses.includes(quote.status)) {
        res.status(400).json({ success: false, message: 'Quote can no longer be edited' });
        return;
      }

      const totalAmount = lineItems.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
      const validUntil = new Date(Date.now() + validityHours * 3_600_000);
      const isEdit = quote.status !== QuoteStatus.REQUESTED;

      const updated = await prisma.$transaction(async (tx) => {
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

      const clientUser = await prisma.user.findUnique({ where: { id: quote.clientId } });
      await prisma.notification.create({
        data: {
          userId: quote.clientId,
          type:   'QUOTE_SUBMITTED',
          refId:  quote.id,
          title:  isEdit ? 'Fee Quote Updated' : 'Your Fee Quote is Ready!',
          body:   `${advisor.fullName} has ${isEdit ? 'updated' : 'sent'} a fee breakdown of ₹${totalAmount.toLocaleString('en-IN')}.`,
        },
      }).catch(() => {});

      io.to(`user:${quote.clientId}`).emit('quote_submitted', {
        quoteId:     quote.id,
        totalAmount: String(totalAmount),
        advisorName: advisor.fullName,
        validUntil:  validUntil.toISOString(),
        isEdit,
      });

      if (clientUser?.pushToken) {
        sendPushNotification(
          clientUser.pushToken,
          isEdit ? 'Fee Quote Updated' : 'Your Fee Quote is Ready!',
          `${advisor.fullName} ${isEdit ? 'updated' : 'sent'} a fee breakdown of ₹${totalAmount.toLocaleString('en-IN')}.`,
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
        res.json({ success: true, data: quote });
        return;
      }

      const updated = await prisma.feeQuote.update({
        where: { id: quote.id },
        data:  { viewedAt: new Date(), status: QuoteStatus.VIEWED },
      });

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
 * CLIENT accepts a quote (status → ACCEPTED). Payment + ticket creation handled separately.
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
