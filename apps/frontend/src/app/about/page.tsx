'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ShieldCheck, Users, Star, Award, CheckCircle, ArrowRight,
  Briefcase, FileText, Search, UserCheck, CreditCard, MessageCircle,
  BadgeCheck, Scale, AlertTriangle, Globe, TrendingUp, Lock,
  Building2, AlertOctagon, Gavel, FileWarning, Ban
} from 'lucide-react';

/* ─── TAB TYPES ─────────────────────────────── */
type Tab = 'about' | 'platform' | 'terms';

/* ─── DATA ───────────────────────────────────── */
const advantages = [
  { icon: ShieldCheck, titleEN: 'Verified Professionals', titleHI: 'सत्यापित पेशेवर', descEN: 'Every advisor passes rigorous KYC — license check, background verification, and admin approval.', descHI: 'हर सलाहकार KYC से गुजरता है — लाइसेंस जांच, बैकग्राउंड वेरिफिकेशन।', glow: 'rgba(16,185,129,0.5)', accent: '#10b981', num: '01' },
  { icon: Lock, titleEN: 'Escrow-Protected Payments', titleHI: 'एस्क्रो-सुरक्षित भुगतान', descEN: 'Money held in escrow and released only after your consultation is successfully completed.', descHI: 'पैसा एस्क्रो में रहता है और परामर्श पूरा होने के बाद ही जारी होता है।', glow: 'rgba(59,130,246,0.5)', accent: '#3b82f6', num: '02' },
  { icon: Briefcase, titleEN: '19 Service Categories', titleHI: '19 सेवा श्रेणियां', descEN: 'From property registry to GST filing, court help to RTO — 165+ services for every life need.', descHI: 'संपत्ति रजिस्ट्री से GST, कोर्ट से RTO तक — 165+ सेवाएं।', glow: 'rgba(212,175,55,0.5)', accent: '#D4AF37', num: '03' },
  { icon: MessageCircle, titleEN: 'Real-Time Consultation', titleHI: 'रियल-टाइम परामर्श', descEN: 'Private encrypted chat room auto-created per booking for seamless communication.', descHI: 'हर बुकिंग के साथ निजी एन्क्रिप्टेड चैट रूम स्वतः बनता है।', glow: 'rgba(139,92,246,0.5)', accent: '#8b5cf6', num: '04' },
  { icon: TrendingUp, titleEN: 'Transparent Pricing', titleHI: 'पारदर्शी मूल्य', descEN: 'Advisor fees shown upfront. No hidden charges, no surprises before you book.', descHI: 'सलाहकार शुल्क पहले से दिखते हैं। कोई छिपा शुल्क नहीं।', glow: 'rgba(245,158,11,0.5)', accent: '#f59e0b', num: '05' },
  { icon: Globe, titleEN: 'Multi-Language Support', titleHI: 'बहु-भाषा समर्थन', descEN: 'Search and interact in English or Hindi. No language barrier for anyone.', descHI: 'अंग्रेजी या हिंदी में खोजें। कोई भाषा बाधा नहीं।', glow: 'rgba(20,184,166,0.5)', accent: '#14b8a6', num: '06' },
];

const verificationSteps = [
  { step: '01', titleEN: 'Application Submitted', titleHI: 'आवेदन जमा', descEN: 'Advisor signs up with professional details, business name, experience, and specializations.', descHI: 'सलाहकार पेशेवर विवरण के साथ साइन अप करता है।', icon: FileText, color: '#3b82f6' },
  { step: '02', titleEN: 'KYC Documents Uploaded', titleHI: 'KYC अपलोड', descEN: 'License, government ID, professional certificates uploaded to our secure AWS system.', descHI: 'लाइसेंस, सरकारी आईडी हमारे सुरक्षित सिस्टम में अपलोड।', icon: BadgeCheck, color: '#D4AF37' },
  { step: '03', titleEN: 'Admin Review', titleHI: 'एडमिन समीक्षा', descEN: 'Compliance team manually reviews every document and cross-checks credentials.', descHI: 'अनुपालन टीम हर दस्तावेज़ की मैन्युअल समीक्षा करती है।', icon: Search, color: '#8b5cf6' },
  { step: '04', titleEN: 'APPROVED & Live', titleHI: 'अनुमोदित और लाइव', descEN: 'Approved advisors go live with the BrokerSaab Verified badge on their profile.', descHI: 'अनुमोदित सलाहकार BrokerSaab बैज के साथ लाइव होते हैं।', icon: CheckCircle, color: '#10b981' },
];

