'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, Loader2, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';

type LoginRole = 'admin' | 'advisor';

export default function AdminLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const handleLogin = async () => {
    if (!email.trim()) { setError('Please enter your email address'); return; }
    if (!password.trim()) { setError('Please enter your password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/login/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUserName(data.user.fullName || data.user.email);
        setSuccess(true);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      // Demo fallback when backend is not running
      if (email === 'admin@brokersaab.com' && password === 'BrokerAdmin123') {
        localStorage.setItem('user', JSON.stringify({
          fullName: 'Super Admin',
          email: 'admin@brokersaab.com',
          role: 'SUPER_ADMIN'
        }));
        setUserName('Super Admin');
        setSuccess(true);
      } else if (role === 'advisor') {
        localStorage.setItem('user', JSON.stringify({
          fullName: 'Demo Advisor',
          email,
          role: 'ADVISOR'
        }));
        setUserName('Demo Advisor');
        setSuccess(true);
      } else {
        setError('Unable to connect to server. Credentials: admin@brokersaab.com / BrokerAdmin123');
      }
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-800 to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="w-full max-w-md relative z-10">

        {/* Back button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => router.push('/auth')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to User Login
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="bg-white rounded-2xl px-6 py-3 border border-gold-500/20 shadow-lg inline-block hover:scale-105 transition-transform">
              <img src="/logo-icon.png" alt="BrokerSaab" className="h-14 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-3">
            <KeyRound size={14} className="text-gold-500" />
            <p className="text-gold-400/70 text-sm font-medium">Secure Portal Access</p>
          </div>
        </div>

        {/* ═══ Card ═══ */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Role Toggle */}
          <div className="bg-gray-50 px-6 pt-5 pb-0 border-b border-gray-100">
            <div className="flex rounded-xl bg-gray-200/60 p-1 mb-4">
              <button
                onClick={() => { setRole('admin'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === 'admin'
                    ? 'bg-navy-800 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🛡️ Admin Login
              </button>
              <button
                onClick={() => { setRole('advisor'); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === 'advisor'
                    ? 'bg-navy-800 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                👨‍💼 Advisor Login
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="px-6 pt-5 pb-2">
            <h1 className="text-xl font-bold text-gray-900">
              {success ? 'Welcome Back!' : role === 'admin' ? 'Admin Dashboard Access' : 'Advisor Portal Login'}
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              {success
                ? `Signed in as ${userName}`
                : role === 'admin'
                  ? 'Sign in with your admin credentials'
                  : 'Sign in with your registered advisor email'
              }
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 pt-4">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!success ? (
              <div className="space-y-4">

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200">
                      <Mail size={18} className="text-gray-400" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={role === 'admin' ? 'admin@brokersaab.com' : 'advisor@email.com'}
                      className="flex-1 px-4 py-3.5 text-gray-900 text-sm outline-none placeholder:text-gray-400"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <span className="bg-gray-50 px-3 py-3.5 border-r border-gray-200">
                      <Lock size={18} className="text-gray-400" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter your password"
                      className="flex-1 px-4 py-3.5 text-gray-900 text-sm outline-none placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-3 py-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
                    <span className="text-xs">Remember me</span>
                  </label>
                  <button className="text-xs text-blue-500 hover:text-blue-600 hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-gold-500 text-navy-800 font-bold py-3.5 rounded-xl text-sm hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 mt-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                  {loading ? 'Signing in...' : `Sign In as ${role === 'admin' ? 'Admin' : 'Advisor'}`}
                </button>

                {/* Credentials hint */}
                {role === 'admin' && (
                  <div className="bg-navy-800/5 border border-navy-800/20 rounded-xl px-4 py-3 mt-3">
                    <p className="text-[11px] font-bold text-navy-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      🛡️ Admin Credentials
                    </p>
                    <div className="text-xs text-gray-700 space-y-1 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-16">Email</span>
                        <span className="font-bold text-navy-800 select-all">admin@brokersaab.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-16">Password</span>
                        <span className="font-bold text-navy-800 select-all">BrokerAdmin123</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Separator */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">or</span></div>
                </div>

                {/* User Login Link */}
                <Link
                  href="/auth"
                  className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  📱 Sign in with Phone (User Login)
                </Link>

                {/* Advisor Signup */}
                {role === 'advisor' && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    Not registered yet?{' '}
                    <Link href="/advisors/onboarding" className="text-blue-500 hover:underline font-medium">
                      Register as Advisor
                    </Link>
                  </div>
                )}

              </div>
            ) : (
              /* ── Success State ── */
              <div className="text-center space-y-5 py-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Welcome, {userName}!</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {role === 'admin' ? 'Redirecting to Admin Dashboard...' : 'Redirecting to Advisor Workspace...'}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={role === 'admin' ? '/admin' : '/advisors/onboarding'}
                    className="inline-flex items-center justify-center gap-2 bg-gold-500 text-navy-800 font-bold px-8 py-3 rounded-xl text-sm hover:bg-gold-400 shadow-lg shadow-gold-500/20 transition-all"
                  >
                    {role === 'admin' ? 'Go to Admin Dashboard' : 'Go to Advisor Workspace'}
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/"
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
              <p className="text-[11px] text-gray-400">
                This is a secure portal. Unauthorized access is prohibited.
              </p>
            </div>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>SSL Encrypted</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1">
            <KeyRound size={12} className="text-gold-400" />
            <span>Role-Based Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
