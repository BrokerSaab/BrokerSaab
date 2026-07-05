/**
 * Manual end-to-end walkthrough for the milestone-payout + refund feature.
 * Creates real fixtures against the dev DB, drives the actual HTTP routes on
 * a running backend (localhost:5000, started with DUMMY_PAYOUTS=true), and
 * asserts the money reconciliation invariant. Not a permanent test — cleans
 * up its own fixtures at the end.
 *
 * Run with: npx ts-node src/services/__tests__/e2e-walkthrough.ts
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
  const clientPhone  = `9${suffix.toString().slice(-9)}`;
  const advisorPhone = `8${suffix.toString().slice(-9)}`;

  const clientUser = await prisma.user.create({
    data: { phoneNumber: clientPhone, fullName: 'E2E Test Client', role: 'CLIENT', wallet: { create: { balance: 0 } } },
  });
  const advisorUser = await prisma.user.create({
    data: { phoneNumber: advisorPhone, fullName: 'E2E Test Advisor', role: 'ADVISOR' },
  });
  const advisor = await prisma.advisor.create({
    data: {
      phoneNumber: advisorPhone, email: `e2e-advisor-${suffix}@test.com`, fullName: 'E2E Test Advisor',
      experienceYears: 5, consultationFee: 500, languages: ['English'], location: 'Test City',
      verificationStatus: 'APPROVED',
      bankAccountNumber: '1234567890', bankIfsc: 'SBIN0001234', bankAccountHolder: 'E2E Test Advisor',
    },
  });

  const quote = await prisma.feeQuote.create({
    data: {
      clientId: clientUser.id, advisorId: advisor.id, status: 'ACCEPTED', totalAmount: 5000,
      lineItems: {
        create: [
          { description: 'Item 1', amount: 1000, sortOrder: 0 },
          { description: 'Item 2', amount: 2000, sortOrder: 1 },
          { description: 'Item 3', amount: 2000, sortOrder: 2 },
        ],
      },
    },
    include: { lineItems: true },
  });

  const baseAmount = 5000;
  const gatewayFee = Math.round(baseAmount * 0.015 * 100) / 100; // 75
  const platformFee = baseAmount <= 3000 ? 30 : baseAmount <= 5000 ? 50 : Math.round(baseAmount * 0.01 * 100) / 100; // 50 (1% tier)
  const totalAmount = baseAmount + gatewayFee + platformFee; // 5125
  const advisorGatewayFee = gatewayFee, advisorPlatformFee = platformFee;
  const advisorPayout = baseAmount - advisorGatewayFee - advisorPlatformFee; // 4875

  const ticket = await prisma.serviceTicket.create({
    data: {
      ticketNumber: `E2E-${suffix}`, quoteId: quote.id, clientId: clientUser.id, advisorId: advisor.id,
      baseAmount, platformFee, gatewayFee, totalAmount, commission: 0, netAmount: baseAmount,
      advisorGatewayFee, advisorPlatformFee, advisorPayout, status: 'OPEN',
    },
  });

  const clientToken  = sign({ id: clientUser.id, phoneNumber: clientPhone, role: 'CLIENT' });
  const advisorToken = sign({ id: advisorUser.id, phoneNumber: advisorPhone, role: 'ADVISOR' });
  const item1 = quote.lineItems.find(li => li.description === 'Item 1')!;
  const item2 = quote.lineItems.find(li => li.description === 'Item 2')!;
  const item3 = quote.lineItems.find(li => li.description === 'Item 3')!;

  try {
    // 1. Advisor attaches a stage to item2 (milestone release)
    let res = await fetch(`${API}/tickets/${ticket.id}/stages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${advisorToken}` },
      body: JSON.stringify({ title: 'Work on item 2', lineItemId: item2.id }),
    });
    let body: any = await res.json();
    check(res.status === 201 && body.data?.releaseAmount === '2000', 'attach stage to item2', body);
    const stage2Id = body.data.id;

    // Advance to AWAITING_CONFIRM
    res = await fetch(`${API}/tickets/${ticket.id}/stages/${stage2Id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${advisorToken}` },
      body: JSON.stringify({ status: 'AWAITING_CONFIRM' }),
    });
    check(res.status === 200, 'stage2 -> AWAITING_CONFIRM', await res.text());

    // Client confirms -> triggers milestone payout
    res = await fetch(`${API}/tickets/${ticket.id}/stages/${stage2Id}/confirm`, {
      method: 'POST', headers: { Authorization: `Bearer ${clientToken}` },
    });
    body = await res.json();
    check(res.status === 200, 'client confirms stage2', body);

    await new Promise(r => setTimeout(r, 300)); // let async payout settle

    const item2After = await prisma.feeQuoteLineItem.findUnique({ where: { id: item2.id } });
    check(item2After?.status === 'RELEASED', 'item2 status -> RELEASED', item2After?.status);

    const payoutForStage2 = await prisma.payout.findUnique({ where: { stageId: stage2Id } });
    check(!!payoutForStage2, 'Payout row created for stage2', payoutForStage2);
    check(Number(payoutForStage2?.netAmount) === 1950, 'stage2 payout netAmount == 1950', payoutForStage2?.netAmount);

    const advisorAfterMilestone = await prisma.advisor.findUnique({ where: { id: advisor.id } });
    check(Number(advisorAfterMilestone?.walletBalance) === 1950, 'advisor wallet credited 1950 after milestone', advisorAfterMilestone?.walletBalance);

    // 2. Try attaching a second stage to the same (now RELEASED) line item -> expect 409
    res = await fetch(`${API}/tickets/${ticket.id}/stages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${advisorToken}` },
      body: JSON.stringify({ title: 'Duplicate', lineItemId: item2.id }),
    });
    check(res.status === 409, 'attaching stage to already-RELEASED item2 -> 409', res.status);

    // 3. Advisor cancels item1 (refund trigger)
    res = await fetch(`${API}/tickets/${ticket.id}/line-items/${item1.id}/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${advisorToken}` },
      body: JSON.stringify({ reason: 'Not needed after all' }),
    });
    body = await res.json();
    check(res.status === 200 && body.data?.refundAmount === 1000, 'cancel item1 -> refundAmount 1000', body);

    const clientWalletAfterRefund = await prisma.wallet.findUnique({ where: { userId: clientUser.id } });
    check(Number(clientWalletAfterRefund?.balance) === 1000, 'client wallet credited exactly 1000 (no fee proration)', clientWalletAfterRefund?.balance);

    const item1After = await prisma.feeQuoteLineItem.findUnique({ where: { id: item1.id } });
    check(item1After?.status === 'CANCELLED', 'item1 status -> CANCELLED', item1After?.status);

    // 4. Try cancelling item2 (already RELEASED) -> expect 409
    res = await fetch(`${API}/tickets/${ticket.id}/line-items/${item2.id}/cancel`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${advisorToken}` },
      body: JSON.stringify({ reason: 'test double-cancel' }),
    });
    check(res.status === 409, 'cancel already-RELEASED item2 -> 409', res.status);

    // 5. Client closes the ticket — item3 still PENDING, should settle only that
    res = await fetch(`${API}/tickets/${ticket.id}/close`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
      body: JSON.stringify({ closingComment: 'All done', userRating: 5 }),
    });
    body = await res.json();
    check(res.status === 200, 'close ticket', body);

    await new Promise(r => setTimeout(r, 300));

    const allPayouts = await prisma.payout.findMany({ where: { ticketId: ticket.id } });
    check(allPayouts.length === 2, 'exactly 2 Payout rows exist (stage2 + close remainder)', allPayouts.length);

    const closePayout = allPayouts.find(p => p.stageId === null);
    check(!!closePayout && Number(closePayout.netAmount) === 1950, 'close-route payout netAmount == 1950 (item3 only)', closePayout?.netAmount);

    const advisorFinal = await prisma.advisor.findUnique({ where: { id: advisor.id } });
    check(Number(advisorFinal?.walletBalance) === 3900, 'advisor total wallet == 3900 (1950 + 1950)', advisorFinal?.walletBalance);

    const ticketFinal = await prisma.serviceTicket.findUnique({ where: { id: ticket.id } });
    check(ticketFinal?.status === 'PAYOUT_RELEASED', 'ticket status -> PAYOUT_RELEASED', ticketFinal?.status);

    // 6. Full reconciliation invariant
    const refundTotal = 1000;
    const advisorTotal = Number(advisorFinal?.walletBalance);
    const retainedClientFee = platformFee + gatewayFee; // 125, collected once at ticket creation
    const retainedAdvisorFees = (Number(payoutForStage2?.amount) - Number(payoutForStage2?.netAmount)) +
                                 (Number(closePayout?.amount) - Number(closePayout?.netAmount));
    const reconciled = refundTotal + advisorTotal + retainedClientFee + retainedAdvisorFees;
    check(Math.abs(reconciled - totalAmount) < 0.01, `reconciliation: refund+advisor+fees(${reconciled}) == totalAmount(${totalAmount})`, { reconciled, totalAmount });

  } finally {
    // Cleanup fixtures
    await prisma.payout.deleteMany({ where: { ticketId: ticket.id } });
    await prisma.ticketStage.deleteMany({ where: { ticketId: ticket.id } });
    await prisma.serviceTicket.delete({ where: { id: ticket.id } }).catch(() => {});
    await prisma.feeQuoteLineItem.deleteMany({ where: { quoteId: quote.id } });
    await prisma.feeQuote.delete({ where: { id: quote.id } }).catch(() => {});
    await prisma.advisor.delete({ where: { id: advisor.id } }).catch(() => {});
    await prisma.wallet.deleteMany({ where: { userId: clientUser.id } });
    await prisma.user.delete({ where: { id: clientUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: advisorUser.id } }).catch(() => {});
    console.log('\nFixtures cleaned up.');
  }

  if (failures > 0) { console.error(`\n${failures} check(s) FAILED`); process.exit(1); }
  console.log('\nAll end-to-end checks passed.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
