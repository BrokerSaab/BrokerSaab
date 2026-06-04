import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { TransactionStatus } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, requireRole } from '../middlewares/auth';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Base ₹1,999 + CGST 9% + SGST 9% = ₹1,999 × 1.18 = ₹2,358.82
const BASE_AMOUNT = 1999;
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;
const GST_AMOUNT = Math.round(BASE_AMOUNT * (CGST_RATE + SGST_RATE) * 100) / 100; // 359.82
const TOTAL_AMOUNT = Math.round((BASE_AMOUNT + GST_AMOUNT) * 100) / 100;           // 2358.82
const SUBSCRIPTION_AMOUNT_PAISE = Math.round(TOTAL_AMOUNT * 100);                  // 235882 paise
const SUBSCRIPTION_AMOUNT = TOTAL_AMOUNT;

// ── POST /subscriptions/create-order ──────────────────────────────
router.post('/create-order', authenticateJWT, requireRole(['ADVISOR']), async (req: Request, res: Response) => {
  try {
    const advisorId = (req as any).user.advisorId;
    if (!advisorId) return res.status(403).json({ success: false, message: 'Advisor profile required' });

    const advisor = await prisma.advisor.findUnique({ where: { id: advisorId } });
    if (!advisor) return res.status(404).json({ success: false, message: 'Advisor not found' });
    if (advisor.advisorType !== 'AUTHORIZED') {
      return res.status(400).json({ success: false, message: 'Only Authorized advisors can subscribe' });
    }

    // Check no active subscription
    const activeSub = await prisma.advisorSubscription.findFirst({
      where: { advisorId, status: 'SUCCESS', expiresAt: { gt: new Date() } },
    });
    if (activeSub) {
      return res.status(400).json({ success: false, message: 'Active subscription already exists', expiresAt: activeSub.expiresAt });
    }

    const order = await razorpay.orders.create({
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `sub_${advisorId.slice(0, 8)}_${Date.now()}`,
      payment_capture: true,
      notes: {
        advisorId,
        advisorName: advisor.fullName,
        purpose: 'AUTHORIZED_ADVISOR_SUBSCRIPTION',
      },
    } as any);

    await prisma.advisorSubscription.create({
      data: {
        advisorId,
        razorpayOrderId: order.id,
        amount: SUBSCRIPTION_AMOUNT,
        status: TransactionStatus.PENDING,
      },
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('[create-order]', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// ── POST /subscriptions/verify-payment ────────────────────────────
router.post('/verify-payment', authenticateJWT, requireRole(['ADVISOR']), async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const sigMatch = crypto.timingSafeEqual(
      Buffer.from(expectedSig),
      Buffer.from(razorpaySignature)
    );
    if (!sigMatch) return res.status(400).json({ success: false, message: 'Invalid payment signature' });

    const sub = await prisma.advisorSubscription.findUnique({ where: { razorpayOrderId } });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription record not found' });
    if (sub.status === TransactionStatus.SUCCESS) {
      return res.json({ success: true, message: 'Already activated', expiresAt: sub.expiresAt });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await prisma.$transaction([
      prisma.advisorSubscription.update({
        where: { razorpayOrderId },
        data: {
          status: TransactionStatus.SUCCESS,
          razorpayPaymentId,
          razorpaySignature,
          subscribedAt: now,
          expiresAt,
        },
      }),
      prisma.advisor.update({
        where: { id: sub.advisorId },
        data: { isAuthorizedDealer: true, dealerAuthorizedAt: now },
      }),
    ]);

    return res.json({ success: true, message: 'Authorized badge activated!', expiresAt });
  } catch (err: any) {
    console.error('[verify-payment]', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// ── POST /subscriptions/webhook (raw body, mounted before express.json) ──
export async function webhookHandler(req: Request, res: Response) {
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
      const paymentId = payment.id;

      const sub = await prisma.advisorSubscription.findUnique({ where: { razorpayOrderId: orderId } });
      if (sub && sub.status !== TransactionStatus.SUCCESS) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await prisma.$transaction([
          prisma.advisorSubscription.update({
            where: { razorpayOrderId: orderId },
            data: { status: TransactionStatus.SUCCESS, razorpayPaymentId: paymentId, subscribedAt: now, expiresAt },
          }),
          prisma.advisor.update({
            where: { id: sub.advisorId },
            data: { isAuthorizedDealer: true, dealerAuthorizedAt: now },
          }),
        ]);
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('[webhook]', err);
    return res.status(500).send('Webhook error');
  }
}

export default router;
