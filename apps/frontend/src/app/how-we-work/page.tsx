'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Search, UserCheck, CreditCard, MessageCircle, Star, ArrowRight,
  FileText, BadgeCheck, CheckCircle, ShieldCheck, Lock,
  Phone, Video, MessageSquare, MapPin, Wallet, AlertTriangle,
  ChevronDown, ChevronUp, Building2, Scale, RefreshCw, Sun, Moon
} from 'lucide-react';

type TabType = 'users' | 'advisors';

const userSteps = [
  {
    number: '01',
    icon: Search,
    titleEN: 'Describe Your Need',
    titleHI: 'अपनी जरूरत बताएं',
    descEN: 'Search or browse across 19 service categories — in English or Hindi. Type "bainama", "registry", "GST", "court" or whatever you call it.',
    descHI: '19 सेवा श्रेणियों में खोजें — अंग्रेजी या हिंदी में। "बैनामा", "रजिस्ट्री", "GST" या जो भी आप बोलते हैं, टाइप करें।',
    tags: ['Legal', 'Property', 'Tax', 'Documents', 'RTO'],
    color: 'from-blue-500/20 to-blue-900/10',
    border: 'border-blue-500/30',
    accent: 'text-blue-400',
  },
  {
    number: '02',
    icon: UserCheck,
    titleEN: 'Choose a Verified Advisor',
    titleHI: 'सत्यापित सलाहकार चुनें',
    descEN: 'Review full profiles — credentials, experience, languages, ratings, past client reviews, and available consultation slots. Every advisor is admin-verified.',
    descHI: 'पूर्ण प्रोफाइल देखें — क्रेडेंशियल, अनुभव, भाषाएं, रेटिंग और उपलब्ध स्लॉट। हर सलाहकार सत्यापित है।',
    tags: ['Verified Badge', 'Ratings', 'Experience', 'Reviews'],
    color: 'from-gold-500/20 to-gold-900/10',
    border: 'border-gold-500/30',
    accent: 'text-gold-400',
  },
  {
    number: '03',
    icon: CreditCard,
    titleEN: 'Book & Pay Securely',
    titleHI: 'बुक करें और सुरक्षित भुगतान करें',
    descEN: 'Select a time slot, choose your consultation mode — Phone, Video, Chat, or Physical. Pay via Wallet, Stripe, or Razorpay. Funds go into escrow, not the advisor.',
    descHI: 'समय स्लॉट चुनें, परामर्श मोड चुनें। Wallet, Stripe या Razorpay से भुगतान करें। पैसा एस्क्रो में जाता है।',
    tags: ['Escrow Protected', 'Multiple Gateways', 'Instant Confirmation'],
    color: 'from-emerald-500/20 to-emerald-900/10',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
  },
  {
    number: '04',
    icon: MessageCircle,
    titleEN: 'Get Expert Advice',
    titleHI: 'विशेषज्ञ सलाह प्राप्त करें',
    descEN: 'Attend the consultation through your dedicated, private chat room. Your advisor provides expert guidance, documentation help, and answers all your questions.',
    descHI: 'अपने निजी चैट रूम के माध्यम से परामर्श करें। आपका सलाहकार विशेषज्ञ मार्गदर्शन और दस्तावेज़ सहायता प्रदान करता है।',
    tags: ['Private Chat Room', 'Real-Time', 'Secure'],
    color: 'from-violet-500/20 to-violet-900/10',
    border: 'border-violet-500/30',
    accent: 'text-violet-400',
  },
  {
    number: '05',
    icon: Star,
    titleEN: 'Rate & Review',
    titleHI: 'रेट करें और समीक्षा करें',
    descEN: "After completion, rate your advisor and leave a review. Your feedback helps the community find the best professionals and keeps our platform's quality high.",
    descHI: 'पूरा होने के बाद, अपने सलाहकार को रेट करें। आपकी समीक्षा समुदाय की मदद करती है।',
    tags: ['1-5 Star Rating', 'Written Review', 'Community Impact'],
    color: 'from-amber-500/20 to-amber-900/10',
    border: 'border-amber-500/30',
    accent: 'text-amber-400',
  },
];

