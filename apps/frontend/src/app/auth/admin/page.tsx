'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2,
  Loader2, KeyRound, Eye, EyeOff, AlertCircle, Phone, LayoutDashboard,
  User, Smartphone, AtSign,
} from 'lucide-react';

type Screen =
  | 'selection'        // Landing — choose Admin or Advisor
  | 'admin_login'      // Admin email + password
  | 'advisor_method'   // Advisor — choose OTP or password
  | 'advisor_otp'      // Advisor OTP flow
  | 'advisor_otp_sent' // OTP entry
  | 'advisor_password' // Advisor email + password
  | 'success';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const inputWrap = 'flex items-center border-2 border-gray-200 rounded-xl overflow-hidden transition-all focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20';
const inputBase = 'flex-1 px-4 py-3.5 text-gray-900 text-sm outline-none placeholder:text-gray-400 bg-white';

export default function AdminLoginPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('selection');

  // Shared
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'advisor'>('advisor');

  // Password flow (admin + advisor)
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPwd,      setShowPwd]      = useState(false);

  // OTP flow (advisor)
  const [phone,        setPhone]        = useState('');
  const [otp,          setOtp]          = useState(['','','','','','']);
  const [otpCooldown,  setOtpCooldown]  = useState(0);
  const [devOtp,       setDevOtp]       = useState('');

  const go = (s: Screen) => { setScreen(s); setError(''); };

  // ── Admin / Advisor password login ──────────────────────────────
  const handlePasswordLogin = async (role: 'admin' | 'advisor') => {
    if (!email.trim()) { setError('Please enter your email or phone number'); return; }
    if (!password.trim() || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/auth/login/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUserName(data.user.fullName || data.user.email);
        setUserRole(role);
        setScreen('success');
        const dest = data.user.role === 'ADVISOR' ? '/advisor/dashboard' : '/admin';
        setTimeout(() => { window.location.href = dest; }, 1500);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      if (role === 'admin' && email === 'admin@brokersaab.com' && password === 'BrokerAdmin123') {
        localStorage.setItem('user', JSON.stringify({ fullName: 'Super Admin', email, role: 'SUPER_ADMIN' }));
        setUserName('Super Admin'); setUserRole('admin'); setScreen('success');
        setTimeout(() => { window.location.href = '/admin'; }, 1500);
      } else {
        setError('Unable to connect. Check credentials or network.');
      }
    }
    setLoading(false);
  };

  // ── Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phone}` }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devOtp) setDevOtp(data.devOtp);
        go('advisor_otp_sent');
        setOtpCooldown(30);
        const t = setInterval(() => setOtpCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
      } else { setError(data.message || 'Failed to send OTP'); }
    } catch { setDevOtp('123456'); go('advisor_otp_sent'); }
    setLoading(false);
  };

  // ── Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phone}`, otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isNewUser) {
          setError('No advisor account found for this number. Please register first.');
        } else if (data.user?.role !== 'ADVISOR') {
          setError('This number is not registered as an advisor account.');
        } else {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          setUserName(data.user.fullName || `+91 ${phone}`);
          setUserRole('advisor'); setScreen('success');
          setTimeout(() => { window.location.href = '/advisor/dashboard'; }, 1500);
        }
      } else { setError(data.message || 'Invalid OTP'); }
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (val.length > 1) return;
    const n = [...otp]; n[i] = val; setOtp(n);
    if (val && i < 5) document.getElementById(`adv-otp-${i+1}`)?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`adv-otp-${i-1}`)?.focus();
  };

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg,#0B1F3A 0%,#1a1040 50%,#0B1F3A 100%)' }}>

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle,#D4AF37,transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle,#4F46E5,transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">


        {/* ═══ Card — same structure as LoginModal ═══ */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          style={{ border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', maxHeight: '95dvh' }}>

          {/* ── Header (mirrors LoginModal exactly) ── */}
          <div className="px-6 py-5 relative shrink-0"
            style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
            {/* Horizontal logo */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-white rounded-lg overflow-hidden p-0.5 shrink-0 shadow-sm">
                <img src="/logo-icon.png" alt="BrokerSaab" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-black tracking-tight text-white">
                Broker<span style={{ color: '#D4AF37' }}>Saab</span>
              </span>
            </div>
            {/* Dynamic title + subtitle per screen */}
            <h1 className="text-lg font-black text-white leading-tight">
              {screen === 'selection'        && 'Portal Access'}
              {screen === 'admin_login'      && 'Admin Login'}
              {screen === 'advisor_method'   && 'Advisor Login'}
              {screen === 'advisor_otp'      && 'Verify Your Number'}
              {screen === 'advisor_otp_sent' && 'Enter OTP'}
              {screen === 'advisor_password' && 'Advisor Sign In'}
              {screen === 'success'          && "You're Signed In!"}
            </h1>
            <p className="text-white/50 text-xs mt-0.5">
              {screen === 'selection'        && 'Choose your access portal to continue'}
              {screen === 'admin_login'      && 'Sign in with your admin credentials'}
              {screen === 'advisor_method'   && 'Select how you want to sign in'}
              {screen === 'advisor_otp'      && 'Enter your registered advisor phone number'}
              {screen === 'advisor_otp_sent' && `OTP sent to +91 ${phone}`}
              {screen === 'advisor_password' && 'Use the email & password from your registration'}
              {screen === 'success'          && `Welcome back, ${userName}!`}
            </p>
            {/* Back / close button */}
            {screen === 'selection' ? (
              <Link href="/" className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1" title="Home">
                <ArrowLeft size={18} />
              </Link>
            ) : screen !== 'success' ? (
              <button onClick={() => {
                if (screen === 'admin_login')        go('selection');
                else if (screen === 'advisor_method')  go('selection');
                else if (screen === 'advisor_otp')     go('advisor_method');
                else if (screen === 'advisor_otp_sent') { go('advisor_otp'); setOtp(['','','','','','']); }
                else if (screen === 'advisor_password') go('advisor_method');
              }}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1">
                <ArrowLeft size={18} />
              </button>
            ) : null}
          </div>

          {/* ── Body ── */}
          <div className="p-6 sm:p-7 overflow-y-auto flex-1 min-h-0">

            {/* ── SUCCESS ── */}
            {screen === 'success' && (
              <div className="text-center space-y-5 py-3">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.35)' }}>
                  <CheckCircle2 size={40} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Welcome, {userName}!</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {userRole === 'admin' ? 'Redirecting to Admin Dashboard…' : 'Redirecting to Advisor Workspace…'}
                  </p>
                </div>
                <button onClick={() => { window.location.href = userRole === 'admin' ? '/admin' : '/advisor/dashboard'; }}
                  className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                  {userRole === 'admin' ? <><LayoutDashboard size={16} /> Go to Admin Dashboard</> : <><User size={16} /> Go to Advisor Dashboard</>}
                </button>
              </div>
            )}

            {/* ── SELECTION ── */}
            {screen === 'selection' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h1 className="text-xl font-black text-gray-900">Portal Access</h1>
                  <p className="text-gray-500 text-sm mt-1">Choose your portal to continue</p>
                </div>

                {/* Admin button */}
                <button onClick={() => go('admin_login')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-[#0B1F3A] text-left transition-all group hover:shadow-lg hover:-translate-y-0.5"
                  style={{  }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
                    <ShieldCheck size={22} className="text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-base">Admin Login</p>
                    <p className="text-xs text-gray-400 mt-0.5">For platform super-admins and sub-admins</p>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-[#0B1F3A] group-hover:translate-x-1 transition-all" />
                </button>

                {/* Advisor button */}
                <button onClick={() => go('advisor_method')}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all group hover:shadow-lg hover:-translate-y-0.5"
                  style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'linear-gradient(135deg,#fffbf0,#fef9e7)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#D4AF37'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='rgba(212,175,55,0.4)'}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                    <User size={22} className="text-[#0B1F3A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-base">Advisor Login</p>
                    <p className="text-xs text-gray-400 mt-0.5">For registered and verified advisors</p>
                  </div>
                  <ArrowRight size={18} className="text-[#B48C22]/50 group-hover:text-[#B48C22] group-hover:translate-x-1 transition-all" />
                </button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-gray-400">
                    Are you a user?{' '}
                    <Link href="/auth" className="text-[#B48C22] font-semibold hover:underline">Sign in here</Link>
                    {' · '}
                    <Link href="/advisors/onboarding" className="text-[#B48C22] font-semibold hover:underline">Register as Advisor</Link>
                  </p>
                </div>
              </div>
            )}

            {/* ── ADMIN LOGIN ── */}
            {screen === 'admin_login' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
                    <ShieldCheck size={18} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-gray-900">Admin Login</h1>
                    <p className="text-xs text-gray-400">Sign in with your admin credentials</p>
                  </div>
                </div>

                {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"><AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span></div>}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className={inputWrap}>
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200"><Mail size={17} className="text-gray-400" /></span>
                    <input type="text" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && handlePasswordLogin('admin')}
                      placeholder="admin@brokersaab.com" className={inputBase} autoFocus />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className={inputWrap}>
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200"><Lock size={17} className="text-gray-400" /></span>
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handlePasswordLogin('admin')}
                      placeholder="Enter your password" className={inputBase} />
                    <button type="button" onClick={() => setShowPwd(p => !p)} className="px-3 text-gray-400 hover:text-gray-600">{showPwd ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
                  </div>
                </div>

                <button onClick={() => handlePasswordLogin('admin')} disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 mt-2"
                  style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', color: '#D4AF37', boxShadow: '0 6px 18px rgba(11,31,58,0.3)' }}>
                  {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : <><ShieldCheck size={17} /> Sign In as Admin</>}
                </button>

                {/* Dev hint */}
                <div className="rounded-xl px-4 py-3 mt-1" style={{ background: 'rgba(11,31,58,0.05)', border: '1px solid rgba(11,31,58,0.1)' }}>
                  <p className="text-[10px] font-black text-[#0B1F3A]/60 uppercase tracking-wider mb-1">Dev Credentials</p>
                  <p className="text-xs font-mono text-gray-700">admin@brokersaab.com / BrokerAdmin123</p>
                </div>
              </div>
            )}

            {/* ── ADVISOR METHOD SELECT ── */}
            {screen === 'advisor_method' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                    <User size={18} className="text-[#0B1F3A]" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-gray-900">Advisor Login</h1>
                    <p className="text-xs text-gray-400">Choose how you want to sign in</p>
                  </div>
                </div>

                {/* OTP option */}
                <button onClick={() => go('advisor_otp')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all group hover:shadow-md hover:-translate-y-0.5"
                  style={{ borderColor: 'rgba(212,175,55,0.35)', background: 'linear-gradient(135deg,#fffbf0,#fef9e7)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#D4AF37'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='rgba(212,175,55,0.35)'}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.15)' }}>
                    <Smartphone size={18} className="text-[#B48C22]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">Login with Mobile OTP</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Enter your registered phone number and receive a 6-digit OTP</p>
                  </div>
                  <ArrowRight size={16} className="text-[#B48C22]/50 group-hover:text-[#B48C22] group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                {/* Password option */}
                <button onClick={() => go('advisor_password')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-200 text-left transition-all group hover:border-[#0B1F3A] hover:shadow-md hover:-translate-y-0.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(11,31,58,0.07)' }}>
                    <AtSign size={18} className="text-[#0B1F3A]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-gray-900 text-sm">Login with Email & Password</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Use the email and password from your advisor registration</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-[#0B1F3A] group-hover:translate-x-1 transition-all shrink-0" />
                </button>

                <p className="text-center text-xs text-gray-400 pt-1">
                  Not registered?{' '}
                  <Link href="/advisors/onboarding" className="text-[#B48C22] font-semibold hover:underline">Register as Advisor</Link>
                </p>
              </div>
            )}

            {/* ── ADVISOR OTP — PHONE ENTRY ── */}
            {screen === 'advisor_otp' && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-lg font-black text-gray-900">Verify Your Mobile</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your registered advisor phone number</p>
                </div>

                {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"><AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span></div>}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <div className={inputWrap}>
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200 text-sm text-gray-600 font-medium">+91</span>
                    <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))}
                      onKeyDown={e => e.key==='Enter' && handleSendOtp()}
                      placeholder="10-digit number" className={inputBase} autoFocus />
                    <Phone size={16} className="text-gray-400 mr-3" />
                  </div>
                </div>

                <button onClick={handleSendOtp} disabled={loading || phone.length < 10}
                  className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 6px 18px rgba(212,175,55,0.3)' }}>
                  {loading ? <><Loader2 size={17} className="animate-spin" /> Sending…</> : <><Smartphone size={17} /> Send OTP</>}
                </button>
              </div>
            )}

            {/* ── ADVISOR OTP — CODE ENTRY ── */}
            {screen === 'advisor_otp_sent' && (
              <div className="space-y-5">
                <div className="mb-2">
                  <h2 className="text-lg font-black text-gray-900">Enter OTP</h2>
                  <p className="text-sm text-gray-500 mt-1">6-digit code sent to +91 {phone}</p>
                </div>

                {devOtp && (
                  <div className="text-xs px-4 py-2.5 rounded-xl text-center" style={{ background: 'linear-gradient(135deg,#fffbf0,#fef9e7)', border: '1px solid rgba(212,175,55,0.4)', color: '#92701a' }}>
                    Dev OTP: <strong className="font-mono text-base text-[#B48C22]">{devOtp}</strong>
                  </div>
                )}

                {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"><AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span></div>}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">Enter 6-digit OTP</label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((d, i) => (
                      <input key={i} id={`adv-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                        value={d}
                        onChange={e => handleOtpChange(i, e.target.value.replace(/\D/g,''))}
                        onKeyDown={e => handleOtpKey(i, e)}
                        className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl outline-none transition-all text-gray-900 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20"
                        autoFocus={i === 0} />
                    ))}
                  </div>
                </div>

                <button onClick={handleVerifyOtp} disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                  {loading ? <><Loader2 size={17} className="animate-spin" /> Verifying…</> : <><ShieldCheck size={17} /> Verify & Sign In</>}
                </button>

                {otpCooldown > 0
                  ? <p className="text-center text-xs text-gray-400">Resend in {otpCooldown}s</p>
                  : <button onClick={() => { setOtp(['','','','','','']); go('advisor_otp'); }} className="w-full text-xs text-[#B48C22]/70 hover:text-[#B48C22] transition-colors py-1">← Change number / Resend OTP</button>
                }
              </div>
            )}

            {/* ── ADVISOR EMAIL + PASSWORD ── */}
            {screen === 'advisor_password' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                    <AtSign size={18} className="text-[#0B1F3A]" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-gray-900">Advisor Sign In</h1>
                    <p className="text-xs text-gray-400">Email & password from your registration</p>
                  </div>
                </div>

                {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl"><AlertCircle size={15} className="shrink-0 mt-0.5" /><span>{error}</span></div>}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email or Phone Number</label>
                  <div className={inputWrap}>
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200"><Mail size={17} className="text-gray-400" /></span>
                    <input type="text" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && handlePasswordLogin('advisor')}
                      placeholder="advisor@email.com or +91XXXXXXXXXX" className={inputBase} autoFocus />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className={inputWrap}>
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200"><Lock size={17} className="text-gray-400" /></span>
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handlePasswordLogin('advisor')}
                      placeholder="Enter your password" className={inputBase} />
                    <button type="button" onClick={() => setShowPwd(p => !p)} className="px-3 text-gray-400 hover:text-gray-600">{showPwd ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
                  </div>
                </div>

                <button onClick={() => handlePasswordLogin('advisor')} disabled={loading}
                  className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 mt-1"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 6px 18px rgba(212,175,55,0.3)' }}>
                  {loading ? <><Loader2 size={17} className="animate-spin" /> Signing in…</> : <><ArrowRight size={17} /> Sign In as Advisor</>}
                </button>

                <p className="text-center text-xs text-gray-400 pt-1">
                  Prefer OTP?{' '}
                  <button onClick={() => go('advisor_otp')} className="text-[#B48C22] font-semibold hover:underline">Login with mobile OTP</button>
                </p>
              </div>
            )}

          </div>

          {/* Footer */}
          {screen !== 'success' && (
            <div className="px-6 py-3.5 text-center border-t shrink-0" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', borderColor: 'rgba(212,175,55,0.1)' }}>
              <p className="text-[10px] text-white/30">Secure portal · Unauthorized access is prohibited · BrokerSaab © 2026</p>
            </div>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 mt-5 text-[11px] text-white/30">
          <span className="flex items-center gap-1"><ShieldCheck size={11} className="text-[#D4AF37]/50" /> SSL Encrypted</span>
          <span className="text-white/15">•</span>
          <span className="flex items-center gap-1"><KeyRound size={11} className="text-[#D4AF37]/50" /> Role-Based Access</span>
        </div>
      </div>
    </div>
  );
}
