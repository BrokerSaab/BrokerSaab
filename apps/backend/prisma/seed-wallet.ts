/**
 * Seed dummy wallet balances and payout records for development/demo.
 * Run: npx ts-node prisma/seed-wallet.ts
 */
import prisma from '../src/config/db';

async function main() {
  const advisors = await prisma.advisor.findMany({
    orderBy: { createdAt: 'asc' },
    take: 5,
    select: { id: true, fullName: true },
  });

  if (advisors.length === 0) {
    console.log('No advisors found. Register at least one advisor first.');
    return;
  }

  console.log(`Found ${advisors.length} advisor(s). Seeding wallet data...`);

  // Give first 3 advisors wallet balances
  const balances = [8500, 3200, 15750];
  for (let i = 0; i < Math.min(advisors.length, 3); i++) {
    await prisma.advisor.update({
      where: { id: advisors[i].id },
      data:  { walletBalance: balances[i] },
    });
    console.log(`  ✓ ${advisors[i].fullName} → wallet ₹${balances[i]}`);
  }

  // Create 2 PENDING withdrawal payout records (dummy bank transfers)
  const pendingData = [
    {
      advisorId:   advisors[0].id,
      amount:      5000,
      commission:  0,
      netAmount:   5000,
      status:      'PENDING' as const,
      bankAccount: 'Rajesh Kumar | XXXX6789 | IFSC: SBIN0001234',
    },
    {
      advisorId:   advisors[1 % advisors.length].id,
      amount:      3000,
      commission:  0,
      netAmount:   3000,
      status:      'PENDING' as const,
      bankAccount: 'Priya Sharma | XXXX4321 | IFSC: HDFC0002345',
    },
  ];

  for (const data of pendingData) {
    const exists = await prisma.payout.findFirst({
      where: { advisorId: data.advisorId, status: 'PENDING', bankAccount: data.bankAccount },
    });
    if (!exists) {
      await prisma.payout.create({ data });
      const adv = advisors.find(a => a.id === data.advisorId);
      console.log(`  ✓ PENDING payout ₹${data.amount} for ${adv?.fullName}`);
    }
  }

  // Create 1 SUCCESS payout record (completed transfer)
  const successAdvisor = advisors[advisors.length > 2 ? 2 : 0];
  const successExists = await prisma.payout.findFirst({
    where: { advisorId: successAdvisor.id, status: 'SUCCESS', bankAccount: { contains: 'XXXX9876' } },
  });
  if (!successExists) {
    await prisma.payout.create({
      data: {
        advisorId:   successAdvisor.id,
        amount:      10000,
        commission:  1500,
        netAmount:   8500,
        status:      'SUCCESS',
        bankAccount: 'Amit Verma | XXXX9876 | IFSC: ICIC0003456',
        referenceId: `demo_success_${Date.now()}`,
      },
    });
    console.log(`  ✓ SUCCESS payout ₹8500 for ${successAdvisor.fullName}`);
  }

  console.log('\nDone. Dummy wallet data seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
