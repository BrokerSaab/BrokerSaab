import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ClientProviders from '@/components/ClientProviders';
import {
  Home, Shield, FileCheck, Briefcase, Percent, FileText, Coins, Landmark,
  Scale, Building2, CreditCard, Phone, Mail, MapPin
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'BROKERSAAB – Trusted Advisor & Professional Marketplace',
  description: 'Book verified legal advisors, property brokers, financial consultants, and documentation experts for professional consultation on BrokerSaab.',
  keywords: 'legaltech, brokers, legal advisor, financial advisor, documentation, consultation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

        <ClientProviders>
          {/* ── Sticky Navbar ── */}
          <Navbar />

          {/* ── Content Area ── */}
          <main className="flex-grow">
            {children}
          </main>
        </ClientProviders>

        {/* ── Professional Footer ── */}
        <footer className="bg-[#071222] text-white pt-10 sm:pt-14 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">

            {/* Footer Top Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

              {/* Brand Column */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white rounded-xl p-1.5">
                    <img src="/logo-icon.png" alt="BrokerSaab Logo" className="h-10 w-auto object-contain" />
                  </div>
                  <div>
                    <div className="font-bold text-xl text-white leading-none">
                      Broker<span className="text-gold-500">Saab</span>
                    </div>
                    <div className="text-white/50 text-[10px] uppercase tracking-widest">
                      Trusted Advisory Platform
                    </div>
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-5">
                  India&apos;s trusted marketplace connecting users with verified legal advisors, property brokers, financial consultants, and documentation experts.
                </p>
                <div className="flex items-center gap-3">
                  {/* Social Links */}
                  {['youtube', 'twitter', 'instagram', 'linkedin'].map((social) => (
                    <a
                      key={social}
                      href="#"
                      className="w-9 h-9 bg-gold-500 rounded-full flex items-center justify-center hover:bg-gold-400 transition-colors"
                      aria-label={social}
                    >
                      <span className="text-navy-900 text-xs font-bold uppercase">{social[0]}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Services Column */}
              <div>
                <h3 className="font-bold text-base mb-5 text-white">Our Services</h3>
                <ul className="space-y-2">
                  {[
                    'Property Brokerage', 'Legal Court Advisor', 'Property Registry',
                    'Corporate Law', 'Tax Consultancy', 'Documentation Drafting',
                    'Capital & Loans', 'Wealth Management'
                  ].map((s) => (
                    <li key={s}>
                      <Link href="/#services-section" className="text-white/60 hover:text-gold-400 transition-colors text-sm">
                        {s}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links Column */}
              <div>
                <h3 className="font-bold text-base mb-5 text-white">Quick Links</h3>
                <ul className="space-y-2">
                  {[
                    { label: 'Home', href: '/' },
                    { label: 'About Us', href: '/about' },
                    { label: 'All Services', href: '/#services-section' },
                    { label: 'How We Work', href: '/how-we-work' },
                    { label: 'Register as Advisor', href: '/advisors/onboarding' },
                    { label: 'My Consultations', href: '/bookings' },
                    { label: 'Admin Panel', href: '/admin' },
                    { label: 'FAQs', href: '/faq' },
                    { label: 'Contact Us', href: '/contact' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-white/60 hover:text-gold-400 transition-colors text-sm">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Column */}
              <div>
                <h3 className="font-bold text-base mb-5 text-white">Contact Us</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-sm text-white/60">
                    <MapPin size={18} className="text-gold-500 shrink-0 mt-0.5" />
                    <span>India (Multi-City Operations)</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/60">
                    <Phone size={18} className="text-gold-500 shrink-0 mt-0.5" />
                    <span>+91-XXXXX-XXXXX</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/60">
                    <Mail size={18} className="text-gold-500 shrink-0 mt-0.5" />
                    <span>help@brokersaab.com</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 bg-gold-500 text-navy-800 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-gold-400 transition-all shadow-lg"
                  >
                    <Phone size={14} />
                    Book a Consultation
                  </Link>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10 mb-6"></div>

            {/* Footer Bottom */}
            <div className="flex flex-col items-center md:flex-row md:justify-between gap-3 text-xs text-white/40 text-center md:text-left">
              <p>© 2026 BROKERSAAB.COM. All rights reserved. Professional verification processes apply.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center">
                <Link href="#" className="hover:text-gold-400 transition-colors">Terms & Conditions</Link>
                <Link href="#" className="hover:text-gold-400 transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-gold-400 transition-colors">Refund Policy</Link>
                <Link href="#" className="hover:text-gold-400 transition-colors">Support</Link>
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
