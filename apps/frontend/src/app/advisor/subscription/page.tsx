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

const BASE  = 1999;
const GST   = Math.round(BASE * 0.18 * 100) / 100;
const TOTAL = Math.round((BASE + GST) * 100) / 100;

const AUTHORIZED_BENEFITS = [
  { icon: <BadgeCheck size={16} className="text-amber-400" />, text: 'Verified Authorized Badge on your profile' },
  { icon: <TrendingUp size={16} className="text-indigo-400" />, text: 'Priority listing in search results' },
  { icon: <Users size={16} className="text-emerald-400" />,    text: 'Clients can find & contact you directly' },
  { icon: <ShieldCheck size={16} className="text-blue-400" />, text: 'Trusted advisor seal across all platforms' },
  { icon: <Award size={16} className="text-purple-400" />,     text: 'Certificate of authorization issued' },
  { icon: <Zap size={16} className="text-amber-400" />,        text: 'Priority customer support access' },
];

const REGULAR_BENEFITS = [
  { icon: <CheckCircle2 size={16} className="text-emerald-400" />, text: 'Full platform access — bookings, quotes & tickets' },
  { icon: <TrendingUp size={16} className="text-indigo-400" />,    text: 'Profile listed in advisor search results' },
  { icon: <Users size={16} className="text-blue-400" />,           text: 'Connect with clients across India' },
  { icon: <ShieldCheck size={16} className="text-purple-400" />,   text: 'Secure escrow payments on every project' },
  { icon: <Star size={16} className="text-amber-400" />,           text: 'Client ratings & review visibility' },
  { icon: <Zap size={16} className="text-amber-400" />,            text: 'Priority customer support access' },
];

interface SubStatus {
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED';
  planType: 'REGULAR' | 'AUTHORIZED';
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

  const [subStatus, setSubStatus]       = useState<SubStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [paying, setPaying]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [activatedUntil, setActivatedUntil] = useState<string | null>(null);

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

