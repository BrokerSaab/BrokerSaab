'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type ChatState =
  | 'home'
  | 'faq_how'
  | 'faq_plans'
  | 'faq_onboarding'
  | 'ticket_check'
  | 'ticket_form'
  | 'ticket_other'
  | 'ticket_submitting'
  | 'ticket_success'
  | 'ticket_error';

interface Message {
  from: 'bot' | 'user';
  text: string;
  html?: boolean;
}

const FAQ_HOW = `BrokerSaab connects you with verified advisors in 5 steps:

1️⃣ Search for a service (property, legal, tax, vehicle, etc.)
2️⃣ Browse verified advisor profiles with ratings & reviews
3️⃣ Connect — your 1st contact is completely FREE
4️⃣ Book a consultation via escrow-protected payment
5️⃣ Get expert guidance from a verified professional

All payments are held in escrow and released only after your consultation is completed. BrokerSaab does not guarantee advice quality — please verify advisor credentials independently.`;

const FAQ_PLANS = `📦 Contact Unlock Pack — ₹99/year
• Original price: ₹999 (90% OFF launch offer)
• ₹116.82 including 18% GST
• Unlocks 20 advisor phone numbers + emails
• Valid for 1 full year from purchase
• 100% refund guarantee within 7 days

🛡️ Advisor Subscription — ₹499/year
• Original price: ₹4,999 (90% OFF launch offer)
• Authorised Dealer badge on your profile
• Enhanced visibility to users
• Valid for 1 full year

💡 Your 1st advisor contact is always FREE — no payment needed to try the platform.`;

const FAQ_ONBOARDING = `To register as an advisor on BrokerSaab:

1️⃣ Go to Advisors → Register as Advisor
2️⃣ Enter your phone number → verify with OTP
3️⃣ Fill in business details (name, license, location, consultation fee)
4️⃣ Upload KYC documents (Aadhaar, passport photo, license copy)
5️⃣ Select your service categories & weekly availability
6️⃣ Complete subscription payment (₹499/year)
7️⃣ Wait for admin review & approval (24–48 hours)

Once approved, your profile goes live and users can find and contact you.

⚠️ BrokerSaab is a neutral marketplace. You are responsible for the accuracy of your profile.`;

