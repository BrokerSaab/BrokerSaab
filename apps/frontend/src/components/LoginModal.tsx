'use client';

import React, { useCallback, useEffect, useRef, useState, KeyboardEvent } from 'react';
import {
  X, Phone, ShieldCheck, CheckCircle2, Loader2, AlertCircle, User, Mail,
  ArrowRight, Scale, AlertOctagon, FileText, Gavel, Lock, Eye, EyeOff, ChevronLeft
} from 'lucide-react';
import { AuthUser } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

type ModalStep = 'phone' | 'otp' | 'register' | 'set_password' | 'success';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

const TC_CLAUSES = [
  { color: '#ef4444', title: 'No Liability for Fraud or Misconduct', body: 'BrokerSaab is a third-party technology marketplace. We are NOT responsible or liable for any fraudulent activity, misrepresentation, negligence, professional misconduct, or financial harm caused by any advisor, agent, or dealer on this platform. Users engage professionals entirely at their own risk.' },
  { color: '#f59e0b', title: 'Disputes — Indian Judiciary', body: 'All disputes, claims, or legal proceedings arising from use of BrokerSaab or from any transaction between a user and an advisor shall be subject exclusively to the jurisdiction of the competent courts of India.' },
  { color: '#10b981', title: 'Escrow Payment Protection', body: 'Payments are held in escrow and released to advisors only upon consultation completion. While escrow protects your funds, BrokerSaab does NOT guarantee the quality, accuracy, or outcome of any professional advice or service rendered.' },
  { color: '#3b82f6', title: 'User Responsibilities', body: "You are responsible for independently verifying the credentials, qualifications, and suitability of any professional before acting on their advice. BrokerSaab's internal verification is not a government certification." },
  { color: '#8b5cf6', title: 'Platform Role', body: 'BrokerSaab acts as a neutral intermediary only. No advisor-client relationship, fiduciary duty, or professional liability is created with BrokerSaab. The platform may suspend accounts that violate conduct policies without prior notice.' },
];

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { t } = useLanguage();
  const [step, setStep]                 = useState<ModalStep>('phone');
  const [tcAccepted, setTcAccepted]     = useState(false);
  const [showTcDetail, setShowTcDetail] = useState(false);
  const [phoneNumber, setPhoneNumber]   = useState('');
  const [otp, setOtp]                   = useState(['', '', '', '', '', '']);
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [devOtp, setDevOtp]             = useState('');

  const [loginMethod, setLoginMethod]   = useState<'otp' | 'password'>('otp');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [pwdRetryCount, setPwdRetryCount] = useState(0);

  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [pendingUser, setPendingUser]   = useState<AuthUser | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setTcAccepted(false);
      setShowTcDetail(false);
      setPhoneNumber('');
      setOtp(['', '', '', '', '', '']);
      setFullName('');
      setEmail('');
      setLoading(false);
      setError('');
      setDevOtp('');
      setLoginMethod('otp');
      setLoginPassword('');
      setShowLoginPwd(false);
      setPwdRetryCount(0);
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPwd(false);
      setShowConfirmPwd(false);
      setPendingUser(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => onClose(), 1500);
      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  useEffect(() => {
    if (step === 'phone') setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [step]);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phoneNumber)) { setError('Enter a valid 10-digit phone number.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/otp/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}` }),
      });
      const data = await res.json();
      if (data.success) { setDevOtp(data.devOtp || ''); setStep('otp'); }
      else setError(data.message || 'Failed to send OTP. Please try again.');
    } catch { setDevOtp('123456'); setStep('otp'); }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) { setError('Please enter the complete 6-digit OTP.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/otp/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, otp: otpString }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isNewUser) { sessionStorage.setItem('tempToken', data.tempToken); setStep('register'); }
        else {
          sessionStorage.setItem('accessToken', data.tokens.accessToken);
          sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
          onLoginSuccess(data.user); setStep('success');
        }
      } else setError(data.message || 'Invalid OTP. Please try again.');
    } catch { setStep('register'); }
    setLoading(false);
  };

  const handlePhonePasswordLogin = async () => {
    if (!/^\d{10}$/.test(phoneNumber)) { setError('Enter a valid 10-digit phone number.'); return; }
    if (!loginPassword) { setError('Please enter your password.'); return; }
    setLoading(true); setError('');
    let res: Response | null = null;
    try {
      res = await fetch(`${API}/auth/login/phone-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+91${phoneNumber}`, password: loginPassword }),
      });
    } catch {
      setPwdRetryCount(c => c + 1);
      setError(pwdRetryCount === 0
        ? 'Server may be starting up. Please wait a moment and try again.'
        : 'Cannot reach the server. Please check your connection and try again.');
      setLoading(false);
      return;
    }
    let data: any = {};
    try { data = await res.json(); } catch { }
    if (data.success) {
      setPwdRetryCount(0);
      sessionStorage.setItem('accessToken', data.tokens.accessToken);
      sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
      onLoginSuccess(data.user); setStep('success');
    } else {
      setError(data.message || (res.ok ? 'Login failed. Please try again.' : `Server error (${res.status}). Please try again.`));
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!fullName.trim()) { setError('Full name is required to create your account.'); return; }
    setLoading(true); setError('');
    try {
      const tempToken = sessionStorage.getItem('tempToken') || 'demo-token';
      const res = await fetch(`${API}/auth/register/complete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, fullName: fullName.trim(), email: email || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('accessToken', data.tokens.accessToken);
        sessionStorage.setItem('refreshToken', data.tokens.refreshToken);
        setPendingUser(data.user);
        setStep('set_password');
      } else setError(data.message || 'Registration failed. Please try again.');
    } catch {
      const demoUser: AuthUser = { fullName: fullName.trim(), phoneNumber: `+91${phoneNumber}`, role: 'CLIENT' };
      setPendingUser(demoUser);
      setStep('set_password');
    }
    setLoading(false);
  };

  const handleSetPassword = async () => {
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const token = sessionStorage.getItem('accessToken') || '';
      const res = await fetch(`${API}/auth/password/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Failed to set password.'); setLoading(false); return; }
    } catch { }
    if (pendingUser) onLoginSuccess(pendingUser);
    setStep('success');
    setLoading(false);
  };

  const otpRef = useRef(otp);
  otpRef.current = otp;

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    setOtp(prev => { const next = [...prev]; next[index] = value; return next; });
    if (value && index < 5) document.getElementById(`modal-otp-${index + 1}`)?.focus();
  }, []);

  const handleOtpKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpRef.current[index] && index > 0)
      document.getElementById(`modal-otp-${index - 1}`)?.focus();
    if (e.key === 'Enter') handleVerifyOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const inputWrap = 'flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/20 transition-all bg-white';
  const inputBase = 'flex-1 px-3 py-3.5 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400';

  const stepTitles: Record<ModalStep, string> = {
    phone:        t('auth.phone.title'),
    otp:          t('auth.otp.title'),
    register:     t('auth.register.title'),
    set_password: t('auth.password.title'),
    success:      t('auth.success.title'),
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '95dvh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <div className={`px-6 py-5 relative shrink-0 bg-gradient-to-r from-navy-800 to-navy-700 ${step === 'set_password' ? '' : ''}`}>
          {step === 'set_password' && (
            <div className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #3b82f6)' }} />
          )}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-white rounded-lg overflow-hidden p-0.5 shrink-0">
              <img src="/logo-icon.png" alt="BrokerSaab" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-black tracking-tight text-white">
              Broker<span style={{ color: '#D4AF37' }}>Saab</span>
            </span>
          </div>
          <h2 className="text-lg font-black text-white">{stepTitles[step]}</h2>
          <p className="text-white/50 text-xs mt-0.5">
            {step === 'otp'          ? `OTP sent to +91 ${phoneNumber}` :
             step === 'phone'        ? t('auth.phone.sub') :
             step === 'register'     ? t('auth.register.sub') :
             step === 'set_password' ? t('auth.password.sub') :
             t('nav.trustedPlatform')}
          </p>
          {step !== 'success' && (
            <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1" aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-6 sm:p-7 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ── PHONE STEP ── */}
          {step === 'phone' && (
            <div className="space-y-4">
              {/* Login method toggle */}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                {(['otp', 'password'] as const).map(method => (
                  <button key={method}
                    onClick={() => { setLoginMethod(method); setLoginPassword(''); setError(''); }}
                    className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                      loginMethod === method
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    {method === 'otp' ? t('auth.otpLogin') : t('auth.pwdLogin')}
                  </button>
                ))}
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.phone.label')}</label>
                <div className={inputWrap}>
                  <span className="px-3 py-3.5 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 font-medium">+91</span>
                  <input ref={firstInputRef} type="tel" maxLength={10} placeholder={t('auth.phone.placeholder')}
                    value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && tcAccepted && (loginMethod === 'otp' ? handleSendOtp() : handlePhonePasswordLogin())}
                    className={inputBase} />
                </div>
              </div>

              {/* Password field */}
              {loginMethod === 'password' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.password')}</label>
                  <div className={inputWrap}>
                    <Lock size={15} className="ml-3 text-slate-400 shrink-0" />
                    <input
                      type={showLoginPwd ? 'text' : 'password'}
                      placeholder={t('auth.password.yourPwd')}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && tcAccepted && handlePhonePasswordLogin()}
                      className={inputBase}
                    />
                    <button type="button" onClick={() => setShowLoginPwd(p => !p)}
                      className="mr-3 text-slate-400 hover:text-slate-600 transition-colors">
                      {showLoginPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* T&C checkbox */}
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  aria-label="Accept terms"
                  onClick={() => setTcAccepted(p => !p)}
                  className="mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{ borderColor: tcAccepted ? '#10b981' : '#d1d5db', background: tcAccepted ? '#10b981' : 'white' }}
                >
                  {tcAccepted && <CheckCircle2 size={10} className="text-white" />}
                </button>
                <span className="text-xs text-gray-500 leading-relaxed select-none">
                  I agree to the{' '}
                  <button type="button"
                    className="text-indigo-600 font-semibold underline underline-offset-2 hover:text-indigo-800 transition-colors"
                    onClick={() => setShowTcDetail(true)}
                  >Terms & Conditions</button>
                  {' '}&{' '}
                  <button type="button"
                    className="text-indigo-600 font-semibold underline underline-offset-2 hover:text-indigo-800 transition-colors"
                    onClick={() => setShowTcDetail(true)}
                  >Privacy Policy</button>
                </span>
              </div>

              {/* CTA */}
              <button
                onClick={loginMethod === 'otp' ? handleSendOtp : handlePhonePasswordLogin}
                disabled={loading || !tcAccepted}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  loginMethod === 'otp' ? 'btn-gold' : 'text-white'
                }`}
                style={{
                  ...(loginMethod === 'password' ? { background: 'linear-gradient(135deg, #4f46e5, #3730a3)' } : {}),
                  opacity: (!tcAccepted || loading) ? 0.45 : 1,
                  cursor: (!tcAccepted || loading) ? 'not-allowed' : 'pointer',
                }}>
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> {loginMethod === 'otp' ? t('auth.phone.sending') : t('auth.loggingIn')}</>
                  : loginMethod === 'otp'
                    ? <>{t('auth.getOtp')} <ArrowRight size={15} /></>
                    : <>{t('auth.login')} <ArrowRight size={15} /></>
                }
              </button>
            </div>
          )}

          {/* ── OTP STEP ── */}
          {step === 'otp' && (
            <div className="space-y-5">
              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 font-medium flex items-center gap-2">
                  <span>🔑</span> Demo OTP: <strong className="text-lg tracking-widest">{devOtp}</strong>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-3">{t('auth.otp.label')}</label>
                <div className="flex gap-1.5 sm:gap-2 justify-between">
                  {otp.map((digit, i) => (
                    <input key={i} id={`modal-otp-${i}`} type="tel" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="flex-1 min-w-0 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-navy-800" />
                  ))}
                </div>
              </div>
              <button onClick={handleVerifyOtp} disabled={loading}
                className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><Loader2 size={16} className="animate-spin" /> {t('auth.otp.verifying')}</> : <>{t('auth.otp.verify')} <ArrowRight size={15} /></>}
              </button>
              <button onClick={() => { setStep('phone'); setError(''); setOtp(['','','','','','']); }}
                className="w-full text-xs text-center text-gray-400 hover:text-gray-600 transition-colors">
                {t('auth.otp.changePhone')}
              </button>
            </div>
          )}

          {/* ── REGISTER STEP ── */}
          {step === 'register' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.register.nameLabel')} <span className="text-red-500">*</span></label>
                <div className={inputWrap}>
                  <User size={15} className="ml-3 text-slate-400 shrink-0" />
                  <input ref={firstInputRef} type="text" placeholder={t('auth.register.namePlaceholder')} value={fullName}
                    onChange={e => setFullName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    className={inputBase} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.register.emailLabel')} <span className="text-gray-400 font-normal">{t('auth.register.emailOptional')}</span></label>
                <div className={inputWrap}>
                  <Mail size={15} className="ml-3 text-slate-400 shrink-0" />
                  <input type="email" placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    className={inputBase} />
                </div>
              </div>
              <button onClick={handleRegister} disabled={loading}
                className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <><Loader2 size={16} className="animate-spin" /> {t('auth.register.creating')}</> : <>{t('auth.register.createBtn')} <ArrowRight size={15} /></>}
              </button>
            </div>
          )}

          {/* ── SET PASSWORD STEP ── */}
          {step === 'set_password' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <ShieldCheck size={15} className="text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-xs text-indigo-700 leading-relaxed">{t('auth.password.info')}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  {t('auth.password.newLabel')} <span className="text-red-500">*</span>
                </label>
                <div className={inputWrap}>
                  <Lock size={15} className="ml-3 text-slate-400 shrink-0" />
                  <input type={showNewPwd ? 'text' : 'password'} placeholder={t('auth.password.placeholder')}
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('confirm-pwd')?.focus()}
                    className={inputBase} />
                  <button type="button" onClick={() => setShowNewPwd(p => !p)}
                    className="mr-3 text-slate-400 hover:text-slate-600 transition-colors">
                    {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('auth.password.confirmLabel')}</label>
                <div className={inputWrap}>
                  <Lock size={15} className="ml-3 text-slate-400 shrink-0" />
                  <input id="confirm-pwd" type={showConfirmPwd ? 'text' : 'password'}
                    placeholder={t('auth.password.repeatPlaceholder')}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                    className={inputBase} />
                  <button type="button" onClick={() => setShowConfirmPwd(p => !p)}
                    className="mr-3 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{t('auth.passwordsNoMatch')}</p>
                )}
              </div>
              <button onClick={handleSetPassword}
                disabled={loading || (!!confirmPassword && newPassword !== confirmPassword)}
                className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 text-white"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> {t('auth.password.setting')}</> : <>{t('auth.password.setBtn')} <ArrowRight size={15} /></>}
              </button>
              <button onClick={() => { if (pendingUser) onLoginSuccess(pendingUser); setStep('success'); }}
                className="w-full text-xs text-center text-gray-400 hover:text-indigo-600 transition-colors py-1">
                {t('auth.password.skip')}
              </button>
            </div>
          )}

          {/* ── SUCCESS STEP ── */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <p className="text-gray-800 font-semibold text-base mb-1">{fullName ? `${t('auth.success.signedIn').replace('!', `, ${fullName.split(' ')[0]}!`)}` : t('auth.success.signedIn')}</p>
              <p className="text-gray-500 text-sm">{t('auth.success.welcomeText')}</p>
            </div>
          )}
        </div>

        {/* ── Footer: Admin Login ── */}
        {step !== 'success' && step !== 'set_password' && (
          <div className="px-6 pb-5 shrink-0 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or</span></div>
            </div>
            <a href="/auth/admin"
              className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:border-gray-300 hover:bg-gray-50 transition-all">
              <span>🔑</span> {t('auth.adminLogin')}
            </a>
          </div>
        )}

        <div className="sm:hidden flex justify-center pb-3 shrink-0">
          <div className="w-12 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* ── T&C Detail Panel (slide-over inside modal) ── */}
        {showTcDetail && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <button onClick={() => setShowTcDetail(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1">
                <ChevronLeft size={20} />
              </button>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Terms & Conditions</h3>
                <p className="text-[11px] text-gray-400">BrokerSaab Platform · Effective June 2026</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {TC_CLAUSES.map((clause, i) => (
                <div key={i} className="rounded-xl border overflow-hidden"
                  style={{ borderColor: `${clause.color}25`, background: `${clause.color}05` }}>
                  <div className="px-4 py-2 border-b flex items-center gap-2"
                    style={{ borderColor: `${clause.color}15`, background: `${clause.color}08` }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: clause.color }} />
                    <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: clause.color }}>
                      {clause.title}
                    </span>
                  </div>
                  <p className="px-4 py-3 text-[12px] text-gray-600 leading-relaxed">{clause.body}</p>
                </div>
              ))}
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">Governing Law:</strong> These terms are governed by the laws of the Republic of India. All disputes are subject exclusively to the jurisdiction of Indian courts.
                </p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => { setTcAccepted(true); setShowTcDetail(false); }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B48C22)', color: '#0B1F3A' }}>
                <CheckCircle2 size={15} /> I Agree & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
