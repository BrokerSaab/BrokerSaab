/**
 * Manual check for the Razorpay booking-webhook fallback
 * (POST /api/v1/payments/webhook). Fabricates a PENDING Transaction the same
 * shape POST /payments/checkout creates for a real (non-DUMMY_PAYMENTS) order,
 * then POSTs a correctly HMAC-signed payment.captured payload and confirms
 * the Transaction/Booking reconcile to SUCCESS/ACCEPTED — including replay
 * idempotency, unknown-order-id handling, and signature rejection.
 *
 * Run with: npx ts-node src/services/__tests__/payments-webhook-check.ts
 * (requires the backend already running with RAZORPAY_WEBHOOK_SECRET set to
 * a known test value shared with this script)
 */
import crypto from 'crypto';
import prisma from '../../config/db';

const API = 'http://localhost:5000/api/v1';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_for_check';

let failures = 0;
function check(cond: boolean, label: string, detail?: any) {
  if (!cond) { console.error(`FAIL: ${label}`, detail ?? ''); failures++; }
  else console.log(`ok   : ${label}`);
}

function signedPost(body: object) {
  const raw = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
  return fetch(`${API}/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signature },
    body: raw,
  });
}

async function main() {
  const suffix = Date.now();
  const clientPhone = `9${suffix.toString().slice(-9)}`;
  const advisorPhone = `8${suffix.toString().slice(-9)}`;

  const clientUser = await prisma.user.create({
    data: { phoneNumber: clientPhone, fullName: 'Webhook Test Client', role: 'CLIENT' },
  });
  const advisor = await prisma.advisor.create({
    data: {
      phoneNumber: advisorPhone, email: `webhook-test-${suffix}@test.com`, fullName: 'Webhook Test Advisor',
      experienceYears: 3, consultationFee: 400, languages: ['English'], location: 'Test City',
      verificationStatus: 'APPROVED',
    },
  });
  const slot = await prisma.availabilitySlot.create({
    data: { advisorId: advisor.id, dayOfWeek: new Date().getDay(), startTime: '11:00', endTime: '12:00', isBooked: false },
  });
  const booking = await prisma.booking.create({
    data: {
      bookingNumber: `BS-WEBHOOK-${suffix}`, clientId: clientUser.id, advisorId: advisor.id,
      mode: 'CHAT', scheduledDate: new Date(Date.now() + 86400000), startTime: slot.startTime, endTime: slot.endTime,
      status: 'PENDING', totalFee: 400,
    },
  });
  const orderId = `order_webhook_test_${suffix}`;
  await prisma.transaction.create({
    data: {
      referenceId: orderId, userId: clientUser.id, bookingId: booking.id,
      type: 'DEBIT', status: 'PENDING', amount: 400, commission: 0, netAmount: 400,
      gatewayMessage: 'Awaiting Razorpay checkout confirmation.',
    },
  });

  try {
    // 1. Unknown order id -> 200 OK, no-op
    let res = await signedPost({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_unknown', order_id: `order_does_not_exist_${suffix}` } } } });
    check(res.status === 200, 'unknown order id acked 200 (idempotent no-op)', res.status);

    // 2. Wrong signature -> 400
    const raw = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_x', order_id: orderId } } } });
    res = await fetch(`${API}/payments/webhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': 'deadbeef'.repeat(8) }, body: raw,
    });
    check(res.status === 400, 'tampered signature rejected with 400', res.status);

    // 3. Correct signed payment.captured -> reconciles Transaction + Booking
    res = await signedPost({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_real_1', order_id: orderId } } } });
    check(res.status === 200, 'valid webhook acked 200', res.status);

    const txAfter = await prisma.transaction.findUnique({ where: { referenceId: orderId } });
    check(txAfter?.status === 'SUCCESS', 'Transaction flipped to SUCCESS via webhook', txAfter?.status);

    const bookingAfter = await prisma.booking.findUnique({ where: { id: booking.id } });
    check(bookingAfter?.status === 'ACCEPTED', 'Booking flipped to ACCEPTED via webhook', bookingAfter?.status);

    // 4. Replay same event -> still 200, no duplicate side effects (status already SUCCESS, untouched)
    res = await signedPost({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_real_1', order_id: orderId } } } });
    check(res.status === 200, 'replayed webhook is idempotent (200, no error)', res.status);

    const txReplay = await prisma.transaction.findUnique({ where: { referenceId: orderId } });
    check(txReplay?.status === 'SUCCESS', 'Transaction still SUCCESS after replay (no regression)', txReplay?.status);

  } finally {
    await prisma.transaction.deleteMany({ where: { bookingId: booking.id } });
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
    await prisma.availabilitySlot.deleteMany({ where: { advisorId: advisor.id } });
    await prisma.advisor.delete({ where: { id: advisor.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: clientUser.id } }).catch(() => {});
    console.log('\nFixtures cleaned up.');
  }

  if (failures > 0) { console.error(`\n${failures} check(s) FAILED`); process.exit(1); }
  console.log('\nAll payments-webhook checks passed.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