export default function ChatbotWidget() {
  const { isLoggedIn, openLoginModal } = useAuth();
  const [isOpen, setIsOpen]   = useState(false);
  const [chatState, setChatState] = useState<ChatState>('home');
  const [messages, setMessages]   = useState<Message[]>([]);
  const [subject, setSubject]     = useState('');
  const [description, setDesc]    = useState('');
  const [otherText, setOther]     = useState('');
  const [ticketId, setTicketId]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasUnread, setHasUnread]   = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') || '' : '');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // On open, show the home welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ from: 'bot', text: `Hi there! 👋 I'm the BrokerSaab assistant.\n\nHow can I help you today? Please choose an option below.` }]);
    }
    if (isOpen) setHasUnread(false);
  }, [isOpen, messages.length]);

  // Show unread badge after 8s if chat not opened
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isOpen) setHasUnread(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [isOpen]);

  const addMsg = useCallback((msg: Message) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const goHome = useCallback(() => {
    setChatState('home');
    setSubject('');
    setDesc('');
    setOther('');
  }, []);

  const handleOption = useCallback((option: string) => {
    addMsg({ from: 'user', text: option });

    switch (option) {
      case 'How BrokerSaab works':
        setChatState('faq_how');
        setTimeout(() => addMsg({ from: 'bot', text: FAQ_HOW }), 400);
        break;
      case 'Subscription plans':
        setChatState('faq_plans');
        setTimeout(() => addMsg({ from: 'bot', text: FAQ_PLANS }), 400);
        break;
      case 'Advisor onboarding':
        setChatState('faq_onboarding');
        setTimeout(() => addMsg({ from: 'bot', text: FAQ_ONBOARDING }), 400);
        break;
      case 'Raise a support ticket':
        setChatState('ticket_check');
        if (!isLoggedIn) {
          setTimeout(() => addMsg({ from: 'bot', text: `You need to be signed in to raise a support ticket.\n\nPlease sign in and I'll bring you right back here.` }), 400);
        } else {
          setChatState('ticket_form');
          setTimeout(() => addMsg({ from: 'bot', text: `Please fill in the details below and I'll create a ticket for you. Our team typically responds within 24 hours.` }), 400);
        }
        break;
      case 'Other question':
        setChatState('ticket_other');
        setTimeout(() => addMsg({ from: 'bot', text: `No problem! Please describe your question or issue and I'll create a support ticket for you.` }), 400);
        break;
      default:
        break;
    }
  }, [addMsg, isLoggedIn]);

  const handleSignIn = useCallback(() => {
    openLoginModal(() => {
      setChatState('ticket_form');
      addMsg({ from: 'bot', text: `Welcome back! Please fill in the details below to raise your support ticket.` });
    });
  }, [openLoginModal, addMsg]);

  const handleSubmitTicket = useCallback(async (subj: string, desc: string) => {
    if (!subj.trim() || !desc.trim()) return;
    setSubmitting(true);
    addMsg({ from: 'user', text: `Subject: ${subj}\n\n${desc}` });
    try {
      const res  = await fetch(`${API}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ subject: subj.trim(), description: desc.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        const tId = `BS-${data.ticket.id.slice(-8).toUpperCase()}`;
        setTicketId(tId);
        setChatState('ticket_success');
        addMsg({ from: 'bot', text: `✅ Ticket created successfully!\n\nTicket ID: ${tId}\n\nOur support team will get back to you within 24 hours. Thank you for reaching out!` });
      } else {
        setChatState('ticket_error');
        addMsg({ from: 'bot', text: `❌ Something went wrong: ${data.message || 'Please try again.'}` });
      }
    } catch {
      setChatState('ticket_error');
      addMsg({ from: 'bot', text: `❌ Could not connect to the server. Please check your connection and try again.` });
    } finally {
      setSubmitting(false);
      setSubject('');
      setDesc('');
    }
  }, [addMsg]);

  const handleSubmitOther = useCallback(async () => {
    if (!otherText.trim()) return;
    await handleSubmitTicket('General Query', otherText);
    setOther('');
  }, [otherText, handleSubmitTicket]);

  const HOME_OPTIONS = [
    { label: 'How BrokerSaab works', icon: '🔍' },
    { label: 'Subscription plans', icon: '💰' },
    { label: 'Advisor onboarding', icon: '📋' },
    { label: 'Raise a support ticket', icon: '🎫' },
    { label: 'Other question', icon: '💬' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[99990] flex flex-col items-end gap-3">

      {/* Chat window */}
      {isOpen && (
        <div
          className="w-[360px] sm:w-[400px] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-popIn"
          style={{
            height: '520px',
            background: 'linear-gradient(160deg, #071527 0%, #050e1b 100%)',
            border: '1px solid rgba(212,175,55,0.25)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ background: 'linear-gradient(90deg,#0B1F3A,#0d2240)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                <MessageCircle size={16} className="text-navy-800" style={{ color: '#071527' }} />
              </div>
              <div>
                <p className="text-white font-bold text-sm">BrokerSaab Support</p>
                <p className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Online · Typically replies in minutes
                </p>
              </div>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'bot' && (
                  <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-0.5 flex items-center justify-center text-[10px]"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527', fontWeight: 900 }}>
                    BS
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line max-w-[78%] ${
                    msg.from === 'user'
                      ? 'text-white rounded-tr-sm'
                      : 'text-white/90 rounded-tl-sm'
                  }`}
                  style={msg.from === 'user'
                    ? { background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527', fontWeight: 600 }
                    : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick reply buttons / forms */}
          <div className="px-4 pb-4 space-y-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

            {/* HOME — option buttons */}
            {chatState === 'home' && (
              <div className="pt-3 space-y-1.5">
                {HOME_OPTIONS.map(({ label, icon }) => (
                  <button
                    key={label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleOption(label)}
                    className="w-full flex items-center gap-2.5 text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all group"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <span className="text-base shrink-0">{icon}</span>
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={13} className="text-white/30 group-hover:text-white/60 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* FAQ states — back button */}
            {(chatState === 'faq_how' || chatState === 'faq_plans' || chatState === 'faq_onboarding') && (
              <div className="pt-3 flex gap-2">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={goHome}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <ArrowLeft size={13} /> Back to menu
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { handleOption('Raise a support ticket'); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
                  🎫 Raise a ticket
                </button>
              </div>
            )}

            {/* TICKET CHECK — not logged in */}
            {chatState === 'ticket_check' && !isLoggedIn && (
              <div className="pt-3 flex gap-2">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={goHome}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <ArrowLeft size={13} /> Back
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleSignIn}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
                  Sign In to Continue →
                </button>
              </div>
            )}

            {/* TICKET FORM */}
            {chatState === 'ticket_form' && (
              <div className="pt-3 space-y-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (e.g. Payment issue, Profile not approved…)"
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-xl text-xs outline-none text-white placeholder-white/30"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <textarea
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe your issue in detail…"
                  maxLength={2000}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-xs outline-none text-white placeholder-white/30 resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <div className="flex gap-2">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={goHome}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <ArrowLeft size={12} /> Back
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSubmitTicket(subject, description)}
                    disabled={submitting || !subject.trim() || !description.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}
                  >
                    {submitting ? <><Loader2 size={12} className="animate-spin" /> Submitting…</> : <><Send size={12} /> Submit Ticket</>}
                  </button>
                </div>
              </div>
            )}

            {/* OTHER QUESTION */}
            {chatState === 'ticket_other' && (
              <div className="pt-3 space-y-2">
                <textarea
                  value={otherText}
                  onChange={(e) => setOther(e.target.value)}
                  placeholder="Type your question or issue here…"
                  maxLength={2000}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-xs outline-none text-white placeholder-white/30 resize-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <div className="flex gap-2">
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={goHome}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <ArrowLeft size={12} /> Back
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (!isLoggedIn) {
                        openLoginModal(() => handleSubmitOther());
                      } else {
                        handleSubmitOther();
                      }
                    }}
                    disabled={submitting || !otherText.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}
                  >
                    {submitting ? <><Loader2 size={12} className="animate-spin" /> Sending…</> : <><Send size={12} /> Send</>}
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS / ERROR — back to menu */}
            {(chatState === 'ticket_success' || chatState === 'ticket_error') && (
              <div className="pt-3 flex gap-2">
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={goHome}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <ArrowLeft size={13} /> Back to menu
                </button>
                {chatState === 'ticket_error' && (
                  <button type="button" onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setChatState('ticket_form')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setIsOpen(prev => !prev)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
        style={{
          background: isOpen ? '#0B1F3A' : 'linear-gradient(135deg,#D4AF37,#B48C22)',
          border: '2px solid rgba(212,175,55,0.4)',
          boxShadow: '0 8px 32px rgba(212,175,55,0.35)',
        }}
        aria-label={isOpen ? 'Close chat' : 'Open BrokerSaab support chat'}
      >
        {isOpen
          ? <X size={22} className="text-white" />
          : <MessageCircle size={22} style={{ color: '#071527' }} />
        }
        {/* Ping animation when closed */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
        )}
        {/* Unread badge */}
        {!isOpen && hasUnread && (
          <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
            1
          </span>
        )}
      </button>
    </div>
  );
}
