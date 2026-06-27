import { Router, Response } from 'express';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

async function isParticipant(chatRoomId: string, userId: string): Promise<boolean> {
  const p = await prisma.chatRoomParticipant.findUnique({
    where: { chatRoomId_userId: { chatRoomId, userId } },
  });
  return !!p;
}

// GET /chat/:roomId — room info + booking context
router.get('/:roomId', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user!.id;
  try {
    if (!(await isParticipant(roomId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        booking: {
          select: {
            bookingNumber: true, scheduledDate: true, startTime: true,
            endTime: true, status: true, mode: true,
            advisor: { select: { fullName: true, businessName: true } },
            client: { select: { id: true, fullName: true } },
          },
        },
        participants: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
        },
      },
    });
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    return res.json({ success: true, room });
  } catch (err) {
    console.error('[chat GET room]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch room' });
  }
});

// GET /chat/:roomId/messages — message history
router.get('/:roomId/messages', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const userId = req.user!.id;
  try {
    if (!(await isParticipant(roomId, userId))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const messages = await prisma.message.findMany({
      where: { chatRoomId: roomId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } } },
    });
    // Mark messages from others as read
    await prisma.message.updateMany({
      where: { chatRoomId: roomId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });
    return res.json({ success: true, messages });
  } catch (err) {
    console.error('[chat GET messages]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

export default router;
