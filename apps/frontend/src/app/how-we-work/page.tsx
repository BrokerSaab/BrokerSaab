'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Search, UserCheck, CreditCard, MessageCircle, Star, ArrowRight,
  FileText, BadgeCheck, CheckCircle, ShieldCheck, Lock,
  Phone, Video, MessageSquare, MapPin, Wallet, AlertTriangle,
  ChevronDown, ChevronUp, Building2, Scale, RefreshCw
} from 'lucide-react';

type TabType = 'users' | 'advisors';

const userSteps = [
  { number: '01', icon: Search, titleEN: 'Describe Your Need', titleHI: 'अपनी जरूरत बताएं', descEN: 'Search or browse across 19 service categories — in English or Hindi. Type "bainama", "registry", "GST", "court" or whatever you call it.', descHI: '19 सेवा श्रेणियों में खोजें — अंग्रेजी या हिंदी में।', tags: ['Legal', 'Property', 'Tax', 'Documents', 'RTO'], accent: '#6366f1' },
  { number: '02', icon: UserCheck, titleEN: 'Choose a Verified Advisor', titleHI: 'सत्यापित सलाहकार चुनें', descEN: 'Review full profiles — credentials, experience, languages, ratings, past client reviews, and available consultation slots. Every advisor is admin-verified.', descHI: 'पूर्ण प्रोफाइल देखें — क्रेडेंशियल, अनुभव, भाषाएं, रेटिंग।', tags: ['Verified Badge', 'Ratings', 'Experience', 'Reviews'], accent: '#D4AF37' },
  { number: '03', icon: CreditCard, titleEN: 'Book & Pay Securely', titleHI: 'बुक करें और सुरक्षित भुगतान करें', descEN: 'Select a time slot, choose your consultation mode — Phone, Video, Chat, or Physical. Pay via Wallet, Stripe, or Razorpay. Funds go into escrow, not the advisor.', descHI: 'समय स्लॉट चुनें, परामर्श मोड चुनें। पैसा एस्क्रो में जाता है।', tags: ['Escrow Protected', 'Multiple Gateways', 'Instant Confirmation'], accent: '#10b981' },
  { number: '04', icon: MessageCircle, titleEN: 'Get Expert Advice', titleHI: 'विशेषज्ञ सलाह प्राप्त करें', descEN: 'Attend the consultation through your dedicated, private chat room. Your advisor provides expert guidance, documentation help, and answers all your questions.', descHI: 'अपने निजी चैट रूम के माध्यम से परामर्श करें।', tags: ['Private Chat Room', 'Real-Time', 'Secure'], accent: '#8b5cf6' },
  { number: '05', icon: Star, titleEN: 'Rate & Review', titleHI: 'रेट करें और समीक्षा करें', descEN: "After completion, rate your advisor and leave a review. Your feedback helps the community find the best professionals.", descHI: 'पूरा होने के बाद, अपने सलाहकार को रेट करें।', tags: ['1-5 Star Rating', 'Written Review', 'Community Impact'], accent: '#f59e0b' },
];

const advisorSteps = [
  { number: '01', icon: FileText, titleEN: 'Create Your Profile', titleHI: 'अपनी प्रोफ़ाइल बनाएं', descEN: 'Sign up with your professional details: business name, specializations, service categories, languages, consultation fee, location, and availability slots.', descHI: 'अपने पेशेवर विवरण के साथ साइन अप करें।', accent: '#6366f1' },
  { number: '02', icon: BadgeCheck, titleEN: 'Submit KYC Documents', titleHI: 'KYC दस्तावेज़ जमा करें', descEN: 'Upload your professional license, government-issued ID, qualification certificates, and any relevant credentials. All uploads go to our secure AWS storage.', descHI: 'अपना पेशेवर लाइसेंस, सरकारी आईडी और योग्यता प्रमाणपत्र अपलोड करें।', accent: '#D4AF37' },
  { number: '03', icon: ShieldCheck, titleEN: 'Get Verified & Go Live', titleHI: 'सत्यापित हों और लाइव हों', descEN: "BrokerSaab's compliance admin reviews your submitted documents. Once APPROVED, your profile appears in search results with the Verified badge.", descHI: 'BrokerSaab की अनुपालन टीम आपके दस्तावेज़ों की समीक्षा करती है।', accent: '#10b981' },
  { number: '04', icon: Building2, titleEN: 'Grow Your Practice', titleHI: 'अपनी प्रैक्टिस बढ़ाएं', descEN: 'Accept bookings, conduct consultations, earn payments directly to your wallet (after 15% platform fee), and build your reputation through verified client reviews.', descHI: 'बुकिंग स्वीकार करें, परामर्श करें, वॉलेट में भुगतान प्राप्त करें।', accent: '#8b5cf6' },
];

