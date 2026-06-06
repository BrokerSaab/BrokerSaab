'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, CheckCircle2, Eye, Clock, Star,
  ArrowLeft, Loader2, CreditCard, Award, Zap, Lock,
  BadgeCheck, Phone, FlaskConical,
} from 'lucide-react';

const API     = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const IS_DEV  = process.env.NODE_ENV !== 'production';

// Pack constants — mirror backend
const BASE    = 99;
const ORIG    = 999;
const CGST    = Math.round(BASE * 0.09 * 100) / 100;   // 8.91
const SGST    = Math.round(BASE * 0.09 * 100) / 100;   // 8.91
const TOTAL   = Math.round((BASE + CGST + SGST) * 100) / 100; // 116.82
const CREDITS = 20;
const DISC    = Math.round((1 - BASE / ORIG) * 100);

const WHAT_YOU_GET = [
  { icon: Eye,         text: `Reveal ${CREDITS} verified advisor contacts (phone + email)` },
  { icon: Clock,       text: '1-year validity — use credits any time within 12 months' },
  { icon: ShieldCheck, text: 'Every advisor is KYC-verified by our review team' },
  { icon: Phone,       text: 'Call or WhatsApp directly — skip the booking queue' },
  { icon: Zap,         text: 'Credits appear in your account instantly after payment' },
  { icon: BadgeCheck,  text: 'First advisor contact is always FREE — no pack needed' },
];

