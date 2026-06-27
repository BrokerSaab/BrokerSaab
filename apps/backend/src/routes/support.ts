import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { ticketUpload, fileUrl } from '../middlewares/upload';

const router = Router();

const TICKET_INCLUDE = {
  user: { select: { fullName: true, phoneNumber: true, email: true, role: true } },
  assignedToAdmin: { select: { id: true, fullName: true } },
  activities: { orderBy: { createdAt: 'asc' as const } },
  attachments: { orderBy: { createdAt: 'asc' as const } },
} as const;

const createTicketSchema = z.object({
  subject:     z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category:    z.enum(['GENERAL', 'BILLING', 'TECHNICAL', 'BOOKING_ISSUE', 'ADVISOR_ISSUE', 'OTHER']).default('GENERAL'),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

// ── POST /support/tickets ──────────────────────────────────────────
// Accepts multipart/form-data so the user can optionally attach up to 3 files.
// Plain JSON requests (no files) continue to work as before.
router.post(
  '/tickets',
  authenticateJWT,
  ticketUpload.array('attachments', 3),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = createTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
      }
      const { subject, description, category, priority } = parsed.data;
      const userId   = req.user!.id;
      const userRole = req.user!.role as string;

      const [user, count] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
        prisma.supportTickets.count(),
      ]);

      const ticketNumber    = `BS-TKT-${String(count + 1).padStart(6, '0')}`;
      const performedByName = user?.fullName || 'User';

      const ticket = await prisma.supportTickets.create({
        data: {
          ticketNumber,
          userId,
          subject,
          description,
          category,
          priority,
          status: 'OPEN',
          activities: {
            create: {
              action: 'STATUS_CHANGED',
              toStatus: 'OPEN',
              note: 'Ticket raised',
              performedByName,
              performedByRole: userRole,
            },
          },
        },
        include: TICKET_INCLUDE,
      });

      // Save any uploaded files as TicketAttachment records
      const files = req.files as Express.Multer.File[] | undefined;
      if (files && files.length > 0) {
        await prisma.ticketAttachment.createMany({
          data: files.map(f => ({
            ticketId:     ticket.id,
            uploadedById: userId,
            uploaderRole: userRole,
            uploaderName: performedByName,
            fileUrl:      fileUrl(f),
            fileName:     f.originalname,
            fileType:     f.mimetype,
          })),
        });
      }

      // Re-fetch with attachments so the response is complete
      const ticketWithAttachments = await prisma.supportTickets.findUnique({
        where: { id: ticket.id },
        include: TICKET_INCLUDE,
      });

      return res.json({ success: true, ticket: ticketWithAttachments });
    } catch (err) {
      console.error('[support/tickets POST]', err);
      return res.status(500).json({ success: false, message: 'Failed to create ticket' });
    }
  }
);

// ── POST /support/tickets/:id/attachments ─────────────────────────
// Add up to 3 more files to an existing open ticket.
router.post(
  '/tickets/:id/attachments',
  authenticateJWT,
  ticketUpload.array('attachments', 3),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const ticket = await prisma.supportTickets.findFirst({
        where: { id, userId },
        select: { id: true, status: true },
      });
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
      }
      if (ticket.status === 'CLOSED') {
        return res.status(400).json({ success: false, message: 'Cannot add attachments to a closed ticket' });
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files provided' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } });
      const uploaderName = user?.fullName || 'User';
      const userRole     = req.user!.role as string;

      await prisma.ticketAttachment.createMany({
        data: files.map(f => ({
          ticketId:     id,
          uploadedById: userId,
          uploaderRole: userRole,
          uploaderName,
          fileUrl:      fileUrl(f),
          fileName:     f.originalname,
          fileType:     f.mimetype,
        })),
      });

      const updated = await prisma.supportTickets.findUnique({
        where: { id },
        include: TICKET_INCLUDE,
      });

      return res.json({ success: true, ticket: updated });
    } catch (err) {
      console.error('[support/tickets/:id/attachments POST]', err);
      return res.status(500).json({ success: false, message: 'Failed to upload attachments' });
    }
  }
);

// ── GET /support/tickets ──────────────────────────────────────────
router.get('/tickets', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const tickets = await prisma.supportTickets.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: TICKET_INCLUDE,
    });

    return res.json({ success: true, tickets });
  } catch (err) {
    console.error('[support/tickets GET]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

// ── GET /support/tickets/:id ──────────────────────────────────────
router.get('/tickets/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const ticket = await prisma.supportTickets.findFirst({
      where: { id, userId },
      include: TICKET_INCLUDE,
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('[support/tickets/:id GET]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
  }
});

export default router;
