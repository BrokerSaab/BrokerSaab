'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Clock, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  forceOpen?: boolean;
  onForceClose?: () => void;
}

export default function LaunchOfferPopup({ forceOpen, onForceClose }: Props) {
  const [countdown, setCountdown] = useState({ h: 23, m: 59, s: 59 });
  const { openLoginModal } = useAuth();

  const open = !!forceOpen;

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [open]);

  const close = () => {
    onForceClose?.();
  };

  if (!open) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* ── POPUP CARD ── */}
      <div className="relative w-full max-w-2xl animate-popIn overflow-hidden rounded-3xl"
        style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.1)' }}>

        {/* ── MEGA BACKGROUND (teal-to-green gradient like reference) ── */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #007a6e 0%, #00b89f 40%, #00d4a8 100%)' }} />

        {/* ── DIAGONAL COLOURED SHAPES (like the reference image) ── */}
        {/* Yellow diagonal strip */}
        <div className="absolute pointer-events-none"
          style={{ width: '55%', height: '200%', top: '-40%', left: '20%', background: '#FFD600', transform: 'rotate(-35deg)', opacity: 0.9, zIndex: 1 }} />
        {/* Red strip over yellow */}
        <div className="absolute pointer-events-none"
          style={{ width: '30%', height: '200%', top: '-40%', left: '36%', background: '#FF1744', transform: 'rotate(-35deg)', opacity: 0.95, zIndex: 2 }} />
        {/* Purple strip */}
        <div className="absolute pointer-events-none"
          style={{ width: '28%', height: '200%', top: '-40%', left: '54%', background: '#9C27B0', transform: 'rotate(-35deg)', opacity: 0.9, zIndex: 2 }} />
        {/* Teal overlay on right */}
        <div className="absolute pointer-events-none"
          style={{ width: '25%', height: '200%', top: '-40%', left: '72%', background: '#00BCD4', transform: 'rotate(-35deg)', opacity: 0.8, zIndex: 1 }} />

        {/* Dark overlay to ensure text readability in left & right zones */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3,
          background: 'linear-gradient(90deg, rgba(0,80,70,0.55) 0%, transparent 30%, transparent 70%, rgba(0,60,80,0.5) 100%)' }} />

        {/* ── CONTENT ── z-10 above all shapes */}
        <div className="relative z-10">

          {/* Close button */}
          <button onClick={close}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white' }}>
            <X size={16} />
          </button>

          {/* ── TOP SECTION ── */}
          <div className="px-7 pt-7 pb-2 text-center">

            {/* MEGA SALE badge — bold outlined style */}
            <div className="inline-flex items-center gap-2 mb-3">
              <Zap size={16} className="text-yellow-300 fill-yellow-300" />
              <span className="font-black text-white text-sm sm:text-base uppercase tracking-[0.25em]"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6), 2px 2px 0 rgba(0,0,0,0.4)', letterSpacing: '0.22em' }}>
                MEGA LAUNCH OFFER
              </span>
              <Zap size={16} className="text-yellow-300 fill-yellow-300" />
            </div>

            {/* GIANT 90% OFF */}
            <div className="mb-1">
              <span
                className="block font-black leading-none text-white select-none"
                style={{
                  fontSize: 'clamp(72px, 16vw, 108px)',
                  WebkitTextStroke: '3px rgba(0,0,0,0.6)',
                  textShadow: '4px 4px 0 rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
                  letterSpacing: '-2px',
                }}
              >
                90%
              </span>
              <span
                className="block font-black leading-none text-white select-none -mt-3 sm:-mt-4"
                style={{
                  fontSize: 'clamp(56px, 13vw, 90px)',
                  WebkitTextStroke: '3px rgba(0,0,0,0.5)',
                  textShadow: '4px 4px 0 rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.3)',
                  letterSpacing: '-1px',
                }}
              >
                OFF
              </span>
            </div>

            {/* BIGGEST DISCOUNTS subtitle */}
            <p className="font-black text-white text-sm sm:text-base uppercase tracking-[0.2em] mb-1"
              style={{ textShadow: '0 2px 6px rgba(0,0,0,0.5)', letterSpacing: '0.18em' }}>
              BIGGEST DISCOUNTS — 1 YEAR VALIDITY
            </p>
          </div>

          {/* ── COUNTDOWN ── */}
          <div className="flex items-center justify-center gap-3 px-7 pb-4">
            <Clock size={14} className="text-yellow-300 shrink-0" />
            <span className="text-yellow-200 text-xs font-bold uppercase tracking-widest">Offer ends in</span>
            {[{ v: countdown.h, l: 'HRS' }, { v: countdown.m, l: 'MIN' }, { v: countdown.s, l: 'SEC' }].map((u, i, arr) => (
              <span key={u.l} className="flex items-center gap-1.5">
                <span className="flex flex-col items-center">
                  <span className="text-white font-black text-lg sm:text-xl w-10 text-center rounded-lg py-1 tabular-nums"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.25)', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                    {pad(u.v)}
                  </span>
                  <span className="text-white/60 text-[8px] font-bold mt-0.5">{u.l}</span>
                </span>
                {i < arr.length - 1 && <span className="text-yellow-300 font-black text-xl pb-4">:</span>}
              </span>
            ))}
          </div>

          {/* ── TWO PLAN CARDS ── */}
          <div className="grid grid-cols-2 gap-3 px-5 pb-5">

            {/* User Plan */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
              <div className="px-4 py-3 text-center border-b border-white/10"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="text-xs font-black uppercase tracking-widest text-yellow-300 mb-0.5">👤 For Users</div>
                <div className="text-white/50 line-through text-xs font-semibold">₹999/year</div>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-4xl font-black text-white leading-none"
                    style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>₹99</span>
                  <span className="text-white/60 text-xs font-bold">/yr</span>
                </div>
                <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black"
                  style={{ background: '#22c55e', color: '#fff' }}>
                  SAVE ₹900 · 90% OFF
                </div>
              </div>
              <ul className="px-4 py-3 space-y-1.5 text-xs text-white/75">
                {['Priority advisor access', 'Escrow-protected bookings', 'Premium support', '1 year validity'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-yellow-300 text-xs">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="px-4 pb-4">
                <button
                  onClick={() => { close(); openLoginModal(); }}
                  className="w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'white', color: '#1a0533', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  GRAB NOW <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Advisor Plan */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.45)', border: '2px solid #FFD600', backdropFilter: 'blur(8px)', boxShadow: '0 0 20px rgba(255,214,0,0.3)' }}>
              {/* Best Value ribbon */}
              <div className="text-center py-1 text-[10px] font-black uppercase tracking-widest"
                style={{ background: '#FFD600', color: '#000' }}>
                ⭐ BEST VALUE
              </div>
              <div className="px-4 py-3 text-center border-b border-white/10"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="text-xs font-black uppercase tracking-widest text-yellow-300 mb-0.5">🤝 For Advisors</div>
                <div className="text-white/50 line-through text-xs font-semibold">₹4,999/year</div>
                <div className="flex items-baseline justify-center gap-1 mt-0.5">
                  <span className="text-4xl font-black text-white leading-none"
                    style={{ textShadow: '0 0 20px rgba(255,214,0,0.7)', color: '#FFD600' }}>₹499</span>
                  <span className="text-white/60 text-xs font-bold">/yr</span>
                </div>
                <div className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black"
                  style={{ background: '#22c55e', color: '#fff' }}>
                  SAVE ₹4,500 · 90% OFF
                </div>
              </div>
              <ul className="px-4 py-3 space-y-1.5 text-xs text-white/75">
                {['Priority listing in search', 'Verified badge on profile', 'Unlimited bookings', '1 year validity'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-yellow-300 text-xs">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="px-4 pb-4">
                <Link href="/advisors/onboarding" onClick={close}
                  className="w-full py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: '#FFD600', color: '#000', boxShadow: '0 4px 12px rgba(255,214,0,0.4)' }}>
                  GRAB NOW <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 text-center space-y-1">
            <p className="text-white/30 text-[10px]">
              Launching offer · Valid for 1 year from purchase · No refunds on discounted plans
            </p>
            <button onClick={close}
              className="text-white/40 text-xs hover:text-white/70 transition-colors underline underline-offset-2">
              No thanks, remind me later
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
