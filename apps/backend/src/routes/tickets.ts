import { Router, Response } from 'express';
import { z } from 'zod';
import { Role, ServiceTicketStatus, StageStatus, LineItemStatus } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { io } from '../app';
import { sendPushNotification } from '../utils/pushNotification';
import { computeAdvisorShare, releasePayout } from '../services/payoutHelper';

const router = Router();

// ── Zod schemas ──────────────────────────────────────────────────────────────

const addStageSchema = z.object({
  body: z.object({
    title:       z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    lineItemId:  z.string().uuid().optional(),
  }),
});

const cancelLineItemSchema = z.object({
  body: z.object({
    reason: z.string().min(1).max(1000),
  }),
});

const updateStageSchema = z.object({
  body: z.object({
    status:         z.enum(['IN_PROGRESS', 'AWAITING_CONFIRM']),
    advisorComment: z.string().max(1000).optional(),
  }),
});

const addCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(2000),
  }),
});

const closeTicketSchema = z.object({
  body: z.object({
    closingComment: z.string().min(1).max(2000),
    userRating:     z.number().int().min(1).max(5),
    userReview:     z.string().max(1000).optional(),
  }),
});

// ── Helper ────────────────────────────────────────────────────────────────────

const TICKET_INCLUDE = {
  quote: {
    include: {
      lineItems: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  client:  { select: { id: true, fullName: true, avatarUrl: true, phoneNumber: true, pushToken: true } },
  advisor: { select: { id: true, fullName: true, avatarUrl: true, pushToken: true } },
  stages:  { orderBy: { sortOrder: 'asc' as const } },
  comments: { orderBy: { createdAt: 'asc' as const } },
  payouts: { select: { id: true, amount: true, netAmount: true, status: true, stageId: true } },
};

function generateTicketNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TK-${date}-${rand}`;
}

async function getAdvisorRecord(phoneNumber: string) {
  return prisma.advisor.findUnique({ where: { phoneNumber } });
}

/** Resolves the User.id for an Advisor (linked via shared phoneNumber). */
async function getAdvisorUserId(advisorId: string): Promise<string | null> {
  const advisor = await prisma.advisor.findUnique({ where: { id: advisorId }, select: { phoneNumber: true } });
  if (!advisor?.phoneNumber) return null;
  const user = await prisma.user.findUnique({ where: { phoneNumber: advisor.phoneNumber }, select: { id: true } });
  return user?.id ?? null;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /tickets
 * CLIENT: list their service tickets.
 * ADVISOR: list their service tickets.
 */
router.get(
  '/',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: userId, role } = req.user!;
    try {
      if (role === Role.CLIENT) {
        const tickets = await prisma.serviceTicket.findMany({
          where:   { clientId: userId },
          include: TICKET_INCLUDE,
          orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: tickets });
        return;
      }

      if (role === Role.ADVISOR) {
        const advisor = await getAdvisorRecord(req.user!.phoneNumber);
        if (!advisor) { res.json({ success: true, data: [] }); return; }
        const tickets = await prisma.serviceTicket.findMany({
          where:   { advisorId: advisor.id },
          include: TICKET_INCLUDE,
          orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: tickets });
        return;
      }

      res.status(403).json({ success: false, message: 'Forbidden' });
    } catch (err) {
      console.error('[GET /tickets]', err);
      res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
    }
  }
);

/**
 * GET /tickets/:id
 * CLIENT (owner) or ADVISOR (owner): get full ticket detail.
 */
router.get(
  '/:id',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: userId, role } = req.user!;
    try {
      const ticket = await prisma.serviceTicket.findUnique({
        where:   { id: req.params.id },
        include: TICKET_INCLUDE,
      });
      if (!ticket) { res.status(404).json({ success: false, message: 'Ticket not found' }); return; }

      let canAccess = false;
      if (role === Role.CLIENT) canAccess = ticket.clientId === userId;
      if (role === Role.ADVISOR) {
        const advisor = await getAdvisorRecord(req.user!.phoneNumber);
        canAccess = advisor?.id === ticket.advisorId;
      }
      if (!canAccess) { res.status(403).json({ success: false, message: 'Access denied' }); return; }

      res.json({ success: true, data: ticket });
    } catch (err) {
      console.error('[GET /tickets/:id]', err);
      res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
    }
  }
);

/**
 * POST /tickets/:id/stages
 * ADVISOR adds a new stage to the ticket.
 */
router.post(
  '/:id/stages',
  authenticateJWT,
  validateRequest(addStageSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.ADVISOR) {
      res.status(403).json({ success: false, message: 'Only advisors can add stages' });
      return;
    }
    const { title, description, lineItemId } = req.body;
    try {
      const advisor = await getAdvisorRecord(req.user!.phoneNumber);
      if (!advisor) { res.status(404).json({ success: false, message: 'Advisor not found' }); return; }

      const ticket = await prisma.serviceTicket.findUnique({ where: { id: req.params.id } });
      if (!ticket || ticket.advisorId !== advisor.id) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }
      if (ticket.status === ServiceTicketStatus.CLOSED || ticket.status === ServiceTicketStatus.PAYOUT_RELEASED) {
        res.status(400).json({ success: false, message: 'Ticket is already closed' });
        return;
      }

      let releaseAmount: number | undefined;
      if (lineItemId) {
        const lineItem = await prisma.feeQuoteLineItem.findUnique({ where: { id: lineItemId } });
        if (!lineItem || lineItem.quoteId !== ticket.quoteId) {
          res.status(404).json({ success: false, message: 'Line item not found' });
          return;
        }
        if (lineItem.status !== LineItemStatus.PENDING) {
          res.status(409).json({ success: false, message: 'This line item has already been released or cancelled' });
          return;
        }
        releaseAmount = Number(lineItem.amount);
      }

      const count = await prisma.ticketStage.count({ where: { ticketId: ticket.id } });
      const stage = await prisma.ticketStage.create({
        data: {
          ticketId: ticket.id, title, description, sortOrder: count,
          lineItemId: lineItemId ?? null,
          releaseAmount: releaseAmount ?? null,
        },
      }).catch((err: any) => {
        if (err?.code === 'P2002') return null; // race: line item attached to another stage concurrently
        throw err;
      });
      if (!stage) {
        res.status(409).json({ success: false, message: 'This line item has already been attached to a stage' });
        return;
      }

      // Update ticket to IN_PROGRESS if it's still OPEN
      if (ticket.status === ServiceTicketStatus.OPEN) {
        await prisma.serviceTicket.update({
          where: { id: ticket.id },
          data:  { status: ServiceTicketStatus.IN_PROGRESS },
        });
      }

      io.to(`user:${ticket.clientId}`).emit('ticket_updated', { ticketId: ticket.id, event: 'stage_added', stage });

      // Add system comment
      await prisma.ticketComment.create({
        data: {
          ticketId:   ticket.id,
          authorId:   advisor.phoneNumber
            ? (await prisma.user.findUnique({ where: { phoneNumber: advisor.phoneNumber } }))?.id ?? ticket.clientId
            : ticket.clientId,
          authorRole: 'ADVISOR',
          authorName: advisor.fullName,
          content:    releaseAmount
            ? `Stage added: "${title}" (₹${releaseAmount.toLocaleString('en-IN')} on confirmation)`
            : `Stage added: "${title}"`,
        },
      }).catch(() => {});

      const clientUser = ticket.clientId ? await prisma.user.findUnique({ where: { id: ticket.clientId } }) : null;
      if (clientUser?.pushToken) {
        sendPushNotification(
          clientUser.pushToken,
          'New Stage Added',
          releaseAmount
            ? `${advisor.fullName} added a new stage: "${title}" (₹${releaseAmount.toLocaleString('en-IN')} on confirmation)`
            : `${advisor.fullName} added a new stage: "${title}"`,
          { ticketId: ticket.id, screen: 'TicketDetail' }
        );
      }

      res.status(201).json({ success: true, data: stage });
    } catch (err) {
      console.error('[POST /tickets/:id/stages]', err);
      res.status(500).json({ success: false, message: 'Failed to add stage' });
    }
  }
);

/**
 * PATCH /tickets/:id/stages/:stageId
 * ADVISOR updates stage status (IN_PROGRESS or AWAITING_CONFIRM).
 */
router.patch(
  '/:id/stages/:stageId',
  authenticateJWT,
  validateRequest(updateStageSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.ADVISOR) {
      res.status(403).json({ success: false, message: 'Only advisors can update stages' });
      return;
    }
    const { status, advisorComment } = req.body;
    try {
      const advisor = await getAdvisorRecord(req.user!.phoneNumber);
      if (!advisor) { res.status(404).json({ success: false, message: 'Advisor not found' }); return; }

      const ticket = await prisma.serviceTicket.findUnique({ where: { id: req.params.id } });
      if (!ticket || ticket.advisorId !== advisor.id) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      const updateData: any = { status, advisorComment };
      if (status === StageStatus.AWAITING_CONFIRM) {
        updateData.completedAt = new Date();
      }

      const stage = await prisma.ticketStage.update({
        where: { id: req.params.stageId },
        data:  updateData,
      });

      // If stage is now awaiting confirm, update ticket status too
      if (status === StageStatus.AWAITING_CONFIRM) {
        await prisma.serviceTicket.update({
          where: { id: ticket.id },
          data:  { status: ServiceTicketStatus.AWAITING_CONFIRM },
        });
      }

      io.to(`user:${ticket.clientId}`).emit('ticket_updated', {
        ticketId: ticket.id,
        event:    'stage_updated',
        stage,
        requiresConfirm: status === StageStatus.AWAITING_CONFIRM,
      });

      const clientUser = await prisma.user.findUnique({ where: { id: ticket.clientId } });
      if (clientUser?.pushToken && status === StageStatus.AWAITING_CONFIRM) {
        sendPushNotification(
          clientUser.pushToken,
          'Stage Completed — Your Confirmation Needed',
          `${advisor.fullName} completed "${stage.title}". Please confirm to proceed.`,
          { ticketId: ticket.id, screen: 'TicketDetail' }
        );
      }

      res.json({ success: true, data: stage });
    } catch (err) {
      console.error('[PATCH /tickets/:id/stages/:stageId]', err);
      res.status(500).json({ success: false, message: 'Failed to update stage' });
    }
  }
);

/**
 * POST /tickets/:id/stages/:stageId/confirm
 * CLIENT confirms a stage as completed.
 */
router.post(
  '/:id/stages/:stageId/confirm',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.CLIENT) {
      res.status(403).json({ success: false, message: 'Only clients can confirm stages' });
      return;
    }
    const clientId = req.user!.id;
    try {
      const ticket = await prisma.serviceTicket.findUnique({
        where:   { id: req.params.id },
        include: {
          advisor: {
            select: {
              id: true, fullName: true, email: true, phoneNumber: true, pushToken: true,
              bankAccountNumber: true, bankIfsc: true, bankAccountHolder: true,
              razorpayContactId: true, razorpayFundAccountId: true,
            },
          },
        },
      });
      if (!ticket || ticket.clientId !== clientId) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      const stage = await prisma.ticketStage.findUnique({ where: { id: req.params.stageId } });
      if (!stage || stage.ticketId !== ticket.id) {
        res.status(404).json({ success: false, message: 'Stage not found' });
        return;
      }
      if (stage.status !== StageStatus.AWAITING_CONFIRM) {
        res.status(400).json({ success: false, message: 'Stage is not awaiting confirmation' });
        return;
      }

      const confirmed = await prisma.ticketStage.update({
        where: { id: stage.id },
        data:  { status: StageStatus.CONFIRMED, confirmedAt: new Date() },
      });

      // Ticket returns to IN_PROGRESS regardless — a milestone release doesn't
      // close the ticket; the client still performs an explicit final close.
      await prisma.serviceTicket.update({
        where: { id: ticket.id },
        data:  { status: ServiceTicketStatus.IN_PROGRESS },
      });

      let payoutTriggered = false;
      if (stage.lineItemId && stage.releaseAmount != null) {
        const { platformFee, gatewayFee, advisorNet } = computeAdvisorShare(
          { baseAmount: Number(ticket.baseAmount), platformFee: Number(ticket.platformFee) },
          Number(stage.releaseAmount),
        );
        const hasBankDetails = !!(ticket.advisor.bankAccountNumber && ticket.advisor.bankIfsc);
        const bankLabel = hasBankDetails
          ? `${ticket.advisor.bankAccountHolder ?? ticket.advisor.fullName} | XXXX${ticket.advisor.bankAccountNumber!.slice(-4)} | ${ticket.advisor.bankIfsc}`
          : ticket.advisor.fullName;

        await releasePayout({
          advisorId:       ticket.advisorId,
          ticketId:        ticket.id,
          stageId:         stage.id,
          grossAmount:     Number(stage.releaseAmount),
          netAmount:       advisorNet,
          bankLabel,
          hasBankDetails,
          advisorFullName: ticket.advisor.fullName,
          advisorEmail:    ticket.advisor.email,
          advisorPhone:    ticket.advisor.phoneNumber,
          advisorPushToken: ticket.advisor.pushToken,
          bankAccountNumber: ticket.advisor.bankAccountNumber,
          bankIfsc:          ticket.advisor.bankIfsc,
          bankAccountHolder: ticket.advisor.bankAccountHolder,
          razorpayContactId:     ticket.advisor.razorpayContactId,
          razorpayFundAccountId: ticket.advisor.razorpayFundAccountId,
          notifyTitle:   'Payment Released!',
          notifySuccess: `₹${advisorNet.toLocaleString('en-IN')} released for "${stage.title}" — transferring to your bank account.`,
          notifyPending: `₹${advisorNet.toLocaleString('en-IN')} for "${stage.title}" will be released by BrokerSaab shortly.`,
        });

        await prisma.feeQuoteLineItem.update({
          where: { id: stage.lineItemId },
          data:  { status: LineItemStatus.RELEASED },
        });
        payoutTriggered = true;
        void platformFee; void gatewayFee; // recorded via releasePayout's Payout row, not needed further here
      }

      const advisorUserId = await getAdvisorUserId(ticket.advisorId);
      io.to(`advisor:${advisorUserId}`).emit('ticket_updated', {
        ticketId: ticket.id,
        event:    'stage_confirmed',
        stage:    confirmed,
        payoutTriggered,
      });

      if (ticket.advisor.pushToken && !payoutTriggered) {
        sendPushNotification(
          ticket.advisor.pushToken,
          'Stage Confirmed by Client',
          `Client confirmed stage "${stage.title}". Continue to the next stage.`,
          { ticketId: ticket.id, screen: 'TicketDetail' }
        );
      }

      res.json({ success: true, data: confirmed });
    } catch (err) {
      console.error('[POST /tickets/:id/stages/:stageId/confirm]', err);
      res.status(500).json({ success: false, message: 'Failed to confirm stage' });
    }
  }
);

/**
 * POST /tickets/:id/line-items/:lineItemId/cancel
 * ADVISOR cancels a line item that isn't going to happen — refunds its base
 * amount (no gateway/platform fee) straight to the client's wallet.
 */
router.post(
  '/:id/line-items/:lineItemId/cancel',
  authenticateJWT,
  validateRequest(cancelLineItemSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.ADVISOR) {
      res.status(403).json({ success: false, message: 'Only advisors can cancel a line item' });
      return;
    }
    const { reason } = req.body;
    try {
      const advisor = await getAdvisorRecord(req.user!.phoneNumber);
      if (!advisor) { res.status(404).json({ success: false, message: 'Advisor not found' }); return; }

      const ticket = await prisma.serviceTicket.findUnique({ where: { id: req.params.id } });
      if (!ticket || ticket.advisorId !== advisor.id) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }
      if (ticket.status === ServiceTicketStatus.CLOSED || ticket.status === ServiceTicketStatus.PAYOUT_RELEASED) {
        res.status(400).json({ success: false, message: 'Ticket is already closed' });
        return;
      }

      const lineItem = await prisma.feeQuoteLineItem.findUnique({ where: { id: req.params.lineItemId } });
      if (!lineItem || lineItem.quoteId !== ticket.quoteId) {
        res.status(404).json({ success: false, message: 'Line item not found' });
        return;
      }
      if (lineItem.status !== LineItemStatus.PENDING) {
        res.status(409).json({ success: false, message: 'This line item has already been released or cancelled' });
        return;
      }

      const attachedStage = await prisma.ticketStage.findUnique({ where: { lineItemId: lineItem.id } });
      const now = new Date();
      const refundAmount = Number(lineItem.amount);

      await prisma.$transaction([
        prisma.feeQuoteLineItem.update({
          where: { id: lineItem.id },
          data:  { status: LineItemStatus.CANCELLED, cancelledAt: now, cancellationReason: reason },
        }),
        ...(attachedStage
          ? [prisma.ticketStage.update({
              where: { id: attachedStage.id },
              data:  { lineItemId: null, releaseAmount: null },
            })]
          : []),
        prisma.wallet.update({
          where: { userId: ticket.clientId },
          data:  { balance: { increment: refundAmount } },
        }),
      ]);

      io.to(`user:${ticket.clientId}`).emit('ticket_updated', {
        ticketId: ticket.id,
        event:    'line_item_cancelled',
        lineItem: { id: lineItem.id, description: lineItem.description, amount: refundAmount, reason },
      });

      const clientUser = await prisma.user.findUnique({ where: { id: ticket.clientId } });
      if (clientUser?.pushToken) {
        sendPushNotification(
          clientUser.pushToken,
          'Refund Issued',
          `"${lineItem.description}" was cancelled — ₹${refundAmount.toLocaleString('en-IN')} has been credited to your BrokerSaab wallet.`,
          { ticketId: ticket.id, screen: 'TicketDetail' }
        );
      }

      res.json({ success: true, data: { lineItemId: lineItem.id, refundAmount } });
    } catch (err) {
      console.error('[POST /tickets/:id/line-items/:lineItemId/cancel]', err);
      res.status(500).json({ success: false, message: 'Failed to cancel line item' });
    }
  }
);

/**
 * POST /tickets/:id/comments
 * CLIENT or ADVISOR adds a comment.
 */
router.post(
  '/:id/comments',
  authenticateJWT,
  validateRequest(addCommentSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id: userId, role } = req.user!;
    const { content } = req.body;

    if (role !== Role.CLIENT && role !== Role.ADVISOR) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    try {
      const ticket = await prisma.serviceTicket.findUnique({ where: { id: req.params.id } });
      if (!ticket) { res.status(404).json({ success: false, message: 'Ticket not found' }); return; }

      let authorName = '';
      let authorId   = userId;
      let recipientId = '';

      if (role === Role.CLIENT) {
        if (ticket.clientId !== userId) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        authorName  = user?.fullName ?? 'Client';
        recipientId = ticket.advisorId; // will emit to advisor room
      } else {
        const advisor = await getAdvisorRecord(req.user!.phoneNumber);
        if (!advisor || advisor.id !== ticket.advisorId) { res.status(403).json({ success: false, message: 'Access denied' }); return; }
        authorName  = advisor.fullName;
        authorId    = userId; // user record id for advisor
        recipientId = ticket.clientId;
      }

      const comment = await prisma.ticketComment.create({
        data: { ticketId: ticket.id, authorId, authorRole: role, authorName, content },
      });

      if (role === Role.CLIENT) {
        const advisorUserId = await getAdvisorUserId(ticket.advisorId);
        io.to(`advisor:${advisorUserId}`).emit('ticket_comment', { ticketId: ticket.id, comment });
        const advisor = await prisma.advisor.findUnique({ where: { id: ticket.advisorId } });
        if (advisor?.pushToken) {
          sendPushNotification(advisor.pushToken, 'New Comment on Ticket', `${authorName}: ${content.slice(0, 80)}`, { ticketId: ticket.id, screen: 'TicketDetail' });
        }
      } else {
        io.to(`user:${ticket.clientId}`).emit('ticket_comment', { ticketId: ticket.id, comment });
        const clientUser = await prisma.user.findUnique({ where: { id: ticket.clientId } });
        if (clientUser?.pushToken) {
          sendPushNotification(clientUser.pushToken, 'New Comment on Ticket', `${authorName}: ${content.slice(0, 80)}`, { ticketId: ticket.id, screen: 'TicketDetail' });
        }
      }

      res.status(201).json({ success: true, data: comment });
    } catch (err) {
      console.error('[POST /tickets/:id/comments]', err);
      res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
  }
);

/**
 * POST /tickets/:id/close
 * CLIENT closes the ticket with a review. Payment is released to advisor.
 */
router.post(
  '/:id/close',
  authenticateJWT,
  validateRequest(closeTicketSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.CLIENT) {
      res.status(403).json({ success: false, message: 'Only clients can close tickets' });
      return;
    }
    const clientId = req.user!.id;
    const { closingComment, userRating, userReview } = req.body;

    try {
      const ticket = await prisma.serviceTicket.findUnique({
        where:   { id: req.params.id },
        include: {
          quote: { include: { lineItems: true } },
          advisor: {
            select: {
              id: true, fullName: true, pushToken: true,
              bankAccountNumber: true, bankIfsc: true, bankAccountHolder: true, bankAccountType: true,
              razorpayContactId: true, razorpayFundAccountId: true, email: true, phoneNumber: true,
            },
          },
        },
      });
      if (!ticket || ticket.clientId !== clientId) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }
      if (ticket.status === ServiceTicketStatus.CLOSED || ticket.status === ServiceTicketStatus.PAYOUT_RELEASED) {
        res.status(400).json({ success: false, message: 'Ticket is already closed' });
        return;
      }

      const now = new Date();

      // Pay the advisor only for line items still PENDING — anything RELEASED
      // was already paid via a milestone, anything CANCELLED was refunded to
      // the client and was never owed. See payoutHelper.computeAdvisorShare.
      const pendingBase = ticket.quote.lineItems
        .filter(li => li.status === LineItemStatus.PENDING)
        .reduce((sum, li) => sum + Number(li.amount), 0);
      const { advisorNet } = computeAdvisorShare(
        { baseAmount: Number(ticket.baseAmount), platformFee: Number(ticket.platformFee) },
        pendingBase,
      );

      // Close the ticket first regardless of whether anything is left to pay.
      const updated = await prisma.serviceTicket.update({
        where: { id: ticket.id },
        data: {
          status:        ServiceTicketStatus.PAYOUT_RELEASED,
          closedAt:      now,
          closingComment,
          userRating,
          userReview,
        },
      });

      if (advisorNet <= 0.01) {
        // Everything was already released via milestones or cancelled — nothing left to pay.
        if (ticket.advisor.pushToken) {
          sendPushNotification(
            ticket.advisor.pushToken,
            'Ticket Closed',
            'All payments for this ticket have already been released.',
            { ticketId: ticket.id, screen: 'Wallet' }
          );
        }
      } else {
        const hasBankDetails = !!(ticket.advisor.bankAccountNumber && ticket.advisor.bankIfsc);
        const bankLabel      = hasBankDetails
          ? `${ticket.advisor.bankAccountHolder ?? ticket.advisor.fullName} | XXXX${ticket.advisor.bankAccountNumber!.slice(-4)} | ${ticket.advisor.bankIfsc}`
          : ticket.advisor.fullName;

        await releasePayout({
          advisorId:       ticket.advisorId,
          ticketId:        ticket.id,
          stageId:         null,
          grossAmount:     pendingBase,
          netAmount:       advisorNet,
          bankLabel,
          hasBankDetails,
          advisorFullName: ticket.advisor.fullName,
          advisorEmail:    ticket.advisor.email,
          advisorPhone:    ticket.advisor.phoneNumber,
          advisorPushToken: ticket.advisor.pushToken,
          bankAccountNumber: ticket.advisor.bankAccountNumber,
          bankIfsc:          ticket.advisor.bankIfsc,
          bankAccountHolder: ticket.advisor.bankAccountHolder,
          razorpayContactId:     ticket.advisor.razorpayContactId,
          razorpayFundAccountId: ticket.advisor.razorpayFundAccountId,
          notifyTitle:   'Payment Initiated!',
          notifySuccess: `₹${advisorNet.toLocaleString('en-IN')} is being transferred to your bank account (${ticket.advisor.bankAccountHolder ?? 'your account'}).`,
          notifyPending: `Your ₹${advisorNet.toLocaleString('en-IN')} payout will be released by BrokerSaab shortly.`,
        });
      }

      io.to(`advisor:${ticket.advisorId}`).emit('ticket_closed', {
        ticketId:  ticket.id,
        netAmount: advisorNet,
        rating:    userRating,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[POST /tickets/:id/close]', err);
      res.status(500).json({ success: false, message: 'Failed to close ticket' });
    }
  }
);

/**
 * POST /tickets/:id/dispute
 * CLIENT raises a dispute on the ticket.
 */
router.post(
  '/:id/dispute',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.user!.role !== Role.CLIENT) {
      res.status(403).json({ success: false, message: 'Only clients can raise disputes' });
      return;
    }
    const clientId = req.user!.id;
    const { reason } = req.body;

    try {
      const ticket = await prisma.serviceTicket.findUnique({ where: { id: req.params.id } });
      if (!ticket || ticket.clientId !== clientId) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }
      if (ticket.status === ServiceTicketStatus.CLOSED || ticket.status === ServiceTicketStatus.PAYOUT_RELEASED) {
        res.status(400).json({ success: false, message: 'Ticket is already closed' });
        return;
      }

      const updated = await prisma.serviceTicket.update({
        where: { id: ticket.id },
        data:  { status: ServiceTicketStatus.DISPUTED },
      });

      if (reason) {
        const user = await prisma.user.findUnique({ where: { id: clientId } });
        await prisma.ticketComment.create({
          data: {
            ticketId:   ticket.id,
            authorId:   clientId,
            authorRole: 'CLIENT',
            authorName: user?.fullName ?? 'Client',
            content:    `[DISPUTE] ${reason}`,
          },
        }).catch(() => {});
      }

      const advisorUserId = await getAdvisorUserId(ticket.advisorId);
      io.to(`advisor:${advisorUserId}`).emit('ticket_updated', { ticketId: ticket.id, event: 'disputed' });

      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[POST /tickets/:id/dispute]', err);
      res.status(500).json({ success: false, message: 'Failed to raise dispute' });
    }
  }
);

export default router;