const stats = [
  { value: '19', label: 'Service Modules', labelHI: 'सेवा मॉड्यूल', icon: Briefcase, color: '#D4AF37' },
  { value: '165+', label: 'Services Listed', labelHI: 'सूचीबद्ध सेवाएं', icon: FileText, color: '#3b82f6' },
  { value: '4', label: 'Consultation Modes', labelHI: 'परामर्श मोड', icon: MessageCircle, color: '#8b5cf6' },
  { value: '100%', label: 'Payment Protected', labelHI: 'भुगतान सुरक्षित', icon: ShieldCheck, color: '#10b981' },
];

const advisorTypes = [
  'Documentation Agents', 'Insurance & Loan DSA Agents', 'Tax Preparers & CA Associates',
  'Registry & Stamp Duty Facilitators', 'RTO & Vehicle Experts', 'Court & Legal Advocates',
  'Property Brokers & RERA Agents', 'Business Registration Consultants',
];

const authorizedBenefits = [
  'License & KYC fully verified by BrokerSaab admin team',
  'Background & reference check completed',
  'Periodic performance reviews and ratings monitoring',
  'Eligible for BrokerSaab Authorized badge on profile',
  'Priority listing in search results',
];

const clientBenefits = [
  'Deal only with licensed, vetted professionals',
  'See real reviews from verified past clients',
  'Full payment protection via escrow',
  'Choose from multiple consultation modes',
  'Transparent fees — no hidden costs',
];

const tcSections = [
  {
    icon: AlertOctagon,
    color: '#ef4444',
    titleEN: 'Fraud & Misconduct — Zero Liability',
    body: [
      'BrokerSaab operates as a neutral third-party technology marketplace. We are NOT a legal firm, financial advisor, property broker, or documentation agency.',
      'BrokerSaab is NOT responsible for any fraudulent activity, misrepresentation, negligence, misconduct, or harm caused by any advisor, agent, or dealer listed on this platform.',
      'Each professional listed is an independent contractor solely responsible for their own actions, advice, and deliverables.',
      'Users engage advisors entirely at their own risk and discretion. BrokerSaab makes no warranty regarding the accuracy, completeness, or fitness of any advice rendered.',
    ],
  },
  {
    icon: Gavel,
    color: '#f59e0b',
    titleEN: 'Escrow & Payment Terms',
    body: [
      'Escrow payments are held by BrokerSaab and released to advisors upon consultation completion. BrokerSaab deducts a 15% platform service fee from all transactions.',
      'Refunds are processed automatically for cancellations made before service delivery begins. BrokerSaab does not guarantee refunds for disputed consultations unless a formal dispute resolution review confirms eligibility.',
      'BrokerSaab is not liable for any losses arising from payment gateway failures, banking errors, or fraudulent payment transactions initiated outside the platform.',
    ],
  },
  {
    icon: BadgeCheck,
    color: '#D4AF37',
    titleEN: 'Authorized Dealer Status',
    body: [
      'The "BrokerSaab Authorised Dealer" badge reflects completion of our internal KYC and credential review process only.',
      'This authorization is NOT a government certification, regulatory license, or official accreditation of any kind.',
      'BrokerSaab does not guarantee the professional competency, legal standing, or integrity of Authorized Dealers beyond the internal verification process.',
      'Users should independently verify the credentials and suitability of any advisor — Authorised or otherwise — before acting on any advice.',
    ],
  },
  {
    icon: Scale,
    color: '#8b5cf6',
    titleEN: 'Platform Role & Independence',
    body: [
      'BrokerSaab is a technology platform only. No advisor-client relationship, attorney-client privilege, or fiduciary duty is created with BrokerSaab by using this platform.',
      'BrokerSaab reserves the right to suspend, remove, or restrict any advisor\'s profile at any time without prior notice if platform conduct standards are violated.',
      'All disputes between users and advisors are subject to the formal dispute resolution process outlined in our full Terms of Service. BrokerSaab\'s decision in disputes is final at the platform level.',
    ],
  },
  {
    icon: FileWarning,
    color: '#14b8a6',
    titleEN: 'Data & Privacy',
    body: [
      'By using BrokerSaab, users consent to data collection for platform operation, advisor matching, and fraud prevention as outlined in our Privacy Policy.',
      'Consultation chat logs are stored securely and may be reviewed by BrokerSaab in the event of a formal dispute or legal requirement.',
      'BrokerSaab does not sell personal data to third parties. Data is used solely to operate and improve the platform.',
    ],
  },
  {
    icon: Ban,
    color: '#ef4444',
    titleEN: 'Prohibited Uses',
    body: [
      'Users and advisors must not use BrokerSaab for any illegal activity, money laundering, fraudulent consultations, identity theft, or harassment.',
      'Advisors may not misrepresent their qualifications, impersonate licensed professionals, or submit falsified KYC documents.',
      'Violation of any prohibited use clause will result in immediate account termination, forfeiture of platform wallet balance, and referral to relevant law enforcement authorities.',
    ],
  },
];

