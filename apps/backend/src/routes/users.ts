import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

/**
 * POST /users/push-token
 * Register an Expo push notification token for the authenticated user/advisor
 */
router.post(
  '/push-token',
  authenticateJWT,
  validateRequest(
    z.object({
      body: z.object({
        token: z.string().min(1),
        platform: z.enum(['android', 'ios']),
      }),
    }),
  ),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { token } = req.body;
    const userId = req.user!.id;

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { pushToken: token },
      });

      // Also update advisor record if this user is an advisor
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: user.phoneNumber } });
        if (advisor) {
          await prisma.advisor.update({
            where: { id: advisor.id },
            data: { pushToken: token },
          });
        }
      }

      res.json({ success: true, message: 'Push token registered' });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to register push token' });
    }
  },
);

/**
 * GET /users/me
 * Return the current authenticated user profile
 */
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        seqId: true,
        phoneNumber: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        state: true,
        createdAt: true,
        wallet: { select: { balance: true } },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          walletBalance: user.wallet?.balance ?? '0.00',
          wallet: undefined,
        },
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Error fetching user profile' });
  }
});

export default router;
