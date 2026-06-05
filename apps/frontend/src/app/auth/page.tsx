'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, ArrowRight, ShieldCheck, KeyRound, User, Mail, CheckCircle2, Loader2, LayoutDashboard, BookOpen, Scale, AlertOctagon, FileText, Gavel } from 'lucide-react';

type AuthStep = 'terms' | 'phone' | 'otp' | 'register' | 'success';

const USER_TC_CLAUSES = [
  { color: '#ef4444', icon: AlertOctagon, title: 'No Liability for Fraud or Misconduct', body: 'BrokerSaab is a third-party technology marketplace. We are NOT responsible or liable for any fraudulent activity, misrepresentation, negligence, professional misconduct, or financial harm caused by any advisor, agent, or dealer listed on this platform. Users engage professionals entirely at their own risk.' },
  { color: '#f59e0b', icon: Gavel, title: 'Disputes — Indian Judiciary', body: 'All disputes, claims, or proceedings arising from use of BrokerSaab shall be subject exclusively to the jurisdiction of the competent courts of India. BrokerSaab is not a party to disputes between users and advisors.' },
  { color: '#10b981', icon: ShieldCheck, title: 'Escrow Payment Protection', body: 'Payments are held in escrow until consultation completion. BrokerSaab does NOT guarantee the quality, accuracy, or outcome of any professional advice or service.' },
  { color: '#3b82f6', icon: FileText, title: 'User Responsibilities', body: "You are responsible for independently verifying any professional's credentials before acting on their advice. BrokerSaab's internal verification is not a government certification." },
  { color: '#8b5cf6', icon: Scale, title: 'Platform Role', body: 'BrokerSaab is a neutral intermediary only. No fiduciary duty or professional liability is created with BrokerSaab by using this platform.' },
];

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>('terms');
  const [tcAccepted, setTcAccepted] = useState(false);
  const [tcScrolled, setTcScrolled] = useState(false);
  const tcScrollRef = useRef<HTMLDivElement>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState<string>('CLIENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handleTcScroll = () => {
    const el = tcScrollRef.current;
    if (el && !tcScrolled && el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setTcScrolled(true);
  };

  const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  // ── Step 1: Send OTP ──
  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` })
      });
      const data = await res.json();
      if (data.success) {
        setDevOtp(data.devOtp || '');
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch {
      // Fallback for demo mode (no backend running)
      setDevOtp('123456');
      setStep('otp');
    }
    setLoading(false);
  };

  // ── Step 2: Verify OTP ──
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp: otpString })
      });
      const data = await res.json();
      if (data.success) {
        if (data.isNewUser) {
          localStorage.setItem('tempToken', data.tempToken);
          setStep('register');
        } else {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          const role = data.user?.role ?? 'CLIENT';
          setUserRole(role);
          setStep('success');
          // Auto-redirect advisors to their dashboard after 2s
          if (role === 'ADVISOR') {
            setTimeout(() => router.push('/advisor/dashboard'), 2000);
          }
        }
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch {
      // Demo mode — simulate new user
      setStep('register');
    }
    setLoading(false);
  };

  // ── Step 3: Complete Registration ──
  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const tempToken = localStorage.getItem('tempToken') || 'demo-token';
      const res = await fetch(`${API}/auth/register/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, fullName, email: email || undefined })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setStep('success');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      // Demo mode
      localStorage.setItem('user', JSON.stringify({ fullName, phoneNumber, role: 'CLIENT' }));
      setStep('success');
    }
    setLoading(false);
  };

  // ── OTP Input Handler ──
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      if (prev) prev.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="bg-white rounded-2xl px-6 py-3 border border-gray-200 shadow-lg inline-block hover:scale-105 transition-transform">
              <img src="/logo-icon.png" alt="BrokerSaab" className="h-16 w-auto object-contain" />
            </div>
          </Link>
          <p className="text-gray-500 text-sm mt-3">Trusted Advisory Platform</p>
        </div>

        {/* ═══════════════════════════════════════
            Card Container
            ═══════════════════════════════════════ */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className={`px-6 py-5 text-center relative ${step === 'terms' ? 'bg-gradient-to-r from-[#0a0505] to-[#0d0818]' : 'bg-gradient-to-r from-navy-800 to-navy-700'}`}>
            {step === 'terms' && (
              <div className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: 'linear-gradient(90deg, #ef4444, #f59e0b, #8b5cf6)' }} />
            )}
            <h1 className="text-xl font-bold text-white">
              {step === 'terms' && 'Terms & Conditions'}
              {step === 'phone' && 'Sign In / Register'}
              {step === 'otp' && 'Verify OTP'}
              {step === 'register' && 'Complete Your Profile'}
              {step === 'success' && 'Welcome to BrokerSaab!'}
            </h1>
            <p className="text-blue-200/70 text-xs mt-1">
              {step === 'terms' && 'Read and accept before continuing'}
              {step === 'phone' && 'Enter your mobile number to get started'}
              {step === 'otp' && `We sent a 6-digit code to +91 ${phoneNumber}`}
              {step === 'register' && 'Tell us a bit about yourself'}
              {step === 'success' && 'You are now signed in'}
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8">

            {/* ── STEP: Terms & Conditions ── */}
            {step === 'terms' && (
              <div className="space-y-0 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8">
                {/* Scrollable content */}
                <div ref={tcScrollRef} onScroll={handleTcScroll}
                  className="overflow-y-auto px-6 sm:px-8 pt-6 pb-4 space-y-3"
                  style={{ maxHeight: '280px', background: '#f8f7f0' }}>
                  <p className="text-[11px] text-gray-500 leading-relaxed bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <strong className="text-amber-700">Important:</strong> By using BrokerSaab, you acknowledge that you have read, understood, and agree to all the terms below.
                  </p>
                  {USER_TC_CLAUSES.map((clause, i) => (
                    <div key={i} className="rounded-xl border overflow-hidden"
                      style={{ borderColor: `${clause.color}30`, background: `${clause.color}06` }}>
                      <div className="flex items-center gap-2.5 px-4 py-2 border-b"
                        style={{ borderColor: `${clause.color}20`, background: `${clause.color}0c` }}>
                        <clause.icon size={13} style={{ color: clause.color }} className="shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: clause.color }}>{clause.title}</span>
                      </div>
                      <p className="px-4 py-2.5 text-[11px] text-gray-600 leading-relaxed">{clause.body}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-[11px] text-red-700 leading-relaxed font-medium">
                      <strong>Governing Law:</strong> These terms are governed by the laws of India. All disputes shall be subject exclusively to Indian courts. BrokerSaab shall not be a party to any dispute between users and advisors.
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center pb-2">Effective Date: June 2026</p>
                </div>
                {/* Accept section */}
                <div className="px-6 sm:px-8 py-4 border-t border-gray-200 bg-white space-y-3">
                  {!tcScrolled && (
                    <p className="text-[10px] text-amber-600 text-center">↓ Scroll to read all terms</p>
                  )}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{ borderColor: tcAccepted ? '#10b981' : '#d1d5db', background: tcAccepted ? '#10b981' : 'white' }}
                      onClick={() => setTcAccepted(p => !p)}>
                      {tcAccepted && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className="text-xs text-gray-600 leading-relaxed select-none">
                      I agree to the Terms & Conditions, including that BrokerSaab is <strong>not liable for fraud or misconduct</strong> by advisors, and all disputes are subject to <strong>Indian courts</strong>.
                    </span>
                  </label>
                  <button disabled={!tcAccepted} onClick={() => tcAccepted && setStep('phone')}
                    className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ background: tcAccepted ? 'linear-gradient(135deg, #D4AF37, #B48C22)' : '#e5e7eb', color: tcAccepted ? '#0B1F3A' : '#9ca3af', cursor: tcAccepted ? 'pointer' : 'not-allowed' }}>
                    I Accept — Continue <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {error && step !== 'terms' && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── STEP: Phone Number ── */}
            {step === 'phone' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <span className="bg-gray-50 px-4 py-3.5 text-gray-500 font-medium border-r border-gray-200 text-sm">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit number"
                      className="flex-1 px-4 py-3.5 text-gray-900 text-base outline-none placeholder:text-gray-400"
                      autoFocus
                    />
                    <Phone size={18} className="text-gray-400 mr-4" />
                  </div>
                </div>

                <button
                  onClick={handleSendOtp}
                  disabled={loading || phoneNumber.length < 10}
                  className="w-full bg-gold-500 text-navy-800 font-bold py-3.5 rounded-xl text-sm hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or</span></div>
                </div>

                <Link
                  href="/auth/admin"
                  className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <KeyRound size={16} />
                  Admin / Advisor Login
                </Link>
              </div>
            )}

            {/* ── STEP: OTP Verification ── */}
            {step === 'otp' && (
              <div className="space-y-5">
                {devOtp && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-4 py-2.5 rounded-xl text-center">
                    <strong>Dev Mode:</strong> Your OTP is <span className="font-mono font-bold text-lg">{devOtp}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">Enter 6-digit OTP</label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-900"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-gold-500 text-navy-800 font-bold py-3.5 rounded-xl text-sm hover:bg-gold-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
                  className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors py-2"
                >
                  ← Change phone number
                </button>
              </div>
            )}

            {/* ── STEP: Registration ── */}
            {step === 'register' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200"><User size={18} className="text-gray-400" /></span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="flex-1 px-4 py-3.5 text-gray-900 text-sm outline-none placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Optional)</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200"><Mail size={18} className="text-gray-400" /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-4 py-3.5 text-gray-900 text-sm outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={loading || !fullName.trim()}
                  className="w-full bg-gold-500 text-navy-800 font-bold py-3.5 rounded-xl text-sm hover:bg-gold-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            )}

            {/* ── STEP: Success — role-aware ── */}
            {step === 'success' && (
              <div className="text-center space-y-5 py-4">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                  userRole === 'ADVISOR' ? 'bg-blue-50' : 'bg-emerald-50'
                }`}>
                  {userRole === 'ADVISOR'
                    ? <LayoutDashboard size={40} className="text-blue-500" />
                    : <CheckCircle2 size={40} className="text-emerald-500" />
                  }
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">You&apos;re signed in!</h3>
                  {userRole === 'ADVISOR' ? (
                    <p className="text-sm text-blue-600 mt-1 font-medium">
                      Welcome back, Advisor. Redirecting to your dashboard…
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      Welcome to BrokerSaab. Start exploring our services.
                    </p>
                  )}
                </div>

                {userRole === 'ADVISOR' ? (
                  <Link
                    href="/advisor/dashboard"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-blue-500 shadow-lg transition-all"
                  >
                    <LayoutDashboard size={16} /> Go to My Dashboard
                  </Link>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 bg-gold-500 text-navy-800 font-bold px-6 py-3 rounded-xl text-sm hover:bg-gold-400 shadow-lg transition-all"
                    >
                      <BookOpen size={16} /> Explore Services
                    </Link>
                    <Link
                      href="/bookings"
                      className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-gray-50 transition-all"
                    >
                      My Consultations
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== 'success' && step !== 'terms' && (
            <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
              <p className="text-[11px] text-gray-400">
                You accepted our{' '}
                <button onClick={() => setStep('terms')} className="text-blue-500 hover:underline">Terms & Conditions</button>
                {' '}· BrokerSaab is not liable for advisor fraud
              </p>
            </div>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-gray-400">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>256-bit encrypted</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={12} className="text-blue-400" />
            <span>Escrow protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
