// Test admin login and dashboard
const BASE = 'http://localhost:5000/api/v1';

// 1. Login
const loginRes = await fetch(`${BASE}/auth/login/password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@brokersaab.com', password: 'admin123' })
});
const loginData = await loginRes.json();
console.log('Login status:', loginRes.status);
console.log('Login response:', JSON.stringify(loginData, null, 2));

if (!loginData.success) {
  console.log('\n❌ Login failed — checking password hash...');
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();
  const admin = await prisma.adminUsers.findUnique({ where: { email: 'admin@brokersaab.com' }, select: { passwordHash: true } });
  console.log('Password hash:', admin?.passwordHash?.substring(0, 20) + '...');
  await prisma.$disconnect();
  process.exit(1);
}

const token = loginData.tokens.accessToken;

// 2. Call dashboard
const dashRes = await fetch(`${BASE}/admin/dashboard`, {
  headers: { Authorization: `Bearer ${token}` }
});
const dashData = await dashRes.json();
console.log('\nDashboard status:', dashRes.status);
console.log('Dashboard response:', JSON.stringify(dashData, null, 2));

// 3. Call advisors
const advRes = await fetch(`${BASE}/admin/advisors?limit=5`, {
  headers: { Authorization: `Bearer ${token}` }
});
const advData = await advRes.json();
console.log('\nAdvisors status:', advRes.status);
console.log('Advisors total:', advData.total, '| data count:', advData.data?.length);
