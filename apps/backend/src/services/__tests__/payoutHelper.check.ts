/**
 * Standalone fee-math verification for computeAdvisorShare (no test runner is
 * configured in this project). Run with: npx ts-node src/services/__tests__/payoutHelper.check.ts
 */
import { computeAdvisorShare } from '../payoutHelper';

let failures = 0;
function assertEqual(actual: number, expected: number, label: string) {
  if (Math.abs(actual - expected) > 0.005) {
    console.error(`FAIL: ${label} — expected ${expected}, got ${actual}`);
    failures++;
  } else {
    console.log(`ok   : ${label} (${actual})`);
  }
}

// ── Tier-boundary cases ──────────────────────────────────────────────────────
// A ticket's own platformFee is what a whole-ticket payout would have charged
// (flat ₹30 ≤3k, flat ₹50 3k-5k, 1% >5k) — computeAdvisorShare re-derives the
// *rate* from that and applies it to a partial slice.

{
  const ticket = { baseAmount: 2500, platformFee: 30 }; // flat ₹30 tier
  const { platformFee, gatewayFee, advisorNet } = computeAdvisorShare(ticket, 2500);
  assertEqual(platformFee, 30, 'flat-30 tier: full amount platform fee');
  assertEqual(gatewayFee, 37.5, 'flat-30 tier: full amount gateway fee (1.5%)');
  assertEqual(advisorNet, 2500 - 30 - 37.5, 'flat-30 tier: advisor net');
}

{
  const ticket = { baseAmount: 4000, platformFee: 50 }; // flat ₹50 tier
  const { platformFee, gatewayFee, advisorNet } = computeAdvisorShare(ticket, 2000); // half the ticket
  assertEqual(platformFee, 25, 'flat-50 tier: half-slice platform fee (rate-based, not re-flattened)');
  assertEqual(gatewayFee, 30, 'flat-50 tier: half-slice gateway fee');
  assertEqual(advisorNet, 2000 - 25 - 30, 'flat-50 tier: half-slice advisor net');
}

{
  const ticket = { baseAmount: 10000, platformFee: 100 }; // 1% tier
  const { platformFee, gatewayFee, advisorNet } = computeAdvisorShare(ticket, 4000);
  assertEqual(platformFee, 40, '1% tier: slice platform fee');
  assertEqual(gatewayFee, 60, '1% tier: slice gateway fee');
  assertEqual(advisorNet, 4000 - 40 - 60, '1% tier: slice advisor net');
}

// ── Reconciliation invariant ──────────────────────────────────────────────────
// Summing fees/net across slices that exactly partition the base amount must
// reproduce what a single whole-ticket payout would have charged.
{
  const baseAmount = 5000;
  const platformFee = 50; // 1% tier
  const ticket = { baseAmount, platformFee };
  const slices = [1000, 2000, 2000]; // matches the plan's worked example (item1 cancelled in that example, but here treat all 3 as paid to check the pure math invariant)

  let totalPlatformFee = 0, totalGatewayFee = 0, totalAdvisorNet = 0;
  for (const slice of slices) {
    const share = computeAdvisorShare(ticket, slice);
    totalPlatformFee += share.platformFee;
    totalGatewayFee  += share.gatewayFee;
    totalAdvisorNet  += share.advisorNet;
  }

  const wholeTicket = computeAdvisorShare(ticket, baseAmount);
  assertEqual(totalPlatformFee, wholeTicket.platformFee, 'reconciliation: summed platform fees == whole-ticket platform fee');
  assertEqual(totalGatewayFee, wholeTicket.gatewayFee, 'reconciliation: summed gateway fees == whole-ticket gateway fee');
  assertEqual(totalAdvisorNet, wholeTicket.advisorNet, 'reconciliation: summed advisor net == whole-ticket advisor net');
}

// ── Worked example from the plan (item1 cancelled, item2 milestone, item3 close) ──
{
  const baseAmount = 5000, platformFee = 50; // 1% tier -> rate 0.01
  const ticket = { baseAmount, platformFee };

  const item1Refund = 1000; // cancelled — refunded at base only, no computeAdvisorShare call
  const item2 = computeAdvisorShare(ticket, 2000); // milestone release
  const item3 = computeAdvisorShare(ticket, 2000); // final close (pendingBase = 2000, only item3 left)

  assertEqual(item2.advisorNet, 1950, 'worked example: item2 milestone advisor net');
  assertEqual(item3.advisorNet, 1950, 'worked example: item3 close advisor net');

  // Client-side ticket fee (ticket.platformFee + ticket.gatewayFee) is collected once,
  // upfront, at ticket creation — fixed regardless of what happens to any line item later.
  const clientSideTicketFee = platformFee + baseAmount * 0.015; // 50 + 75 = 125
  // Advisor-side fee retention only applies to items actually paid out (2 & 3) — a
  // second, separate fee application from the client-side one (subtracted from the
  // advisor instead of added to the client), per this platform's established model.
  const advisorSideFeeRetention = item2.platformFee + item2.gatewayFee + item3.platformFee + item3.gatewayFee;
  const totalAdvisor = item2.advisorNet + item3.advisorNet;
  const clientTotalPaid = baseAmount + clientSideTicketFee; // ticket.totalAmount
  const reconciled = item1Refund + totalAdvisor + clientSideTicketFee + advisorSideFeeRetention;

  assertEqual(reconciled, clientTotalPaid, 'worked example: refund + advisor payouts + all retained fees == client total paid');
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
} else {
  console.log('\nAll fee-math checks passed.');
}