const consultationModes = [
  { icon: Phone, labelEN: 'Phone Call', labelHI: 'फोन कॉल', descEN: 'Quick voice consultation', descHI: 'त्वरित आवाज़ परामर्श', accent: '#6366f1' },
  { icon: Video, labelEN: 'Video Call', labelHI: 'वीडियो कॉल', descEN: 'Face-to-face via video', descHI: 'वीडियो के माध्यम से आमने-सामने', accent: '#D4AF37' },
  { icon: MessageSquare, labelEN: 'Chat', labelHI: 'चैट', descEN: 'Text-based consultation', descHI: 'टेक्स्ट-आधारित परामर्श', accent: '#10b981' },
  { icon: MapPin, labelEN: 'Physical', labelHI: 'व्यक्तिगत', descEN: 'In-person meeting', descHI: 'व्यक्तिगत मुलाकात', accent: '#8b5cf6' },
];

const trustPillars = [
  { icon: BadgeCheck, titleEN: 'KYC Verification', titleHI: 'KYC सत्यापन', descEN: 'Every advisor submits government ID, license, and credentials for manual admin review before going live.', descHI: 'हर सलाहकार सरकारी आईडी, लाइसेंस और क्रेडेंशियल जमा करता है।', accent: '#D4AF37' },
  { icon: Lock, titleEN: 'Escrow Payment', titleHI: 'एस्क्रो भुगतान', descEN: 'Client funds are held securely in escrow and only released to the advisor upon completion.', descHI: 'ग्राहक का पैसा एस्क्रो में सुरक्षित रहता है।', accent: '#10b981' },
  { icon: Star, titleEN: 'Ratings & Reviews', titleHI: 'रेटिंग और समीक्षाएं', descEN: 'Reviews are posted only by verified clients who have completed a booking — no fake reviews.', descHI: 'समीक्षाएं केवल सत्यापित ग्राहकों द्वारा पोस्ट की जाती हैं।', accent: '#f59e0b' },
  { icon: ShieldCheck, titleEN: 'Admin Oversight', titleHI: 'एडमिन निगरानी', descEN: 'Our compliance team monitors platform activity, reviews audit logs, and intervenes in disputes.', descHI: 'हमारी अनुपालन टीम प्लेटफ़ॉर्म गतिविधि की निगरानी करती है।', accent: '#6366f1' },
  { icon: RefreshCw, titleEN: 'Dispute Resolution', titleHI: 'विवाद समाधान', descEN: "If a consultation doesn't go as expected, raise a dispute. Our team reviews and processes refunds where eligible.", descHI: 'यदि परामर्श अपेक्षित नहीं रहा, विवाद उठाएं।', accent: '#8b5cf6' },
  { icon: Scale, titleEN: 'Transparent Cancellation', titleHI: 'पारदर्शी रद्दीकरण', descEN: 'Cancel before service delivery for an automatic full refund to your wallet — no questions asked.', descHI: 'सेवा वितरण से पहले रद्द करें और स्वचालित पूर्ण वापसी पाएं।', accent: '#ef4444' },
];

