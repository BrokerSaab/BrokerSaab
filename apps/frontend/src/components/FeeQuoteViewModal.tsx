'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, FileText, Clock, CheckCircle2, XCircle, Loader2,
  AlertTriangle, CalendarClock, ArrowRight, Wallet, CreditCard, ShieldCheck
} from 'lucide-react';

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
  serviceTicket?: { id: string; ticketNumber: string; status: string } | null;
}

interface Props {
  quote: FeeQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onDeclined?: (quoteId: string) => void;
  onAccepted?: (quoteId: string, ticketId: string) => void;
}

type View = 'quote' | 'payment' | 'success';
type Gateway = 'WALLET' | 'RAZORPAY' | 'STRIPE';

function validityBadge(validUntil?: string): React.ReactNode {
  if (!validUntil) return null;
  const ms = new Date(validUntil).getTime() - Date.now();
  if (ms <= 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-full">
      <AlertTriangle size={11} /> Expired
    </span>
  );
  const hours = Math.floor(ms / 3_600_000);
  const days  = Math.floor(hours / 24);
  const color = hours < 12
    ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : hours < 24
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  const label = days >= 1 ? `${days}d ${hours % 24}h left` : `${hours}h left`;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold border px-2.5 py-1 rounded-full ${color}`}>
      <CalendarClock size={11} /> Valid for {label}
    </span>
  );
}

export default function FeeQuoteViewModal({ quote, isOpen, onClose, onDeclined, onAccepted }: Props) {
  const router  = useRouter();
  const viewedRef = useRef(false);
  const [view,     setView]     = useState<View>('quote');
  const [gateway,  setGateway]  = useState<Gateway>('WALLET');
  const [paying,   setPaying]   = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declined,  setDeclined]  = useState(false);
  const [ticketId,  setTicketId]  = useState('');
  const [ticketNum, setTicketNum] = useState('');
  const [error,     setError]     = useState('');

  // Auto-mark as viewed
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
  useEffect(() => {
    viewedRef.current = false;
    setView('quote');
    setDeclined(false);
    setError('');
    setTicketId('');
    setTicketNum('');
  }, [quote?.id]);

  if (!isOpen || !quote) return null;

  const total     = parseFloat(quote.totalAmount ?? '0');
  const isExpired = quote.status === 'EXPIRED' || (quote.validUntil ? new Date(quote.validUntil) < new Date() : false);
  const canAct    = !declined && !isExpired && ['QUOTED', 'VIEWED'].includes(quote.status);
  const hasTicket = !!quote.serviceTicket;

  const handleDecline = async () => {
    if (!confirm('Decline this quote? The advisor will be notified.')) return;
    setDeclining(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken') || '';
      const res  = await fetch(`${API}/quotes/${quote.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) { setDeclined(true); onDeclined?.(quote.id); }
      else setError(data.message || 'Failed to decline');
    } catch { setError('Network error.'); }
    finally { setDeclining(false); }
  };

  const handleAcceptAndPay = async () => {
    setPaying(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken') || '';
      // Accept the quote first
      await fetch(`${API}/quotes/${quote.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Then process payment and create ticket
      const res  = await fetch(`${API}/payments/quote-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quoteId: quote.id, gateway }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketId(data.data.ticket.id);
        setTicketNum(data.data.ticket.ticketNumber);
        setView('success');
        onAccepted?.(quote.id, data.data.ticket.id);
      } else {
        setError(data.message || 'Payment failed. Please try again.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setPaying(false); }
  };

  const GATEWAYS: { id: Gateway; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'WALLET',  label: 'BrokerSaab Wallet', icon: <Wallet size={16} />,    desc: 'Instant, no fees' },
    { id: 'RAZORPAY',label: 'Razorpay',          icon: <CreditCard size={16} />, desc: 'UPI / Card / Net Banking' },
    { id: 'STRIPE',  label: 'Stripe',             icon: <CreditCard size={16} />, desc: 'International cards' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', border: '1px solid rgba(212,175,55,0.25)' }}
      >
        {/* Gold top bar */}
        <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg,#D4AF37,#4F46E5,#D4AF37)' }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)' }}>
              <FileText size={16} style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                {view === 'quote'   ? 'Fee Quote'    :
                 view === 'payment' ? 'Choose Payment' :
                                     'Payment Done!'}
              </h2>
              <p className="text-white/40 text-xs mt-0.5">from {quote.advisor.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'quote' && validityBadge(isExpired ? undefined : quote.validUntil)}
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1 ml-1">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── QUOTE VIEW ── */}
        {view === 'quote' && (
          <div className="px-5 pb-5 overflow-y-auto flex-1 space-y-3">

            {/* Category + status chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {quote.categorySlug && (
                <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  {quote.categorySlug.toUpperCase()}
                </span>
              )}
              {quote.status === 'ACCEPTED' && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} /> Accepted
                </span>
              )}
              {quote.status === 'CANCELLED' && (
                <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <XCircle size={10} /> Declined
                </span>
              )}
              {quote.viewedAt && quote.status !== 'ACCEPTED' && (
                <span className="text-xs text-blue-300/70 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                  Seen by you
                </span>
              )}
            </div>

            {/* Client message */}
            {quote.clientMessage && (
              <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1">Your Request</p>
                <p className="text-xs text-white/60 leading-relaxed">{quote.clientMessage}</p>
              </div>
            )}

            {/* Fee breakdown table */}
            {quote.lineItems.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1.5">Fee Breakdown</p>
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <div className="grid grid-cols-[1fr_auto] px-3 py-2 bg-white/5 border-b border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Description</span>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider text-right">Amount</span>
                  </div>
                  {[...quote.lineItems].sort((a, b) => a.sortOrder - b.sortOrder).map((item, idx) => (
                    <div key={item.id}
                      className={`grid grid-cols-[1fr_auto] px-3 py-2.5 ${idx < quote.lineItems.length - 1 ? 'border-b border-white/5' : ''}`}>
                      <span className="text-sm text-white/80">{item.description}</span>
                      <span className="text-sm text-white/80 font-semibold text-right tabular-nums">
                        ₹{parseFloat(item.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_auto] px-3 py-2.5 bg-white/5 border-t border-white/10">
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
              <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-3 py-2.5">
                <p className="text-[10px] font-semibold text-blue-300/70 uppercase tracking-wider mb-1">Note from Advisor</p>
                <p className="text-xs text-blue-200/70 leading-relaxed">{quote.advisorNote}</p>
              </div>
            )}

            {/* Expired */}
            {isExpired && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <AlertTriangle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-300">This quote has expired. Contact the advisor to request a new one.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-300 text-xs">{error}</div>
            )}

            {/* Ticket already exists */}
            {hasTicket && quote.serviceTicket && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-300">Work Ticket Active</p>
                    <p className="text-[10px] text-emerald-400/70">{quote.serviceTicket.ticketNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => { onClose(); router.push(`/tickets/${quote.serviceTicket!.id}`); }}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-2">
                  View Ticket
                </button>
              </div>
            )}

            {/* CTAs */}
            {canAct && !hasTicket && (
              <div className="flex gap-2.5 pt-1">
                <button onClick={handleDecline} disabled={declining}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {declining ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  Decline
                </button>
                <button onClick={() => setView('payment')}
                  className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 6px 20px rgba(212,175,55,0.30)' }}>
                  Accept & Pay <ArrowRight size={14} />
                </button>
              </div>
            )}

            {(declined || quote.status === 'CANCELLED') && (
              <div className="text-center py-2 text-white/40 text-sm">
                Quote declined. You can request a new one from the advisor&apos;s profile.
              </div>
            )}

            {quote.status === 'ACCEPTED' && !hasTicket && (
              <button onClick={() => setView('payment')}
                className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                Pay Now to Start Work <ArrowRight size={14} />
              </button>
            )}

            <p className="text-[10px] text-white/20 text-center">
              Received {new Date(quote.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {quote.validUntil && !isExpired && ` · Valid until ${new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
        )}

        {/* ── PAYMENT VIEW ── */}
        {view === 'payment' && (
          <div className="px-5 pb-5 overflow-y-auto flex-1 space-y-4">
            <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10 flex items-center justify-between">
              <span className="text-white/60 text-sm">Amount to pay</span>
              <span className="text-xl font-black tabular-nums" style={{ color: '#D4AF37' }}>₹{total.toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={13} className="text-amber-400 shrink-0" />
                <p className="text-xs font-bold text-amber-300">BrokerSaab Escrow Protection</p>
              </div>
              <p className="text-[11px] text-amber-200/60 leading-relaxed">
                Your payment is held securely. Money is released to the advisor only after you close the work ticket.
                Each stage requires your confirmation before the advisor proceeds.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-2">Payment Method</p>
              <div className="space-y-2">
                {GATEWAYS.map(g => (
                  <button key={g.id} onClick={() => setGateway(g.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      gateway === g.id
                        ? 'border-indigo-500/60 bg-indigo-500/15'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}>
                    <span className={gateway === g.id ? 'text-indigo-300' : 'text-white/40'}>{g.icon}</span>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-bold ${gateway === g.id ? 'text-white' : 'text-white/60'}`}>{g.label}</p>
                      <p className="text-[10px] text-white/30">{g.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      gateway === g.id ? 'border-indigo-400' : 'border-white/20'
                    }`}>
                      {gateway === g.id && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-300 text-xs">{error}</div>
            )}

            <div className="flex gap-2.5 pt-1">
              <button onClick={() => { setView('quote'); setError(''); }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-all">
                Back
              </button>
              <button onClick={handleAcceptAndPay} disabled={paying}
                className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 6px 20px rgba(212,175,55,0.30)' }}>
                {paying
                  ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                  : <>Pay ₹{total.toLocaleString('en-IN')} <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ── SUCCESS VIEW ── */}
        {view === 'success' && (
          <div className="px-5 pb-5 overflow-y-auto flex-1">
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(212,175,55,0.15)', border: '2px solid rgba(212,175,55,0.4)' }}>
                <CheckCircle2 size={30} style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <h3 className="text-white font-black text-base">Payment Successful!</h3>
                <p className="text-white/50 text-xs mt-1.5 leading-relaxed">
                  Work ticket <span className="text-white font-bold">{ticketNum}</span> has been created.
                  Money is securely held until you close the ticket.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10 text-left space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <ShieldCheck size={12} className="text-emerald-400" /> Payment held in escrow
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <CheckCircle2 size={12} className="text-indigo-400" /> Advisor will add stages for your confirmation
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Clock size={12} className="text-amber-400" /> Close ticket when work is done to release payment
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-all">
                  Close
                </button>
                <button
                  onClick={() => { onClose(); router.push(`/tickets/${ticketId}`); }}
                  className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: 'white' }}>
                  Track Ticket <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
