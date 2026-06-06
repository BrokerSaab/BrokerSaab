import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

const TICKET_INCLUDE = {
  user: { select: { fullName: true, phoneNumber: true, email: true, role: true } },
  assignedToAdmin: { select: { id: true, fullName: true } },
  activities: { orderBy: { createdAt: 'asc' as const } },
} as const;

const createTicketSchema = z.object({
  subject:     z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category:    z.enum(['GENERAL', 'BILLING', 'TECHNICAL', 'BOOKING_ISSUE', 'ADVISOR_ISSUE', 'OTHER']).default('GENERAL'),
  priority:    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

// ── POST /support/tickets ─────────────────────────────────────────
router.post('/tickets', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }
    const { subject, description, category, priority } = parsed.data;
    const userId = req.user!.id;
    const userRole = req.user!.role as string;

    const [user, count] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
      prisma.supportTickets.count(),
    ]);

    const ticketNumber = `BS-TKT-${String(count + 1).padStart(6, '0')}`;
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

    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('[support/tickets POST]', err);
    return res.status(500).json({ success: false, message: 'Failed to create ticket' });
  }
});

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
