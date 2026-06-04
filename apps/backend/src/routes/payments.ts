import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { BookingStatus, TransactionType, TransactionStatus } from '@prisma/client';

const router = Router();

const checkoutSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
    gateway: z.enum(['STRIPE', 'RAZORPAY', 'WALLET'])
  })
});

/**
 * 1. POST /payments/checkout
 * Initiate checkout payments for consultation bookings
 */
router.post(
  '/checkout',
  authenticateJWT,
  validateRequest(checkoutSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { bookingId, gateway } = req.body;

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking reference not found' });
        return;
      }

      if (booking.clientId !== userId) {
        res.status(403).json({ success: false, message: 'Forbidden. You do not own this booking.' });
        return;
      }

      if (booking.status !== BookingStatus.PENDING) {
        res.status(400).json({ success: false, message: 'This booking has already been processed or cancelled.' });
        return;
      }

      const totalFee = Number(booking.totalFee);
      const commissionRate = 0.15; // 15% Platform Commission
      const commission = parseFloat((totalFee * commissionRate).toFixed(2));
      const netAmount = parseFloat((totalFee - commission).toFixed(2));

      // Gateway Strategy: WALLET Payment
      if (gateway === 'WALLET') {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });

        if (!wallet || Number(wallet.balance) < totalFee) {
          res.status(400).json({
            success: false,
            message: 'Insufficient wallet ledger funds. Please add balance first.'
          });
          return;
        }

        // Deduct from wallet and update transactions in transaction block
        const transaction = await prisma.$transaction(async (tx) => {
          // Deduct balance
          await tx.wallet.update({
            where: { userId },
            data: { balance: { decrement: totalFee } }
          });

          // Create dynamic transaction ledger
          const txn = await tx.transaction.create({
            data: {
              referenceId: `WL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
              userId,
              bookingId,
              type: TransactionType.DEBIT,
              status: TransactionStatus.SUCCESS,
              amount: totalFee,
              commission,
              netAmount,
              gatewayMessage: 'Debited from personal BrokerSaab wallet.'
            }
          });

          // Mark booking status as ACCEPTED (Ready for consultation)
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.ACCEPTED }
          });

          return txn;
        });

        res.status(200).json({
          success: true,
          message: 'Payment completed successfully via wallet balance.',
          data: transaction
        });
        return;
      }

      // Gateway Strategy: Simulated STRIPE / RAZORPAY Checkout (Development Fallback)
      // Generates instant successful checkout mock or payment setup
      const referenceId = `PAY-${gateway.slice(0, 3)}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const simulatedTxn = await prisma.$transaction(async (tx) => {
        const txn = await tx.transaction.create({
          data: {
            referenceId,
            userId,
            bookingId,
            type: TransactionType.DEBIT,
            status: TransactionStatus.SUCCESS, // Instantly mark success for mock purposes
            amount: totalFee,
            commission,
            netAmount,
            gatewayMessage: `Simulated checkout via ${gateway} sandbox.`
          }
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.ACCEPTED }
        });

        return txn;
      });

      res.status(200).json({
        success: true,
        message: 'Mock payment checkout initialized successfully.',
        paymentUrl: `https://checkout.brokersaab.com/pay/${simulatedTxn.referenceId}`,
        data: simulatedTxn
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Checkout initialization error occurred.' });
    }
  }
);

/**
 * 2. POST /payments/wallet/add
 * Simulate adding funds directly to Client BrokerSaab Wallet balance
 */
router.post('/wallet/add', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { amount } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ success: false, message: 'Invalid currency amount spec.' });
    return;
  }

  try {
    const updatedWallet = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: Number(amount) } }
      });

      await tx.transaction.create({
        data: {
          referenceId: `DEP-${Date.now()}`,
          userId,
          type: TransactionType.CREDIT,
          status: TransactionStatus.SUCCESS,
          amount: Number(amount),
          commission: 0,
          netAmount: Number(amount),
          gatewayMessage: 'Funds deposit added successfully.'
        }
      });

      return wallet;
    });

    res.status(200).json({
      success: true,
      message: 'Funds credited successfully to wallet.',
      balance: updatedWallet.balance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to credit funds.' });
  }
});

export default router;
