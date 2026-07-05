'use client';

import React, { useState } from 'react';
import { X, Calculator, ChevronDown, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: 'CLIENT' | 'ADVISOR';
}

/* ── Fee structure:
   - Gateway Fee: 1.5% of quote amount (always)
   - Platform Fee: flat ₹30 (≤₹3,000), flat ₹50 (₹3,001–5,000), 1% (>₹5,000)
   - No commission.
─────────────────────────────────────────── */
function calcFees(base: number) {
  const gatewayFee  = parseFloat((base * 0.015).toFixed(2));
  const platformFee = base <= 3000 ? 30 : base <= 5000 ? 50 : parseFloat((base * 0.01).toFixed(2));
  const clientTotal = parseFloat((base + gatewayFee + platformFee).toFixed(2));
  const advisorPayout = parseFloat((base - gatewayFee - platformFee).toFixed(2));
  return { gatewayFee, platformFee, clientTotal, advisorPayout };
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function platformFeeLabel(amount: number) {
  return amount <= 3000 ? 'flat ₹30' : amount <= 5000 ? 'flat ₹50' : '1%';
}

/* ── component ────────────────────────────────────────── */
export default function FeeCalculatorModal({ isOpen, onClose, role }: Props) {
  const [raw, setRaw]             = useState('');
  const [showTiers, setShowTiers] = useState(false);

  if (!isOpen) return null;

  const amount    = parseFloat(raw) || 0;
  const hasAmount = amount > 0;
  const isAdvisor = role === 'ADVISOR';
  const fees      = hasAmount ? calcFees(amount) : null;

  /* ── row helper ── */
  const Row = ({ label, value, sub, red, bold, green, divider }: {
    label: string; value: string; sub?: string;
    red?: boolean; bold?: boolean; green?: boolean; divider?: boolean;
  }) => (
    <>
      {divider && <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2px 0' }} />}
      <div className={`flex items-center justify-between ${divider ? 'pt-1.5' : 'py-0.5'}`}>
        <div className="flex items-center gap-1 min-w-0">
          <span className={`text-xs truncate ${bold ? 'font-bold text-white' : 'text-white/60'}`}>{label}</span>
          {sub && <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</span>}
        </div>
        <span className={`text-xs font-bold tabular-nums shrink-0 ml-2 ${
          green ? 'text-emerald-400' : red ? 'text-red-400' : bold ? 'text-white' : 'text-white/80'
        }`}>{value}</span>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-[400px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, #0B1F3A 0%, #111827 50%, #1a1040 100%)',
          border: '1px solid rgba(212,175,55,0.3)',
          maxHeight: 'min(92dvh, 560px)',
        }}
      >
        {/* Gold–indigo accent bar */}
        <div className="h-0.5 w-full shrink-0"
          style={{ background: 'linear-gradient(90deg, #D4AF37 0%, #4F46E5 50%, #D4AF37 100%)' }} />

        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)' }}>
              <Calculator size={15} style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                {isAdvisor ? 'What will I earn?' : 'What will I pay?'}
              </h2>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isAdvisor ? 'Advisor fee breakdown' : 'Client fee breakdown'}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X size={14} />
          </button>
        </div>

        {/* Divider */}
        <div className="shrink-0 mx-4" style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

        {/* Scrollable body */}
        <div className="px-4 py-3 overflow-y-auto flex-1 space-y-2.5">

          {/* Amount input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5"
              style={{ color: 'rgba(212,175,55,0.7)' }}>
              {isAdvisor ? 'Enter your quote amount (₹)' : 'Enter advisory service amount (₹)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-black"
                style={{ color: '#D4AF37' }}>₹</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={raw}
                onChange={e => setRaw(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-8 pr-3 py-2 rounded-xl text-base font-black tabular-nums focus:outline-none"
                style={{
                  background: 'rgba(11, 31, 58, 0.95)',
                  border: '1px solid rgba(79, 70, 229, 0.45)',
                  color: '#ffffff',
                  caretColor: '#D4AF37',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = 'rgba(212,175,55,0.7)';
                  e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(212,175,55,0.12)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.45)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
              />
            </div>
          </div>

          {/* ── CLIENT VIEW ── */}
          {!isAdvisor && fees && hasAmount && (
            <div className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.04)' }}>
              <div className="px-3 py-1.5 border-b"
                style={{ borderColor: 'rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.09)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#D4AF37' }}>You pay</p>
              </div>
              <div className="px-3 py-2">
                <Row label="Advisory Service Fee"  value={`₹${fmt(amount)}`} />
                <Row label="Gateway Fee"  sub="(1.5%)"  value={`₹${fmt(fees.gatewayFee)}`} />
                <Row label="Platform Fee" sub={`(${platformFeeLabel(amount)})`} value={`₹${fmt(fees.platformFee)}`} />
                <Row label="Total Payable" value={`₹${fmt(fees.clientTotal)}`} bold divider />
              </div>
              <div className="px-3 pb-2">
                <div className="rounded-lg px-2.5 py-1.5 flex items-start gap-1.5"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Info size={11} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
                  <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(253,230,138,0.75)' }}>
                    Advisory fee held in escrow. Gateway & platform fees are{' '}
                    <span className="text-red-400 font-semibold">non-refundable</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ADVISOR VIEW ── */}
          {isAdvisor && fees && hasAmount && (
            <>
              {/* Client total — for advisor awareness */}
              <div className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(79,70,229,0.25)', background: 'rgba(79,70,229,0.05)' }}>
                <div className="px-3 py-1.5 border-b"
                  style={{ borderColor: 'rgba(79,70,229,0.2)', background: 'rgba(79,70,229,0.12)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#818CF8' }}>Client will pay</p>
                </div>
                <div className="px-3 py-2">
                  <Row label="Advisory Fee (your quote)" value={`₹${fmt(amount)}`} />
                  <Row label="Gateway Fee" sub="(1.5%)"  value={`₹${fmt(fees.gatewayFee)}`} />
                  <Row label="Platform Fee" sub={`(${platformFeeLabel(amount)})`} value={`₹${fmt(fees.platformFee)}`} />
                  <Row label="Client's Total" value={`₹${fmt(fees.clientTotal)}`} bold divider />
                </div>
              </div>

              {/* Advisor earnings */}
              <div className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.04)' }}>
                <div className="px-3 py-1.5 border-b"
                  style={{ borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.1)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#D4AF37' }}>Your earnings</p>
                </div>
                <div className="px-3 py-2">
                  <Row label="Quote Amount"                                              value={`₹${fmt(amount)}`} />
                  <Row label="Gateway Fee"  sub="(1.5%)"  red                           value={`− ₹${fmt(fees.gatewayFee)}`} />
                  <Row label="Platform Fee" sub={`(${platformFeeLabel(amount)})`} red    value={`− ₹${fmt(fees.platformFee)}`} />
                  <Row label="You Receive"              green bold divider               value={`₹${fmt(fees.advisorPayout)}`} />
                </div>
                <div className="px-3 pb-2">
                  <div className="rounded-lg px-2.5 py-1.5 flex items-start gap-1.5"
                    style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
                    <Info size={11} className="shrink-0 mt-0.5" style={{ color: '#FB923C' }} />
                    <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(254,215,170,0.75)' }}>
                      {`Gateway fee (1.5%) + Platform fee (${platformFeeLabel(amount)}) deducted — non-refundable.`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!hasAmount && (
            <div className="text-center py-4 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Enter an amount above to see the breakdown
            </div>
          )}

          {/* Fee tiers toggle */}
          <button
            onClick={() => setShowTiers(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Fee Schedule</span>
            <ChevronDown size={13} className={`transition-transform ${showTiers ? 'rotate-180' : ''}`}
              style={{ color: 'rgba(255,255,255,0.35)' }} />
          </button>

          {showTiers && (
            <div className="rounded-xl overflow-hidden text-xs" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="grid grid-cols-3 px-3 py-1.5"
                style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Amount', 'Gateway', 'Platform'].map(h => (
                  <span key={h} className={`font-bold text-[10px] uppercase tracking-wider ${h !== 'Amount' ? 'text-center' : ''}`}
                    style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</span>
                ))}
              </div>
              {[
                { range: '₹0 – ₹3,000', gateway: '1.5%', platform: 'Flat ₹30' },
                { range: '₹3,001 – ₹5,000', gateway: '1.5%', platform: 'Flat ₹50' },
                { range: 'Above ₹5,000', gateway: '1.5%', platform: '1%' },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-3 px-3 py-2"
                  style={{ borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>{row.range}</span>
                  <span className="text-center" style={{ color: '#D4AF37' }}>{row.gateway}</span>
                  <span className="text-center" style={{ color: '#818CF8' }}>{row.platform}</span>
                </div>
              ))}
              <div className="px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Platform fee is a flat ₹30/₹50 for smaller quotes, or 1% once the quote exceeds ₹5,000.
                </p>
              </div>
            </div>
          )}

          <div className="h-1" />
        </div>
      </div>
    </div>
  );
}