  const handlePay = async () => {
    setError('');
    setPaying(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      if (!token) { setError('Session expired. Please log in again.'); return; }

      const orderRes  = await fetch(`${API}/subscriptions/create-order`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.message || 'Could not initiate payment'); return; }

      await loadRazorpay();

      const planLabel = orderData.planType === 'AUTHORIZED' ? 'Authorized Plan' : 'Regular Plan';

      const rzp = new (window as any).Razorpay({
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    'INR',
        name:        'BrokerSaab',
        description: `${planLabel} — Advisor Subscription`,
        image:       '/logo-icon.png',
        notes:       { purpose: 'ADVISOR_SUBSCRIPTION', advisorName: user?.fullName ?? '', planType: orderData.planType },
        theme:       { color: '#D4AF37' },
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

  const handleTestPay = async () => {
    setError('');
    setPaying(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res   = await fetch(`${API}/subscriptions/test-payment`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data  = await res.json();
      if (data.success) {
        setActivatedUntil(data.expiresAt);
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

  const planType   = subStatus?.planType ?? 'REGULAR';
  const isAuth     = planType === 'AUTHORIZED';
  const planLabel  = isAuth ? 'Authorized Plan' : 'Regular Plan';
  const benefits   = isAuth ? AUTHORIZED_BENEFITS : REGULAR_BENEFITS;
  const PlanIcon   = isAuth ? BadgeCheck : Crown;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#0B1F3A 0%,#1a1040 100%)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/advisor/dashboard" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <PlanIcon size={18} className="text-amber-400" />
            <span className="text-sm font-bold text-white">{planLabel}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Trial banner */}
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
                Subscribe now → get <strong className="text-indigo-200">1.5 years</strong> validity from today
              </p>
            </div>
          </div>
        )}

        {/* Expired banner */}
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
              <PlanIcon size={28} className="text-amber-400" />
            </div>
            <p className="text-lg font-black text-emerald-300">{planLabel} Activated!</p>
            <p className="text-sm text-emerald-200/70">
              Your subscription is now active and visible to clients.
              {activatedUntil && ` Valid until ${new Date(activatedUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
            </p>
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
              <p className="text-sm font-bold text-amber-300">{planLabel} Active</p>
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

        {/* Hero card */}
        {!success && (
          <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.25)', background: 'rgba(255,255,255,0.03)' }}>

            {/* Gold header */}
            <div className="px-6 py-5 text-center" style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(180,140,34,0.08))' }}>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', boxShadow: '0 8px 24px rgba(212,175,55,0.35)' }}>
                <PlanIcon size={30} className="text-slate-900" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400/70 mb-1">{planLabel}</p>
              <p className="text-3xl font-black text-white">₹{BASE.toLocaleString('en-IN')}</p>
              <p className="text-xs text-white/40 mt-1">
                + ₹{GST.toFixed(2)} GST (18%) = <span className="text-white/70 font-semibold">₹{TOTAL.toFixed(2)} total</span>
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/8 border border-white/10">
                <CalendarClock size={11} className="text-amber-400" />
                <span className="text-[11px] font-semibold text-white/60">
                  {subStatus?.isInTrial
                    ? 'Subscribe during trial → 1.5 years validity'
                    : subStatus?.status === 'EXPIRED'
                    ? '1 year validity from today'
                    : 'Validity based on when you subscribe'}
                </span>
              </div>
            </div>

            {/* Benefits */}
            <div className="px-6 py-5 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">What you get</p>
              <div className="space-y-2.5">
                {benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/5">
                      {b.icon}
                    </div>
                    <p className="text-sm text-white/75">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Validity breakdown */}
            <div className="mx-6 mb-3 rounded-2xl overflow-hidden border border-white/8">
              <div className="px-4 py-2.5 bg-white/3 border-b border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Validity rules</p>
              </div>
              <div className="px-4 py-2.5 flex justify-between text-xs text-white/50 border-b border-white/5">
                <span>Pay on onboarding day</span><span className="text-emerald-400 font-semibold">2 years</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between text-xs text-white/50 border-b border-white/5">
                <span>Pay during 6-month trial</span><span className="text-emerald-400 font-semibold">1.5 years</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between text-xs text-white/50">
                <span>Pay after trial expires</span><span className="text-amber-400 font-semibold">1 year</span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="mx-6 mb-5 rounded-2xl overflow-hidden border border-white/8">
              <div className="px-4 py-2.5 flex justify-between text-xs text-white/50 border-b border-white/5">
                <span>{planLabel} (Annual)</span><span>₹{BASE.toLocaleString('en-IN')}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between text-xs text-white/50 border-b border-white/5">
                <span>CGST 9%</span><span>₹{(BASE * 0.09).toFixed(2)}</span>
              </div>
              <div className="px-4 py-2.5 flex justify-between text-xs text-white/50 border-b border-white/5">
                <span>SGST 9%</span><span>₹{(BASE * 0.09).toFixed(2)}</span>
              </div>
              <div className="px-4 py-3 flex justify-between items-center" style={{ background: 'rgba(212,175,55,0.08)' }}>
                <span className="text-sm font-black text-white">Total Payable</span>
                <span className="text-base font-black text-amber-400">₹{TOTAL.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 space-y-3">
              {error && (
                <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <button onClick={handlePay} disabled={paying}
                className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 8px 24px rgba(212,175,55,0.35)' }}>
                {paying
                  ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
                  : <><CreditCard size={18} /> {subStatus?.isActive ? `Renew ${planLabel}` : `Activate ${planLabel}`} — ₹{TOTAL.toFixed(2)}</>
                }
              </button>

              <p className="text-[11px] text-white/30 text-center flex items-center justify-center gap-1">
                <ShieldCheck size={11} /> Secured by Razorpay · UPI, Cards, Net Banking · 100% refund if profile rejected
              </p>

              {process.env.NODE_ENV !== 'production' && (
                <button onClick={handleTestPay} disabled={paying}
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
              If your advisor profile is rejected by our review team, the full amount of ₹{TOTAL.toFixed(2)} will be
              refunded to your original payment method within 3–5 business days. No questions asked.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