const faqs = [
  { q: 'How are advisors verified on BrokerSaab?', qHI: 'BrokerSaab पर सलाहकारों का सत्यापन कैसे होता है?', a: 'Every advisor submits their professional license, government-issued photo ID, and qualification certificates during onboarding. Our compliance admin team manually reviews each document and only approves profiles that pass the full review. Approved advisors receive the "BrokerSaab Verified" badge on their profile.', aHI: 'हर सलाहकार ऑनबोर्डिंग के दौरान अपना पेशेवर लाइसेंस, सरकारी फोटो आईडी जमा करता है।' },
  { q: 'What if I am not satisfied with my consultation?', qHI: 'क्या होगा अगर मैं परामर्श से संतुष्ट नहीं हूं?', a: 'After a consultation is marked complete, you can raise a formal dispute through your Bookings dashboard. Our team reviews the case within 3-5 business days. If the dispute is upheld, a partial or full refund is issued to your wallet.', aHI: 'परामर्श पूरा होने के बाद, आप अपने बुकिंग डैशबोर्ड के माध्यम से औपचारिक विवाद उठा सकते हैं।' },
  { q: 'How does the escrow payment work?', qHI: 'एस्क्रो भुगतान कैसे काम करता है?', a: 'When you pay for a booking, your money is held in our secure escrow account — not transferred to the advisor. The funds are held until the consultation status is marked as Completed. Only then does the advisor receive their payment (minus the 15% platform commission).', aHI: 'जब आप बुकिंग के लिए भुगतान करते हैं, तो आपका पैसा हमारे सुरक्षित एस्क्रो खाते में रखा जाता है।' },
  { q: 'Can I choose my consultation mode?', qHI: 'क्या मैं अपना परामर्श मोड चुन सकता हूं?', a: "Yes. BrokerSaab supports four consultation modes: Phone Call, Video Call, Chat (text-based through our in-platform chat room), and Physical (in-person at the advisor's location). You select your preferred mode at the time of booking.", aHI: 'हां। BrokerSaab चार परामर्श मोड का समर्थन करता है: फोन कॉल, वीडियो कॉल, चैट, और व्यक्तिगत।' },
  { q: 'What is the platform fee for advisors?', qHI: 'सलाहकारों के लिए प्लेटफ़ॉर्म शुल्क क्या है?', a: 'BrokerSaab deducts a 15% platform service fee from each completed consultation payment. The remaining 85% is transferred directly to the advisor\'s BrokerSaab wallet. Advisors can withdraw their wallet balance at any time.', aHI: 'BrokerSaab प्रत्येक पूर्ण परामर्श भुगतान से 15% प्लेटफ़ॉर्म सेवा शुल्क काटता है।' },
  { q: 'Is my personal data safe on BrokerSaab?', qHI: 'क्या BrokerSaab पर मेरा व्यक्तिगत डेटा सुरक्षित है?', a: 'Yes. BrokerSaab uses AWS-hosted, encrypted storage for all KYC documents. Consultation chat logs are stored securely and only reviewed in the event of a formal dispute or legal requirement. We do not sell personal data to any third parties.', aHI: 'हां। BrokerSaab सभी KYC दस्तावेज़ों के लिए AWS-होस्टेड, एन्क्रिप्टेड स्टोरेज का उपयोग करता है।' },
];

function lightCard(accent: string): React.CSSProperties {
  return {
    background: 'white',
    border: `1px solid ${accent}28`,
    boxShadow: `0 4px 18px rgba(0,0,0,0.06)`,
  };
}

