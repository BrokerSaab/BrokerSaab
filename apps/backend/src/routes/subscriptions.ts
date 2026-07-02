import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { TransactionStatus, Role, AdvisorType } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, requireRole } from '../middlewares/auth';

const router = Router();

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ── Pricing ───────────────────────────────────────────────────────────────────
// Regular plan  : ₹499 base + 18% GST = ₹588.82
// Authorized plan: ₹1,999 base + 18% GST = ₹2,358.82
const PLANS = {
  REGULAR: {
    base: 499,
    total: Math.round(499 * 1.18 * 100) / 100,   // 588.82
    paise: Math.round(499 * 1.18 * 100),           // 58882
    label: 'Regular Advisor Plan',
  },
  AUTHORIZED: {
    base: 1999,
    total: Math.round(1999 * 1.18 * 100) / 100,   // 2358.82
    paise: Math.round(1999 * 1.18 * 100),          // 235882
    label: 'Authorized Advisor Plan',
  },
} as const;

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
 * - Subscribe within 6 months of joining → 1.5 years (18 months) from payment
 * - Subscribe after 6 months             → 1 year from payment
 */
function calcValidUntil(trialStartDate: Date, paymentDate: Date): Date {
  const trialEnd = new Date(trialStartDate);
  trialEnd.setMonth(trialEnd.getMonth() + 6);

  const result = new Date(paymentDate);

  if (paymentDate <= trialEnd) {
    result.setMonth(result.getMonth() + 18);
  } else {
    result.setFullYear(result.getFullYear() + 1);
  }
  return result;
}