const advisorSteps = [
  {
    number: '01',
    icon: FileText,
    titleEN: 'Create Your Profile',
    titleHI: 'अपनी प्रोफ़ाइल बनाएं',
    descEN: 'Sign up with your professional details: business name, specializations, service categories, languages, consultation fee, location, and availability slots.',
    descHI: 'अपने पेशेवर विवरण के साथ साइन अप करें: व्यापार नाम, विशेषज्ञता, सेवा श्रेणियां, भाषाएं और उपलब्धता।',
    color: 'from-blue-500/20 to-blue-900/10',
    border: 'border-blue-500/30',
    accent: 'text-blue-400',
  },
  {
    number: '02',
    icon: BadgeCheck,
    titleEN: 'Submit KYC Documents',
    titleHI: 'KYC दस्तावेज़ जमा करें',
    descEN: 'Upload your professional license, government-issued ID, qualification certificates, and any relevant credentials. All uploads go to our secure AWS storage.',
    descHI: 'अपना पेशेवर लाइसेंस, सरकारी आईडी और योग्यता प्रमाणपत्र अपलोड करें। सभी अपलोड हमारे सुरक्षित AWS स्टोरेज में जाते हैं।',
    color: 'from-gold-500/20 to-gold-900/10',
    border: 'border-gold-500/30',
    accent: 'text-gold-400',
  },
  {
    number: '03',
    icon: ShieldCheck,
    titleEN: 'Get Verified & Go Live',
    titleHI: 'सत्यापित हों और लाइव हों',
    descEN: "BrokerSaab's compliance admin reviews your submitted documents. Once APPROVED, your profile appears in search results with the Verified badge.",
    descHI: 'BrokerSaab की अनुपालन टीम आपके दस्तावेज़ों की समीक्षा करती है। APPROVED होने पर, आपकी प्रोफ़ाइल खोज में दिखती है।',
    color: 'from-emerald-500/20 to-emerald-900/10',
    border: 'border-emerald-500/30',
    accent: 'text-emerald-400',
  },
  {
    number: '04',
    icon: Building2,
    titleEN: 'Grow Your Practice',
    titleHI: 'अपनी प्रैक्टिस बढ़ाएं',
    descEN: 'Accept bookings, conduct consultations, earn payments directly to your wallet (after 15% platform fee), and build your reputation through verified client reviews.',
    descHI: 'बुकिंग स्वीकार करें, परामर्श करें, अपने वॉलेट में भुगतान प्राप्त करें और सत्यापित समीक्षाओं से अपनी प्रतिष्ठा बनाएं।',
    color: 'from-violet-500/20 to-violet-900/10',
    border: 'border-violet-500/30',
    accent: 'text-violet-400',
  },
];

const consultationModes = [
  { icon: Phone, labelEN: 'Phone Call', labelHI: 'फोन कॉल', descEN: 'Quick voice consultation', descHI: 'त्वरित आवाज़ परामर्श' },
  { icon: Video, labelEN: 'Video Call', labelHI: 'वीडियो कॉल', descEN: 'Face-to-face via video', descHI: 'वीडियो के माध्यम से आमने-सामने' },
  { icon: MessageSquare, labelEN: 'Chat', labelHI: 'चैट', descEN: 'Text-based consultation', descHI: 'टेक्स्ट-आधारित परामर्श' },
  { icon: MapPin, labelEN: 'Physical', labelHI: 'व्यक्तिगत', descEN: 'In-person meeting', descHI: 'व्यक्तिगत मुलाकात' },
];

