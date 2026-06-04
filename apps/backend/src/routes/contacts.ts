import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Role, TransactionStatus } from '@prisma/client';
import prisma from '../config/db';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// GST constants for contact pack
const BASE_AMOUNT       = 99;
const ORIGINAL_PRICE    = 999;
const CGST_AMT          = Math.round(BASE_AMOUNT * 0.09 * 100) / 100;  // 8.91
const SGST_AMT          = Math.round(BASE_AMOUNT * 0.09 * 100) / 100;  // 8.91
const TOTAL_AMOUNT      = Math.round((BASE_AMOUNT + CGST_AMT + SGST_AMT) * 100) / 100; // 116.82
const AMOUNT_PAISE      = Math.round(TOTAL_AMOUNT * 100);               // 11682
const CREDITS_PER_PACK  = 20;

// ── GET /contacts/status ──────────────────────────────────────────
router.get('/status', authenticateJWT, requireRole([Role.CLIENT]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const activeSub = await prisma.userContactSubscription.findFirst({
      where: { userId, status: TransactionStatus.SUCCESS, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
    });

    const unlocks = await prisma.contactUnlock.findMany({
      where: { userId },
      select: { advisorId: true },
    });

    const creditsRemaining = activeSub ? activeSub.creditsTotal - activeSub.creditsUsed : 0;

    return res.json({
      success: true,
      creditsRemaining,
      creditsTotal: activeSub?.creditsTotal ?? 0,
      expiresAt: activeSub?.expiresAt ?? null,
      unlockedAdvisorIds: unlocks.map((u) => u.advisorId),
    });
  } catch (err) {
    console.error('[contacts/status]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch contact status' });
  }
});

// ── POST /contacts/unlock/:advisorId ─────────────────────────────
router.post('/unlock/:advisorId', authenticateJWT, requireRole([Role.CLIENT]), async (req: AuthenticatedRequest, res: Response) => {
  const userId    = req.user!.id;
  const advisorId = req.params.advisorId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Idempotency — already unlocked?
      const existing = await tx.contactUnlock.findUnique({
        where: { userId_advisorId: { userId, advisorId } },
      });
      if (existing) {
        const advisor = await tx.advisor.findUnique({ where: { id: advisorId }, select: { phoneNumber: true, email: true } });
        const activeSub = await tx.userContactSubscription.findFirst({
          where: { userId, status: TransactionStatus.SUCCESS, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        });
        return {
          alreadyUnlocked: true,
          phoneNumber: advisor?.phoneNumber ?? '',
          email: advisor?.email ?? '',
          creditsRemaining: activeSub ? activeSub.creditsTotal - activeSub.creditsUsed : 0,
        };
      }

      // 2. Check advisor exists
      const advisor = await tx.advisor.findUnique({ where: { id: advisorId }, select: { phoneNumber: true, email: true } });
      if (!advisor) throw new Error('ADVISOR_NOT_FOUND');

      // 3. Count existing unlocks for this user
      const totalUnlocks = await tx.contactUnlock.count({ where: { userId } });

      // 4. Free first unlock
      if (totalUnlocks === 0) {
        await tx.contactUnlock.create({ data: { userId, advisorId, isFree: true } });
        return { phoneNumber: advisor.phoneNumber, email: advisor.email ?? '', creditsRemaining: 0, isFree: true };
      }

      // 5. Find active subscription with credits
      const activeSub = await tx.userContactSubscription.findFirst({
        where: { userId, status: TransactionStatus.SUCCESS, expiresAt: { gt: new Date() }, creditsUsed: { lt: tx.userContactSubscription.fields?.creditsTotal as any } },
        orderBy: { createdAt: 'asc' },
      });

      // Re-query without the field comparison (Prisma doesn't support column-to-column in findFirst)
      const subWithCredits = await tx.userContactSubscription.findFirst({
        where: { userId, status: TransactionStatus.SUCCESS, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'asc' },
      });

      if (!subWithCredits || subWithCredits.creditsUsed >= subWithCredits.creditsTotal) {
        return { requiresPurchase: true };
      }

      // 6. Atomic deduct (race-safe)
      const updated = await tx.userContactSubscription.updateMany({
        where: { id: subWithCredits.id, creditsUsed: { lt: subWithCredits.creditsTotal } },
        data: { creditsUsed: { increment: 1 } },
      });
      if (updated.count === 0) throw new Error('CREDIT_RACE');

      // 7. Create unlock record
      await tx.contactUnlock.create({ data: { userId, advisorId, isFree: false, subscriptionId: subWithCredits.id } });

      return {
        phoneNumber: advisor.phoneNumber,
        email: advisor.email ?? '',
        creditsRemaining: subWithCredits.creditsTotal - subWithCredits.creditsUsed - 1,
      };
    });

    if ((result as any).requiresPurchase) {
      return res.status(402).json({ success: false, requiresPurchase: true, message: 'NO_ACTIVE_PACK' });
    }
    if ((result as any).ADVISOR_NOT_FOUND) {
      return res.status(404).json({ success: false, message: 'Advisor not found' });
    }

    return res.json({ success: true, ...result });
  } catch (err: any) {
    if (err.message === 'ADVISOR_NOT_FOUND') return res.status(404).json({ success: false, message: 'Advisor not found' });
    if (err.message === 'CREDIT_RACE') return res.status(409).json({ success: false, message: 'Credit allocation conflict, please retry' });
    console.error('[contacts/unlock]', err);
    return res.status(500).json({ success: false, message: 'Failed to unlock contact' });
  }
});