// ── POST /subscriptions/create-order ──────────────────────────────────────────
// Body: { plan?: 'REGULAR' | 'AUTHORIZED' }
// - AUTHORIZED advisors always use the AUTHORIZED plan price.
// - REGULAR advisors can pay for REGULAR (₹499) or upgrade to AUTHORIZED (₹1,999).
router.post('/create-order', authenticateJWT, requireRole(['ADVISOR']), async (req: Request, res: Response) => {
  try {
    const advisor = await resolveAdvisor(req);
    const advisorId = advisor?.id;
    if (!advisorId || !advisor) return res.status(403).json({ success: false, message: 'Advisor profile required' });

    // Check no active subscription
    const activeSub = await prisma.advisorSubscription.findFirst({
      where: { advisorId, status: 'SUCCESS', expiresAt: { gt: new Date() } },
    });
    if (activeSub) {
      return res.status(400).json({ success: false, message: 'Active subscription already exists', expiresAt: activeSub.expiresAt });
    }

    // Determine effective plan
    const requestedPlan = (req.body?.plan as string | undefined)?.toUpperCase();
    const effectivePlan: 'REGULAR' | 'AUTHORIZED' =
      advisor.advisorType === 'AUTHORIZED' || requestedPlan === 'AUTHORIZED'
        ? 'AUTHORIZED'
        : 'REGULAR';

    const pricing = PLANS[effectivePlan];

    const order = await getRazorpay().orders.create({
      amount: pricing.paise,
      currency: 'INR',
      receipt: `sub_${advisorId.slice(0, 8)}_${Date.now()}`,
      payment_capture: true,
      notes: {
        advisorId,
        advisorName: advisor.fullName,
        plan: effectivePlan,
        purpose: 'ADVISOR_SUBSCRIPTION',
      },
    } as any);

    await prisma.advisorSubscription.create({
      data: {
        advisorId,
        razorpayOrderId: order.id,
        amount: pricing.total,
        plan: effectivePlan as AdvisorType,
        status: TransactionStatus.PENDING,
      },
    });

    return res.json({
      success: true,
      orderId: order.id,
      amount: pricing.paise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: effectivePlan,
      planLabel: pricing.label,
      planType: advisor.advisorType,
    });
  } catch (err: any) {
    console.error('[create-order]', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// ── POST /subscriptions/verify-payment ────────────────────────────────────────
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
      return res.json({ success: true, message: 'Already activated', expiresAt: sub.expiresAt, plan: sub.plan });
    }

    const advisor = await prisma.advisor.findUnique({ where: { id: sub.advisorId } });
    if (!advisor) return res.status(404).json({ success: false, message: 'Advisor not found' });

    const now = new Date();
    const expiresAt = calcValidUntil(advisor.trialStartDate ?? now, now);
    const paidPlan = sub.plan; // 'REGULAR' | 'AUTHORIZED'

    // If upgrading to AUTHORIZED, mark advisor as authorized dealer
    const advisorUpdate = paidPlan === 'AUTHORIZED'
      ? { isAuthorizedDealer: true, dealerAuthorizedAt: now, advisorType: AdvisorType.AUTHORIZED }
      : {};

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
        data: advisorUpdate,
      }),
    ]);

    return res.json({
      success: true,
      message: 'Subscription activated!',
      expiresAt,
      plan: paidPlan,
      planType: paidPlan === 'AUTHORIZED' ? 'AUTHORIZED' : advisor.advisorType,
    });
  } catch (err: any) {
    console.error('[verify-payment]', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// ── POST /subscriptions/webhook (raw body, mounted before express.json) ───────
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
        const paidPlan = sub.plan;

        const advisorUpdate = paidPlan === 'AUTHORIZED'
          ? { isAuthorizedDealer: true, dealerAuthorizedAt: now, advisorType: AdvisorType.AUTHORIZED }
          : {};

        await prisma.$transaction([
          prisma.advisorSubscription.update({
            where: { razorpayOrderId: orderId },
            data: { status: TransactionStatus.SUCCESS, razorpayPaymentId: paymentId, subscribedAt: now, expiresAt },
          }),
          prisma.advisor.update({
            where: { id: sub.advisorId },
            data: advisorUpdate,
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

// ── GET /subscriptions/status ─────────────────────────────────────────────────
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
      subscribedPlan: sub?.plan ?? null,
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

// ── POST /subscriptions/test-payment (dev/testing only) ──────────────────────
// Body: { plan?: 'REGULAR' | 'AUTHORIZED' }
router.post('/test-payment', authenticateJWT, requireRole(['ADVISOR']), async (req: Request, res: Response) => {
  try {
    const advisor = await resolveAdvisor(req);
    const advisorId = advisor?.id;
    if (!advisorId || !advisor) return res.status(403).json({ success: false, message: 'Advisor profile required' });

    const requestedPlan = (req.body?.plan as string | undefined)?.toUpperCase();
    const effectivePlan: 'REGULAR' | 'AUTHORIZED' =
      advisor.advisorType === 'AUTHORIZED' || requestedPlan === 'AUTHORIZED'
        ? 'AUTHORIZED'
        : 'REGULAR';

    const pricing = PLANS[effectivePlan];
    const fakeOrderId = `test_order_${Date.now()}`;
    const fakePayId   = `test_pay_${Date.now()}`;
    const now         = new Date();
    const expiresAt   = calcValidUntil(advisor.trialStartDate ?? now, now);

    const advisorUpdate = effectivePlan === 'AUTHORIZED'
      ? { isAuthorizedDealer: true, dealerAuthorizedAt: now, advisorType: AdvisorType.AUTHORIZED }
      : {};

    await prisma.$transaction([
      prisma.advisorSubscription.create({
        data: {
          advisorId,
          razorpayOrderId:   fakeOrderId,
          razorpayPaymentId: fakePayId,
          razorpaySignature: 'test_signature',
          amount:            pricing.total,
          plan:              effectivePlan as AdvisorType,
          status:            TransactionStatus.SUCCESS,
          subscribedAt:      now,
          expiresAt,
        },
      }),
      prisma.advisor.update({
        where: { id: advisorId },
        data: advisorUpdate,
      }),
    ]);

    return res.json({
      success: true,
      message: 'Test subscription activated',
      paymentId: fakePayId,
      expiresAt,
      plan: effectivePlan,
      planType: effectivePlan === 'AUTHORIZED' ? 'AUTHORIZED' : advisor.advisorType,
    });
  } catch (err: any) {
    console.error('[subscriptions/test-payment]', err);
    return res.status(500).json({ success: false, message: 'Test payment failed' });
  }
});

export default router;
