import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../config/db';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { BookingStatus, TransactionType, TransactionStatus, QuoteStatus } from '@prisma/client';
import { io } from '../app';
import { sendPushNotification } from '../utils/pushNotification';

const router = Router();

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const checkoutSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
    gateway: z.enum(['RAZORPAY', 'WALLET'])
  })
});

const verifyCheckoutSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string(),
    razorpayPaymentId: z.string(),
    razorpaySignature: z.string(),
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
      const commission = 0; // No platform commission
      const netAmount = totalFee;

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

      // Gateway Strategy: RAZORPAY — test mode short-circuit for dev/staging.
      // Set DUMMY_PAYMENTS=true to skip the real Razorpay order and mark the
      // booking paid instantly, mirroring the DUMMY_PAYOUTS convention used
      // on the advisor-payout side.
      if (process.env.DUMMY_PAYMENTS === 'true') {
        const referenceId = `DUMMY-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const dummyTxn = await prisma.$transaction(async (tx) => {
          const txn = await tx.transaction.create({
            data: {
              referenceId, userId, bookingId,
              type: TransactionType.DEBIT,
              status: TransactionStatus.SUCCESS,
              amount: totalFee, commission, netAmount,
              gatewayMessage: 'DUMMY_PAYMENTS test mode — no real gateway call made.',
            },
          });
          await tx.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.ACCEPTED } });
          return txn;
        });
        res.status(200).json({ success: true, message: 'Test-mode payment completed instantly (DUMMY_PAYMENTS).', data: dummyTxn });
        return;
      }

      // Real Razorpay order — booking stays PENDING until POST /payments/verify-checkout confirms it.
      const order = await getRazorpay().orders.create({
        amount: Math.round(totalFee * 100),
        currency: 'INR',
        receipt: `booking_${bookingId.slice(0, 8)}_${Date.now()}`,
        payment_capture: true,
        notes: { bookingId, purpose: 'CONSULTATION_BOOKING' },
      } as any);

      await prisma.transaction.create({
        data: {
          referenceId: order.id,
          userId,
          bookingId,
          type: TransactionType.DEBIT,
          status: TransactionStatus.PENDING,
          amount: totalFee,
          commission,
          netAmount,
          gatewayMessage: 'Awaiting Razorpay checkout confirmation.',
        },
      });

      res.status(200).json({
        success: true,
        requiresPayment: true,
        orderId: order.id,
        amount: Math.round(totalFee * 100),
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId,
      });
    } catch (error) {
      console.error('[POST /payments/checkout]', error);
      res.status(500).json({ success: false, message: 'Checkout initialization error occurred.' });
    }
  }
);

/**
 * 1b. POST /payments/verify-checkout
 * Verifies a real Razorpay payment for a consultation booking and marks it paid.
 */
router.post(
  '/verify-checkout',
  authenticateJWT,
  validateRequest(verifyCheckoutSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    try {
      const transaction = await prisma.transaction.findUnique({ where: { referenceId: razorpayOrderId } });
      if (!transaction || !transaction.bookingId) {
        res.status(404).json({ success: false, message: 'Payment record not found' });
        return;
      }
      if (transaction.status === TransactionStatus.SUCCESS) {
        res.json({ success: true, message: 'Already confirmed' });
        return;
      }

      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      const sigMatch = crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(razorpaySignature));
      if (!sigMatch) {
        res.status(400).json({ success: false, message: 'Invalid payment signature' });
        return;
      }

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.SUCCESS, gatewayMessage: 'Razorpay checkout confirmed.' },
        }),
        prisma.booking.update({
          where: { id: transaction.bookingId },
          data: { status: BookingStatus.ACCEPTED },
        }),
      ]);

      res.json({ success: true, message: 'Payment confirmed and booking accepted.' });
    } catch (err) {
      console.error('[POST /payments/verify-checkout]', err);
      res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
  }
);

/**
 * 1c. POST /payments/test-checkout
 * Dev-only bypass — fabricates a successful payment without touching Razorpay.
 * Blocked in production regardless of any client-side gating.
 */
router.post(
  '/test-checkout',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ success: false, message: 'Not available in production' });
      return;
    }
    const userId = req.user!.id;
    const { bookingId } = req.body;

    try {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.clientId !== userId) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
      }
      if (booking.status !== BookingStatus.PENDING) {
        res.status(400).json({ success: false, message: 'Booking already processed' });
        return;
      }

      const totalFee = Number(booking.totalFee);
      const referenceId = `test_order_${Date.now()}`;

      const txn = await prisma.$transaction(async (tx) => {
        const t = await tx.transaction.create({
          data: {
            referenceId, userId, bookingId,
            type: TransactionType.DEBIT,
            status: TransactionStatus.SUCCESS,
            amount: totalFee, commission: 0, netAmount: totalFee,
            gatewayMessage: '[DEV] Simulated payment via test-checkout.',
          },
        });
        await tx.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.ACCEPTED } });
        return t;
      });

      res.json({ success: true, message: 'Test payment confirmed and booking accepted.', data: txn });
    } catch (err) {
      console.error('[POST /payments/test-checkout]', err);
      res.status(500).json({ success: false, message: 'Test checkout failed' });
    }
  }
);

/**
 * 1d. POST /payments/webhook (raw body, mounted in app.ts before express.json)
 * Server-side backstop for booking payments: if the client's browser closes/loses
 * connection after Razorpay captures payment but before it calls verify-checkout,
 * this reconciles the Transaction/Booking from Razorpay's own event instead of
 * leaving them stuck PENDING forever. Mirrors subscriptions.ts's webhookHandler
 * and contacts.ts's contactWebhookHandler.
 */
export async function paymentsWebhookHandler(req: Request, res: Response) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) return res.status(400).send('Missing signature');

    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature))) {
      return res.status(400).send('Invalid signature');
    }

    const event = JSON.parse(req.body.toString());
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Bookings key the Razorpay order id off Transaction.referenceId (no
      // dedicated order-id column, unlike AdvisorSubscription.razorpayOrderId).
      const transaction = await prisma.transaction.findUnique({ where: { referenceId: orderId } });
      if (transaction && transaction.bookingId && transaction.status !== TransactionStatus.SUCCESS) {
        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.SUCCESS, gatewayMessage: 'Confirmed via Razorpay webhook (client did not complete verify-checkout).' },
          }),
          prisma.booking.update({
            where: { id: transaction.bookingId },
            data: { status: BookingStatus.ACCEPTED },
          }),
        ]);
      }
      // Unknown order id, no linked booking, or already SUCCESS: idempotent no-op, still ack 200.
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('[payments/webhook]', err);
    return res.status(500).send('Webhook error');
  }
}

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

      // No platform commission — advisor payout is base amount minus gateway + platform fee only
      const commission = 0;
      const netAmount  = baseAmount;

      const advisorGatewayFee  = gatewayFee;
      const advisorPlatformFee = platformFee;
      const advisorPayout      = parseFloat((baseAmount - advisorGatewayFee - advisorPlatformFee).toFixed(2));

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
