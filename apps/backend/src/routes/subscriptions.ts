import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { TransactionStatus, Role } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, requireRole } from '../middlewares/auth';

const router = Router();

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Base ₹1,999 + CGST 9% + SGST 9% = ₹1,999 × 1.18 = ₹2,358.82
const BASE_AMOUNT = 1999;
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;
const GST_AMOUNT = Math.round(BASE_AMOUNT * (CGST_RATE + SGST_RATE) * 100) / 100;
const TOTAL_AMOUNT = Math.round((BASE_AMOUNT + GST_AMOUNT) * 100) / 100;
const SUBSCRIPTION_AMOUNT_PAISE = Math.round(TOTAL_AMOUNT * 100);
const SUBSCRIPTION_AMOUNT = TOTAL_AMOUNT;

// helper: resolve advisor from JWT
async function resolveAdvisor(req: Request) {
  const user = (req as any).user;
  if (user.advisorId) return prisma.advisor.findUnique({ where: { id: user.advisorId } });
  return prisma.advisor.findUnique({ where: { phoneNumber: user.phoneNumber } });
}

/**
 * Calculates subscription validity end date based on when the advisor pays
 * relative to their 6-month free trial.
 *
 * - Pay on day 0 (onboarding day)  → 2 years from payment
 * - Pay during trial (day 1–179)   → 1.5 years (18 months) from payment
 * - Pay after trial expires         → 1 year from payment
 */
function calcValidUntil(trialStartDate: Date, paymentDate: Date): Date {
  const trialEnd = new Date(trialStartDate);
  trialEnd.setMonth(trialEnd.getMonth() + 6);

  const result = new Date(paymentDate);
  const isOnboardingDay = paymentDate.toDateString() === trialStartDate.toDateString();

  if (isOnboardingDay) {
    result.setFullYear(result.getFullYear() + 2);
  } else if (paymentDate <= trialEnd) {
    result.setMonth(result.getMonth() + 18);
  } else {
    result.setFullYear(result.getFullYear() + 1);
  }
  return result;
}

// ── POST /subscriptions/create-order ──────────────────────────────
router.post('/create-order', authenticateJWT, requireRole(['ADVISOR']), async (req: Request, res: Response) => {
  try {
    const advisor = await resolveAdvisor(req);
    const advisorId = advisor?.id;
    if (!advisorId) return res.status(403).json({ success: false, message: 'Advisor profile required' });
    if (!advisor) return res.status(404).json({ success: false, message: 'Advisor not found' });

    // Check no active subscription
    const activeSub = await prisma.advisorSubscription.findFirst({
      where: { advisorId, status: 'SUCCESS', expiresAt: { gt: new Date() } },
    });
    if (activeSub) {
      return res.status(400).json({ success: false, message: 'Active subscription already exists', expiresAt: activeSub.expiresAt });
    }

    const order = await getRazorpay().orders.create({
      amount: SUBSCRIPTION_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `sub_${advisorId.slice(0, 8)}_${Date.now()}`,
      payment_capture: true,
      notes: {
        advisorId,
        advisorName: advisor.fullName,
        planType: advisor.advisorType,
        purpose: 'ADVISOR_SUBSCRIPTION',
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
      planType: advisor.advisorType,
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

    const advisor = await prisma.advisor.findUnique({ where: { id: sub.advisorId } });
    if (!advisor) return res.status(404).json({ success: false, message: 'Advisor not found' });

    const now = new Date();
    const expiresAt = calcValidUntil(advisor.trialStartDate ?? now, now);

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
        data: advisor.advisorType === 'AUTHORIZED'
          ? { isAuthorizedDealer: true, dealerAuthorizedAt: now }
          : {},
      }),
    ]);

    return res.json({ success: true, message: 'Subscription activated!', expiresAt, planType: advisor.advisorType });
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
        const advisor = await prisma.advisor.findUnique({ where: { id: sub.advisorId } });
        const now = new Date();
        const expiresAt = calcValidUntil(advisor?.trialStartDate ?? now, now);

        await prisma.$transaction([
          prisma.advisorSubscription.update({
            where: { razorpayOrderId: orderId },
            data: { status: TransactionStatus.SUCCESS, razorpayPaymentId: paymentId, subscribedAt: now, expiresAt },
          }),
          prisma.advisor.update({
            where: { id: sub.advisorId },
            data: advisor?.advisorType === 'AUTHORIZED'
              ? { isAuthorizedDealer: true, dealerAuthorizedAt: now }
              : {},
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

// ── GET /subscriptions/status ────────────────────────────────────
router.get('/status', authenticateJWT, requireRole([Role.ADVISOR]), async (req: any, res: Response) => {
  try {
    const advisor = await prisma.advisor.findUnique({ where: { phoneNumber: req.user.phoneNumber } });
    if (!advisor) return res.status(404).json({ success: false, message: 'Advisor profile not found' });

    const sub = await prisma.advisorSubscription.findFirst({
      where: { advisorId: advisor.id, status: TransactionStatus.SUCCESS },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const isActive = !!sub?.expiresAt && sub.expiresAt > now;
    const daysLeft = isActive
      ? Math.floor((sub!.expiresAt!.getTime() - now.getTime()) / 86400000)
      : 0;

    const trialEndDate = advisor.trialEndDate;
    const isInTrial = !isActive && !!trialEndDate && trialEndDate > now;
    const trialDaysLeft = isInTrial
      ? Math.floor((trialEndDate!.getTime() - now.getTime()) / 86400000)
      : 0;

    const status = isActive ? 'ACTIVE' : isInTrial ? 'TRIAL' : 'EXPIRED';

    return res.json({
      success: true,
      status,
      planType: advisor.advisorType,
      trialStartDate: advisor.trialStartDate,
      trialEndDate,
      trialDaysLeft,
      isInTrial,
      isActive,
      subscriptionValidUntil: sub?.expiresAt ?? null,
      daysLeft: isActive ? daysLeft : trialDaysLeft,
    });
  } catch (err) {
    console.error('[subscriptions/status]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription status' });
  }
});

// ── POST /subscriptions/test-payment (dev/testing only) ──────────────
router.post('/test-payment', authenticateJWT, requireRole(['ADVISOR']), async (req: Request, res: Response) => {
  try {
    const advisor = await resolveAdvisor(req);
    const advisorId = advisor?.id;
    if (!advisorId || !advisor) return res.status(403).json({ success: false, message: 'Advisor profile required' });

    const fakeOrderId = `test_order_${Date.now()}`;
    const fakePayId   = `test_pay_${Date.now()}`;
    const now         = new Date();
    const expiresAt   = calcValidUntil(advisor.trialStartDate ?? now, now);

    await prisma.$transaction([
      prisma.advisorSubscription.create({
        data: {
          advisorId,
          razorpayOrderId:   fakeOrderId,
          razorpayPaymentId: fakePayId,
          razorpaySignature: 'test_signature',
          amount:            SUBSCRIPTION_AMOUNT,
          status:            TransactionStatus.SUCCESS,
          subscribedAt:      now,
          expiresAt,
        },
      }),
      prisma.advisor.update({
        where: { id: advisorId },
        data: advisor.advisorType === 'AUTHORIZED'
          ? { isAuthorizedDealer: true, dealerAuthorizedAt: now }
          : {},
      }),
    ]);

    return res.json({ success: true, message: 'Test subscription activated', paymentId: fakePayId, expiresAt, planType: advisor.advisorType });
  } catch (err: any) {
    console.error('[subscriptions/test-payment]', err);
    return res.status(500).json({ success: false, message: 'Test payment failed' });
  }
});

export default router;
