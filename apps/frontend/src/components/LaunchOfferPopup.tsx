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

  const close = () => { onForceClose?.(); };

  if (!open) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      {/* ── POPUP CARD ── */}
      <div
        className="relative w-full max-w-md animate-popIn rounded-2xl overflow-hidden"
        style={{
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #0c1445 100%)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.35), 0 0 40px rgba(99,102,241,0.12)',
        }}
      >
        {/* Indigo glow top-right */}
        <div className="absolute top-0 right-0 w-52 h-52 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        {/* Gold glow bottom-left */}
        <div className="absolute bottom-0 left-0 w-44 h-44 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

        {/* ── CONTENT ── */}
        <div className="relative z-10">

          {/* Close button */}
          <button onClick={close}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:bg-white/20"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: 'white' }}>
            <X size={14} />
          </button>

          {/* ── HEADER ── */}
          <div className="px-6 pt-6 pb-3 text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)' }}>
              <Zap size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-amber-300 text-[10px] font-black uppercase tracking-[0.2em]">MEGA LAUNCH OFFER</span>
              <Zap size={11} className="text-amber-400 fill-amber-400" />
            </div>

            {/* 90% OFF — compact but bold */}
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="font-black text-white leading-none select-none"
                style={{ fontSize: 'clamp(46px, 11vw, 64px)', letterSpacing: '-2px', textShadow: '0 0 28px rgba(99,102,241,0.55)' }}>
                90%
              </span>
              <span className="font-black leading-none select-none"
                style={{ fontSize: 'clamp(34px, 8vw, 48px)', color: '#F59E0B', letterSpacing: '-1px', textShadow: '0 0 18px rgba(245,158,11,0.5)' }}>
                OFF
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-indigo-300 text-[11px] font-bold uppercase tracking-[0.15em]">
              Biggest Discounts · 1 Year Validity
            </p>
          </div>

          {/* ── COUNTDOWN ── */}
          <div className="flex items-center justify-center gap-2 px-6 py-3">
            <Clock size={12} className="text-amber-400 shrink-0" />
            <span className="text-amber-300/80 text-[10px] font-bold uppercase tracking-wider">Offer ends in</span>
            {[{ v: countdown.h, l: 'HRS' }, { v: countdown.m, l: 'MIN' }, { v: countdown.s, l: 'SEC' }].map((u, i, arr) => (
              <span key={u.l} className="flex items-center gap-1.5">
                <span className="flex flex-col items-center">
                  <span className="text-white font-black text-base w-9 text-center rounded-lg py-1 tabular-nums"
                    style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.5)' }}>
                    {pad(u.v)}
                  </span>
                  <span className="text-white/40 text-[8px] font-bold mt-0.5">{u.l}</span>
                </span>
                {i < arr.length - 1 && <span className="text-amber-400 font-black text-base pb-3">:</span>}
              </span>
            ))}
          </div>

          {/* Gold divider */}
          <div className="mx-6 mb-4 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.45), transparent)' }} />

          {/* ── TWO PLAN CARDS ── */}
          <div className="grid grid-cols-2 gap-3 px-5 pb-4">

            {/* User Plan */}
            <div className="rounded-xl overflow-hidden flex flex-col"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(99,102,241,0.45)', backdropFilter: 'blur(8px)' }}>
              <div className="px-3 py-2.5 text-center border-b border-indigo-500/20"
                style={{ background: 'rgba(99,102,241,0.12)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-0.5">👤 For Users</p>
                <p className="text-white/40 line-through text-[10px] font-semibold">₹999/year</p>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span className="text-3xl font-black text-white leading-none">₹99</span>
                  <span className="text-white/50 text-[10px] font-bold">/yr</span>
                </div>
                <div className="inline-flex items-center gap-0.5 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: '#16a34a', color: '#fff' }}>
                  SAVE ₹900 · 90% OFF
                </div>
              </div>
              <ul className="px-3 py-2.5 space-y-1.5 text-[10px] text-white/70 flex-1">
                {['Priority advisor access', 'Escrow-protected bookings', 'Premium support', '1 year validity'].map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-indigo-400 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="px-3 pb-3">
                <button
                  onClick={() => { close(); openLoginModal(); }}
                  className="w-full py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                  GRAB NOW <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Advisor Plan */}
            <div className="rounded-xl overflow-hidden flex flex-col"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(245,158,11,0.55)', backdropFilter: 'blur(8px)', boxShadow: '0 0 16px rgba(245,158,11,0.18)' }}>
              {/* Best Value ribbon */}
              <div className="text-center py-1 text-[9px] font-black uppercase tracking-widest"
                style={{ background: 'linear-gradient(90deg, #b45309, #f59e0b, #b45309)', color: '#000' }}>
                ⭐ BEST VALUE
              </div>
              <div className="px-3 py-2.5 text-center border-b border-amber-500/20"
                style={{ background: 'rgba(245,158,11,0.08)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-0.5">🤝 For Advisors</p>
                <p className="text-white/40 line-through text-[10px] font-semibold">₹4,999/year</p>
                <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
                  <span className="text-3xl font-black leading-none" style={{ color: '#F59E0B' }}>₹499</span>
                  <span className="text-white/50 text-[10px] font-bold">/yr</span>
                </div>
                <div className="inline-flex items-center gap-0.5 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: '#16a34a', color: '#fff' }}>
                  SAVE ₹4,500 · 90% OFF
                </div>
              </div>
              <ul className="px-3 py-2.5 space-y-1.5 text-[10px] text-white/70 flex-1">
                {['Priority listing in search', 'Verified badge on profile', 'Unlimited bookings', '1 year validity'].map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <div className="px-3 pb-3">
                <Link href="/advisors/onboarding" onClick={close}
                  className="w-full py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
                  GRAB NOW <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 text-center space-y-1.5">
            <p className="text-white/25 text-[9px]">
              Launching offer · Valid for 1 year from purchase · No refunds on discounted plans
            </p>
            <button onClick={close}
              className="text-white/35 text-[10px] hover:text-white/65 transition-colors underline underline-offset-2">
              No thanks, remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
