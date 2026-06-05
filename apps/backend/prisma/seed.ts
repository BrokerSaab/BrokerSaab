import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Seed admin user
  const adminEmail = 'admin@brokersaab.com';
  const existingAdmin = await prisma.adminUsers.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('BrokerAdmin123', 10);
    const admin = await prisma.adminUsers.create({
      data: {
        email: adminEmail,
        fullName: 'BrokerSaab Super Admin',
        passwordHash,
        role: Role.SUPER_ADMIN
      }
    });
    console.log(`Created Super Admin user: ${admin.email}`);
  } else {
    console.log('Super Admin user already exists.');
  }

  // 2. Seed Categories
  const categories = [
    { name: 'Birth, Death & Marriage Papers', slug: 'm1', description: 'Official civil registrations and personal certificates required for identity verification.' },
    { name: 'Identity Cards & Documents', slug: 'm2', description: 'National citizenship identity cards, correction services, and foreign citizen paperwork.' },
    { name: 'Income, Caste & Residence', slug: 'm3', description: 'Revenue department status certificates, financial solvency, and legal heir documentation.' },
    { name: 'Property & Land Papers', slug: 'm4', description: 'Property registrations, deeds drafting, land records extracts, mutation, and due diligence checks.' },
    { name: 'Tax / GST Filing', slug: 'm5', description: 'GST registration, business return filings, professional tax, and ITR planning.' },
    { name: 'Business Registration', slug: 'm6', description: 'Start proprietorships, companies, NGOs, obtain FSSAI licenses, and handle ROC filings.' },
    { name: 'Brand & IP Protection', slug: 'm7', description: 'Securing intellectual assets via trademark registrations, designs, patents, and copyright filings.' },
    { name: 'Bank, Loan & Credit', slug: 'm8', description: 'Structured home loans, commercial capital, CIBIL reports, and DSA loan consulting.' },
    { name: 'Insurance (Bima)', slug: 'm9', description: 'Term plans, health policies, mediclaim, crop bima, and claim support consultation.' },
    { name: 'Vehicle & RTO Work', slug: 'm10', description: 'Driving license renewal, inter-state vehicle transfer, duplicate RC, permits, and pollution certificates.' },
    { name: 'Legal & Court Help', slug: 'm11', description: 'Notary attestations, legal notices, civil/criminal court litigation, cheque bounce cases, and bail counsel.' },
    { name: 'Job, PF & Labour', slug: 'm12', description: 'Employee provident fund withdrawals, ESI registrations, and labor licensing applications.' },
    { name: 'School & College Papers', slug: 'm13', description: 'Academic migration certificates, school transfer records, degree attestation, and WES verification.' },
    { name: 'Pension & Govt Schemes', slug: 'm14', description: 'Ayushman Bharat card setup, state welfare pensions, PM-KISAN, and direct benefit transfer filing.' },
    { name: 'Savings & Investment', slug: 'm15', description: 'Mutual funds setup, corporate fixed deposits, wealth management planning, and gold investment consulting.' },
    { name: 'Passport, Visa & Foreign', slug: 'm16', description: 'Passport application help, student visa paperwork, visa stamping, and embassy legal translation.' },
    { name: 'Electricity, Water & Gas', slug: 'm17', description: 'New utilities connections, name changes on bills, meter load extensions, and public grievance representation.' },
    { name: 'Farmer & Agriculture', slug: 'm18', description: 'PM-KISAN registrations, land-use conversion applications, agricultural subsidies filings, and organic certification help.' },
    { name: 'Online Form & Doc Help', slug: 'm19', description: 'Digitization of physical documents, online registrations, applications, and general electronic document assistance.' }
  ];

  console.log(`Seeding ${categories.length} advisor categories...`);
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description, slug: cat.slug },
      create: cat
    });
  }

  // 3. Seed Specializations
  const specializations = [
    { name: 'Real Estate Purchase & Sale', slug: 'real-estate-purchase-sale' },
    { name: 'Intellectual Property & Patents', slug: 'ip-patents' },
    { name: 'GST & Tax Planning', slug: 'gst-tax-planning' },
    { name: 'Company Registration', slug: 'company-registration' },
    { name: 'Bail & Criminal Defense', slug: 'bail-criminal-defense' },
    { name: 'Will & Family Trusts', slug: 'will-family-trusts' },
    { name: 'Mortgage & Business Loans', slug: 'mortgage-business-loans' },
    { name: 'Mutual Funds & Portfolio Management', slug: 'mutual-funds-portfolio' }
  ];

  console.log(`Seeding ${specializations.length} specializations...`);
  for (const spec of specializations) {
    await prisma.specialization.upsert({
      where: { name: spec.name },
      update: { slug: spec.slug },
      create: spec
    });
  }

  console.log('Database Seeding Successful!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
