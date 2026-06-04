'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ShieldCheck, Users, Star, Award, CheckCircle, ArrowRight,
  Briefcase, FileText, Search, UserCheck, CreditCard, MessageCircle,
  BadgeCheck, Scale, AlertTriangle, Globe, TrendingUp, Lock,
  Building2, AlertOctagon, Gavel, FileWarning, Ban, Sun, Moon
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

/* ─── CARD STYLE — adapts to theme ── */
function card3dStyle(accent: string, isDark = true): React.CSSProperties {
  if (!isDark) {
    return {
      background: 'rgba(255,255,255,0.96)',
      boxShadow: `0 4px 20px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.9) inset`,
      border: `1px solid ${accent}40`,
    };
  }
  return {
    background: `linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))`,
    boxShadow: `0 4px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${accent}40`,
    border: `1px solid ${accent}45`,
    backdropFilter: 'blur(12px)',
  };
}


/* ─── COMPONENT ──────────────────────────────── */
export default function AboutPage() {
  const { language } = useLanguage();
  const hi = language === 'HI';
  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  /* convenience shorthands */
  const th = (dark: string, light: string) => isDark ? dark : light;

  const tabs: { id: Tab; label: string; labelHI: string; short: string; shortHI: string; accent: string }[] = [
    { id: 'about', label: 'About Us', labelHI: 'हमारे बारे में', short: 'About', shortHI: 'बारे में', accent: '#D4AF37' },
    { id: 'platform', label: "Who's On the Platform", labelHI: 'प्लेटफ़ॉर्म पर कौन', short: 'Platform', shortHI: 'प्लेटफ़ॉर्म', accent: '#3b82f6' },
    { id: 'terms', label: 'Terms & Conditions', labelHI: 'नियम और शर्तें', short: 'T&C', shortHI: 'नियम', accent: '#ef4444' },
  ];

  return (
    <div className={`min-h-screen ${th('text-slate-100 bg-[#050E1B]', 'text-slate-800 bg-[#F4F6FB]')}`} style={{ transition: 'background 0.4s ease, color 0.4s ease' }}>

      {/* ── Shared Hero — same style as home page hero ── */}
      <section className={`relative overflow-hidden py-12 sm:py-20 px-4 sm:px-6 ${th('navy-gradient-bg', 'bg-white border-b border-slate-200')}`}>
        {/* home-page style glow orbs */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 65%)', transform: 'translate(30%, -30%)' }} />
        <div className={`absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none ${th('opacity-20', 'opacity-10')}`}
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 65%)', transform: 'translate(-25%, 25%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* ── Theme toggle ── */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isDark
              ? <><Sun size={13} className="text-amber-400 fill-amber-400/20" /><span>Light</span></>
              : <><Moon size={13} className="text-slate-600" /><span>Dark</span></>}
          </button>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.30)' }}>
            <ShieldCheck size={12} className="text-gold-400" />
            <span className="text-gold-400 text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase">
              {hi ? 'भारत का विश्वसनीय सलाहकार प्लेटफ़ॉर्म' : "India's Trusted Advisory Platform"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
            <span className={th('text-white', 'text-slate-900')}>{hi ? 'BrokerSaab —' : 'BrokerSaab —'}</span>
            <br />
            <span className="gold-gradient-text">{hi ? 'सत्यापित विशेषज्ञों का बाज़ार' : 'Marketplace of Verified Experts'}</span>
          </h1>
          <p className={`${th('text-slate-400', 'text-slate-600')} text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed`}>
            {hi
              ? 'एक तटस्थ तृतीय-पक्ष मंच जो उपयोगकर्ताओं को सत्यापित कानूनी, संपत्ति और वित्तीय सलाहकारों से जोड़ता है।'
              : 'A neutral third-party platform connecting users with verified legal, property, financial advisors and documentation experts — safely and transparently.'}
          </p>

          {/* ── TAB BAR ── */}
          <div className="flex w-full sm:w-auto rounded-2xl p-1.5 gap-1"
            style={{
              background: th('rgba(11,31,58,0.8)', 'rgba(255,255,255,0.92)'),
              border: th('1px solid rgba(255,255,255,0.10)', '1px solid rgba(0,0,0,0.08)'),
              backdropFilter: 'blur(12px)',
              boxShadow: th('0 2px 12px rgba(0,0,0,0.4)', '0 2px 12px rgba(0,0,0,0.06)'),
            }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 sm:flex-none px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap"
                style={activeTab === tab.id ? {
                  background: `linear-gradient(135deg, ${tab.accent}25, ${tab.accent}10)`,
                  color: tab.accent,
                  boxShadow: `0 0 16px ${tab.accent}30, inset 0 1px 0 ${tab.accent}30`,
                  border: `1px solid ${tab.accent}35`,
                } : {
                  color: th('rgba(148,163,184,0.75)', 'rgba(71,85,105,0.75)'),
                  border: '1px solid transparent',
                }}
              >
                <span className="sm:hidden">{hi ? tab.shortHI : tab.short}</span>
                <span className="hidden sm:inline">{hi ? tab.labelHI : tab.label}</span>
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
        <div style={{ background: th('linear-gradient(180deg, #071527 0%, #0A1829 60%, #050E1B 100%)', 'linear-gradient(180deg, #F8FAFF 0%, #F0F4FF 60%, #EEF2FF 100%)') }}>

          {/* ══════════════════════════════════════════
              FOUNDER'S DIARY
              ══════════════════════════════════════════ */}
          <section className="py-12 sm:py-20 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">

              {/* Badge */}
              <div className="flex justify-center mb-10 sm:mb-14">
                <div className="inline-flex items-center gap-2 rounded-full px-5 py-2"
                  style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.30)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }} />
                  <span className="text-[10px] sm:text-xs font-black tracking-[0.20em] uppercase" style={{ color: '#D4AF37' }}>
                    {hi ? 'संस्थापक की डायरी' : "FOUNDER'S DIARY"}
                  </span>
                </div>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

                {/* ── LEFT: Photo + name card ── */}
                <div className="flex flex-col items-center lg:items-start">

                  {/* Gold-framed photo */}
                  <div className="relative mb-7 self-center">
                    {/* Outer gold ring */}
                    <div className="absolute -inset-[6px] rounded-3xl pointer-events-none"
                      style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #FFE082 40%, #B48C22 80%, #D4AF37 100%)', borderRadius: '28px' }}>
                      <div className={`w-full h-full rounded-[24px] ${th('bg-[#071527]', 'bg-[#F4F6FB]')}`} />
                    </div>
                    {/* Ambient glow */}
                    <div className="absolute -inset-[20px] rounded-3xl pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }} />
                    {/* Photo */}
                    <img
                      src="/founder.jpg"
                      alt="Ravi Ranjan — Founder & CEO, BrokerSaab"
                      className="relative z-10 rounded-3xl object-cover object-top"
                      style={{ width: '100%', maxWidth: '300px', height: '360px' }}
                    />
                    {/* Corner accents */}
                    <div className="absolute top-3 left-3 z-20 w-7 h-7 pointer-events-none"
                      style={{ borderTop: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37', borderRadius: '4px 0 0 0', opacity: 0.75 }} />
                    <div className="absolute bottom-3 right-3 z-20 w-7 h-7 pointer-events-none"
                      style={{ borderBottom: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', borderRadius: '0 0 4px 0', opacity: 0.75 }} />
                  </div>

                  {/* Name / title card */}
                  <div className="rounded-2xl px-6 py-5 w-full max-w-[300px] self-center lg:self-start"
                    style={card3dStyle('#D4AF37', isDark)}>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: '#D4AF37' }}>
                      {hi ? 'संस्थापक और CEO' : 'Founder & CEO'}
                    </div>
                    <div className={`text-xl font-black ${th('text-white', 'text-slate-900')}`}>
                      Ravi Ranjan
                    </div>
                    <div className={`text-sm mt-0.5 ${th('text-slate-400', 'text-slate-500')}`}>
                      BrokerSaab
                    </div>
                    <div className="mt-3 h-px" style={{ background: 'linear-gradient(90deg, #D4AF37, rgba(212,175,55,0.15))' }} />
                    <div className="mt-3 text-base italic" style={{ color: '#D4AF37', fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '0.02em' }}>
                      — Ravi Ranjan
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: Narrative ── */}
                <div>
                  <h2 className={`text-3xl sm:text-4xl font-black leading-tight mb-6 ${th('text-white', 'text-slate-900')}`}>
                    {hi ? 'संस्थापक की कलम से' : "From the Founder's Desk"}
                  </h2>

                  {/* Pullquote */}
                  <div className="rounded-r-2xl rounded-l-sm mb-7 px-6 py-5"
                    style={{
                      borderLeft: '4px solid #D4AF37',
                      background: isDark ? 'rgba(212,175,55,0.08)' : 'rgba(212,175,55,0.07)',
                      backdropFilter: isDark ? 'blur(8px)' : 'none',
                    }}>
                    <p className={`text-base sm:text-lg font-semibold leading-relaxed italic ${th('text-slate-200', 'text-slate-800')}`}>
                      {hi
                        ? '"मैंने देखा है कि आम भारतीय लाखों गंवा देते हैं अज्ञात दलालों पर — लालच से नहीं, बल्कि गलत भरोसे से। BrokerSaab इसीलिए बना है — ताकि यह भरोसा कभी गलत न पड़े।"'
                        : '"I have seen ordinary Indians lose lakhs to unverified agents — not from greed, but from trust misplaced. BrokerSaab exists so that trust is never misplaced again."'}
                    </p>
                  </div>

                  {/* Paragraph 1 */}
                  <p className={`text-sm sm:text-base leading-relaxed mb-5 ${th('text-slate-300', 'text-slate-700')}`}>
                    {hi
                      ? 'बचपन से मैंने अपने परिवार को संपत्ति रजिस्ट्री, अदालती कागज़ और टैक्स फाइलिंग के चक्करों में देखा। एक बात हमेशा सामने आई — आम इंसान को यह जानने का कोई तरीका नहीं था कि सामने बैठा दलाल असली है या नहीं। न सत्यापित प्रमाणपत्र, न जवाबदेही, और शुल्क बंद कमरों में तय होते थे बिना किसी रसीद के।'
                      : 'Growing up watching my family navigate property registrations, court paperwork, and tax filings, I saw one constant: ordinary people had no way to know if the advisor sitting across from them was legitimate. There were no verified credentials, no accountability, and fees were negotiated in smoke-filled rooms with no receipts.'}
                  </p>

                  {/* Paragraph 2 */}
                  <p className={`text-sm sm:text-base leading-relaxed mb-5 ${th('text-slate-300', 'text-slate-700')}`}>
                    {hi
                      ? 'यही खाई — एक ज़रूरतमंद इंसान और एक भरोसेमंद पेशेवर के बीच — BrokerSaab के निर्माण की प्रेरणा बनी। हमने एक ऐसा प्लेटफ़ॉर्म बनाया जहाँ हर सलाहकार KYC-सत्यापित है, हर भुगतान काम पूरा होने तक एस्क्रो में सुरक्षित है, और हर शुल्क बुकिंग से पहले दिखता है। न सिर्फ एक डायरेक्टरी — बल्कि वास्तविक जवाबदेही वाला बाज़ार।'
                      : 'That gap — between a person who needs help and a professional they can actually trust — is why BrokerSaab was built. We created a platform where every advisor is KYC-verified, every payment is held in escrow until the work is done, and every fee is shown before you book. Not a directory. Not a classifieds board. A marketplace with real accountability baked in.'}
                  </p>

                  {/* Paragraph 3 */}
                  <p className={`text-sm sm:text-base leading-relaxed mb-8 ${th('text-slate-300', 'text-slate-700')}`}>
                    {hi
                      ? 'BrokerSaab का उपयोग करने वाले हर भारतीय से मेरी प्रतिबद्धता सरल है: आप हमेशा जानेंगे कि आप किससे बात कर रहे हैं, क्या दे रहे हैं, और बदले में क्या मिलेगा। टियर-2 शहरों के प्रॉपर्टी ब्रोकर से लेकर मेट्रो दफ्तरों के GST कंसल्टेंट तक — इस प्लेटफ़ॉर्म पर हर पेशेवर ने सत्यापन से अपनी जगह अर्जित की है, और हर उपयोगकर्ता इसी मानक का हकदार है।'
                      : 'My commitment to every Indian using BrokerSaab is simple: you will always know who you are speaking to, what you are paying, and what you will receive in return. From property brokers in Tier-2 cities to GST consultants in metro offices — every professional on this platform has earned their place through verification, and every user deserves nothing less.'}
                  </p>

                  {/* Trust-signal chips */}
                  <div className="flex flex-wrap gap-3">
                    {[
                      { en: 'KYC-Verified Advisors', hi: 'KYC-सत्यापित सलाहकार' },
                      { en: 'Escrow-Protected Payments', hi: 'एस्क्रो-सुरक्षित भुगतान' },
                      { en: 'Transparent Pricing', hi: 'पारदर्शी मूल्य' },
                    ].map((chip) => (
                      <span key={chip.en}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.28)', color: '#D4AF37' }}>
                        <span className="w-1 h-1 rounded-full" style={{ background: '#D4AF37' }} />
                        {hi ? chip.hi : chip.en}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider → leads into Mission & Vision */}
              <div className="mt-14 sm:mt-20 flex items-center gap-4">
                <div className="h-px flex-1"
                  style={{ background: isDark ? 'linear-gradient(90deg, rgba(212,175,55,0.25), rgba(255,255,255,0.04))' : 'linear-gradient(90deg, rgba(212,175,55,0.4), rgba(0,0,0,0.04))' }} />
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#D4AF37', opacity: 0.5 }} />
                <div className="h-px flex-1"
                  style={{ background: isDark ? 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(212,175,55,0.25))' : 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(212,175,55,0.4))' }} />
              </div>
            </div>
          </section>
          {/* ══ END FOUNDER'S DIARY ══ */}

          {/* Mission & Vision */}
          <section className="py-10 sm:py-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-16">
                {[
                  { accentColor: '#D4AF37', icon: Award, tagEN: 'Our Mission', tagHI: 'हमारा मिशन', bodyEN: 'To make professional legal, property and financial advisory services accessible, verified, and affordable to every Indian — regardless of city, language, or background.', bodyHI: 'हर भारतीय के लिए पेशेवर कानूनी, संपत्ति और वित्तीय सेवाओं को सुलभ और किफायती बनाना।' },
                  { accentColor: '#3b82f6', icon: TrendingUp, tagEN: 'Our Vision', tagHI: 'हमारा विज़न', bodyEN: "Become India's most trusted third-party marketplace connecting people with credentialed professionals — one verified consultation at a time.", bodyHI: 'भारत का सबसे विश्वसनीय तृतीय-पक्ष मार्केटप्लेस बनना जो लोगों को सत्यापित पेशेवरों से जोड़े।' },
                ].map((item) => (
                  <div key={item.tagEN}
                    className="relative rounded-3xl p-5 sm:p-8 transition-all duration-300 hover:-translate-y-1"
                    style={card3dStyle(item.accentColor, isDark)}>
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
                    <p className={`${th('text-slate-300', 'text-slate-700')} leading-relaxed`}>{hi ? item.bodyHI : item.bodyEN}</p>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 sm:mb-16">
                {stats.map((stat) => (
                  <div key={stat.label}
                    className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                    style={card3dStyle(stat.color, isDark)}>
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
                    <div className={`${th('text-slate-400', 'text-slate-600')} text-xs font-medium`}>{hi ? stat.labelHI : stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Verification Steps */}
              <div className="text-center mb-10">
                <h2 className={`text-3xl font-black ${th('text-white', 'text-slate-900')} mb-3`}>{hi ? 'हम विश्वास कैसे बनाते हैं' : 'How We Build Trust'}</h2>
                <p className={`${th('text-white/45', 'text-slate-500')} max-w-xl mx-auto`}>{hi ? 'हर सलाहकार 4-चरणीय सत्यापन से गुजरता है।' : 'Every advisor passes a rigorous 4-step verification before going live.'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 sm:mb-16">
                {verificationSteps.map((step, i) => (
                  <div key={step.step}
                    className="rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={card3dStyle(step.color, isDark)}>
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${step.color}, transparent)` }} />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: step.color, boxShadow: `0 4px 12px ${step.color}60` }}>
                        <step.icon size={18} className="text-white" />
                      </div>
                      <span className="text-3xl font-black opacity-25" style={{ color: step.color }}>{step.step}</span>
                    </div>
                    <h3 className={`${th('text-white', 'text-slate-900')} font-bold text-sm mb-2`}>{hi ? step.titleHI : step.titleEN}</h3>
                    <p className={`${th('text-slate-400', 'text-slate-600')} text-xs leading-relaxed`}>{hi ? step.descHI : step.descEN}</p>
                    {i < verificationSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-2.5 w-5 h-0.5 z-10"
                        style={{ background: `linear-gradient(90deg, ${step.color}, transparent)` }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Advantage 3D tiles */}
              <div className="text-center mb-10">
                <h2 className={`text-3xl font-black ${th('text-white', 'text-slate-900')} mb-3`}>{hi ? 'BrokerSaab का फायदा' : 'The BrokerSaab Advantage'}</h2>
                <p className={`${th('text-white/45', 'text-slate-500')} max-w-xl mx-auto`}>{hi ? 'यहां वो है जो हमें अलग करता है।' : "What sets us apart from every other directory or listing platform."}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {advantages.map((adv) => (
                  <div key={adv.titleEN}
                    className="rounded-2xl p-5 sm:p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-default group"
                    style={card3dStyle(adv.accent, isDark)}>
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${adv.accent}80, transparent)` }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl pointer-events-none group-hover:from-white/[0.06] transition-all duration-300" />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${adv.accent}18`, border: `1px solid ${adv.accent}35`, boxShadow: `0 0 16px ${adv.accent}25` }}>
                        <adv.icon size={22} style={{ color: adv.accent }} />
                      </div>
                      <span className="text-3xl font-black opacity-15" style={{ color: adv.accent }}>{adv.num}</span>
                    </div>
                    <h3 className={`${th('text-white', 'text-slate-900')} font-bold text-base mb-2`}>{hi ? adv.titleHI : adv.titleEN}</h3>
                    <p className={`${th('text-slate-400', 'text-slate-600')} text-sm leading-relaxed`}>{hi ? adv.descHI : adv.descEN}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-10 sm:py-14 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="rounded-3xl p-8 sm:p-10" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(59,130,246,0.12), rgba(255,255,255,0.04))', border: '1px solid rgba(212,175,55,0.35)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <h2 className={`text-3xl font-black ${th('text-white', 'text-slate-900')} mb-3`}>{hi ? 'अपना विश्वसनीय सलाहकार खोजें' : 'Ready to Find Your Trusted Advisor?'}</h2>
                <p className={`${th('text-slate-400', 'text-slate-600')} mb-8`}>{hi ? 'आज एक सत्यापित सलाहकार बुक करें।' : 'Book a verified advisor today — or grow your practice with us.'}</p>
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
        <div style={{ background: th('linear-gradient(180deg, #071527 0%, #081628 60%, #050E1B 100%)', 'linear-gradient(180deg, #F8FAFF 0%, #EEF5FF 60%, #E8F0FF 100%)') }}>
          <section className="py-10 sm:py-16 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-5"
                  style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.30)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-blue-400 text-xs font-bold tracking-[0.18em] uppercase">
                    {hi ? 'तीन पक्ष · एक विश्वसनीय हाथ मिलाना' : 'Three Sides · One Trusted Handshake'}
                  </span>
                </div>
                <h2 className={`text-3xl md:text-4xl font-black ${th('text-white', 'text-slate-900')} mb-4`}>
                  {hi ? 'BrokerSaab पर सबकी जगह है' : 'Everyone Has a Place on BrokerSaab'}
                </h2>
                <p className={`${th('text-slate-400', 'text-slate-600')} max-w-2xl mx-auto`}>
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
                    style={isDark ? {
                      background: `linear-gradient(160deg, ${card.accent}20, rgba(255,255,255,0.05))`,
                      boxShadow: `0 0 0 1px ${card.accent}45, 8px 8px 0 ${card.accent}25, 0 20px 50px rgba(0,0,0,0.5)`,
                      border: `1px solid ${card.accent}40`,
                      backdropFilter: 'blur(12px)',
                    } : {
                      background: `linear-gradient(160deg, ${card.accent}12, rgba(255,255,255,0.98))`,
                      boxShadow: `0 0 0 1px ${card.accent}30, 8px 8px 0 ${card.accent}15, 0 12px 30px rgba(0,0,0,0.08)`,
                      border: `1px solid ${card.accent}35`,
                    }}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)` }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent rounded-3xl pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-6xl font-black leading-none opacity-15" style={{ color: card.accent }}>{card.num}</span>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: card.accent, boxShadow: `0 6px 20px ${card.accent}60` }}>
                        <card.icon size={22} className="text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: card.accent }}>
                      {hi ? card.tagHI : card.tagEN}
                    </div>
                    <h3 className={`text-2xl font-black ${th('text-white', 'text-slate-900')} mb-4`}>{hi ? card.titleHI : card.titleEN}</h3>
                    <p className={`${th('text-slate-400', 'text-slate-600')} text-sm leading-relaxed mb-6`}>{hi ? card.descHI : card.descEN}</p>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {card.points.map((p, i) => (
                        <li key={i} className={`flex items-start gap-2.5 text-sm ${th('text-white/65', 'text-slate-600')}`}>
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
                style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
                <h3 className={`${th('text-white', 'text-slate-900')} font-black text-xl mb-8 text-center`}>
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
                        <span className={`${th('text-white/65', 'text-slate-600')} text-xs font-semibold max-w-[90px]`}>{step.label}</span>
                      </div>
                      {i < arr.length - 1 && <ArrowRight size={16} className={`${th('text-white/20', 'text-slate-300')} hidden md:block shrink-0`} />}
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
        <div style={{ background: th('linear-gradient(180deg, #090512 0%, #0A0615 60%, #050E1B 100%)', 'linear-gradient(180deg, #FDF4FF 0%, #F9F0FF 60%, #F5EEFF 100%)') }}>
          <section className="py-10 sm:py-16 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">

              {/* MAIN FRAUD WARNING — PROMINENT */}
              <div className="rounded-3xl p-8 mb-10 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(255,255,255,0.04))',
                  border: '1px solid rgba(239,68,68,0.45)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 0 rgba(239,68,68,0.2), 0 20px 50px rgba(0,0,0,0.4)',
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
                    <h2 className={`${th('text-white', 'text-slate-900')} font-black text-xl md:text-2xl mb-4`}>
                      {hi ? 'BrokerSaab किसी भी धोखाधड़ी के लिए उत्तरदायी नहीं है' : 'BrokerSaab is NOT Responsible for Any Fraudulent Activity'}
                    </h2>
                    <p className={`${th('text-white/70', 'text-slate-700')} leading-relaxed text-sm md:text-base`}>
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
                <span className={`${th('text-white/30', 'text-slate-400')} text-xs font-mono`}>
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
                      background: `linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))`,
                      boxShadow: `0 0 0 1px ${section.color}45, 0 12px 30px rgba(0,0,0,0.4)`,
                      border: `1px solid ${section.color}40`,
                      backdropFilter: 'blur(12px)',
                    }}>
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                      style={{ background: `linear-gradient(90deg, transparent, ${section.color}70, transparent)` }} />
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${section.color}18`, border: `1px solid ${section.color}35` }}>
                        <section.icon size={18} style={{ color: section.color }} />
                      </div>
                      <h3 className={`${th('text-white', 'text-slate-900')} font-black text-base`} style={{ textShadow: isDark ? `0 0 20px ${section.color}30` : 'none' }}>
                        {section.titleEN}
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {section.body.map((para, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: section.color }} />
                          <p className="text-slate-400 text-sm leading-relaxed">{para}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Final acknowledgement */}
              <div className="mt-10 rounded-2xl p-7 text-center"
                style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
                <Scale size={32} className={`mx-auto mb-3 ${th('text-white/20', 'text-slate-300')}`} />
                <p className={`${th('text-slate-400', 'text-slate-600')} text-xs leading-relaxed max-w-xl mx-auto`}>
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
