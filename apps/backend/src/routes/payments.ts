import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { BookingStatus, TransactionType, TransactionStatus, QuoteStatus } from '@prisma/client';
import { io } from '../app';
import { sendPushNotification } from '../utils/pushNotification';

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
 * 2. POST /payments/quote-checkout
 * Pay for an accepted fee quote → creates a ServiceTicket with escrow hold.
 */
router.post(
  '/quote-checkout',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { quoteId, gateway } = req.body;

    if (!quoteId || !gateway) {
      res.status(400).json({ success: false, message: 'quoteId and gateway are required' });
      return;
    }

    try {
      const quote = await prisma.feeQuote.findUnique({
        where:   { id: quoteId },
        include: {
          advisor: { select: { id: true, fullName: true, pushToken: true } },
          client:  { select: { id: true, fullName: true, pushToken: true } },
          serviceTicket: true,
        },
      });

      if (!quote) {
        res.status(404).json({ success: false, message: 'Quote not found' });
        return;
      }
      if (quote.clientId !== userId) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
      if (quote.status !== QuoteStatus.ACCEPTED && quote.status !== QuoteStatus.QUOTED && quote.status !== QuoteStatus.VIEWED) {
        res.status(400).json({ success: false, message: 'Quote must be accepted before payment' });
        return;
      }
      if (quote.serviceTicket) {
        res.status(400).json({ success: false, message: 'Payment already made for this quote' });
        return;
      }

      const baseAmount = Number(quote.totalAmount ?? 0);
      if (baseAmount <= 0) {
        res.status(400).json({ success: false, message: 'Invalid quote amount' });
        return;
      }

      // Client-side fee structure
      const gatewayFee  = parseFloat((baseAmount * 0.015).toFixed(2));
      const platformFee = baseAmount <= 3000 ? 30 : baseAmount <= 5000 ? 50 : parseFloat((baseAmount * 0.01).toFixed(2));
      const totalAmount = parseFloat((baseAmount + gatewayFee + platformFee).toFixed(2)); // total client pays

      // Advisor-side commission (unchanged)
      const commission = parseFloat((baseAmount * 0.15).toFixed(2));
      const netAmount  = parseFloat((baseAmount - commission).toFixed(2));

      // Advisor payout deductions (deducted from netAmount at release)
      const advisorGatewayFee  = parseFloat((netAmount * 0.015).toFixed(2));
      const advisorPlatformFee = netAmount <= 3000 ? 30 : netAmount <= 5000 ? 50 : parseFloat((netAmount * 0.01).toFixed(2));
      const advisorPayout      = parseFloat((netAmount - advisorGatewayFee - advisorPlatformFee).toFixed(2));

      let paymentRef = '';

      if (gateway === 'WALLET') {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet || Number(wallet.balance) < totalAmount) {
          res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
          return;
        }
        await prisma.wallet.update({
          where: { userId },
          data:  { balance: { decrement: totalAmount } },
        });
        paymentRef = `WL-TK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      } else {
        paymentRef = `PAY-${gateway.slice(0, 3)}-TK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Mark quote as ACCEPTED and create ticket atomically
      const ticket = await prisma.$transaction(async (tx) => {
        await tx.feeQuote.update({
          where: { id: quoteId },
          data:  { status: QuoteStatus.ACCEPTED },
        });

        // Generate unique ticket number
        let ticketNumber = '';
        let attempts = 0;
        do {
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const rand = Math.floor(1000 + Math.random() * 9000);
          ticketNumber = `TK-${date}-${rand}`;
          const exists = await tx.serviceTicket.findUnique({ where: { ticketNumber } });
          if (!exists) break;
          attempts++;
        } while (attempts < 5);

        return tx.serviceTicket.create({
          data: {
            ticketNumber,
            quoteId,
            clientId:   quote.clientId,
            advisorId:  quote.advisor.id,
            baseAmount,
            platformFee,
            gatewayFee,
            totalAmount,
            commission,
            netAmount,
            advisorGatewayFee,
            advisorPlatformFee,
            advisorPayout,
            paymentRef,
          },
        });
      });

      // Notify advisor
      io.to(`advisor:${quote.advisor.id}`).emit('ticket_created', {
        ticketId:     ticket.id,
        ticketNumber: ticket.ticketNumber,
        clientName:   quote.client.fullName,
        totalAmount:  baseAmount,
      });

      if (quote.advisor.pushToken) {
        sendPushNotification(
          quote.advisor.pushToken,
          'New Work Order Received!',
          `${quote.client.fullName} has accepted your quote of ₹${baseAmount.toLocaleString('en-IN')}. Start the work and add stages.`,
          { ticketId: ticket.id, screen: 'TicketDetail' }
        );
      }

      // Also notify client
      await prisma.notification.create({
        data: {
          userId:  quote.clientId,
          type:    'GENERAL',
          refId:   ticket.id,
          title:   'Payment Successful — Work Order Created',
          body:    `Your payment of ₹${totalAmount.toLocaleString('en-IN')} is held securely. Ticket ${ticket.ticketNumber} has been created.`,
        },
      }).catch(() => {});

      res.status(201).json({
        success: true,
        message: 'Payment successful. Work ticket created.',
        data: { ticket, paymentRef },
      });
    } catch (err) {
      console.error('[POST /payments/quote-checkout]', err);
      res.status(500).json({ success: false, message: 'Payment failed' });
    }
  }
);

/**
 * 3. POST /payments/wallet/add
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
