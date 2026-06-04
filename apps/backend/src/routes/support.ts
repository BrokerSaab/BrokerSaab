import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

const createTicketSchema = z.object({
  subject:     z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
});

// ── POST /support/tickets ─────────────────────────────────────────
router.post('/tickets', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.errors[0].message });
    }
    const { subject, description } = parsed.data;
    const userId = req.user!.id;

    const ticket = await prisma.supportTickets.create({
      data: { userId, subject, description, status: 'OPEN' },
      select: { id: true, subject: true, status: true, createdAt: true },
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
      select: { id: true, subject: true, description: true, status: true, createdAt: true, updatedAt: true },
    });

    return res.json({ success: true, tickets });
  } catch (err) {
    console.error('[support/tickets GET]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
  }
});

export default router;
