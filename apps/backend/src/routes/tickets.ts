import { Router, Response } from 'express';
import { z } from 'zod';
import { Role, ServiceTicketStatus, StageStatus } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { io } from '../app';
import { sendPushNotification } from '../utils/pushNotification';
import { initiatePayout, mapRzpStatus } from '../services/razorpayPayout';

const router = Router();

// ── Zod schemas ──────────────────────────────────────────────────────────────

const addStageSchema = z.object({
  body: z.object({
    title:       z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
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
    const { title, description } = req.body;
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

      const count = await prisma.ticketStage.count({ where: { ticketId: ticket.id } });
      const stage = await prisma.ticketStage.create({
        data: { ticketId: ticket.id, title, description, sortOrder: count },
      });

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
          content:    `Stage added: "${title}"`,
        },
      }).catch(() => {});

      const clientUser = ticket.clientId ? await prisma.user.findUnique({ where: { id: ticket.clientId } }) : null;
      if (clientUser?.pushToken) {
        sendPushNotification(
          clientUser.pushToken,
          'New Stage Added',
          `${advisor.fullName} added a new stage: "${title}"`,
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
        include: { advisor: { select: { id: true, fullName: true, pushToken: true } } },
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

      // Check if all stages are confirmed — move ticket back to IN_PROGRESS
      const pendingStages = await prisma.ticketStage.count({
        where: { ticketId: ticket.id, status: { notIn: [StageStatus.CONFIRMED] } },
      });
      if (pendingStages === 0) {
        await prisma.serviceTicket.update({
          where: { id: ticket.id },
          data:  { status: ServiceTicketStatus.IN_PROGRESS },
        });
      } else {
        await prisma.serviceTicket.update({
          where: { id: ticket.id },
          data:  { status: ServiceTicketStatus.IN_PROGRESS },
        });
      }

      const advisorUserId = await getAdvisorUserId(ticket.advisorId);
      io.to(`advisor:${advisorUserId}`).emit('ticket_updated', {
        ticketId: ticket.id,
        event:    'stage_confirmed',
        stage:    confirmed,
      });

      if (ticket.advisor.pushToken) {
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

      const advisorPayout = Number(ticket.advisorPayout);
      const commission    = Number(ticket.commission);
      const totalAmount   = Number(ticket.totalAmount);
      const amountPaise   = Math.round(advisorPayout * 100);   // Razorpay amounts are in paise
      const now         = new Date();

      const hasBankDetails = !!(ticket.advisor.bankAccountNumber && ticket.advisor.bankIfsc);
      const bankLabel      = hasBankDetails
        ? `${ticket.advisor.bankAccountHolder ?? ticket.advisor.fullName} | XXXX${ticket.advisor.bankAccountNumber!.slice(-4)} | ${ticket.advisor.bankIfsc}`
        : ticket.advisor.fullName;

      // ── Step 1: Atomically close the ticket and create a PENDING payout record ──
      const [updated, payoutRecord] = await prisma.$transaction([
        prisma.serviceTicket.update({
          where: { id: ticket.id },
          data: {
            status:        ServiceTicketStatus.PAYOUT_RELEASED,
            closedAt:      now,
            closingComment,
            userRating,
            userReview,
          },
        }),
        prisma.payout.create({
          data: {
            advisorId:   ticket.advisorId,
            ticketId:    ticket.id,
            amount:      totalAmount,
            commission,
            netAmount:   advisorPayout,
            status:      'PENDING',
            bankAccount: bankLabel,
            referenceId: `ticket_${ticket.id}`,
          },
        }),
      ]);

      // ── Step 2: Trigger RazorpayX payout (PAYOUT_RELEASED interceptor) ─────────
      // Runs after the DB commit — ticket is always PAYOUT_RELEASED regardless of outcome.
      if (hasBankDetails) {
        const outcome = await initiatePayout(
          {
            advisorId:             ticket.advisor.id,
            fullName:              ticket.advisor.fullName,
            email:                 ticket.advisor.email,
            phoneNumber:           ticket.advisor.phoneNumber,
            bankAccountNumber:     ticket.advisor.bankAccountNumber!,
            bankIfsc:              ticket.advisor.bankIfsc!,
            bankAccountHolder:     ticket.advisor.bankAccountHolder ?? ticket.advisor.fullName,
            razorpayContactId:     ticket.advisor.razorpayContactId,
            razorpayFundAccountId: ticket.advisor.razorpayFundAccountId,
          },
          amountPaise,
          ticket.id,
        );

        const payoutStatus = mapRzpStatus(outcome.rzpStatus);

        // Persist payout_id, mode, and status from RazorpayX response
        await prisma.payout.update({
          where: { id: payoutRecord.id },
          data: {
            razorpayPayoutId: outcome.razorpayPayoutId,
            payoutMode:       outcome.mode ?? 'IMPS',
            status:           payoutStatus,
            ...(outcome.error ? { rejectionReason: outcome.error } : {}),
            // Credit wallet optimistically when payout is successfully queued
            ...(outcome.success ? { releasedAt: now } : {}),
          },
        });

        // Credit advisor wallet balance when payout is successfully initiated
        if (outcome.success) {
          await prisma.advisor.update({
            where: { id: ticket.advisorId },
            data:  { walletBalance: { increment: advisorPayout } },
          });
        }

        // Notify advisor with outcome-specific message
        if (ticket.advisor.pushToken) {
          const title = outcome.success ? 'Payment Initiated!' : 'Ticket Closed — Payout Pending';
          const body  = outcome.success
            ? `₹${advisorPayout.toLocaleString('en-IN')} is being transferred to your bank account (${ticket.advisor.bankAccountHolder ?? 'your account'}).`
            : `Your ₹${advisorPayout.toLocaleString('en-IN')} payout will be released by BrokerSaab shortly.`;
          sendPushNotification(ticket.advisor.pushToken, title, body, { ticketId: ticket.id, screen: 'Wallet' });
        }
      } else {
        // No bank details — stays PENDING for admin to release manually
        if (ticket.advisor.pushToken) {
          sendPushNotification(
            ticket.advisor.pushToken,
            'Ticket Closed — Add Bank Details',
            `₹${advisorPayout.toLocaleString('en-IN')} is ready to be released. Add your bank account in the app to receive payment.`,
            { ticketId: ticket.id, screen: 'Wallet' }
          );
        }
      }

      io.to(`advisor:${ticket.advisorId}`).emit('ticket_closed', {
        ticketId:  ticket.id,
        netAmount: advisorPayout,
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
