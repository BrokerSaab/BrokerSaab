import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { kycUpload, fileUrl } from '../middlewares/upload';

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

/**
 * POST /users/upload/avatar
 * Upload / replace client profile picture. Updates user.avatarUrl.
 */
router.post(
  '/upload/avatar',
  authenticateJWT,
  kycUpload.single('file'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const avatarUrl = fileUrl(req.file);
      await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
      res.json({ success: true, avatarUrl });
    } catch (err) {
      console.error('[users/upload/avatar]', err);
      res.status(500).json({ success: false, message: 'Avatar upload failed' });
    }
  },
);

/**
 * GET /users/wallet
 * CLIENT wallet balance + pending withdrawal requests.
 */
router.get(
  '/wallet',
  authenticateJWT,
  requireRole(['CLIENT']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const wallet = await prisma.wallet.findUnique({ where: { userId } });
      const pendingWithdrawals = await prisma.clientWithdrawal.findMany({
        where:   { userId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
      const recentWithdrawals = await prisma.clientWithdrawal.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        take:    10,
      });
      const user = await prisma.user.findUnique({
        where:  { id: userId },
        select: { bankAccountNumber: true, bankIfsc: true, bankAccountHolder: true, bankAccountType: true },
      });

      res.json({
        success: true,
        data: {
          walletBalance: Number(wallet?.balance ?? 0),
          pendingWithdrawals,
          recentWithdrawals,
          bankDetails: user,
        },
      });
    } catch (err) {
      console.error('[GET /users/wallet]', err);
      res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
    }
  },
);

const bankDetailsSchema = z.object({
  body: z.object({
    bankAccountNumber: z.string().min(4).max(30),
    bankIfsc:          z.string().min(4).max(15),
    bankAccountHolder: z.string().min(1).max(200),
    bankAccountType:   z.enum(['savings', 'current']).optional(),
  }),
});

/**
 * PATCH /users/bank-details
 * CLIENT saves/updates their bank details for future withdrawals.
 */
router.patch(
  '/bank-details',
  authenticateJWT,
  requireRole(['CLIENT']),
  validateRequest(bankDetailsSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { bankAccountNumber, bankIfsc, bankAccountHolder, bankAccountType } = req.body;
    try {
      await prisma.user.update({
        where: { id: req.user!.id },
        data:  { bankAccountNumber, bankIfsc, bankAccountHolder, bankAccountType },
      });
      res.json({ success: true, message: 'Bank details saved' });
    } catch (err) {
      console.error('[PATCH /users/bank-details]', err);
      res.status(500).json({ success: false, message: 'Failed to save bank details' });
    }
  },
);

/**
 * POST /users/wallet/withdraw
 * CLIENT requests withdrawal of their wallet balance to their bank account.
 */
router.post(
  '/wallet/withdraw',
  authenticateJWT,
  requireRole(['CLIENT']),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { amount, bankAccountNumber, bankIfsc, bankAccountHolder } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
      return;
    }

    try {
      const userId = req.user!.id;
      const [wallet, user] = await Promise.all([
        prisma.wallet.findUnique({ where: { userId } }),
        prisma.user.findUnique({
          where:  { id: userId },
          select: { bankAccountNumber: true, bankIfsc: true, bankAccountHolder: true },
        }),
      ]);

      const balance = Number(wallet?.balance ?? 0);
      if (amount > balance) {
        res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${balance.toFixed(2)}` });
        return;
      }

      const accountNumber = bankAccountNumber ?? user?.bankAccountNumber;
      const ifsc          = bankIfsc          ?? user?.bankIfsc;
      const accountHolder = bankAccountHolder ?? user?.bankAccountHolder;
      if (!accountNumber || !ifsc || !accountHolder) {
        res.status(400).json({ success: false, message: 'Bank account details are required — save them under Bank Details first' });
        return;
      }

      const existingPending = await prisma.clientWithdrawal.findFirst({
        where: { userId, status: 'PENDING' },
      });
      if (existingPending) {
        res.status(400).json({ success: false, message: 'You already have a pending withdrawal request' });
        return;
      }

      const maskedAccount = `XXXX${String(accountNumber).slice(-4)}`;
      const bankLabel     = `${accountHolder} | ${maskedAccount} | IFSC: ${ifsc}`;

      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId },
          data:  { balance: { decrement: amount } },
        }),
        prisma.clientWithdrawal.create({
          data: {
            userId,
            amount,
            commission: 0,
            netAmount:  amount,
            status:     'PENDING',
            bankAccount: bankLabel,
          },
        }),
        // Persist bank details for future withdrawals if passed fresh this time
        ...(bankAccountNumber && bankIfsc && bankAccountHolder
          ? [prisma.user.update({ where: { id: userId }, data: { bankAccountNumber, bankIfsc, bankAccountHolder } })]
          : []),
      ]);

      res.json({ success: true, message: 'Withdrawal request submitted. Admin will process it within 2-3 business days.' });
    } catch (err) {
      console.error('[POST /users/wallet/withdraw]', err);
      res.status(500).json({ success: false, message: 'Failed to submit withdrawal request' });
    }
  },
);

export default router;
