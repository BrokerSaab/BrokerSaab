'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BadgeCheck, ShieldCheck, Star, Loader2,
  CreditCard, CheckCircle2, CalendarClock, AlertCircle, RefreshCw,
  Zap, Award, TrendingUp, Users, Clock, Crown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// ── Pricing (display-only; backend recomputes) ────────────────────────────────
const PLANS = {
  REGULAR: {
    base: 499, mrp: 4990,
    cgst: Math.round(499 * 0.09 * 100) / 100,
    sgst: Math.round(499 * 0.09 * 100) / 100,
    total: Math.round(499 * 1.18 * 100) / 100,  // 588.82
    label: 'Regular Plan',
    validityNote: 'Within 6 months of joining → 1.5 yrs · After 6 months → 1 yr',
  },
  AUTHORIZED: {
    base: 1999, mrp: 19999,
    cgst: Math.round(1999 * 0.09 * 100) / 100,
    sgst: Math.round(1999 * 0.09 * 100) / 100,
    total: Math.round(1999 * 1.18 * 100) / 100, // 2358.82
    label: 'Authorized Plan',
    validityNote: 'Within 6 months of joining → 1.5 yrs · After 6 months → 1 yr',
  },
} as const;

const AUTHORIZED_BENEFITS = [
  { icon: <BadgeCheck size={15} className="text-amber-400" />, text: 'Verified Authorized Badge on profile' },
  { icon: <TrendingUp size={15} className="text-indigo-400" />, text: 'Priority listing in search results' },
  { icon: <Users size={15} className="text-emerald-400" />,    text: 'Clients can find & contact you directly' },
  { icon: <ShieldCheck size={15} className="text-blue-400" />, text: 'Trusted advisor seal across all platforms' },
  { icon: <Award size={15} className="text-purple-400" />,     text: 'Certificate of authorization issued' },
  { icon: <Zap size={15} className="text-amber-400" />,        text: 'Priority customer support access' },
];

const REGULAR_BENEFITS = [
  { icon: <CheckCircle2 size={15} className="text-emerald-400" />, text: 'Full platform access — bookings, quotes & tickets' },
  { icon: <TrendingUp size={15} className="text-indigo-400" />,    text: 'Profile listed in advisor search results' },
  { icon: <Users size={15} className="text-blue-400" />,           text: 'Connect with clients across India' },
  { icon: <ShieldCheck size={15} className="text-purple-400" />,   text: 'Secure escrow payments on every project' },
  { icon: <Star size={15} className="text-amber-400" />,           text: 'Client ratings & review visibility' },
  { icon: <Zap size={15} className="text-amber-400" />,            text: 'Upgrade to Authorized anytime' },
];

interface SubStatus {
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  planType: 'REGULAR' | 'AUTHORIZED';
  subscribedPlan: 'REGULAR' | 'AUTHORIZED' | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  trialDaysLeft: number;
  isInTrial: boolean;
  isActive: boolean;
  subscriptionValidUntil: string | null;
  daysLeft: number;
}

