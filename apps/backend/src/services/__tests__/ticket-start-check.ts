/**
 * Manual check for POST /tickets/:id/start — the new advisor-driven
 * OPEN -> IN_PROGRESS ticket-status transition, independent of adding a stage.
 *
 * Run with: npx ts-node src/services/__tests__/ticket-start-check.ts
 * (requires the backend already running)
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
    data: { phoneNumber: clientPhone, fullName: 'Ticket Start Test Client', role: 'CLIENT' },
  });
  const advisorUser = await prisma.user.create({
    data: { phoneNumber: advisorPhone, fullName: 'Ticket Start Test Advisor', role: 'ADVISOR' },
  });
  const advisor = await prisma.advisor.create({
    data: {
      phoneNumber: advisorPhone, email: `ticket-start-${suffix}@test.com`, fullName: 'Ticket Start Test Advisor',
      experienceYears: 5, consultationFee: 500, languages: ['English'], location: 'Test City',
      verificationStatus: 'APPROVED',
    },
  });
  const quote = await prisma.feeQuote.create({
    data: { clientId: clientUser.id, advisorId: advisor.id, status: 'ACCEPTED', totalAmount: 1000 },
  });
  const ticket = await prisma.serviceTicket.create({
    data: {
      ticketNumber: `TK-START-${suffix}`, quoteId: quote.id, clientId: clientUser.id, advisorId: advisor.id,
      baseAmount: 1000, platformFee: 30, gatewayFee: 15, totalAmount: 1045, commission: 0, netAmount: 1000,
      paymentRef: `test_${suffix}`, status: 'OPEN',
    },
  });

  const advisorToken = sign({ id: advisorUser.id, phoneNumber: advisorPhone, role: 'ADVISOR' });
  const clientToken = sign({ id: clientUser.id, phoneNumber: clientPhone, role: 'CLIENT' });

  try {
    // 1. Client cannot call /start (advisor-only)
    let res = await fetch(`${API}/tickets/${ticket.id}/start`, {
      method: 'POST', headers: { Authorization: `Bearer ${clientToken}` },
    });
    check(res.status === 403, 'client forbidden from calling /start', res.status);

    // 2. Advisor starts work -> OPEN -> IN_PROGRESS
    res = await fetch(`${API}/tickets/${ticket.id}/start`, {
      method: 'POST', headers: { Authorization: `Bearer ${advisorToken}` },
    });
    let body: any = await res.json();
    check(res.status === 200 && body.success && body.data.status === 'IN_PROGRESS', 'advisor starts work -> IN_PROGRESS', body);

    const ticketAfter = await prisma.serviceTicket.findUnique({ where: { id: ticket.id } });
    check(ticketAfter?.status === 'IN_PROGRESS', 'ticket persisted as IN_PROGRESS', ticketAfter?.status);

    // 3. Calling /start again on an already-IN_PROGRESS ticket -> 400, no-op
    res = await fetch(`${API}/tickets/${ticket.id}/start`, {
      method: 'POST', headers: { Authorization: `Bearer ${advisorToken}` },
    });
    body = await res.json();
    check(res.status === 400 && !body.success, '/start on already-started ticket returns 400', body);

    const ticketStillInProgress = await prisma.serviceTicket.findUnique({ where: { id: ticket.id } });
    check(ticketStillInProgress?.status === 'IN_PROGRESS', 'ticket status unchanged after redundant /start call', ticketStillInProgress?.status);

    // 4. A system comment was created
    const comments = await prisma.ticketComment.findMany({ where: { ticketId: ticket.id } });
    check(comments.some(c => c.content.includes('started working')), 'system comment recorded for start-work action', comments.map(c => c.content));

  } finally {
    await prisma.ticketComment.deleteMany({ where: { ticketId: ticket.id } });
    await prisma.serviceTicket.delete({ where: { id: ticket.id } }).catch(() => {});
    await prisma.feeQuoteLineItem.deleteMany({ where: { quoteId: quote.id } });
    await prisma.feeQuote.delete({ where: { id: quote.id } }).catch(() => {});
    await prisma.advisor.delete({ where: { id: advisor.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: clientUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: advisorUser.id } }).catch(() => {});
    console.log('\nFixtures cleaned up.');
  }

  if (failures > 0) { console.error(`\n${failures} check(s) FAILED`); process.exit(1); }
  console.log('\nAll ticket-start checks passed.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
