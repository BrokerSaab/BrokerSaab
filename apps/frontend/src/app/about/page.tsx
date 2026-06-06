'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ShieldCheck, Users, Award, CheckCircle, ArrowRight,
  Briefcase, FileText, Search, UserCheck, CreditCard, MessageCircle,
  BadgeCheck, Scale, Globe, TrendingUp, Lock,
  Building2, AlertOctagon, Gavel, FileWarning, Ban
} from 'lucide-react';

type Tab = 'about' | 'platform' | 'terms';

const advantages = [
  { icon: ShieldCheck, titleEN: 'Verified Professionals', titleHI: 'सत्यापित पेशेवर', descEN: 'Every advisor passes rigorous KYC — license check, background verification, and admin approval.', descHI: 'हर सलाहकार KYC से गुजरता है।', accent: '#10b981', num: '01' },
  { icon: Lock, titleEN: 'Escrow-Protected Payments', titleHI: 'एस्क्रो-सुरक्षित भुगतान', descEN: 'Money held in escrow and released only after your consultation is successfully completed.', descHI: 'पैसा एस्क्रो में रहता है और परामर्श पूरा होने के बाद ही जारी होता है।', accent: '#6366f1', num: '02' },
  { icon: Briefcase, titleEN: '19 Service Categories', titleHI: '19 सेवा श्रेणियां', descEN: 'From property registry to GST filing, court help to RTO — 165+ services for every life need.', descHI: 'संपत्ति रजिस्ट्री से GST, कोर्ट से RTO तक — 165+ सेवाएं।', accent: '#D4AF37', num: '03' },
  { icon: MessageCircle, titleEN: 'Real-Time Consultation', titleHI: 'रियल-टाइम परामर्श', descEN: 'Private encrypted chat room auto-created per booking for seamless communication.', descHI: 'हर बुकिंग के साथ निजी एन्क्रिप्टेड चैट रूम स्वतः बनता है।', accent: '#8b5cf6', num: '04' },
  { icon: TrendingUp, titleEN: 'Transparent Pricing', titleHI: 'पारदर्शी मूल्य', descEN: 'Advisor fees shown upfront. No hidden charges, no surprises before you book.', descHI: 'सलाहकार शुल्क पहले से दिखते हैं। कोई छिपा शुल्क नहीं।', accent: '#D4AF37', num: '05' },
  { icon: Globe, titleEN: 'Multi-Language Support', titleHI: 'बहु-भाषा समर्थन', descEN: 'Search and interact in English or Hindi. No language barrier for anyone.', descHI: 'अंग्रेजी या हिंदी में खोजें। कोई भाषा बाधा नहीं।', accent: '#6366f1', num: '06' },
];

const verificationSteps = [
  { step: '01', titleEN: 'Application Submitted', titleHI: 'आवेदन जमा', descEN: 'Advisor signs up with professional details, business name, experience, and specializations.', descHI: 'सलाहकार पेशेवर विवरण के साथ साइन अप करता है।', icon: FileText, color: '#6366f1' },
  { step: '02', titleEN: 'KYC Documents Uploaded', titleHI: 'KYC अपलोड', descEN: 'License, government ID, professional certificates uploaded to our secure AWS system.', descHI: 'लाइसेंस, सरकारी आईडी हमारे सुरक्षित सिस्टम में अपलोड।', icon: BadgeCheck, color: '#D4AF37' },
  { step: '03', titleEN: 'Admin Review', titleHI: 'एडमिन समीक्षा', descEN: 'Compliance team manually reviews every document and cross-checks credentials.', descHI: 'अनुपालन टीम हर दस्तावेज़ की मैन्युअल समीक्षा करती है।', icon: Search, color: '#0B1F3A' },
  { step: '04', titleEN: 'APPROVED & Live', titleHI: 'अनुमोदित और लाइव', descEN: 'Approved advisors go live with the BrokerSaab Verified badge on their profile.', descHI: 'अनुमोदित सलाहकार BrokerSaab बैज के साथ लाइव होते हैं।', icon: CheckCircle, color: '#10b981' },
];

