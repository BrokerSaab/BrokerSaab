'use client';

import React, { useState } from 'react';
import { X, Calculator, ChevronDown, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: 'CLIENT' | 'ADVISOR';
}

/* ── shared fee formulas (must mirror backend exactly) ── */
function calcClientFees(base: number) {
  const gatewayFee  = parseFloat((base * 0.015).toFixed(2));
  const platformFee = base <= 3000 ? 30 : base <= 5000 ? 50 : parseFloat((base * 0.01).toFixed(2));
  const clientTotal = parseFloat((base + gatewayFee + platformFee).toFixed(2));
  return { gatewayFee, platformFee, clientTotal };
}

function calcAdvisorFees(base: number) {
  const commission       = parseFloat((base * 0.15).toFixed(2));
  const net              = parseFloat((base - commission).toFixed(2));
  const advGatewayFee    = parseFloat((net * 0.015).toFixed(2));
  const advPlatformFee   = net <= 3000 ? 30 : net <= 5000 ? 50 : parseFloat((net * 0.01).toFixed(2));
  const advisorPayout    = parseFloat((net - advGatewayFee - advPlatformFee).toFixed(2));
  return { commission, net, advGatewayFee, advPlatformFee, advisorPayout };
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function platformFeeLabel(amount: number) {
  return amount <= 3000 ? 'flat ₹30' : amount <= 5000 ? 'flat ₹50' : '1%';
}

/* ── component ────────────────────────────────────────── */
export default function FeeCalculatorModal({ isOpen, onClose, role }: Props) {
  const [raw, setRaw] = useState('');
  const [showTiers, setShowTiers] = useState(false);

  if (!isOpen) return null;

  const amount = parseFloat(raw) || 0;
  const hasAmount = amount > 0;

  const isAdvisor = role === 'ADVISOR';

  /* derived */
  const clientFees  = hasAmount ? calcClientFees(amount) : null;
  const advisorFees = hasAmount ? calcAdvisorFees(amount) : null;

  /* ── row helpers ── */
  const Row = ({ label, value, sub, red, bold, green, divider }: {
    label: string; value: string; sub?: string;
    red?: boolean; bold?: boolean; green?: boolean; divider?: boolean;
  }) => (
    <>
      {divider && <div className="border-t border-white/10 my-1" />}
      <div className={`flex items-center justify-between py-1.5 ${divider ? 'pt-2.5' : ''}`}>
        <div>
          <span className={`text-xs ${bold ? 'font-black text-white' : 'text-white/60'}`}>{label}</span>
          {sub && <span className="text-[10px] text-white/30 ml-1">{sub}</span>}
        </div>
        <span className={`text-sm font-bold tabular-nums ${
          green ? 'text-emerald-400' : red ? 'text-red-400' : bold ? 'text-white' : 'text-white/80'
        }`}>{value}</span>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', border: '1px solid rgba(212,175,55,0.25)' }}
      >
        {/* Gold accent bar */}
        <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg,#D4AF37,#4F46E5,#D4AF37)' }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)' }}>
              <Calculator size={16} style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                {isAdvisor ? 'What will I earn?' : 'What will I pay?'}
              </h2>
              <p className="text-white/40 text-xs mt-0.5">
                {isAdvisor ? 'BrokerSaab fee breakdown for advisors' : 'BrokerSaab fee breakdown for clients'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-6 overflow-y-auto flex-1 space-y-4">

          {/* Amount input */}
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">
              {isAdvisor ? 'Enter your quote amount (₹)' : 'Enter advisory service amount (₹)'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-amber-400">₹</span>
              <input
                type="number"
                min="0"
                value={raw}
                onChange={e => setRaw(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-9 pr-4 py-3 rounded-xl text-lg font-black text-white bg-white/8 border border-white/15 focus:border-amber-400/60 focus:outline-none focus:bg-white/10 transition-all placeholder:text-white/20 tabular-nums"
              />
            </div>
          </div>

          {/* ── CLIENT VIEW ── */}
          {!isAdvisor && clientFees && hasAmount && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <div className="px-4 py-2.5 bg-white/5 border-b border-white/10">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Client pays</p>
              </div>
              <div className="px-4 py-2">
                <Row label="Advisory Service Fee"           value={`₹${fmt(amount)}`} />
                <Row label="Platform Fee"  sub={`(${platformFeeLabel(amount)})`}    value={`₹${fmt(clientFees.platformFee)}`} />
                <Row label="Payment Gateway Fee"  sub="(1.5%)"                       value={`₹${fmt(clientFees.gatewayFee)}`} />
                <Row label="Total Payable" value={`₹${fmt(clientFees.clientTotal)}`} bold divider />
              </div>
              <div className="px-4 pb-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <Info size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-200/70 leading-relaxed">
                    Advisory fee (₹{fmt(amount)}) is held in escrow until work is confirmed. Platform and gateway fees are <span className="text-red-400 font-semibold">non-refundable</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ADVISOR VIEW ── */}
          {isAdvisor && advisorFees && clientFees && hasAmount && (
            <>
              {/* What client pays — for advisor's awareness */}
              <div className="rounded-xl overflow-hidden border border-indigo-500/20 bg-indigo-500/5">
                <div className="px-4 py-2.5 bg-indigo-500/10 border-b border-indigo-500/15">
                  <p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-wider">Client will pay</p>
                </div>
                <div className="px-4 py-2">
                  <Row label="Advisory Fee (your quote)"          value={`₹${fmt(amount)}`} />
                  <Row label="Platform Fee"  sub={`(${platformFeeLabel(amount)})`}           value={`₹${fmt(clientFees.platformFee)}`} />
                  <Row label="Gateway Fee"   sub="(1.5%)"                                    value={`₹${fmt(clientFees.gatewayFee)}`} />
                  <Row label="Client's Total" value={`₹${fmt(clientFees.clientTotal)}`} bold divider />
                </div>
              </div>

              {/* What advisor earns */}
              <div className="rounded-xl overflow-hidden border border-amber-500/25">
                <div className="px-4 py-2.5 border-b border-white/10" style={{ background: 'rgba(212,175,55,0.1)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#D4AF37' }}>Your earnings breakdown</p>
                </div>
                <div className="px-4 py-2">
                  <Row label="Quote Amount"                                                          value={`₹${fmt(amount)}`} />
                  <Row label={`Platform Commission`}  sub="(15%)"      red                           value={`− ₹${fmt(advisorFees.commission)}`} />
                  <Row label="Sub-total after commission"                                             value={`₹${fmt(advisorFees.net)}`}          divider />
                  <Row label="Payment Gateway Fee"    sub="(1.5%)"     red                           value={`− ₹${fmt(advisorFees.advGatewayFee)}`} />
                  <Row
                    label="Platform Fee"
                    sub={`(${platformFeeLabel(advisorFees.net)})`}
                    red
                    value={`− ₹${fmt(advisorFees.advPlatformFee)}`}
                  />
                  <Row label="You Actually Receive"                    green bold divider             value={`₹${fmt(advisorFees.advisorPayout)}`} />
                </div>
                <div className="px-4 pb-3">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                    <Info size={12} className="text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-orange-200/70 leading-relaxed">
                      Gateway fee (₹{fmt(advisorFees.advGatewayFee)}) and platform fee (₹{fmt(advisorFees.advPlatformFee)}) are deducted from your payout and are <span className="text-red-400 font-semibold">non-refundable</span>.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!hasAmount && (
            <div className="text-center py-6 text-white/25 text-sm">
              Enter an amount above to see the breakdown
            </div>
          )}

          {/* Fee tiers reference */}
          <button
            onClick={() => setShowTiers(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
          >
            <span className="text-xs font-semibold text-white/50">View Platform Fee Tiers</span>
            <ChevronDown size={14} className={`text-white/30 transition-transform ${showTiers ? 'rotate-180' : ''}`} />
          </button>

          {showTiers && (
            <div className="rounded-xl overflow-hidden border border-white/10 text-xs">
              <div className="grid grid-cols-3 px-4 py-2 bg-white/5 border-b border-white/10">
                <span className="font-bold text-white/40 uppercase tracking-wider text-[10px]">Amount</span>
                <span className="font-bold text-white/40 uppercase tracking-wider text-[10px] text-center">Client Fee</span>
                <span className="font-bold text-white/40 uppercase tracking-wider text-[10px] text-right">Advisor Fee</span>
              </div>
              {[
                { range: 'Up to ₹3,000',      client: '₹30 flat',   advisor: '₹30 flat' },
                { range: '₹3,001 – ₹5,000',   client: '₹50 flat',   advisor: '₹50 flat (of net)' },
                { range: 'Above ₹5,000',       client: '1% of quote', advisor: '1% of net' },
              ].map((row, i) => (
                <div key={i} className={`grid grid-cols-3 px-4 py-2.5 ${i < 2 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-white/60">{row.range}</span>
                  <span className="text-amber-400 text-center">{row.client}</span>
                  <span className="text-indigo-400 text-right">{row.advisor}</span>
                </div>
              ))}
              <div className="px-4 py-2 bg-white/3 border-t border-white/10">
                <p className="text-[10px] text-white/30">Payment Gateway Fee: 1.5% charged to both client and advisor separately.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