export default function HowWeWorkPage() {
  const { language } = useLanguage();
  const hi = language === 'HI';
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tabs = [
    { id: 'users' as TabType, en: 'For Users / Clients', hi: 'उपयोगकर्ताओं के लिए', short: 'Users', shortHI: 'उपयोगकर्ता', accent: '#6366f1' },
    { id: 'advisors' as TabType, en: 'For Advisors', hi: 'सलाहकारों के लिए', short: 'Advisors', shortHI: 'सलाहकार', accent: '#D4AF37' },
  ];

  const steps = activeTab === 'users' ? userSteps : advisorSteps;

  return (
    <div className="min-h-screen">

      {/* ══ HERO — dark navy ══ */}
      <section className="relative overflow-hidden py-14 sm:py-24 px-4 sm:px-6"
        style={{ background: 'linear-gradient(135deg, #0B1F3A 0%, #1a1040 60%, #0B1F3A 100%)' }}>
        {/* Glows */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle,rgba(212,175,55,0.20) 0%,transparent 65%)', transform: 'translate(30%,-30%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.30) 0%,transparent 65%)', transform: 'translate(-25%,25%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)' }}>
            <ShieldCheck size={12} style={{ color: '#818cf8' }} />
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase text-indigo-300">
              {hi ? 'पारदर्शी · सुरक्षित · सत्यापित' : 'Transparent · Secure · Verified'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
            <span className="text-white">{hi ? 'BrokerSaab कैसे' : 'How BrokerSaab'}</span>
            <br />
            <span className="gold-gradient-text">{hi ? 'काम करता है' : 'Works'}</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            {hi
              ? 'हर बुकिंग में विश्वास, पारदर्शिता और सुरक्षा — यही BrokerSaab का वादा है।'
              : 'Every step — from search to payment to consultation — is designed for trust, transparency, and your complete protection.'}
          </p>

          {/* Tab switcher */}
          <div className="inline-flex rounded-2xl p-1.5 gap-1"
            style={{ background: 'rgba(11,31,58,0.85)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="relative px-5 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap"
                style={activeTab === tab.id ? {
                  background: `linear-gradient(135deg,${tab.accent}30,${tab.accent}12)`,
                  color: tab.accent,
                  border: `1px solid ${tab.accent}35`,
                  boxShadow: `0 0 16px ${tab.accent}25`,
                } : { color: 'rgba(148,163,184,0.75)', border: '1px solid transparent' }}>
                <span className="sm:hidden">{hi ? tab.shortHI : tab.short}</span>
                <span className="hidden sm:inline">{hi ? tab.hi : tab.en}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STEPS — white ══ */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.20)' }}>
              <span className="text-indigo-600 text-[10px] font-black tracking-widest uppercase">
                {activeTab === 'users'
                  ? (hi ? 'यूज़र यात्रा' : 'USER JOURNEY')
                  : (hi ? 'सलाहकार यात्रा' : 'ADVISOR JOURNEY')}
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              {activeTab === 'users'
                ? (hi ? 'परामर्श पाने के 5 कदम' : '5 Steps to Getting Expert Help')
                : (hi ? 'BrokerSaab पर शुरुआत के 4 कदम' : '4 Steps to Starting on BrokerSaab')}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {activeTab === 'users'
                ? (hi ? 'सरल, सुरक्षित और पारदर्शी प्रक्रिया।' : 'Simple, secure, and transparent from start to finish.')
                : (hi ? 'अपनी प्रैक्टिस को ऑनलाइन बढ़ाएं।' : 'Build your verified practice online.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {steps.map((step) => (
              <div key={step.number} className="rounded-2xl p-6 relative transition-all duration-300 hover:-translate-y-2"
                style={lightCard(step.accent)}>
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg,transparent,${step.accent},transparent)` }} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: step.accent }}>
                    <step.icon size={20} className="text-white" />
                  </div>
                  <span className="text-3xl font-black leading-none opacity-10" style={{ color: step.accent }}>
                    {step.number}
                  </span>
                </div>
                <h3 className="text-slate-900 font-bold text-sm mb-2">{hi ? step.titleHI : step.titleEN}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4">{hi ? step.descHI : step.descEN}</p>
                {'tags' in step && Array.isArray(step.tags) && (
                  <div className="flex flex-wrap gap-1.5">
                    {(step.tags as string[]).map((tag) => (
                      <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: `${step.accent}10`, color: step.accent, border: `1px solid ${step.accent}25` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONSULTATION MODES — light indigo ══ */}
      <section className="py-14 sm:py-20 px-4 sm:px-6" style={{ background: '#F5F3FF' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
              style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <span className="text-indigo-700 text-[10px] font-black tracking-widest uppercase">
                {hi ? 'परामर्श के तरीके' : 'CONSULTATION MODES'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              {hi ? 'अपना तरीका चुनें' : 'Choose How You Consult'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {hi ? 'बुकिंग के समय, आप अपना पसंदीदा परामर्श तरीका चुनते हैं।' : 'At booking time, you select your preferred consultation mode.'}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {consultationModes.map((mode) => (
              <div key={mode.labelEN} className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
                style={lightCard(mode.accent)}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: mode.accent }}>
                  <mode.icon size={24} className="text-white" />
                </div>
                <div className="font-bold text-slate-900 text-sm mb-1">{hi ? mode.labelHI : mode.labelEN}</div>
                <div className="text-slate-400 text-xs">{hi ? mode.descHI : mode.descEN}</div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-5 text-center"
            style={{ background: 'white', border: '1px solid rgba(239,68,68,0.20)', boxShadow: '0 2px 12px rgba(239,68,68,0.06)' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-red-600 text-xs font-bold uppercase tracking-wider">
                {hi ? 'रद्दीकरण नीति' : 'CANCELLATION POLICY'}
              </span>
            </div>
            <p className="text-slate-500 text-xs max-w-xl mx-auto">
              {hi
                ? 'सेवा वितरण शुरू होने से पहले रद्द करने पर, आपके BrokerSaab वॉलेट में पूर्ण वापसी होती है।'
                : 'Cancel before service delivery begins and receive a full automatic refund to your BrokerSaab wallet. No questions asked.'}
            </p>
          </div>
        </div>
      </section>

      {/* ══ ESCROW — white ══ */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
              style={{ background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.30)' }}>
              <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#B48C22' }}>
                {hi ? 'भुगतान सुरक्षा' : 'PAYMENT PROTECTION'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              {hi ? 'एस्क्रो — आपका पैसा सुरक्षित' : 'Escrow — Your Money, Protected'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {hi ? 'जब तक परामर्श पूरा न हो, पैसा एडवाइजर तक नहीं जाता।' : 'Your payment never reaches the advisor until your consultation is successfully completed.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { step: '1', icon: Wallet, title: hi ? 'भुगतान करें' : 'You Pay', desc: hi ? 'पैसा BrokerSaab एस्क्रो में जाता है — सीधे सलाहकार को नहीं।' : 'Payment goes to BrokerSaab escrow — not the advisor directly.', accent: '#6366f1' },
              { step: '2', icon: Lock, title: hi ? 'एस्क्रो में रखा' : 'Held in Escrow', desc: hi ? 'परामर्श पूरा होने तक पैसा एस्क्रो में सुरक्षित रहता है।' : 'Funds are locked until consultation completion is confirmed.', accent: '#D4AF37' },
              { step: '3', icon: CheckCircle, title: hi ? 'सलाहकार को जारी' : 'Released to Advisor', desc: hi ? 'पूरा होने के बाद, 15% प्लेटफ़ॉर्म शुल्क काटकर सलाहकार को भुगतान।' : 'After completion, advisor receives payment minus 15% platform fee.', accent: '#10b981' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl p-6 text-center relative" style={lightCard(item.accent)}>
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg,transparent,${item.accent},transparent)` }} />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: item.accent }}>
                  <item.icon size={22} className="text-white" />
                </div>
                <div className="text-2xl font-black mb-2" style={{ color: item.accent }}>Step {item.step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Real-time chat preview */}
          <div className="rounded-3xl p-7" style={{ background: '#F5F3FF', border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 4px 20px rgba(99,102,241,0.07)' }}>
            <div className="text-center mb-6">
              <h3 className="text-slate-900 font-black text-xl mb-2">{hi ? 'प्राइवेट चैट रूम' : 'Private Consultation Chat Room'}</h3>
              <p className="text-slate-500 text-sm">{hi ? 'हर बुकिंग के साथ निजी एन्क्रिप्टेड चैट रूम स्वतः बनता है।' : 'Auto-created per booking, encrypted, and deleted after the consultation.'}</p>
            </div>
            <div className="max-w-sm mx-auto space-y-3">
              {[
                { from: 'user', msg: hi ? 'नमस्ते, मुझे बैनामा के बारे में जानना है।' : 'Hello, I need help with my property bainama.' },
                { from: 'advisor', msg: hi ? 'नमस्ते! मैं आपकी मदद करूंगा। कौन सा जिला?' : 'Hello! I can help with that. Which district is the property in?' },
                { from: 'user', msg: hi ? 'लखनऊ, UP में है।' : "It's in Lucknow, UP." },
                { from: 'advisor', msg: hi ? 'अच्छा। मुझे दस्तावेज़ों की सूची भेजता हूं।' : "Perfect. I'll send you a checklist of required documents now." },
              ].map((bubble, i) => (
                <div key={i} className={`flex ${bubble.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                    style={bubble.from === 'advisor'
                      ? { background: 'white', border: '1px solid rgba(99,102,241,0.20)', color: '#1e293b', borderBottomLeftRadius: '4px' }
                      : { background: '#6366f1', color: 'white', borderBottomRightRadius: '4px' }}>
                    {bubble.msg}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRUST PILLARS — light gold ══ */}
      <section className="py-14 sm:py-20 px-4 sm:px-6" style={{ background: '#FFFBEF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.30)' }}>
              <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#B48C22' }}>
                {hi ? 'हमारे 6 विश्वास स्तंभ' : 'OUR 6 TRUST PILLARS'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              {hi ? 'विश्वास जो हम बनाते हैं' : 'How We Build Trust Into Every Interaction'}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {hi ? 'हर बुकिंग में सुरक्षा, पारदर्शिता और जवाबदेही।' : 'Safety, transparency and accountability built into every booking.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trustPillars.map((pillar) => (
              <div key={pillar.titleEN} className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={lightCard(pillar.accent)}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${pillar.accent}15`, border: `1px solid ${pillar.accent}30` }}>
                    <pillar.icon size={22} style={{ color: pillar.accent }} />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-bold text-sm mb-1">{hi ? pillar.titleHI : pillar.titleEN}</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">{hi ? pillar.descHI : pillar.descEN}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ — light indigo ══ */}
      <section className="py-14 sm:py-20 px-4 sm:px-6" style={{ background: '#F5F3FF' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-3"
              style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <span className="text-indigo-700 text-[10px] font-black tracking-widest uppercase">
                {hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'FAQ'}
              </span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              {hi ? 'आपके सवाल, हमारे जवाब' : 'Common Questions Answered'}
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: 'white',
                  border: openFaq === i ? '1px solid rgba(212,175,55,0.40)' : '1px solid rgba(0,0,0,0.07)',
                  boxShadow: openFaq === i ? '0 4px 16px rgba(212,175,55,0.10)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                <button className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-semibold text-slate-900 text-sm">{hi ? faq.qHI : faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={16} className="shrink-0 text-slate-400" />
                    : <ChevronDown size={16} className="shrink-0 text-slate-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 border-t border-slate-100">
                    <p className="text-slate-500 text-sm leading-relaxed pt-4">{hi ? faq.aHI : faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA — dark navy ══ */}
      <section className="py-16 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0B1F3A 0%,#1a1040 100%)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle,#D4AF37 0%,transparent 70%)', transform: 'translate(-50%,-50%)' }} />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle,#6366f1 0%,transparent 70%)', transform: 'translate(50%,-50%)' }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.30)' }}>
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#D4AF37' }}>
              {hi ? 'शुरुआत करें' : 'GET STARTED'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            {hi ? 'BrokerSaab के साथ शुरुआत करें' : 'Ready to Experience BrokerSaab?'}
          </h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto">
            {hi
              ? 'एक सत्यापित सलाहकार बुक करें या अपनी प्रैक्टिस बढ़ाएं।'
              : 'Book a verified advisor for your next legal, property, or financial need — or grow your professional practice on India\'s trusted advisory platform.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/advisors" className="btn-gold px-8 py-4 rounded-xl font-bold flex items-center gap-2 justify-center">
              {hi ? 'सलाहकार खोजें' : 'Find an Advisor'}<ArrowRight size={16} />
            </Link>
            <Link href="/advisors/onboarding" className="btn-outline px-8 py-4 rounded-xl font-bold flex items-center gap-2 justify-center">
              {hi ? 'सलाहकार बनें' : 'Register as Advisor'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