export default function SubscriptionPage() {
  const { user, isLoggedIn, authReady } = useAuth();
  const router = useRouter();

  const [subStatus, setSubStatus]           = useState<SubStatus | null>(null);
  const [statusLoading, setStatusLoading]   = useState(true);
  const [paying, setPaying]                 = useState(false);
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState(false);
  const [activatedUntil, setActivatedUntil] = useState<string | null>(null);
  const [activatedPlan, setActivatedPlan]   = useState<'REGULAR' | 'AUTHORIZED' | null>(null);
  // For REGULAR advisors: which plan card they chose before paying
  const [selectedPlan, setSelectedPlan]     = useState<'REGULAR' | 'AUTHORIZED' | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn || user?.role !== 'ADVISOR') { router.replace('/auth/admin'); return; }
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoggedIn, user]);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res   = await fetch(`${API}/subscriptions/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setSubStatus(data);
    } catch { /* ignore */ }
    finally { setStatusLoading(false); }
  };

  const loadRazorpay = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if ((window as any).Razorpay) { resolve(); return; }
      const s = document.createElement('script');
      s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload  = () => resolve();
      s.onerror = () => reject(new Error('Payment gateway unavailable. Please try again.'));
      document.body.appendChild(s);
    });

  const handlePay = async (plan: 'REGULAR' | 'AUTHORIZED') => {
    setError('');
    setPaying(true);
    setSelectedPlan(plan);
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) { setError('Session expired. Please log in again.'); return; }

      const orderRes  = await fetch(`${API}/subscriptions/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.message || 'Could not initiate payment'); return; }

      await loadRazorpay();

      const rzp = new (window as any).Razorpay({
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    'INR',
        name:        'BrokerSaab',
        description: orderData.planLabel,
        image:       '/logo-icon.png',
        notes:       { purpose: 'ADVISOR_SUBSCRIPTION', advisorName: user?.fullName ?? '', plan: orderData.plan },
        theme:       { color: plan === 'AUTHORIZED' ? '#4F46E5' : '#D4AF37' },
        modal:       { ondismiss: () => setPaying(false) },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API}/subscriptions/verify-payment`, {
              method:  'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body:    JSON.stringify({
                razorpayOrderId:   orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setActivatedUntil(verifyData.expiresAt);
              setActivatedPlan(verifyData.plan);
              setSuccess(true);
              fetchStatus();
            } else {
              setError(verifyData.message || 'Payment verification failed');
            }
          } catch {
            setError('Payment verified but activation failed. Contact support.');
          } finally {
            setPaying(false);
          }
        },
      });
      rzp.open();
    } catch (e: any) {
      setError(e.message || 'Payment failed. Please try again.');
      setPaying(false);
    }
  };

  const handleTestPay = async (plan: 'REGULAR' | 'AUTHORIZED') => {
    setError('');
    setPaying(true);
    setSelectedPlan(plan);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res   = await fetch(`${API}/subscriptions/test-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data  = await res.json();
      if (data.success) {
        setActivatedUntil(data.expiresAt);
        setActivatedPlan(data.plan);
        setSuccess(true);
        fetchStatus();
      } else {
        setError(data.message || 'Test payment failed');
      }
    } catch { setError('Network error'); }
    finally { setPaying(false); }
  };

  if (!authReady || statusLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-amber-400" />
      </div>
    );
  }

  const isAlreadyAuthorized = subStatus?.planType === 'AUTHORIZED';
  // REGULAR advisors who don't have an active paid subscription see both plans
  const showPlanPicker = !isAlreadyAuthorized && !subStatus?.isActive && !success;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#0B1F3A 0%,#1a1040 100%)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/advisor/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-amber-400" />
            <span className="text-sm font-bold text-white">Advisor Subscription</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Trial / expired banners */}
        {subStatus?.isInTrial && !success && (
          <div className="rounded-2xl px-5 py-4 border border-indigo-500/30 bg-indigo-500/10 flex items-center gap-4">
            <Clock size={20} className="text-indigo-300 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-200">Free Trial Active</p>
              <p className="text-xs text-indigo-300/70">
                {subStatus.trialDaysLeft} days remaining · Trial ends{' '}
                {subStatus.trialEndDate
                  ? new Date(subStatus.trialEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
              <p className="text-[11px] text-indigo-300/50 mt-0.5">
                You're within 6 months → subscribing now gives you <strong className="text-indigo-200">1.5 years</strong> validity
              </p>
            </div>
          </div>
        )}

        {subStatus?.status === 'EXPIRED' && !success && (
          <div className="rounded-2xl px-5 py-4 border border-red-500/30 bg-red-500/10 flex items-center gap-4">
            <AlertCircle size={20} className="text-red-300 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-200">Trial Expired</p>
              <p className="text-xs text-red-300/70">Subscribe now to restore platform access (1-year validity)</p>
            </div>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="rounded-2xl p-6 text-center space-y-3 border border-emerald-500/30 bg-emerald-500/10">
            <div className="w-14 h-14 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center mx-auto">
              {activatedPlan === 'AUTHORIZED' ? <BadgeCheck size={28} className="text-amber-400" /> : <Crown size={28} className="text-amber-400" />}
            </div>
            <p className="text-lg font-black text-emerald-300">
              {activatedPlan === 'AUTHORIZED' ? 'Authorized Plan' : 'Regular Plan'} Activated!
            </p>
            <p className="text-sm text-emerald-200/70">
              Your subscription is now active.
              {activatedUntil && ` Valid until ${new Date(activatedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
            </p>
            {activatedPlan === 'AUTHORIZED' && (
              <p className="text-xs text-indigo-300 bg-indigo-500/15 rounded-xl px-3 py-2">Authorized Dealer badge is pending admin approval.</p>
            )}
            <Link href="/advisor/dashboard"
              className="inline-block mt-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Already active */}
        {!success && subStatus?.isActive && (
          <div className="rounded-2xl px-5 py-4 border border-amber-500/30 bg-amber-500/10 flex items-center gap-4">
            <CheckCircle2 size={24} className="text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-300">
                {subStatus.planType === 'AUTHORIZED' ? 'Authorized Plan' : 'Regular Plan'} — Active
              </p>
              <p className="text-xs text-amber-200/60">
                {subStatus.daysLeft} days remaining · Valid until{' '}
                {subStatus.subscriptionValidUntil
                  ? new Date(subStatus.subscriptionValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <button onClick={fetchStatus} className="text-amber-400/50 hover:text-amber-400 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {/* ── Plan picker (REGULAR advisors without active paid subscription) ── */}
        {showPlanPicker && (
          <>
            <p className="text-center text-sm font-semibold text-white/60">Choose your plan</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Regular Plan card */}
              <div className="rounded-3xl overflow-hidden flex flex-col" style={{ border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="px-5 py-4 text-center" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.18),rgba(180,140,34,0.10))' }}>
                  <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', boxShadow: '0 6px 18px rgba(212,175,55,0.35)' }}>
                    <Crown size={22} className="text-slate-900" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 mb-0.5">Regular Plan</p>
                  <p className="text-2xl font-black text-white">₹{PLANS.REGULAR.base.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-white/30 line-through">₹{PLANS.REGULAR.mrp.toLocaleString('en-IN')} MRP</p>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    + ₹{(PLANS.REGULAR.cgst + PLANS.REGULAR.sgst).toFixed(2)} GST = <span className="text-white/70 font-semibold">₹{PLANS.REGULAR.total.toFixed(2)}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    90% Launch Discount
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2 flex-1">
                  {REGULAR_BENEFITS.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-white/5">{b.icon}</div>
                      <p className="text-xs text-white/70">{b.text}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="flex items-center gap-1 text-[10px] text-white/40 justify-center">
                    <CalendarClock size={10} className="text-amber-400" />
                    <span>
                      {subStatus?.status === 'EXPIRED' ? '1 year validity' : '1.5 years validity'}
                    </span>
                  </div>
                  {error && selectedPlan === 'REGULAR' && (
                    <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2">
                      <AlertCircle size={12} className="text-red-400 shrink-0" />
                      <p className="text-[10px] text-red-300">{error}</p>
                    </div>
                  )}
                  <button onClick={() => handlePay('REGULAR')} disabled={paying}
                    className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-wait"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 6px 18px rgba(212,175,55,0.3)' }}>
                    {paying && selectedPlan === 'REGULAR'
                      ? <><Loader2 size={15} className="animate-spin" /> Processing…</>
                      : <><CreditCard size={15} /> Activate Regular — ₹{PLANS.REGULAR.total.toFixed(2)}</>}
                  </button>
                  {process.env.NODE_ENV !== 'production' && (
                    <button onClick={() => handleTestPay('REGULAR')} disabled={paying}
                      className="w-full py-1.5 rounded-xl text-[10px] font-semibold text-white/30 border border-white/8 hover:bg-white/5 transition-all">
                      [DEV] Simulate Regular payment
                    </button>
                  )}
                </div>
              </div>

              {/* Authorized Plan card */}
              <div className="rounded-3xl overflow-hidden flex flex-col" style={{ border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="px-5 py-4 text-center" style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.2),rgba(55,48,163,0.12))' }}>
                  <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', boxShadow: '0 6px 18px rgba(79,70,229,0.35)' }}>
                    <BadgeCheck size={22} className="text-white" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70 mb-0.5">Authorized Plan</p>
                  <p className="text-2xl font-black text-white">₹{PLANS.AUTHORIZED.base.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-white/30 line-through">₹{PLANS.AUTHORIZED.mrp.toLocaleString('en-IN')} MRP</p>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    + ₹{(PLANS.AUTHORIZED.cgst + PLANS.AUTHORIZED.sgst).toFixed(2)} GST = <span className="text-white/70 font-semibold">₹{PLANS.AUTHORIZED.total.toFixed(2)}</span>
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ~90% Launch Discount
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2 flex-1">
                  {AUTHORIZED_BENEFITS.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-white/5">{b.icon}</div>
                      <p className="text-xs text-white/70">{b.text}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="flex items-center gap-1 text-[10px] text-white/40 justify-center">
                    <CalendarClock size={10} className="text-indigo-400" />
                    <span>
                      {subStatus?.status === 'EXPIRED' ? '1 year validity' : '1.5 years validity'}
                    </span>
                  </div>
                  {error && selectedPlan === 'AUTHORIZED' && (
                    <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2">
                      <AlertCircle size={12} className="text-red-400 shrink-0" />
                      <p className="text-[10px] text-red-300">{error}</p>
                    </div>
                  )}
                  <button onClick={() => handlePay('AUTHORIZED')} disabled={paying}
                    className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-wait"
                    style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: '#fff', boxShadow: '0 6px 18px rgba(79,70,229,0.3)' }}>
                    {paying && selectedPlan === 'AUTHORIZED'
                      ? <><Loader2 size={15} className="animate-spin" /> Processing…</>
                      : <><Zap size={15} /> Get Authorized — ₹{PLANS.AUTHORIZED.total.toFixed(2)}</>}
                  </button>
                  {process.env.NODE_ENV !== 'production' && (
                    <button onClick={() => handleTestPay('AUTHORIZED')} disabled={paying}
                      className="w-full py-1.5 rounded-xl text-[10px] font-semibold text-white/30 border border-white/8 hover:bg-white/5 transition-all">
                      [DEV] Simulate Authorized payment
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Shared validity table */}
            <div className="rounded-2xl overflow-hidden border border-white/8">
              <div className="px-4 py-2.5 bg-white/3 border-b border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Validity rules (both plans)</p>
              </div>
              <div className="px-4 py-2.5 flex justify-between text-xs text-white/50 border-b border-white/5">
                <span>Subscribe within 6 months of joining</span><span className="text-emerald-400 font-semibold">1.5 years</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between text-xs text-white/50">
                <span>Subscribe after 6 months</span><span className="text-amber-400 font-semibold">1 year</span>
              </div>
            </div>
          </>
        )}

        {/* ── Single plan card for AUTHORIZED advisors renewing ── */}
        {!success && isAlreadyAuthorized && !subStatus?.isActive && (
          <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(255,255,255,0.03)' }}>
            <div className="px-6 py-5 text-center" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(180,140,34,0.08))' }}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', boxShadow: '0 8px 24px rgba(212,175,55,0.35)' }}>
                <BadgeCheck size={30} className="text-slate-900" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70 mb-1">Authorized Plan</p>
              <p className="text-3xl font-black text-white">₹{PLANS.AUTHORIZED.base.toLocaleString('en-IN')}</p>
              <p className="text-xs text-white/40 mt-1">
                + ₹{(PLANS.AUTHORIZED.cgst + PLANS.AUTHORIZED.sgst).toFixed(2)} GST = <span className="text-white/70 font-semibold">₹{PLANS.AUTHORIZED.total.toFixed(2)} total</span>
              </p>
            </div>
            <div className="px-6 py-4 space-y-2.5">
              {AUTHORIZED_BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/5">{b.icon}</div>
                  <p className="text-sm text-white/75">{b.text}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 space-y-3">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}
              <button onClick={() => handlePay('AUTHORIZED')} disabled={paying}
                className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-wait"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 8px 24px rgba(212,175,55,0.35)' }}>
                {paying
                  ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
                  : <><CreditCard size={18} /> {subStatus?.isActive ? 'Renew Authorized Plan' : 'Activate Authorized Plan'} — ₹{PLANS.AUTHORIZED.total.toFixed(2)}</>}
              </button>
              <p className="text-[11px] text-white/30 text-center flex items-center justify-center gap-1">
                <ShieldCheck size={11} /> Secured by Razorpay · UPI, Cards, Net Banking · 100% refund if profile rejected
              </p>
              {process.env.NODE_ENV !== 'production' && (
                <button onClick={() => handleTestPay('AUTHORIZED')} disabled={paying}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-white/30 border border-white/8 hover:bg-white/5 transition-all">
                  [DEV] Simulate payment (test mode)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Refund policy */}
        {!success && (
          <div className="rounded-2xl px-4 py-3.5 border border-emerald-500/20 bg-emerald-500/8">
            <p className="text-xs font-bold text-emerald-300 mb-1">100% Refund Guarantee</p>
            <p className="text-[11px] text-emerald-200/50 leading-relaxed">
              If your advisor profile is rejected by our review team, the full amount will be refunded to your original payment method within 3–5 business days. No questions asked.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
