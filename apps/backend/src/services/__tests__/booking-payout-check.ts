/**
 * Manual end-to-end check for the booking payment + advisor-credit fix.
 * Creates real fixtures, drives the actual HTTP routes on a running backend
 * (localhost:5000, started with DUMMY_PAYMENTS=true), and confirms the
 * advisor's actual withdrawable balance (Advisor.walletBalance) is credited
 * correctly — the bug this session's work fixed.
 *
 * Run with: npx ts-node src/services/__tests__/booking-payout-check.ts
 * (requires the backend already running with DUMMY_PAYMENTS=true)
 */
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';

const API = 'http://localhost:5000/api/v1';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'brokersaab_secret_access_token_12345_dev_super_secret';

function sign(user: { id: string; phoneNumber: string; role: 'CLIENT' | 'ADVISOR' }) {
  return jwt.sign({ id: user.id, phoneNumber: user.phoneNumber, role: user.role }, JWT_ACCESS_SECRET, { expiresIn: '1h' });
}

let failures = 0;
function check(cond: boolean, label: string, detail?: any) {
  if (!cond) { console.error(`FAIL: ${label}`, detail ?? ''); failures++; }
  else console.log(`ok   : ${label}`);
}

async function main() {
  const suffix = Date.now();
  const clientPhone = `9${suffix.toString().slice(-9)}`;
  const advisorPhone = `8${suffix.toString().slice(-9)}`;

  const clientUser = await prisma.user.create({
    data: { phoneNumber: clientPhone, fullName: 'Booking Test Client', role: 'CLIENT', wallet: { create: { balance: 0 } } },
  });
  const advisorUser = await prisma.user.create({
    data: { phoneNumber: advisorPhone, fullName: 'Booking Test Advisor', role: 'ADVISOR' },
  });
  const advisor = await prisma.advisor.create({
    data: {
      phoneNumber: advisorPhone, email: `booking-test-${suffix}@test.com`, fullName: 'Booking Test Advisor',
      experienceYears: 4, consultationFee: 500, languages: ['English'], location: 'Test City',
      verificationStatus: 'APPROVED',
      bankAccountNumber: '1234567890', bankIfsc: 'SBIN0001234', bankAccountHolder: 'Booking Test Advisor',
    },
  });
  const slot = await prisma.availabilitySlot.create({
    data: { advisorId: advisor.id, dayOfWeek: new Date().getDay(), startTime: '10:00', endTime: '11:00', isBooked: false },
  });

  const clientToken = sign({ id: clientUser.id, phoneNumber: clientPhone, role: 'CLIENT' });

  try {
    // 1. Create booking
    const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    let res = await fetch(`${API}/bookings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({ advisorId: advisor.id, slotId: slot.id, scheduledDate, mode: 'PHONE', notes: 'Test booking' }),
    });
    let body: any = await res.json();
    check(res.status === 201 || (res.status === 200 && body.success), 'create booking', body);
    const bookingId = body.data.id;
    check(body.data.totalFee !== undefined, 'booking has totalFee', body.data);
    const totalFee = Number(body.data.totalFee);

    // 2. Checkout via RAZORPAY gateway — expect DUMMY_PAYMENTS test-mode instant success
    res = await fetch(`${API}/payments/checkout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({ bookingId, gateway: 'RAZORPAY' }),
    });
    body = await res.json();
    check(res.status === 200 && body.success && !body.requiresPayment, 'DUMMY_PAYMENTS checkout instant success (no requiresPayment)', body);

    const bookingAfterPay = await prisma.booking.findUnique({ where: { id: bookingId } });
    check(bookingAfterPay?.status === 'ACCEPTED', 'booking status -> ACCEPTED after DUMMY_PAYMENTS checkout', bookingAfterPay?.status);

    // 3. Mark booking COMPLETED -> should credit Advisor.walletBalance (the fix)
    res = await fetch(`${API}/bookings/${bookingId}/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    body = await res.json();
    check(res.status === 200 && body.success, 'mark booking COMPLETED', body);

    const advisorAfter = await prisma.advisor.findUnique({ where: { id: advisor.id } });
    check(Number(advisorAfter?.walletBalance) === totalFee, `Advisor.walletBalance credited exactly totalFee (${totalFee})`, advisorAfter?.walletBalance);

    const walletAfter = await prisma.wallet.findUnique({ where: { userId: advisorUser.id } });
    check(Number(walletAfter?.balance ?? 0) === 0, 'User-linked Wallet.balance NOT touched (bug fixed — old code wrote here)', walletAfter?.balance);

    // 4. Confirm the advisor can actually withdraw the credited amount
    const advisorToken = sign({ id: advisorUser.id, phoneNumber: advisorPhone, role: 'ADVISOR' });
    res = await fetch(`${API}/advisors/wallet/withdraw`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${advisorToken}` },
      body: JSON.stringify({ amount: totalFee, bankAccount: '1234567890', ifscCode: 'SBIN0001234', accountHolderName: 'Booking Test Advisor' }),
    });
    body = await res.json();
    check(res.status === 200 && body.success, 'advisor can withdraw the booking earnings', body);

    const advisorFinal = await prisma.advisor.findUnique({ where: { id: advisor.id } });
    check(Number(advisorFinal?.walletBalance) === 0, 'Advisor.walletBalance decremented to 0 after withdrawal request', advisorFinal?.walletBalance);

    // 5. test-checkout route (dev bypass) — separate booking, separate slot
    const slot2 = await prisma.availabilitySlot.create({
      data: { advisorId: advisor.id, dayOfWeek: new Date().getDay(), startTime: '14:00', endTime: '15:00', isBooked: false },
    });
    res = await fetch(`${API}/bookings`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({ advisorId: advisor.id, slotId: slot2.id, scheduledDate, mode: 'CHAT', notes: 'Test booking 2' }),
    });
    body = await res.json();
    const bookingId2 = body.data.id;

    res = await fetch(`${API}/payments/test-checkout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({ bookingId: bookingId2 }),
    });
    body = await res.json();
    check(res.status === 200 && body.success, 'test-checkout route works in non-production', body);

  } finally {
    // Cleanup
    await prisma.payout.deleteMany({ where: { advisorId: advisor.id } });
    await prisma.transaction.deleteMany({ where: { OR: [{ userId: clientUser.id }, { userId: advisorUser.id }] } });
    await prisma.booking.deleteMany({ where: { advisorId: advisor.id } });
    await prisma.availabilitySlot.deleteMany({ where: { advisorId: advisor.id } });
    await prisma.wallet.deleteMany({ where: { userId: { in: [clientUser.id, advisorUser.id] } } });
    await prisma.advisor.delete({ where: { id: advisor.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: clientUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: advisorUser.id } }).catch(() => {});
    console.log('\nFixtures cleaned up.');
  }

  if (failures > 0) { console.error(`\n${failures} check(s) FAILED`); process.exit(1); }
  console.log('\nAll booking-payout checks passed.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
