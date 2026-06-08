'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, Clock, CheckCircle2, XCircle, Loader2, AlertTriangle, CalendarClock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface LineItem { id: string; description: string; amount: string; sortOrder: number }
interface FeeQuote {
  id: string;
  status: string;
  categorySlug?: string;
  clientMessage?: string;
  advisorNote?: string;
  totalAmount?: string;
  validUntil?: string;
  viewedAt?: string;
  createdAt: string;
  lineItems: LineItem[];
  advisor: { id: string; fullName: string; avatarUrl?: string };
}

interface Props {
  quote: FeeQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onDeclined?: (quoteId: string) => void;
}

function validityBadge(validUntil?: string): React.ReactNode {
  if (!validUntil) return null;
  const ms = new Date(validUntil).getTime() - Date.now();
  if (ms <= 0) return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-full"><AlertTriangle size={11} /> Expired</span>;
  const hours = Math.floor(ms / 3_600_000);
  const days  = Math.floor(hours / 24);
  const color  = hours < 12 ? 'text-red-400 bg-red-500/10 border-red-500/30' : hours < 24 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  const label  = days >= 1 ? `${days}d ${hours % 24}h left` : `${hours}h left`;
  return <span className={`inline-flex items-center gap-1 text-xs font-bold border px-2.5 py-1 rounded-full ${color}`}><CalendarClock size={11} /> Valid for {label}</span>;
}

export default function FeeQuoteViewModal({ quote, isOpen, onClose, onDeclined }: Props) {
  const router = useRouter();
  const viewedRef  = useRef(false);
  const [declining, setDeclining] = useState(false);
  const [declined,  setDeclined]  = useState(false);
  const [error,     setError]     = useState('');

  // Mark as viewed once on open
  useEffect(() => {
    if (!isOpen || !quote || viewedRef.current) return;
    if (quote.status !== 'QUOTED') return;
    viewedRef.current = true;
    const token = localStorage.getItem('accessToken') || '';
    fetch(`${API}/quotes/${quote.id}/view`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }, [isOpen, quote]);

  // Reset on new quote
  useEffect(() => { viewedRef.current = false; setDeclined(false); setError(''); }, [quote?.id]);

  if (!isOpen || !quote) return null;

  const total = parseFloat(quote.totalAmount ?? '0');
  const isExpired = quote.status === 'EXPIRED' || (quote.validUntil ? new Date(quote.validUntil) < new Date() : false);

  const handleDecline = async () => {
    if (!confirm('Decline this quote? The advisor will be notified.')) return;
    setDeclining(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken') || '';
      const res = await fetch(`${API}/quotes/${quote.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setDeclined(true); onDeclined?.(quote.id); }
      else setError(data.message || 'Failed to decline');
    } catch { setError('Network error. Please try again.'); }
    finally { setDeclining(false); }
  };

  const handleBookNow = () => {
    onClose();
    router.push(`/advisors/${quote.advisor.id}?fee=${total}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', border: '1px solid rgba(212,175,55,0.25)' }}>

        {/* Gold top bar */}
        <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg,#D4AF37,#4F46E5,#D4AF37)' }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)' }}>
              <FileText size={18} style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">Fee Quote</h2>
              <p className="text-white/40 text-xs mt-0.5">from {quote.advisor.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {validityBadge(isExpired ? undefined : quote.validUntil)}
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1 ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="px-6 pb-6 overflow-y-auto flex-1 space-y-4">

          {/* Category chip */}
          {quote.categorySlug && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-full">{quote.categorySlug.toUpperCase()}</span>
              {quote.status === 'ACCEPTED' && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={11} /> Accepted</span>}
              {(quote.status === 'CANCELLED') && <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle size={11} /> Declined</span>}
            </div>
          )}

          {/* Client message */}
          {quote.clientMessage && (
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1">Your Request</p>
              <p className="text-xs text-white/60 leading-relaxed">{quote.clientMessage}</p>
            </div>
          )}

          {/* Fee breakdown table */}
          {quote.lineItems.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-2">Fee Breakdown</p>
              <div className="rounded-xl overflow-hidden border border-white/10">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto] px-4 py-2 bg-white/5 border-b border-white/5">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Description</span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Amount</span>
                </div>
                {/* Line items */}
                {[...quote.lineItems].sort((a, b) => a.sortOrder - b.sortOrder).map((item, idx) => (
                  <div key={item.id}
                    className={`grid grid-cols-[1fr_auto] px-4 py-3 ${idx < quote.lineItems.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <span className="text-sm text-white/80">{item.description}</span>
                    <span className="text-sm text-white/80 font-semibold text-right tabular-nums">
                      ₹{parseFloat(item.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
                {/* Total row */}
                <div className="grid grid-cols-[1fr_auto] px-4 py-3 bg-white/5 border-t border-white/10">
                  <span className="text-sm font-black text-white">Total</span>
                  <span className="text-base font-black tabular-nums" style={{ color: '#D4AF37' }}>
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Advisor note */}
          {quote.advisorNote && (
            <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
              <p className="text-[10px] font-semibold text-blue-300/70 uppercase tracking-wider mb-1">Note from Advisor</p>
              <p className="text-xs text-blue-200/70 leading-relaxed">{quote.advisorNote}</p>
            </div>
          )}

          {/* Expired notice */}
          {isExpired && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-300">This quote has expired. Contact the advisor to request a new one.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-300 text-xs">{error}</div>
          )}

          {/* CTAs */}
          {!declined && !isExpired && ['QUOTED', 'VIEWED'].includes(quote.status) && (
            <div className="flex gap-3 pt-2">
              <button onClick={handleDecline} disabled={declining}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                {declining ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Decline
              </button>
              <button onClick={handleBookNow}
                className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 6px 20px rgba(212,175,55,0.30)' }}>
                Book Now <ArrowRight size={15} />
              </button>
            </div>
          )}

          {(declined || quote.status === 'CANCELLED') && (
            <div className="text-center py-3 text-white/40 text-sm">
              Quote declined. You can request a new one from the advisor&apos;s profile.
            </div>
          )}

          {quote.status === 'ACCEPTED' && (
            <button onClick={handleBookNow}
              className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
              Go to Booking <ArrowRight size={15} />
            </button>
          )}

          <p className="text-[10px] text-white/20 text-center">
            Received {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {quote.validUntil && !isExpired && ` · Valid until ${new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
      </div>
    </div>
  );
}