const trustPillars = [
  { icon: BadgeCheck, titleEN: 'KYC Verification', titleHI: 'KYC सत्यापन', descEN: 'Every advisor submits government ID, license, and credentials for manual admin review before going live.', descHI: 'हर सलाहकार सरकारी आईडी, लाइसेंस और क्रेडेंशियल जमा करता है।', color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20' },
  { icon: Lock, titleEN: 'Escrow Payment', titleHI: 'एस्क्रो भुगतान', descEN: 'Client funds are held securely in escrow and only released to the advisor upon completion.', descHI: 'ग्राहक का पैसा एस्क्रो में सुरक्षित रहता है और केवल परामर्श पूरा होने पर जारी होता है।', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: Star, titleEN: 'Ratings & Reviews', titleHI: 'रेटिंग और समीक्षाएं', descEN: 'Reviews are posted only by verified clients who have completed a booking — no fake reviews.', descHI: 'समीक्षाएं केवल सत्यापित ग्राहकों द्वारा पोस्ट की जाती हैं जिन्होंने बुकिंग पूरी की है।', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { icon: ShieldCheck, titleEN: 'Admin Oversight', titleHI: 'एडमिन निगरानी', descEN: 'Our compliance team monitors platform activity, reviews audit logs, and intervenes in disputes.', descHI: 'हमारी अनुपालन टीम प्लेटफ़ॉर्म गतिविधि की निगरानी करती है और विवादों में हस्तक्षेप करती है।', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: RefreshCw, titleEN: 'Dispute Resolution', titleHI: 'विवाद समाधान', descEN: "If a consultation doesn't go as expected, raise a dispute. Our team reviews and processes refunds where eligible.", descHI: 'यदि परामर्श अपेक्षित नहीं रहा, विवाद उठाएं। हमारी टीम समीक्षा करती है।', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: Scale, titleEN: 'Transparent Cancellation', titleHI: 'पारदर्शी रद्दीकरण', descEN: 'Cancel before service delivery for an automatic full refund to your wallet — no questions asked.', descHI: 'सेवा वितरण से पहले रद्द करें और अपने वॉलेट में स्वचालित पूर्ण वापसी पाएं।', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
];

const faqs = [
  {
    q: 'How are advisors verified on BrokerSaab?',
    qHI: 'BrokerSaab पर सलाहकारों का सत्यापन कैसे होता है?',
    a: 'Every advisor submits their professional license, government-issued photo ID, and qualification certificates during onboarding. Our compliance admin team manually reviews each document, cross-checks credentials with issuing authorities where possible, and only approves profiles that pass the full review. Approved advisors receive the "BrokerSaab Verified" badge on their profile.',
    aHI: 'हर सलाहकार ऑनबोर्डिंग के दौरान अपना पेशेवर लाइसेंस, सरकारी फोटो आईडी और योग्यता प्रमाणपत्र जमा करता है। हमारी अनुपालन टीम हर दस्तावेज़ की मैन्युअल समीक्षा करती है और केवल उन प्रोफाइलों को अनुमोदित करती है जो पूर्ण समीक्षा पास करती हैं।',
  },
  {
    q: 'What if I am not satisfied with my consultation?',
    qHI: 'क्या होगा अगर मैं परामर्श से संतुष्ट नहीं हूं?',
    a: "After a consultation is marked complete, you can raise a formal dispute through your Bookings dashboard. Our team reviews the case within 3-5 business days. If the dispute is upheld, a partial or full refund is issued to your wallet. We take every complaint seriously to maintain platform integrity.",
    aHI: 'परामर्श पूरा होने के बाद, आप अपने बुकिंग डैशबोर्ड के माध्यम से औपचारिक विवाद उठा सकते हैं। हमारी टीम 3-5 कार्य दिवसों में मामले की समीक्षा करती है।',
  },
  {
    q: 'How does the escrow payment work?',
    qHI: 'एस्क्रो भुगतान कैसे काम करता है?',
    a: "When you pay for a booking, your money is held in our secure escrow account — not transferred to the advisor. The funds are held until the consultation status is marked as Completed. Only then does the advisor receive their payment (minus the 15% platform commission). If the booking is cancelled before service delivery, you receive an automatic full refund to your BrokerSaab wallet.",
    aHI: 'जब आप बुकिंग के लिए भुगतान करते हैं, तो आपका पैसा हमारे सुरक्षित एस्क्रो खाते में रखा जाता है। फंड तब तक रखे जाते हैं जब तक परामर्श स्थिति "पूर्ण" चिह्नित नहीं हो जाती।',
  },
  {
    q: 'Can I choose my consultation mode?',
    qHI: 'क्या मैं अपना परामर्श मोड चुन सकता हूं?',
    a: 'Yes. BrokerSaab supports four consultation modes: Phone Call, Video Call, Chat (text-based through our in-platform chat room), and Physical (in-person at the advisor\'s location). You select your preferred mode at the time of booking. Availability of specific modes may vary by advisor.',
    aHI: 'हां। BrokerSaab चार परामर्श मोड का समर्थन करता है: फोन कॉल, वीडियो कॉल, चैट (इन-प्लेटफॉर्म), और व्यक्तिगत।',
  },
  {
    q: 'How do I become a BrokerSaab Authorized Advisor?',
    qHI: 'मैं BrokerSaab अधिकृत सलाहकार कैसे बनूं?',
    a: "Register as an advisor at /advisors/onboarding, fill in your professional details, upload your KYC documents (license, ID, certificates), and submit for review. Our admin team reviews submissions in the order received. Once approved, you automatically receive the Authorized badge. There is no extra step — the authorization is granted as part of the approval process.",
    aHI: '/advisors/onboarding पर सलाहकार के रूप में पंजीकरण करें, अपने पेशेवर विवरण भरें, KYC दस्तावेज़ अपलोड करें और समीक्षा के लिए जमा करें।',
  },
  {
    q: 'Is my data and conversation private?',
    qHI: 'क्या मेरा डेटा और बातचीत निजी है?',
    a: 'Yes. Every booking creates a dedicated, private chat room accessible only to you and your advisor. Conversations are stored securely and are not shared with third parties. All file uploads go to encrypted AWS S3 storage. For phone or video consultations, communication happens outside the platform but the booking context and notes remain private within BrokerSaab.',
    aHI: 'हां। हर बुकिंग एक निजी चैट रूम बनाती है जो केवल आपके और आपके सलाहकार के लिए सुलभ है। बातचीत सुरक्षित रूप से संग्रहीत होती है।',
  },
];

export default function HowWeWorkPage() {
  const { language } = useLanguage();
  const hi = language === 'HI';
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isDark = theme === 'dark';

  /* convenience shorthand */
  const th = (dark: string, light: string) => isDark ? dark : light;

  /* theme-aware card style */
  const glassCard = (accent?: string): React.CSSProperties => isDark ? {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
    border: accent ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
  } : {
    background: 'rgba(255,255,255,0.97)',
    border: accent ? `1px solid ${accent}35` : '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
  };

  const currentSteps = activeTab === 'users' ? userSteps : advisorSteps;


  return (
    <div className={`min-h-screen ${th('text-slate-100 bg-[#050E1B]', 'text-slate-800 bg-[#F4F6FB]')} relative`} style={{ transition: 'background 0.4s ease' }}>
      {/* Floating orbs (decorative, hidden on mobile to avoid iOS scroll artifacts) */}
      <div className="hidden sm:block fixed top-24 left-8 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', zIndex: 0 }} />
      <div className="hidden sm:block fixed bottom-32 right-8 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)', zIndex: 0 }} />

      {/* ── Hero — same style as home page hero ── */}
      <section className={`relative overflow-hidden py-14 sm:py-24 px-4 sm:px-6 ${th('navy-gradient-bg', 'bg-white border-b border-slate-200')}`} style={{ zIndex: 1 }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.20) 0%, transparent 65%)', transform: 'translate(30%, -30%)' }} />
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
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 mb-5">
            <CheckCircle size={13} className="text-gold-400" />
            <span className="text-gold-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase">
              {hi ? 'हमारी प्रक्रिया' : 'Our Process'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5 sm:mb-6">
            <span className="gold-gradient-text">{hi ? 'सरल। पारदर्शी।' : 'Simple. Transparent.'}</span>
            <br />
            <span className={th('text-white', 'text-slate-900')}>{hi ? 'विश्वसनीय।' : 'Trusted.'}</span>
          </h1>
          <p className={`${th('text-slate-400', 'text-slate-600')} text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed`}>
            {hi
              ? 'सही सलाहकार खोजने से लेकर अपना काम पूरा करने तक — यहां देखें BrokerSaab आपके लिए कैसे काम करता है।'
              : "From finding the right advisor to completing your work — here's exactly how BrokerSaab works for you."}
          </p>
          {/* Tab Switcher */}
          <div className="inline-flex rounded-2xl p-1.5 gap-1" style={{
            background: th('rgba(11,31,58,0.8)', 'rgba(255,255,255,0.92)'),
            border: th('1px solid rgba(255,255,255,0.10)', '1px solid rgba(0,0,0,0.08)'),
            backdropFilter: 'blur(12px)',
            boxShadow: th('0 2px 12px rgba(0,0,0,0.4)', '0 2px 12px rgba(0,0,0,0.06)'),
          }}>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-7 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-gold-500 text-navy-900 shadow-lg'
                  : th('text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')
              }`}
            >
              {hi ? 'उपयोगकर्ताओं के लिए' : 'For Users'}
            </button>
            <button
              onClick={() => setActiveTab('advisors')}
              className={`px-7 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === 'advisors'
                  ? 'bg-gold-500 text-navy-900 shadow-lg'
                  : th('text-slate-400 hover:text-white', 'text-slate-500 hover:text-slate-900')
              }`}
            >
              {hi ? 'सलाहकारों के लिए' : 'For Advisors'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Step-by-Step Journey ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl md:text-4xl font-black ${th('text-white', 'text-slate-900')} mb-4`}>
              {activeTab === 'users'
                ? (hi ? 'आपकी 5-चरण यात्रा' : 'Your 5-Step Journey')
                : (hi ? 'सलाहकार ऑनबोर्डिंग' : 'Advisor Onboarding Journey')}
            </h2>
            <p className={`${th('text-slate-400', 'text-slate-600')} text-lg max-w-xl mx-auto`}>
              {activeTab === 'users'
                ? (hi ? 'खोज से लेकर परामर्श तक — पूरी तरह से मार्गदर्शित।' : 'From search to consultation — fully guided, fully protected.')
                : (hi ? 'पंजीकरण से लेकर अपनी प्रैक्टिस बढ़ाने तक।' : 'From registration to growing your practice on BrokerSaab.')}
            </p>
          </div>
          <div className="space-y-5">
            {currentSteps.map((step, i) => (
              <div key={step.number}
                className={`rounded-2xl p-5 sm:p-7 border flex flex-col sm:flex-row gap-4 sm:gap-6 items-start hover:scale-[1.01] transition-transform duration-300 ${step.border}`}
                style={glassCard()}>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }}>
                    <step.icon size={24} className={step.accent} />
                  </div>
                  <span className={`text-4xl font-black ${step.accent} opacity-40 sm:hidden`}>{step.number}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`text-3xl font-black ${step.accent} opacity-30 hidden sm:block`}>{step.number}</span>
                    <h3 className={`${th('text-white', 'text-slate-900')} font-black text-xl`}>
                      {hi ? step.titleHI : step.titleEN}
                    </h3>
                  </div>
                  <p className={`${th('text-slate-400', 'text-slate-600')} text-sm leading-relaxed mb-4`}>
                    {hi ? step.descHI : step.descEN}
                  </p>
                  {'tags' in step && Array.isArray((step as any).tags) && (
                    <div className="flex flex-wrap gap-2">
                      {((step as any).tags as string[]).map((tag) => (
                        <span key={tag} className={`text-xs font-semibold px-3 py-1 rounded-full ${step.accent} border`} style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.10)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {i < currentSteps.length - 1 && (
                  <div className="hidden sm:flex items-center shrink-0 self-center">
                    <ArrowRight size={20} className="text-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Consultation Modes ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative" style={{ zIndex: 1, background: 'rgba(11,31,58,0.35)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl md:text-4xl font-black ${th('text-white', 'text-slate-900')} mb-4`}>
              {hi ? '4 परामर्श मोड' : '4 Consultation Modes'}
            </h2>
            <p className={`${th('text-slate-400', 'text-slate-600')} text-lg max-w-xl mx-auto`}>
              {hi ? 'वह मोड चुनें जो आपके लिए सबसे अच्छा काम करे।' : 'Choose the mode that works best for your situation and preference.'}
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {consultationModes.map((mode) => (
              <div key={mode.labelEN}
                className="rounded-2xl p-6 border hover:border-gold-400/40 transition-all duration-300 text-center group"
                style={glassCard()}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-500/15 transition-colors" style={{ background: 'rgba(212,175,55,0.10)' }}>
                  <mode.icon size={24} className="text-gold-400" />
                </div>
                <h3 className={`${th('text-white', 'text-slate-900')} font-bold text-base mb-2`}>{hi ? mode.labelHI : mode.labelEN}</h3>
                <p className={`${th('text-slate-400', 'text-slate-600')} text-xs`}>{hi ? mode.descHI : mode.descEN}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Escrow Payment Model ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl md:text-4xl font-black ${th('text-white', 'text-slate-900')} mb-4`}>
              {hi ? 'एस्क्रो भुगतान मॉडल' : 'Escrow Payment Model'}
            </h2>
            <p className={`${th('text-slate-400', 'text-slate-600')} text-lg max-w-2xl mx-auto`}>
              {hi
                ? 'आपका पैसा परामर्श पूरा होने तक सुरक्षित है। यहां दिखाया गया है कि यह कैसे काम करता है।'
                : 'Your money is protected until the consultation is complete. Here is exactly how the money flows.'}
            </p>
          </div>

          {/* Flow diagram */}
          <div className="rounded-3xl p-5 sm:p-8 mb-8" style={glassCard()}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {[
                { icon: Wallet, label: hi ? 'ग्राहक भुगतान करता है' : 'Client Pays', sub: hi ? 'Wallet / Stripe / Razorpay' : 'Wallet · Stripe · Razorpay', color: 'bg-blue-500' },
                { icon: Lock, label: hi ? 'एस्क्रो में रखा गया' : 'Held in Escrow', sub: hi ? 'सलाहकार को नहीं भेजा गया' : 'Not sent to advisor yet', color: 'bg-amber-500' },
                { icon: CheckCircle, label: hi ? 'परामर्श पूर्ण' : 'Consultation Complete', sub: hi ? 'सलाहकार द्वारा चिह्नित' : 'Marked by advisor', color: 'bg-emerald-500' },
                { icon: Wallet, label: hi ? 'सलाहकार को जारी' : 'Released to Advisor', sub: hi ? '15% प्लेटफ़ॉर्म शुल्क काटा गया' : 'Minus 15% platform fee', color: 'bg-gold-500' },
              ].map((node, i, arr) => (
                <div key={node.label} className="flex flex-col md:flex-row items-center gap-4 flex-1">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 ${node.color} rounded-2xl flex items-center justify-center mb-3 shadow-lg`}>
                      <node.icon size={22} className="text-white" />
                    </div>
                    <div className={`${th('text-white', 'text-slate-800')} font-bold text-sm mb-1`}>{node.label}</div>
                    <div className={`${th('text-white/80', 'text-slate-600')} text-xs max-w-[120px]`}>{node.sub}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight size={18} className="text-slate-300 hidden md:block shrink-0 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation flow */}
          <div className="border border-rose-500/25 rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4" style={{ background: 'rgba(244,63,94,0.08)', backdropFilter: 'blur(8px)' }}>
            <div className="w-10 h-10 bg-rose-500/15 rounded-xl flex items-center justify-center shrink-0">
              <RefreshCw size={18} className="text-rose-400" />
            </div>
            <div>
              <h4 className={`${th('text-white', 'text-slate-900')} font-bold mb-2`}>
                {hi ? 'रद्दीकरण पर: स्वचालित पूर्ण वापसी' : 'On Cancellation: Automatic Full Refund'}
              </h4>
              <p className={`${th('text-slate-400', 'text-slate-700')} text-sm leading-relaxed`}>
                {hi
                  ? 'यदि सेवा वितरण से पहले बुकिंग रद्द की जाती है, तो एस्क्रो से पूर्ण राशि तुरंत आपके BrokerSaab वॉलेट में वापस कर दी जाती है।'
                  : 'If a booking is cancelled before service delivery, the full escrow amount is instantly refunded to your BrokerSaab wallet — no waiting, no hassle.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Real-Time Consultation ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative" style={{ zIndex: 1, background: 'rgba(11,31,58,0.35)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl p-6 sm:p-10" style={glassCard('#8b5cf6')}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-4 py-1.5 mb-6">
                  <MessageCircle size={13} className="text-violet-400" />
                  <span className="text-violet-400 text-xs font-semibold tracking-widest uppercase">
                    {hi ? 'रियल-टाइम संचार' : 'Real-Time Communication'}
                  </span>
                </div>
                <h2 className={`text-3xl font-black ${th('text-white', 'text-slate-900')} mb-4`}>
                  {hi ? 'प्रत्येक बुकिंग के साथ निजी चैट रूम' : 'Private Chat Room with Every Booking'}
                </h2>
                <p className={`${th('text-slate-400', 'text-slate-600')} leading-relaxed mb-6`}>
                  {hi
                    ? 'जैसे ही आप बुकिंग करते हैं, आपके और आपके सलाहकार के लिए एक समर्पित, एन्क्रिप्टेड चैट रूम स्वचालित रूप से बनाया जाता है।'
                    : 'The moment a booking is confirmed, a dedicated, encrypted chat room is automatically created — accessible only to you and your advisor. No external apps needed.'}
                </p>
                <ul className="space-y-3">
                  {[
                    { EN: 'Auto-created per booking — no setup needed', HI: 'प्रत्येक बुकिंग के साथ स्वतः बनाया जाता है' },
                    { EN: 'Socket.IO powered — messages arrive in real-time', HI: 'Socket.IO — संदेश रियल-टाइम में आते हैं' },
                    { EN: 'Persistent history — review your consultation anytime', HI: 'स्थायी इतिहास — अपना परामर्श कभी भी देखें' },
                    { EN: 'Private — only you and your advisor can access it', HI: 'निजी — केवल आप और आपका सलाहकार' },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-violet-400 shrink-0" />
                      <span className={`${th('text-white/70', 'text-slate-600')} text-sm`}>{hi ? item.HI : item.EN}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-navy-900/80 rounded-2xl border border-violet-500/20 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-navy-800/60">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-rose-500 rounded-full" />
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  </div>
                  <span className="text-slate-400 text-xs">BrokerSaab Consultation Chat</span>
                </div>
                <div className="p-5 space-y-4">
                  {[
                    { msg: hi ? 'नमस्ते! मुझे अपनी प्रॉपर्टी रजिस्ट्री में मदद चाहिए।' : 'Hello! I need help with my property registration.', sender: 'client' },
                    { msg: hi ? 'नमस्ते! मैं अभी आपकी सहायता करता हूं। क्या आपके पास सभी दस्तावेज़ तैयार हैं?' : "Hello! I'll help you right away. Do you have all the documents ready?", sender: 'advisor' },
                    { msg: hi ? 'हां, मेरे पास बैनामा और आईडी है।' : 'Yes, I have the bainama and my ID.', sender: 'client' },
                  ].map((item, i) => (
                    <div key={i} className={`flex ${item.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        item.sender === 'client'
                          ? 'bg-gold-500 text-navy-900 font-medium'
                          : 'bg-navy-700 text-white/80 border border-white/8'
                      }`}>
                        {item.msg}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-4 bg-navy-800/60 rounded-xl px-4 py-2.5 border border-white/5">
                    <span className="text-white/25 text-xs flex-1">{hi ? 'संदेश टाइप करें...' : 'Type a message...'}</span>
                    <div className="w-6 h-6 bg-gold-500 rounded-lg flex items-center justify-center">
                      <ArrowRight size={12} className="text-navy-900" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Safety Pillars ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl md:text-4xl font-black ${th('text-white', 'text-slate-900')} mb-4`}>
              {hi ? 'विश्वास और सुरक्षा' : 'Trust & Safety'}
            </h2>
            <p className={`${th('text-slate-400', 'text-slate-600')} text-lg max-w-2xl mx-auto`}>
              {hi
                ? 'BrokerSaab पर हर लेनदेन और हर बातचीत इन छह स्तंभों द्वारा संरक्षित है।'
                : 'Every transaction and every interaction on BrokerSaab is protected by these six pillars.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trustPillars.map((pillar) => (
              <div key={pillar.titleEN} className={`rounded-2xl p-7 border ${pillar.bg} hover:scale-[1.02] transition-transform duration-300`} style={glassCard()}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${pillar.color}`} style={{ background: th('rgba(11,31,58,0.8)', 'rgba(241,245,249,0.8)'), border: th('1px solid rgba(255,255,255,0.10)', '1px solid rgba(0,0,0,0.08)') }}>
                  <pillar.icon size={20} />
                </div>
                <h3 className={`${th('text-white', 'text-slate-900')} font-bold text-base mb-3`}>
                  {hi ? pillar.titleHI : pillar.titleEN}
                </h3>
                <p className={`${th('text-white/55', 'text-slate-600')} text-sm leading-relaxed`}>
                  {hi ? pillar.descHI : pillar.descEN}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Role Disclaimer ── */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-4xl mx-auto">
          <div className="border border-amber-500/25 rounded-2xl p-5 sm:p-7 flex items-start gap-3 sm:gap-4" style={{ background: 'rgba(245,158,11,0.08)', backdropFilter: 'blur(8px)' }}>
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <h4 className={`${th('text-white', 'text-slate-900')} font-bold mb-2`}>
                {hi ? 'प्लेटफ़ॉर्म की भूमिका को समझें' : 'Understanding Our Platform Role'}
              </h4>
              <p className={`${th('text-slate-400', 'text-slate-700')} text-sm leading-relaxed`}>
                {hi
                  ? 'BrokerSaab आपको पेशेवरों से जोड़ता है — हम सेवा प्रदाता नहीं हैं। हम क्रेडेंशियल सत्यापित करते हैं और आपके भुगतान को सुरक्षित करते हैं, लेकिन सलाह और परिणाम सलाहकार की स्वतंत्र जिम्मेदारी है।'
                  : 'BrokerSaab connects you with independent professionals — we are not the service provider. We verify credentials and secure your payment, but the advice, deliverables, and outcomes are the advisor\'s independent professional responsibility. We encourage all users to exercise independent judgement when selecting and acting on professional advice.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Accordion ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative" style={{ zIndex: 1 }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl md:text-4xl font-black ${th('text-white', 'text-slate-900')} mb-4`}>
              {hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
            </h2>
            <p className={`${th('text-slate-400', 'text-slate-600')} max-w-xl mx-auto`}>
              {hi ? 'आपके सबसे सामान्य प्रश्नों के उत्तर।' : 'Answers to the most common questions about BrokerSaab.'}
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl overflow-hidden hover:border-gold-500/40 transition-colors" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className={`${th('text-white', 'text-slate-900')} font-semibold text-sm leading-relaxed`}>
                    {hi ? faq.qHI : faq.q}
                  </span>
                  <div className="shrink-0">
                    {openFaq === i
                      ? <ChevronUp size={18} className="text-gold-400" />
                      : <ChevronDown size={18} className="text-slate-400" />
                    }
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 border-t border-white/5">
                    <p className={`${th('text-slate-400', 'text-slate-600')} text-sm leading-relaxed pt-4`}>
                      {hi ? faq.aHI : faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 relative overflow-hidden" style={{ zIndex: 1, background: 'linear-gradient(135deg, rgba(11,31,58,0.95), rgba(5,14,27,0.98))' }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 100%, #D4AF37 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {hi ? 'शुरू करने के लिए तैयार हैं?' : 'Ready to Get Started?'}
          </h2>
          <p className="text-slate-300 text-lg mb-10">
            {hi
              ? 'आज एक सत्यापित सलाहकार खोजें — या BrokerSaab पर अपनी प्रैक्टिस बढ़ाएं।'
              : 'Find a verified advisor today — or grow your professional practice with BrokerSaab.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/advisors" className="btn-gold px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
              {hi ? 'सलाहकार खोजें' : 'Find an Advisor'}
              <ArrowRight size={16} />
            </Link>
            <Link href="/advisors/onboarding" className="btn-outline px-8 py-3.5 rounded-xl font-semibold flex items-center gap-2 justify-center text-sm">
              {hi ? 'सलाहकार के रूप में पंजीकरण करें' : 'Register as Advisor'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