/* ─── CARD 3D STYLE HELPER ───────────────────── */
function card3dStyle(accent: string, depth = 6): React.CSSProperties {
  return {
    background: `linear-gradient(145deg, rgba(10,18,35,0.95), rgba(5,10,20,0.98))`,
    boxShadow: `0 1px 0 rgba(255,255,255,0.06) inset, ${depth}px ${depth}px 0 ${accent}40, 0 ${depth + 10}px ${depth * 5}px rgba(0,0,0,0.5)`,
    border: `1px solid ${accent}40`,
  };
}

/* ─── MESH BG PATTERNS (dark-navy, matching home page aesthetic) ─── */
const CROSSHATCH = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const MESH_ABOUT = `${CROSSHATCH},
  radial-gradient(ellipse 70% 45% at 15% 10%, rgba(212,175,55,0.18) 0%, transparent 55%),
  radial-gradient(ellipse 55% 40% at 85% 85%, rgba(59,130,246,0.14) 0%, transparent 55%),
  radial-gradient(ellipse 50% 60% at 50% 50%, rgba(139,92,246,0.07) 0%, transparent 60%),
  linear-gradient(160deg, #071527 0%, #050e1b 50%, #04111c 100%)`;

const MESH_PLATFORM = `${CROSSHATCH},
  radial-gradient(ellipse 65% 45% at 8% 15%, rgba(59,130,246,0.22) 0%, transparent 55%),
  radial-gradient(ellipse 60% 55% at 92% 82%, rgba(212,175,55,0.18) 0%, transparent 55%),
  radial-gradient(ellipse 50% 40% at 50% 5%, rgba(16,185,129,0.14) 0%, transparent 55%),
  linear-gradient(160deg, #04111c 0%, #050e1b 50%, #071527 100%)`;

const MESH_TERMS = `${CROSSHATCH},
  radial-gradient(ellipse 65% 45% at 12% 12%, rgba(239,68,68,0.18) 0%, transparent 55%),
  radial-gradient(ellipse 55% 50% at 88% 88%, rgba(245,158,11,0.15) 0%, transparent 55%),
  radial-gradient(ellipse 40% 40% at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 55%),
  linear-gradient(160deg, #0a0608 0%, #08060f 50%, #0a0608 100%)`;