// ── POST /contacts/create-order ──────────────────────────────────
router.post('/create-order', authenticateJWT, requireRole([Role.CLIENT]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const order = await getRazorpay().orders.create({
      amount: AMOUNT_PAISE,
      currency: 'INR',
      receipt: `cpk_${userId.slice(0, 8)}_${Date.now()}`,
      payment_capture: true,
      notes: { userId, purpose: 'CONTACT_UNLOCK_PACK', credits: CREDITS_PER_PACK },
    } as any);

    await prisma.userContactSubscription.create({
      data: { userId, razorpayOrderId: order.id, amount: TOTAL_AMOUNT, status: TransactionStatus.PENDING },
    });

    return res.json({ success: true, orderId: order.id, amount: AMOUNT_PAISE, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('[contacts/create-order]', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// ── POST /contacts/verify-payment ────────────────────────────────
router.post('/verify-payment', authenticateJWT, requireRole([Role.CLIENT]), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Missing payment fields' });
    }

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(razorpaySignature))) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const sub = await prisma.userContactSubscription.findUnique({ where: { razorpayOrderId } });
    if (!sub) return res.status(404).json({ success: false, message: 'Subscription record not found' });
    if (sub.status === TransactionStatus.SUCCESS) {
      return res.json({ success: true, message: 'Already activated', creditsTotal: sub.creditsTotal, expiresAt: sub.expiresAt });
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await prisma.userContactSubscription.update({
      where: { razorpayOrderId },
      data: {
        status: TransactionStatus.SUCCESS,
        razorpayPaymentId,
        razorpaySignature,
        subscribedAt: now,
        expiresAt,
        creditsTotal: CREDITS_PER_PACK,
        creditsUsed: 0,
      },
    });

    return res.json({ success: true, creditsTotal: CREDITS_PER_PACK, expiresAt });
  } catch (err) {
    console.error('[contacts/verify-payment]', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// ── Webhook (raw body, mounted in app.ts before express.json) ────
export async function contactWebhookHandler(req: Request, res: Response) {
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
      const orderId  = payment.order_id;
      const paymentId = payment.id;

      const sub = await prisma.userContactSubscription.findUnique({ where: { razorpayOrderId: orderId } });
      if (sub && sub.status !== TransactionStatus.SUCCESS) {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        await prisma.userContactSubscription.update({
          where: { razorpayOrderId: orderId },
          data: {
            status: TransactionStatus.SUCCESS,
            razorpayPaymentId: paymentId,
            subscribedAt: now,
            expiresAt,
            creditsTotal: CREDITS_PER_PACK,
            creditsUsed: 0,
          },
        });
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('[contacts/webhook]', err);
    return res.status(500).send('Webhook error');
  }
}

export default router;