const stats = [
  { value: '19', label: 'Service Modules', labelHI: 'सेवा मॉड्यूल', icon: Briefcase, color: '#D4AF37' },
  { value: '165+', label: 'Services Listed', labelHI: 'सूचीबद्ध सेवाएं', icon: FileText, color: '#6366f1' },
  { value: '4', label: 'Consultation Modes', labelHI: 'परामर्श मोड', icon: MessageCircle, color: '#0B1F3A' },
  { value: '100%', label: 'Payment Protected', labelHI: 'भुगतान सुरक्षित', icon: ShieldCheck, color: '#10b981' },
];

const advisorTypes = [
  'Documentation Agents', 'Insurance & Loan DSA Agents', 'Tax Preparers & CA Associates',
  'Registry & Stamp Duty Facilitators', 'RTO & Vehicle Experts',
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
  { icon: AlertOctagon, color: '#ef4444', titleEN: 'Fraud & Misconduct — Zero Liability', body: ['BrokerSaab operates as a neutral third-party technology marketplace. We are NOT a legal firm, financial advisor, property broker, or documentation agency.', 'BrokerSaab is NOT responsible for any fraudulent activity, misrepresentation, negligence, misconduct, or harm caused by any advisor, agent, or dealer listed on this platform.', 'Each professional listed is an independent contractor solely responsible for their own actions, advice, and deliverables.', 'Users engage advisors entirely at their own risk and discretion.'] },
  { icon: Gavel, color: '#D4AF37', titleEN: 'Escrow & Payment Terms', body: ['Escrow payments are held by BrokerSaab and released to advisors upon consultation completion. BrokerSaab deducts a 15% platform service fee from all transactions.', 'Refunds are processed automatically for cancellations made before service delivery begins.', 'BrokerSaab is not liable for any losses arising from payment gateway failures, banking errors, or fraudulent payment transactions initiated outside the platform.'] },
  { icon: BadgeCheck, color: '#D4AF37', titleEN: 'Authorized Dealer Status', body: ['The "BrokerSaab Authorised Dealer" badge reflects completion of our internal KYC and credential review process only.', 'This authorization is NOT a government certification, regulatory license, or official accreditation of any kind.', 'Users should independently verify the credentials and suitability of any advisor before acting on any advice.'] },
  { icon: Scale, color: '#6366f1', titleEN: 'Platform Role & Independence', body: ["BrokerSaab is a technology platform only. No advisor-client relationship, attorney-client privilege, or fiduciary duty is created with BrokerSaab by using this platform.", "BrokerSaab reserves the right to suspend, remove, or restrict any advisor's profile at any time without prior notice if platform conduct standards are violated."] },
  { icon: FileWarning, color: '#0B1F3A', titleEN: 'Data & Privacy', body: ['By using BrokerSaab, users consent to data collection for platform operation, advisor matching, and fraud prevention.', 'Consultation chat logs are stored securely and may be reviewed by BrokerSaab in the event of a formal dispute or legal requirement.', 'BrokerSaab does not sell personal data to third parties.'] },
  { icon: Ban, color: '#ef4444', titleEN: 'Prohibited Uses', body: ['Users and advisors must not use BrokerSaab for any illegal activity, money laundering, fraudulent consultations, identity theft, or harassment.', 'Advisors may not misrepresent their qualifications or submit falsified KYC documents.', 'Violation of any prohibited use clause will result in immediate account termination and referral to law enforcement.'] },
];

/* Light card style */
function lightCard(accent: string): React.CSSProperties {
  return {
    background: 'white',
    border: `1px solid ${accent}30`,
    boxShadow: `0 4px 18px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.9) inset`,
  };
}