/* ─── COMPONENT ──────────────────────────────── */
export default function AboutPage() {
  const { language } = useLanguage();
  const hi = language === 'HI';
  const [activeTab, setActiveTab] = useState<Tab>('about');

  const tabMesh = activeTab === 'about' ? MESH_ABOUT : activeTab === 'platform' ? MESH_PLATFORM : MESH_TERMS;

  const tabs: { id: Tab; label: string; labelHI: string; accent: string }[] = [
    { id: 'about', label: 'About Us', labelHI: 'हमारे बारे में', accent: '#D4AF37' },
    { id: 'platform', label: "Who's On the Platform", labelHI: 'प्लेटफ़ॉर्म पर कौन', accent: '#3b82f6' },
    { id: 'terms', label: 'Terms & Conditions', labelHI: 'नियम और शर्तें', accent: '#ef4444' },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: tabMesh, transition: 'background 0.6s ease' }}>

      {/* ── Shared Hero ── */}
      <section className="relative overflow-hidden py-20 px-6">
        {/* grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-6"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)' }}>
            <ShieldCheck size={13} className="text-gold-400" />
            <span className="text-gold-400 text-xs font-bold tracking-[0.18em] uppercase">
              {hi ? 'भारत का विश्वसनीय सलाहकार प्लेटफ़ॉर्म' : "India's Trusted Advisory Platform"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
            <span className="text-white">{hi ? 'BrokerSaab —' : 'BrokerSaab —'}</span>
            <br />
            <span className="gold-gradient-text">{hi ? 'सत्यापित विशेषज्ञों का बाज़ार' : 'Marketplace of Verified Experts'}</span>
          </h1>
          <p className="text-white/55 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            {hi
              ? 'एक तटस्थ तृतीय-पक्ष मंच जो उपयोगकर्ताओं को सत्यापित कानूनी, संपत्ति और वित्तीय सलाहकारों से जोड़ता है।'
              : 'A neutral third-party platform connecting users with verified legal, property, financial advisors and documentation experts — safely and transparently.'}
          </p>

          {/* ── TAB BAR ── */}
          <div className="inline-flex rounded-2xl p-1.5 gap-1"
            style={{ background: 'rgba(5,14,27,0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                style={activeTab === tab.id ? {
                  background: `linear-gradient(135deg, ${tab.accent}25, ${tab.accent}10)`,
                  color: tab.accent,
                  boxShadow: `0 0 16px ${tab.accent}30, inset 0 1px 0 ${tab.accent}30`,
                  border: `1px solid ${tab.accent}35`,
                } : {
                  color: 'rgba(255,255,255,0.45)',
                  border: '1px solid transparent',
                }}
              >
                {hi ? tab.labelHI : tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: tab.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TAB 1 — ABOUT US
          ════════════════════════════════════════════ */}
      {activeTab === 'about' && (
        <div>
          {/* Mission & Vision */}
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {[
                  { accentColor: '#D4AF37', icon: Award, tagEN: 'Our Mission', tagHI: 'हमारा मिशन', bodyEN: 'To make professional legal, property and financial advisory services accessible, verified, and affordable to every Indian — regardless of city, language, or background.', bodyHI: 'हर भारतीय के लिए पेशेवर कानूनी, संपत्ति और वित्तीय सेवाओं को सुलभ और किफायती बनाना।' },
                  { accentColor: '#3b82f6', icon: TrendingUp, tagEN: 'Our Vision', tagHI: 'हमारा विज़न', bodyEN: "Become India's most trusted third-party marketplace connecting people with credentialed professionals — one verified consultation at a time.", bodyHI: 'भारत का सबसे विश्वसनीय तृतीय-पक्ष मार्केटप्लेस बनना जो लोगों को सत्यापित पेशेवरों से जोड़े।' },
                ].map((item) => (
                  <div key={item.tagEN}
                    className="rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1"
                    style={card3dStyle(item.accentColor, 5)}>
                    {/* shine */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: `${item.accentColor}20`, border: `1px solid ${item.accentColor}40` }}>
                        <item.icon size={20} style={{ color: item.accentColor }} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: item.accentColor }}>
                        {hi ? item.tagHI : item.tagEN}
                      </span>
                    </div>
                    <p className="text-white/75 leading-relaxed">{hi ? item.bodyHI : item.bodyEN}</p>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                {stats.map((stat) => (
                  <div key={stat.label}
                    className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                    style={card3dStyle(stat.color, 4)}>
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${stat.color}, transparent)` }} />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${stat.color}15` }}>
                      <stat.icon size={18} style={{ color: stat.color }} />
                    </div>
                    <div className="text-3xl font-black mb-1"
                      style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}60` }}>
                      {stat.value}
                    </div>
                    <div className="text-white/50 text-xs font-medium">{hi ? stat.labelHI : stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Verification Steps */}
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white mb-3">{hi ? 'हम विश्वास कैसे बनाते हैं' : 'How We Build Trust'}</h2>
                <p className="text-white/45 max-w-xl mx-auto">{hi ? 'हर सलाहकार 4-चरणीय सत्यापन से गुजरता है।' : 'Every advisor passes a rigorous 4-step verification before going live.'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
                {verificationSteps.map((step, i) => (
                  <div key={step.step}
                    className="rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={card3dStyle(step.color, 5)}>
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${step.color}, transparent)` }} />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: step.color, boxShadow: `0 4px 12px ${step.color}60` }}>
                        <step.icon size={18} className="text-white" />
                      </div>
                      <span className="text-3xl font-black opacity-25" style={{ color: step.color }}>{step.step}</span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-2">{hi ? step.titleHI : step.titleEN}</h3>
                    <p className="text-white/50 text-xs leading-relaxed">{hi ? step.descHI : step.descEN}</p>
                    {i < verificationSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-2.5 w-5 h-0.5 z-10"
                        style={{ background: `linear-gradient(90deg, ${step.color}, transparent)` }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Advantage 3D tiles */}
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white mb-3">{hi ? 'BrokerSaab का फायदा' : 'The BrokerSaab Advantage'}</h2>
                <p className="text-white/45 max-w-xl mx-auto">{hi ? 'यहां वो है जो हमें अलग करता है।' : "What sets us apart from every other directory or listing platform."}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {advantages.map((adv) => (
                  <div key={adv.titleEN}
                    className="rounded-2xl p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-default group"
                    style={card3dStyle(adv.accent, 6)}>
                    {/* top line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${adv.accent}80, transparent)` }} />
                    {/* shine */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl pointer-events-none
                      group-hover:from-white/[0.06] transition-all duration-300" />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${adv.accent}18`, border: `1px solid ${adv.accent}35`, boxShadow: `0 0 16px ${adv.accent}25` }}>
                        <adv.icon size={22} style={{ color: adv.accent }} />
                      </div>
                      <span className="text-3xl font-black opacity-15" style={{ color: adv.accent }}>{adv.num}</span>
                    </div>
                    <h3 className="text-white font-bold text-base mb-2">{hi ? adv.titleHI : adv.titleEN}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{hi ? adv.descHI : adv.descEN}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-14 px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="rounded-3xl p-10" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                <h2 className="text-3xl font-black text-white mb-3">{hi ? 'अपना विश्वसनीय सलाहकार खोजें' : 'Ready to Find Your Trusted Advisor?'}</h2>
                <p className="text-white/55 mb-8">{hi ? 'आज एक सत्यापित सलाहकार बुक करें।' : 'Book a verified advisor today — or grow your practice with us.'}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/advisors" className="btn-gold px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
                    {hi ? 'परामर्श बुक करें' : 'Book Consultation Now'}<ArrowRight size={15} />
                  </Link>
                  <Link href="/advisors/onboarding" className="btn-outline px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
                    {hi ? 'सलाहकार बनें' : 'Become an Advisor'}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB 2 — WHO'S ON THE PLATFORM
          ════════════════════════════════════════════ */}
      {activeTab === 'platform' && (
        <div>
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-5"
                  style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-blue-400 text-xs font-bold tracking-[0.18em] uppercase">
                    {hi ? 'तीन पक्ष · एक विश्वसनीय हाथ मिलाना' : 'Three Sides · One Trusted Handshake'}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                  {hi ? 'BrokerSaab पर सबकी जगह है' : 'Everyone Has a Place on BrokerSaab'}
                </h2>
                <p className="text-white/50 max-w-2xl mx-auto">
                  {hi ? 'तीन अलग भूमिकाएं, एक विश्वसनीय प्लेटफ़ॉर्म।' : 'Three distinct roles, one trusted neutral platform connecting them all.'}
                </p>
              </div>

              {/* Three 3D side cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
                {/* 01 Advisors */}
                {[
                  {
                    num: '01', accent: '#3b82f6', icon: UserCheck,
                    tagEN: 'Independent Specialists', tagHI: 'स्वतंत्र विशेषज्ञ',
                    titleEN: 'Advisors & Agents', titleHI: 'सलाहकार और एजेंट',
                    descEN: 'Independent specialists — documentation agents, insurance & loan/DSA agents, tax preparers, registry facilitators, RTO experts — who build a profile in their exact area of specialisation, so users reach a real expert in that field.',
                    descHI: 'स्वतंत्र विशेषज्ञ जो अपने सटीक क्षेत्र में प्रोफ़ाइल बनाते हैं — दस्तावेज़ एजेंट, DSA एजेंट, टैक्स तैयारकर्ता, RTO विशेषज्ञ।',
                    points: advisorTypes.slice(0, 5),
                    ctaEN: 'Register as Advisor', ctaHI: 'सलाहकार बनें', ctaHref: '/advisors/onboarding',
                  },
                  {
                    num: '02', accent: '#D4AF37', icon: BadgeCheck,
                    tagEN: 'Higher Trust Tier', tagHI: 'उच्च विश्वास स्तर',
                    titleEN: 'Authorised Dealers', titleHI: 'अधिकृत डीलर',
                    descEN: 'The higher trust tier: partners verified and authorised by BrokerSaab through enhanced checks. Choosing them gives users extra confidence and added benefits.',
                    descHI: 'उच्च विश्वास स्तर: BrokerSaab द्वारा उन्नत जांच से सत्यापित। उन्हें चुनने से अतिरिक्त आत्मविश्वास मिलता है।',
                    points: authorizedBenefits,
                    ctaEN: 'Apply for Dealer Status', ctaHI: 'डीलर स्टेटस के लिए आवेदन', ctaHref: '/advisors/onboarding',
                  },
                  {
                    num: '03', accent: '#10b981', icon: Users,
                    tagEN: 'People Who Get Things Done', tagHI: 'काम करवाने वाले',
                    titleEN: 'Users', titleHI: 'उपयोगकर्ता',
                    descEN: 'People and small businesses who need legal or documentation work done — searching by simple keywords, comparing verified professionals, and connecting directly with the right one.',
                    descHI: 'वे लोग और छोटे व्यवसाय जिन्हें काम करवाना है — सरल कीवर्ड से खोज, सत्यापित पेशेवरों की तुलना।',
                    points: clientBenefits,
                    ctaEN: 'Find an Advisor', ctaHI: 'सलाहकार खोजें', ctaHref: '/advisors',
                  },
                ].map((card) => (
                  <div key={card.num}
                    className="rounded-3xl p-8 relative overflow-hidden transition-all duration-400 hover:-translate-y-3 flex flex-col"
                    style={{
                      background: `linear-gradient(160deg, ${card.accent}0d, rgba(5,10,20,0.98))`,
                      boxShadow: `8px 8px 0 ${card.accent}35, 0 20px 50px rgba(0,0,0,0.55)`,
                      border: `1px solid ${card.accent}35`,
                    }}>
                    {/* top glow line */}
                    <div className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)` }} />
                    {/* shine */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent rounded-3xl pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-6xl font-black leading-none opacity-15" style={{ color: card.accent }}>{card.num}</span>
                      <div className="w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: card.accent, boxShadow: `0 6px 20px ${card.accent}60` }}>
                        <card.icon size={22} className="text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: card.accent }}>
                      {hi ? card.tagHI : card.tagEN}
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4">{hi ? card.titleHI : card.titleEN}</h3>
                    <p className="text-white/55 text-sm leading-relaxed mb-6">{hi ? card.descHI : card.descEN}</p>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {card.points.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-white/65">
                          <CheckCircle size={13} className="shrink-0 mt-0.5" style={{ color: card.accent }} />
                          {typeof p === 'string' ? p : (hi ? (p as any).HI || p : (p as any).EN || p)}
                        </li>
                      ))}
                    </ul>
                    <Link href={card.ctaHref}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 mt-auto"
                      style={{ border: `1px solid ${card.accent}50`, color: card.accent }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = `${card.accent}15`)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      {hi ? card.ctaHI : card.ctaEN}<ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>

              {/* How the sides connect — flow */}
              <div className="rounded-3xl p-8 mb-10"
                style={{ background: 'rgba(5,10,20,0.7)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
                <h3 className="text-white font-black text-xl mb-8 text-center">
                  {hi ? 'तीनों पक्ष कैसे जुड़ते हैं' : 'How the Three Sides Connect'}
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {[
                    { icon: Search, label: hi ? 'यूज़र खोजता है' : 'User Searches', color: '#3b82f6' },
                    { icon: Users, label: hi ? 'Verified + Dealer सूची' : 'Verified + Dealer List', color: '#D4AF37' },
                    { icon: CreditCard, label: hi ? 'एस्क्रो भुगतान' : 'Pays via Escrow', color: '#10b981' },
                    { icon: MessageCircle, label: hi ? 'परामर्श होता है' : 'Consultation Happens', color: '#8b5cf6' },
                    { icon: Lock, label: hi ? 'एस्क्रो जारी' : 'Escrow Released', color: '#f59e0b' },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex flex-col md:flex-row items-center gap-3 flex-1">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                          style={{ background: step.color, boxShadow: `0 6px 18px ${step.color}50` }}>
                          <step.icon size={22} className="text-white" />
                        </div>
                        <span className="text-white/65 text-xs font-semibold max-w-[90px]">{step.label}</span>
                      </div>
                      {i < arr.length - 1 && <ArrowRight size={16} className="text-white/20 hidden md:block shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB 3 — TERMS & CONDITIONS
          ════════════════════════════════════════════ */}
      {activeTab === 'terms' && (
        <div>
          <section className="py-16 px-6">
            <div className="max-w-4xl mx-auto">

              {/* MAIN FRAUD WARNING — PROMINENT */}
              <div className="rounded-3xl p-8 mb-10 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(10,5,5,0.97))',
                  border: '1px solid rgba(239,68,68,0.4)',
                  boxShadow: '0 8px 0 rgba(239,68,68,0.2), 0 20px 50px rgba(0,0,0,0.5)',
                }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: 'linear-gradient(90deg, transparent, #ef4444, transparent)' }} />
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
                    <AlertOctagon size={26} className="text-red-400" />
                  </div>
                  <div>
                    <div className="text-red-400 text-xs font-black uppercase tracking-widest mb-2">
                      {hi ? 'महत्वपूर्ण — कृपया ध्यान से पढ़ें' : 'IMPORTANT — Please Read Carefully'}
                    </div>
                    <h2 className="text-white font-black text-xl md:text-2xl mb-4">
                      {hi ? 'BrokerSaab किसी भी धोखाधड़ी के लिए उत्तरदायी नहीं है' : 'BrokerSaab is NOT Responsible for Any Fraudulent Activity'}
                    </h2>
                    <p className="text-white/70 leading-relaxed text-sm md:text-base">
                      {hi
                        ? 'BrokerSaab एक तकनीकी मार्केटप्लेस प्लेटफ़ॉर्म है। हम किसी भी प्रकार की धोखाधड़ी, गलत बयानी, लापरवाही या नुकसान के लिए उत्तरदायी नहीं हैं जो किसी भी सलाहकार, एजेंट या डीलर द्वारा किया गया हो। उपयोगकर्ता अपने विवेक से सलाहकार का चयन करते हैं।'
                        : 'BrokerSaab is a technology marketplace platform only. We are NOT responsible or liable for any fraudulent activity, misrepresentation, negligence, misconduct, harm, or financial loss caused by any advisor, agent, dealer, or user listed on or using this platform. Users engage professionals entirely at their own discretion and risk.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Effective Date */}
              <div className="flex items-center gap-3 mb-8 px-1">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-white/30 text-xs font-mono">
                  {hi ? 'प्रभावी तारीख: जून 2026' : 'Effective Date: June 2026'}
                </span>
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* T&C sections */}
              <div className="space-y-5">
                {tcSections.map((section, i) => (
                  <div key={i}
                    className="rounded-2xl p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: `linear-gradient(145deg, ${section.color}08, rgba(8,6,12,0.97))`,
                      boxShadow: `5px 5px 0 ${section.color}30, 0 12px 30px rgba(0,0,0,0.45)`,
                      border: `1px solid ${section.color}30`,
                    }}>
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${section.color}70, transparent)` }} />
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${section.color}18`, border: `1px solid ${section.color}35` }}>
                        <section.icon size={18} style={{ color: section.color }} />
                      </div>
                      <h3 className="text-white font-black text-base" style={{ textShadow: `0 0 20px ${section.color}30` }}>
                        {section.titleEN}
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {section.body.map((para, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: section.color }} />
                          <p className="text-white/60 text-sm leading-relaxed">{para}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Final acknowledgement */}
              <div className="mt-10 rounded-2xl p-7 text-center"
                style={{ background: 'rgba(5,10,20,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Scale size={32} className="mx-auto mb-3 text-white/20" />
                <p className="text-white/40 text-xs leading-relaxed max-w-xl mx-auto">
                  {hi
                    ? 'BrokerSaab का उपयोग करके, आप इन नियमों और शर्तों से सहमत होते हैं। किसी भी प्रश्न के लिए help@brokersaab.com पर संपर्क करें।'
                    : 'By using BrokerSaab, you agree to these Terms & Conditions. For questions, contact help@brokersaab.com. These terms are governed by the laws of India.'}
                </p>
                <div className="flex gap-4 justify-center mt-6">
                  <Link href="/advisors" className="btn-gold px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
                    {hi ? 'सलाहकार खोजें' : 'Find an Advisor'}<ArrowRight size={14} />
                  </Link>
                  <Link href="/advisors/onboarding" className="btn-outline px-6 py-3 rounded-xl font-semibold text-sm">
                    {hi ? 'सलाहकार बनें' : 'Register as Advisor'}
                  </Link>
                </div>
              </div>

            </div>
          </section>
        </div>
      )}
    </div>
  );
}