export default function BuyPackPage() {
  const router = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [devLoad,  setDevLoad]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [invoice,  setInvoice]  = useState('');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';

  // ── Razorpay payment ─────────────────────────────────────────────
  const handlePay = async () => {
    if (!token()) { router.push('/auth'); return; }
    setLoading(true); setError('');
    try {
      const orderRes = await fetch(`${API}/contacts/create-order`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` },
      });
      const od = await orderRes.json();
      if (!od.success) { setError(od.message || 'Could not create order. Please try again.'); return; }

      if (!(window as any).Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => res(); s.onerror = () => rej(new Error('Razorpay SDK load failed'));
          document.body.appendChild(s);
        });
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      new (window as any).Razorpay({
        key: od.keyId, amount: od.amount, currency: 'INR',
        name: 'BrokerSaab', description: `Contact Pack — ${CREDITS} Advisor Contacts`,
        order_id: od.orderId, theme: { color: '#D4AF37' },
        prefill: { name: user.fullName, contact: user.phoneNumber },
        handler: async (rp: any) => {
          try {
            const vr = await fetch(`${API}/contacts/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
              body: JSON.stringify({
                razorpayOrderId: od.orderId,
                razorpayPaymentId: rp.razorpay_payment_id,
                razorpaySignature: rp.razorpay_signature,
              }),
            });
            const vd = await vr.json();
            if (vd.success) { setInvoice(`BS-CP-${Date.now().toString().slice(-8)}`); setSuccess(true); }
            else setError('Payment received but activation failed. Contact support.');
          } catch { setError('Verification error. Contact support.'); }
          finally { setLoading(false); }
        },
        modal: { ondismiss: () => setLoading(false) },
      }).open();
    } catch (e: any) { setError(e.message || 'Payment failed.'); setLoading(false); }
  };

  // ── Dev-mode instant activation ──────────────────────────────────
  const handleDevActivate = async () => {
    if (!token()) { router.push('/auth'); return; }
    setDevLoad(true); setError('');
    try {
      const r = await fetch(`${API}/contacts/dev-activate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` },
      });
      const d = await r.json();
      if (d.success) { setInvoice(`DEV-${Date.now().toString().slice(-8)}`); setSuccess(true); }
      else setError(d.message || 'Dev activation failed.');
    } catch { setError('Dev activation error.'); }
    finally { setDevLoad(false); }
  };

  // ── Success screen ───────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
        <div className="w-full max-w-sm bg-white rounded-3xl text-center overflow-hidden"
          style={{ border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          <div className="px-7 pt-8 pb-7">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(212,175,55,0.12)', border: '2px solid rgba(212,175,55,0.4)' }}>
              <CheckCircle2 size={42} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Pack Activated!</h2>
            <p className="text-gray-500 text-sm mb-5">
              <strong className="text-gray-800">{CREDITS} contacts</strong> added to your account. Valid 1 year.
            </p>
            <div className="rounded-2xl p-4 mb-5 text-left space-y-2 text-sm"
              style={{ background: 'linear-gradient(135deg,#fffbf0,#fef9e7)', border: '1px solid rgba(212,175,55,0.3)' }}>
              {[
                ['Invoice', invoice],
                ['Credits', `${CREDITS} contacts`],
                ['Validity', '1 Year'],
                ['Amount Paid', `₹${TOTAL.toFixed(2)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-bold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Link href="/advisors"
                className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                <Eye size={15} /> Browse Advisors Now
              </Link>
              <Link href="/bookings"
                className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                My Consultations
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main page ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen overflow-y-auto"
      style={{ background: 'linear-gradient(135deg,#0B1F3A 0%,#1a1040 50%,#0B1F3A 100%)' }}>

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle,#D4AF37,transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle,#4F46E5,transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">

        {/* Back */}
        <Link href="/bookings"
          className="inline-flex items-center gap-2 text-white/40 hover:text-[#D4AF37] text-xs mb-6 transition-colors">
          <ArrowLeft size={13} /> Back to My Consultations
        </Link>

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 text-[10px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
            <Star size={11} /> {DISC}% Off — Limited Offer
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
            Contact Pack — {CREDITS} Advisor Contacts
          </h1>
          <p className="text-white/40 text-sm max-w-lg mx-auto">
            Reveal direct phone &amp; email of verified advisors. Call them instantly — no booking queue.
          </p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── LEFT: What you get (3/5 cols) ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Features */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.07)' }}>
                <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">What's Included</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-x-0 sm:divide-x" style={{ '--tw-divide-opacity': 0.06 } as React.CSSProperties}>
                {WHAT_YOU_GET.map((f, i) => (
                  <div key={f.text}
                    className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 sm:last:border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.2)' }}>
                      <f.icon size={13} className="text-[#D4AF37]" />
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="rounded-2xl p-4 space-y-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest">Common Questions</span>
              {[
                { q: 'Is the first contact free?', a: "Yes — your very first advisor contact is always free, no pack needed." },
                { q: 'What if I don\'t use all 20?', a: 'Unused credits expire after 1 year. Refunds available within 7 days if no contact was unlocked.' },
                { q: 'Can I use 1 credit per advisor?', a: 'Exactly — 1 credit reveals one advisor. Mix and match any 20 advisors you like.' },
              ].map(item => (
                <div key={item.q} className="border-t pt-3 first:border-t-0 first:pt-0"
                  style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-xs font-bold text-white/80 mb-0.5">{item.q}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Pricing card (2/5 cols) ── */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>

              {/* Card header */}
              <div className="px-5 py-4 text-center relative" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
                <div className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg,transparent,#D4AF37,transparent)' }} />
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-2"
                  style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <Award size={9} /> Best Value
                </div>
                <div className="flex items-end justify-center gap-2">
                  <span className="text-white/30 text-xs line-through">₹{ORIG}</span>
                  <span className="text-3xl font-black text-white">₹{TOTAL.toFixed(2)}</span>
                </div>
                <p className="text-white/40 text-[10px] mt-0.5">Incl. 18% GST · One-time payment</p>
              </div>

              {/* Card body */}
              <div className="bg-white px-5 py-4 space-y-4">

                {/* Hero stat */}
                <div className="rounded-xl p-3 text-center"
                  style={{ background: 'linear-gradient(135deg,#fffbf0,#fef9e7)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <p className="text-4xl font-black" style={{ color: '#B48C22' }}>{CREDITS}</p>
                  <p className="text-gray-700 font-bold text-sm">Advisor Contacts</p>
                  <p className="text-gray-400 text-xs">Valid for 12 months</p>
                </div>

                {/* Price breakdown */}
                <div className="space-y-1 text-xs">
                  {[
                    { label: 'Base Price',                  val: `₹${BASE}.00`,             cls: 'text-gray-600' },
                    { label: `Discount (${DISC}% off ₹${ORIG})`, val: `– ₹${ORIG-BASE}.00`,cls: 'text-emerald-600 font-semibold' },
                    { label: 'CGST @ 9%',                   val: `₹${CGST.toFixed(2)}`,    cls: 'text-gray-400' },
                    { label: 'SGST @ 9%',                   val: `₹${SGST.toFixed(2)}`,    cls: 'text-gray-400' },
                  ].map(r => (
                    <div key={r.label} className={`flex justify-between ${r.cls}`}>
                      <span>{r.label}</span><span>{r.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-sm border-t-2 border-gray-200 pt-2 mt-1">
                    <span className="text-gray-900">Total Payable</span>
                    <span style={{ color: '#B48C22' }}>₹{TOTAL.toFixed(2)}</span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-xs">
                    <span className="mt-0.5 shrink-0">⚠</span><span>{error}</span>
                  </div>
                )}

                {/* Pay button */}
                <button onClick={handlePay} disabled={loading || devLoad}
                  className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 6px 18px rgba(212,175,55,0.35)' }}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                    : <><CreditCard size={15} /> Pay ₹{TOTAL.toFixed(2)} Securely</>}
                </button>

                {/* Dev mode test button */}
                {IS_DEV && (
                  <button onClick={handleDevActivate} disabled={loading || devLoad}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:brightness-105 disabled:opacity-50 border-2"
                    style={{ borderColor: 'rgba(79,70,229,0.4)', color: '#4F46E5', background: 'rgba(79,70,229,0.06)' }}>
                    {devLoad
                      ? <><Loader2 size={13} className="animate-spin" /> Activating…</>
                      : <><FlaskConical size={13} /> Test Mode — Simulate Payment</>}
                  </button>
                )}

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-3 pt-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Lock size={10} className="text-emerald-500" /> Encrypted
                  </div>
                  <span className="text-gray-200 text-xs">·</span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <ShieldCheck size={10} className="text-[#D4AF37]" /> Razorpay
                  </div>
                  <span className="text-gray-200 text-xs">·</span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <CheckCircle2 size={10} className="text-blue-400" /> Refundable
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