export default function AboutPage() {
  const { language } = useLanguage();
  const hi = language === 'HI';
  const [activeTab, setActiveTab] = useState<Tab>('about');

  const tabs: { id: Tab; label: string; labelHI: string; short: string; shortHI: string; accent: string }[] = [
    { id: 'about', label: 'About Us', labelHI: 'हमारे बारे में', short: 'About', shortHI: 'बारे में', accent: '#D4AF37' },
    { id: 'platform', label: "Who's On the Platform", labelHI: 'प्लेटफ़ॉर्म पर कौन', short: 'Platform', shortHI: 'प्लेटफ़ॉर्म', accent: '#6366f1' },
    { id: 'terms', label: 'Terms & Conditions', labelHI: 'नियम और शर्तें', short: 'T&C', shortHI: 'नियम', accent: '#ef4444' },
  ];

  return (
    <div className="min-h-screen">

      {/* ══ HERO — dark navy ══ */}
      <section className="relative overflow-hidden py-14 sm:py-24 px-4 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #0B1F3A 0%, #1a1040 60%, #0B1F3A 100%)' }}>
        {/* Glows */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.20) 0%, transparent 65%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.30) 0%, transparent 65%)', transform: 'translate(-25%,25%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)' }}>
            <ShieldCheck size={12} style={{ color: '#D4AF37' }} />
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase" style={{ color: '#D4AF37' }}>
              {hi ? 'भारत का विश्वसनीय सलाहकार प्लेटफ़ॉर्म' : "India's Trusted Advisory Platform"}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
            <span className="text-white">BrokerSaab —</span>
            <br />
            <span className="gold-gradient-text">{hi ? 'सत्यापित विशेषज्ञों का बाज़ार' : 'Marketplace of Verified Experts'}</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            {hi
              ? 'एक तटस्थ तृतीय-पक्ष मंच जो उपयोगकर्ताओं को सत्यापित कानूनी, संपत्ति और वित्तीय सलाहकारों से जोड़ता है।'
              : 'A neutral third-party platform connecting users with verified legal, property, financial advisors and documentation experts — safely and transparently.'}
          </p>

          {/* Tab bar */}
          <div className="flex w-full sm:w-max mx-auto rounded-2xl p-1.5 gap-1"
            style={{ background: 'rgba(11,31,58,0.85)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 sm:flex-none px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap"
                style={activeTab === tab.id ? {
                  background: `linear-gradient(135deg,${tab.accent}30,${tab.accent}12)`,
                  color: tab.accent,
                  boxShadow: `0 0 16px ${tab.accent}25, inset 0 1px 0 ${tab.accent}30`,
                  border: `1px solid ${tab.accent}35`,
                } : { color: 'rgba(148,163,184,0.75)', border: '1px solid transparent' }}>
                <span className="sm:hidden">{hi ? tab.shortHI : tab.short}</span>
                <span className="hidden sm:inline">{hi ? tab.labelHI : tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: tab.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TAB 1 — ABOUT ══ */}
      {activeTab === 'about' && (
        <>
          {/* Founder's Diary — white */}
          <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-center mb-10 sm:mb-14">
                <div className="inline-flex items-center gap-2 rounded-full px-5 py-2"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.30)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4AF37' }} />
                  <span className="text-[10px] sm:text-xs font-black tracking-[0.20em] uppercase" style={{ color: '#B48C22' }}>
                    {hi ? 'संस्थापक की डायरी' : "FOUNDER'S DIARY"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                {/* Photo */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-7 self-center">
                    <div className="absolute -inset-[6px] rounded-3xl pointer-events-none"
                      style={{ background: 'linear-gradient(135deg,#D4AF37 0%,#FFE082 40%,#B48C22 80%,#D4AF37 100%)', borderRadius: '28px' }}>
                      <div className="w-full h-full rounded-[24px] bg-white" />
                    </div>
                    <div className="absolute -inset-[20px] rounded-3xl pointer-events-none"
                      style={{ background: 'radial-gradient(circle,rgba(212,175,55,0.12) 0%,transparent 70%)' }} />
                    <img src="/founder.jpg" alt="Ravi Ranjan — Founder & CEO, BrokerSaab"
                      className="relative z-10 rounded-3xl object-cover object-top"
                      style={{ width: '100%', maxWidth: '300px', height: '360px' }} />
                    <div className="absolute top-3 left-3 z-20 w-7 h-7 pointer-events-none"
                      style={{ borderTop: '2px solid #D4AF37', borderLeft: '2px solid #D4AF37', borderRadius: '4px 0 0 0', opacity: 0.75 }} />
                    <div className="absolute bottom-3 right-3 z-20 w-7 h-7 pointer-events-none"
                      style={{ borderBottom: '2px solid #D4AF37', borderRight: '2px solid #D4AF37', borderRadius: '0 0 4px 0', opacity: 0.75 }} />
                  </div>
                  <div className="rounded-2xl px-6 py-5 w-full max-w-[300px] self-center" style={lightCard('#D4AF37')}>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] mb-1" style={{ color: '#B48C22' }}>
                      {hi ? 'संस्थापक और CEO' : 'Founder & CEO'}
                    </div>
                    <div className="text-xl font-black text-slate-900">Ravi Ranjan</div>
                    <div className="text-sm mt-0.5 text-slate-500">BrokerSaab</div>
                  </div>
                </div>

                {/* Narrative */}
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-6 text-slate-900">
                    {hi ? 'संस्थापक की कलम से' : "From the Founder's Desk"}
                  </h2>
                  <div className="rounded-r-2xl rounded-l-sm mb-7 px-6 py-5"
                    style={{ borderLeft: '4px solid #D4AF37', background: 'linear-gradient(135deg,#FFFBEF,#FFF8E1)' }}>
                    <p className="text-base sm:text-lg font-semibold leading-relaxed italic text-slate-700">
                      {hi
                        ? '"मैंने देखा है कि आम भारतीय लाखों गंवा देते हैं अज्ञात दलालों पर — लालच से नहीं, बल्कि गलत भरोसे से। BrokerSaab इसीलिए बना है।"'
                        : '"I have seen ordinary Indians lose lakhs to unverified agents — not from greed, but from trust misplaced. BrokerSaab exists so that trust is never misplaced again."'}
                    </p>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed mb-5 text-slate-600">
                    {hi
                      ? 'बचपन से मैंने अपने परिवार को संपत्ति रजिस्ट्री, अदालती कागज़ और टैक्स फाइलिंग के चक्करों में देखा। एक बात हमेशा सामने आई — आम इंसान को यह जानने का कोई तरीका नहीं था कि सामने बैठा दलाल असली है या नहीं।'
                      : 'Growing up watching my family navigate property registrations, court paperwork, and tax filings, I saw one constant: ordinary people had no way to know if the advisor sitting across from them was legitimate. There were no verified credentials, no accountability, and fees were negotiated in smoke-filled rooms with no receipts.'}
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed mb-5 text-slate-600">
                    {hi
                      ? 'यही खाई — एक ज़रूरतमंद इंसान और एक भरोसेमंद पेशेवर के बीच — BrokerSaab के निर्माण की प्रेरणा बनी।'
                      : 'That gap — between a person who needs help and a professional they can actually trust — is why BrokerSaab was built. We created a platform where every advisor is KYC-verified, every payment is held in escrow until the work is done, and every fee is shown before you book.'}
                  </p>
                  <p className="text-sm sm:text-base leading-relaxed mb-8 text-slate-600">
                    {hi
                      ? 'BrokerSaab का उपयोग करने वाले हर भारतीय से मेरी प्रतिबद्धता सरल है: आप हमेशा जानेंगे कि आप किससे बात कर रहे हैं।'
                      : 'My commitment to every Indian using BrokerSaab is simple: you will always know who you are speaking to, what you are paying, and what you will receive in return.'}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { en: 'KYC-Verified Advisors', hi: 'KYC-सत्यापित सलाहकार' },
                      { en: 'Escrow-Protected Payments', hi: 'एस्क्रो-सुरक्षित भुगतान' },
                      { en: 'Transparent Pricing', hi: 'पारदर्शी मूल्य' },
                    ].map((chip) => (
                      <span key={chip.en} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.30)', color: '#92701a' }}>
                        <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                        {hi ? chip.hi : chip.en}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="mt-14 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="w-2 h-2 rounded-full shrink-0 bg-[#D4AF37] opacity-60" />
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              </div>
            </div>
          </section>

          {/* Mission + Stats + Verification — light indigo */}
          <section className="py-14 sm:py-20 px-4 sm:px-6" style={{ background: '#F5F3FF' }}>
            <div className="max-w-6xl mx-auto">
              {/* Mission & Vision */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
                  style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <span className="text-[10px] font-black tracking-widest uppercase text-indigo-600">
                    {hi ? 'हमारे बारे में' : 'WHO WE ARE'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {[
                  { accentColor: '#D4AF37', icon: Award, tagEN: 'Our Mission', tagHI: 'हमारा मिशन', bodyEN: 'To make professional legal, property and financial advisory services accessible, verified, and affordable to every Indian — regardless of city, language, or background.', bodyHI: 'हर भारतीय के लिए पेशेवर कानूनी, संपत्ति और वित्तीय सेवाओं को सुलभ और किफायती बनाना।' },
                  { accentColor: '#6366f1', icon: TrendingUp, tagEN: 'Our Vision', tagHI: 'हमारा विज़न', bodyEN: "Become India's most trusted third-party marketplace connecting people with credentialed professionals — one verified consultation at a time.", bodyHI: 'भारत का सबसे विश्वसनीय तृतीय-पक्ष मार्केटप्लेस बनना।' },
                ].map((item) => (
                  <div key={item.tagEN} className="relative rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1"
                    style={lightCard(item.accentColor)}>
                    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl"
                      style={{ background: `linear-gradient(90deg,transparent,${item.accentColor},transparent)` }} />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ background: `${item.accentColor}15`, border: `1px solid ${item.accentColor}30` }}>
                        <item.icon size={20} style={{ color: item.accentColor }} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: item.accentColor }}>
                        {hi ? item.tagHI : item.tagEN}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{hi ? item.bodyHI : item.bodyEN}</p>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                    style={lightCard(stat.color)}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg,transparent,${stat.color},transparent)` }} />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${stat.color}12` }}>
                      <stat.icon size={18} style={{ color: stat.color }} />
                    </div>
                    <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-slate-500 text-xs font-medium">{hi ? stat.labelHI : stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Verification Steps */}
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-slate-900 mb-3">{hi ? 'हम विश्वास कैसे बनाते हैं' : 'How We Build Trust'}</h2>
                <p className="text-slate-500 max-w-xl mx-auto">{hi ? 'हर सलाहकार 4-चरणीय सत्यापन से गुजरता है।' : 'Every advisor passes a rigorous 4-step verification before going live.'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {verificationSteps.map((step, i) => (
                  <div key={step.step} className="rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={lightCard(step.color)}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg,transparent,${step.color},transparent)` }} />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: step.color }}>
                        <step.icon size={18} className="text-white" />
                      </div>
                      <span className="text-3xl font-black opacity-15" style={{ color: step.color }}>{step.step}</span>
                    </div>
                    <h3 className="text-slate-900 font-bold text-sm mb-2">{hi ? step.titleHI : step.titleEN}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{hi ? step.descHI : step.descEN}</p>
                    {i < verificationSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-2.5 w-5 h-0.5 z-10"
                        style={{ background: `linear-gradient(90deg,${step.color},transparent)` }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Advantages — white */}
          <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
                  style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.30)' }}>
                  <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#B48C22' }}>
                    {hi ? 'क्यों BrokerSaab' : 'WHY BROKERSAAB'}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3">{hi ? 'BrokerSaab का फायदा' : 'The BrokerSaab Advantage'}</h2>
                <p className="text-slate-500 max-w-xl mx-auto">{hi ? 'यहां वो है जो हमें अलग करता है।' : 'What sets us apart from every other directory or listing platform.'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {advantages.map((adv) => (
                  <div key={adv.titleEN} className="rounded-2xl p-5 sm:p-7 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 group"
                    style={lightCard(adv.accent)}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg,transparent,${adv.accent}80,transparent)` }} />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ background: `${adv.accent}12`, border: `1px solid ${adv.accent}25` }}>
                        <adv.icon size={22} style={{ color: adv.accent }} />
                      </div>
                      <span className="text-3xl font-black opacity-10" style={{ color: adv.accent }}>{adv.num}</span>
                    </div>
                    <h3 className="text-slate-900 font-bold text-base mb-2">{hi ? adv.titleHI : adv.titleEN}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{hi ? adv.descHI : adv.descEN}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA — dark navy */}
          <section className="py-14 px-4 sm:px-6"
            style={{ background: 'linear-gradient(135deg,#0B1F3A 0%,#1a1040 100%)' }}>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-black text-white mb-3">{hi ? 'अपना विश्वसनीय सलाहकार खोजें' : 'Ready to Find Your Trusted Advisor?'}</h2>
              <p className="text-slate-400 mb-8">{hi ? 'आज एक सत्यापित सलाहकार बुक करें।' : 'Book a verified advisor today — or grow your practice with us.'}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/advisors" className="btn-gold px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
                  {hi ? 'परामर्श बुक करें' : 'Book Consultation Now'}<ArrowRight size={15} />
                </Link>
                <Link href="/advisors/onboarding" className="btn-outline px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
                  {hi ? 'सलाहकार बनें' : 'Become an Advisor'}
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ══ TAB 2 — PLATFORM ══ */}
      {activeTab === 'platform' && (
        <>
          {/* Three cards — white */}
          <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-4"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-indigo-700 text-xs font-bold tracking-[0.18em] uppercase">
                    {hi ? 'तीन पक्ष · एक विश्वसनीय हाथ मिलाना' : 'Three Sides · One Trusted Handshake'}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                  {hi ? 'BrokerSaab पर सबकी जगह है' : 'Everyone Has a Place on BrokerSaab'}
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto">
                  {hi ? 'तीन अलग भूमिकाएं, एक विश्वसनीय प्लेटफ़ॉर्म।' : 'Three distinct roles, one trusted neutral platform connecting them all.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
                {[
                  { num: '01', accent: '#6366f1', icon: UserCheck, tagEN: 'Independent Specialists', tagHI: 'स्वतंत्र विशेषज्ञ', titleEN: 'Advisors & Agents', titleHI: 'सलाहकार और एजेंट', descEN: 'Independent specialists — documentation agents, insurance & loan/DSA agents, tax preparers, registry facilitators, RTO experts — who build a profile in their exact area of specialisation.', descHI: 'स्वतंत्र विशेषज्ञ जो अपने सटीक क्षेत्र में प्रोफ़ाइल बनाते हैं।', points: advisorTypes, ctaEN: 'Register as Advisor', ctaHI: 'सलाहकार बनें', ctaHref: '/advisors/onboarding' },
                  { num: '02', accent: '#D4AF37', icon: BadgeCheck, tagEN: 'Higher Trust Tier', tagHI: 'उच्च विश्वास स्तर', titleEN: 'Authorised Dealers', titleHI: 'अधिकृत डीलर', descEN: 'The higher trust tier: partners verified and authorised by BrokerSaab through enhanced checks. Choosing them gives users extra confidence.', descHI: 'BrokerSaab द्वारा उन्नत जांच से सत्यापित।', points: authorizedBenefits, ctaEN: 'Apply for Dealer Status', ctaHI: 'डीलर स्टेटस के लिए आवेदन', ctaHref: '/advisors/onboarding' },
                  { num: '03', accent: '#0B1F3A', icon: Users, tagEN: 'People Who Get Things Done', tagHI: 'काम करवाने वाले', titleEN: 'Users', titleHI: 'उपयोगकर्ता', descEN: 'People and small businesses who need legal or documentation work done — searching by simple keywords, comparing verified professionals, and connecting directly.', descHI: 'वे लोग जिन्हें काम करवाना है।', points: clientBenefits, ctaEN: 'Find an Advisor', ctaHI: 'सलाहकार खोजें', ctaHref: '/advisors' },
                ].map((card) => (
                  <div key={card.num} className="rounded-3xl p-8 relative overflow-hidden transition-all duration-300 hover:-translate-y-2 flex flex-col"
                    style={{ background: 'white', border: `1px solid ${card.accent}25`, boxShadow: `0 8px 28px rgba(0,0,0,0.07), 4px 4px 0 ${card.accent}12` }}>
                    <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl"
                      style={{ background: `linear-gradient(90deg,transparent,${card.accent},transparent)` }} />
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-5xl font-black leading-none opacity-10" style={{ color: card.accent }}>{card.num}</span>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: card.accent }}>
                        <card.icon size={22} className="text-white" />
                      </div>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: card.accent }}>
                      {hi ? card.tagHI : card.tagEN}
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">{hi ? card.titleHI : card.titleEN}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6">{hi ? card.descHI : card.descEN}</p>
                    <ul className="space-y-2.5 mb-8 flex-1">
                      {card.points.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <CheckCircle size={13} className="shrink-0 mt-0.5" style={{ color: card.accent }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <Link href={card.ctaHref}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 mt-auto"
                      style={{ background: `${card.accent}10`, border: `1px solid ${card.accent}30`, color: card.accent }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${card.accent}18`)}
                      onMouseLeave={e => (e.currentTarget.style.background = `${card.accent}10`)}>
                      {hi ? card.ctaHI : card.ctaEN}<ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* How the sides connect — light indigo */}
          <section className="py-12 px-4 sm:px-6" style={{ background: '#EEF2FF' }}>
            <div className="max-w-5xl mx-auto">
              <div className="rounded-3xl p-8"
                style={{ background: 'white', border: '1px solid rgba(99,102,241,0.20)', boxShadow: '0 4px 20px rgba(99,102,241,0.10)' }}>
                <h3 className="text-slate-900 font-black text-xl mb-8 text-center">
                  {hi ? 'तीनों पक्ष कैसे जुड़ते हैं' : 'How the Three Sides Connect'}
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {[
                    { icon: Search, label: hi ? 'यूज़र खोजता है' : 'User Searches', color: '#6366f1' },
                    { icon: Users, label: hi ? 'Verified + Dealer सूची' : 'Verified + Dealer List', color: '#D4AF37' },
                    { icon: CreditCard, label: hi ? 'एस्क्रो भुगतान' : 'Pays via Escrow', color: '#10b981' },
                    { icon: MessageCircle, label: hi ? 'परामर्श होता है' : 'Consultation Happens', color: '#0B1F3A' },
                    { icon: Lock, label: hi ? 'एस्क्रो जारी' : 'Escrow Released', color: '#D4AF37' },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex flex-col md:flex-row items-center gap-3 flex-1">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                          style={{ background: step.color }}>
                          <step.icon size={22} className="text-white" />
                        </div>
                        <span className="text-slate-600 text-xs font-semibold max-w-[90px]">{step.label}</span>
                      </div>
                      {i < arr.length - 1 && <ArrowRight size={16} className="text-slate-300 hidden md:block shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA — dark */}
          <section className="py-14 px-4 sm:px-6"
            style={{ background: 'linear-gradient(135deg,#0B1F3A 0%,#1a1040 100%)' }}>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-black text-white mb-3">{hi ? 'प्लेटफ़ॉर्म से जुड़ें' : 'Join the Platform'}</h2>
              <p className="text-slate-400 mb-8">{hi ? 'सलाहकार बनें या आज सेवा बुक करें।' : 'Register as an advisor or book a consultation today.'}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/advisors" className="btn-gold px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
                  {hi ? 'सलाहकार खोजें' : 'Find an Advisor'}<ArrowRight size={15} />
                </Link>
                <Link href="/advisors/onboarding" className="btn-outline px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
                  {hi ? 'सलाहकार बनें' : 'Register as Advisor'}
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ══ TAB 3 — TERMS ══ */}
      {activeTab === 'terms' && (
        <>
          {/* Fraud warning — light red + white sections */}
          <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
            <div className="max-w-4xl mx-auto">
              {/* Main fraud warning */}
              <div className="rounded-3xl p-8 mb-10 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#FEF2F2,#FFF5F5)', border: '1px solid rgba(239,68,68,0.30)', boxShadow: '0 8px 24px rgba(239,68,68,0.08)' }}>
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl"
                  style={{ background: 'linear-gradient(90deg,transparent,#ef4444,transparent)' }} />
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <AlertOctagon size={26} className="text-red-500" />
                  </div>
                  <div>
                    <div className="text-red-600 text-xs font-black uppercase tracking-widest mb-2">
                      {hi ? 'महत्वपूर्ण — कृपया ध्यान से पढ़ें' : 'IMPORTANT — Please Read Carefully'}
                    </div>
                    <h2 className="text-slate-900 font-black text-xl md:text-2xl mb-4">
                      {hi ? 'BrokerSaab किसी भी धोखाधड़ी के लिए उत्तरदायी नहीं है' : 'BrokerSaab is NOT Responsible for Any Fraudulent Activity'}
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                      {hi
                        ? 'BrokerSaab एक तकनीकी मार्केटप्लेस प्लेटफ़ॉर्म है। हम किसी भी प्रकार की धोखाधड़ी के लिए उत्तरदायी नहीं हैं।'
                        : 'BrokerSaab is a technology marketplace platform only. We are NOT responsible or liable for any fraudulent activity, misrepresentation, negligence, misconduct, harm, or financial loss caused by any advisor, agent, dealer, or user on this platform.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8 px-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-slate-400 text-xs font-mono">
                  {hi ? 'प्रभावी तारीख: जून 2026' : 'Effective Date: June 2026'}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="space-y-4">
                {tcSections.map((section, i) => (
                  <div key={i} className="rounded-2xl p-7 relative overflow-hidden bg-white transition-all duration-300 hover:-translate-y-0.5"
                    style={{ border: `1px solid ${section.color}25`, boxShadow: `0 4px 16px rgba(0,0,0,0.05)` }}>
                    <div className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg,transparent,${section.color}70,transparent)` }} />
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${section.color}12`, border: `1px solid ${section.color}25` }}>
                        <section.icon size={18} style={{ color: section.color }} />
                      </div>
                      <h3 className="text-slate-900 font-black text-base">{section.titleEN}</h3>
                    </div>
                    <ul className="space-y-3">
                      {section.body.map((para, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: section.color }} />
                          <p className="text-slate-500 text-sm leading-relaxed">{para}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Acknowledgement — light gold */}
              <div className="mt-10 rounded-2xl p-7 text-center"
                style={{ background: 'linear-gradient(135deg,#FFFBEF,#FFF8E1)', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 4px 16px rgba(212,175,55,0.08)' }}>
                <Scale size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 text-xs leading-relaxed max-w-xl mx-auto">
                  {hi
                    ? 'BrokerSaab का उपयोग करके, आप इन नियमों से सहमत होते हैं। किसी भी प्रश्न के लिए help@brokersaab.com पर संपर्क करें।'
                    : 'By using BrokerSaab, you agree to these Terms & Conditions. For questions, contact help@brokersaab.com. These terms are governed by the laws of India.'}
                </p>
                <div className="flex gap-4 justify-center mt-6">
                  <Link href="/advisors" className="btn-gold px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
                    {hi ? 'सलाहकार खोजें' : 'Find an Advisor'}<ArrowRight size={14} />
                  </Link>
                  <Link href="/advisors/onboarding"
                    className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: 'white', border: '1px solid rgba(11,31,58,0.20)', color: '#0B1F3A' }}>
                    {hi ? 'सलाहकार बनें' : 'Register as Advisor'}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
