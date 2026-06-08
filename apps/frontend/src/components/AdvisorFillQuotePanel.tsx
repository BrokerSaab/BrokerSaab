'use client';

import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, FileText, Loader2, ChevronRight, User, MessageSquare, Tag, Clock, CheckCircle2, Edit3 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface QuoteRequest {
  id: string;
  status: string;
  categorySlug?: string;
  clientMessage?: string;
  createdAt: string;
  client: { id: string; fullName: string; phoneNumber: string };
  // Pre-filled for editing or proactive send
  existingLineItems?: { description: string; amount: string }[];
  existingNote?: string;
  existingTotalAmount?: string;
}

interface Props {
  request: QuoteRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (quoteId: string) => void;
  /** If true, show proactive flow (advisor initiates, no prior request) */
  proactive?: boolean;
}

interface LineRow { description: string; amount: string }
type View = 'detail' | 'compose' | 'success';

export default function AdvisorFillQuotePanel({ request, isOpen, onClose, onSubmitted, proactive }: Props) {
  const [view,          setView]         = useState<View>('detail');
  const [rows,          setRows]         = useState<LineRow[]>([{ description: '', amount: '' }]);
  const [advisorNote,   setAdvisorNote]  = useState('');
  const [validityHours, setValidityHours] = useState(72);
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState('');

  const isEdit = request?.status === 'QUOTED' || request?.status === 'VIEWED';

  // Pre-fill when editing an existing quote
  useEffect(() => {
    if (!isOpen || !request) return;
    if (request.existingLineItems?.length) {
      setRows(request.existingLineItems);
    } else {
      setRows([{ description: '', amount: '' }]);
    }
    setAdvisorNote(request.existingNote ?? '');
    if (isEdit || proactive) setView('compose');
    else setView('detail');
    setError('');
  }, [isOpen, request?.id]);

  if (!isOpen || !request) return null;

  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const addRow  = () => setRows(prev => [...prev, { description: '', amount: '' }]);
  const delRow  = (i: number) => setRows(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);
  const setDesc = (i: number, v: string) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, description: v } : r));
  const setAmt  = (i: number, v: string) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, amount: v } : r));

  const handleSubmit = async () => {
    setError('');
    for (const r of rows) {
      if (!r.description.trim()) { setError('All rows must have a description.'); return; }
      const n = parseFloat(r.amount);
      if (isNaN(n) || n <= 0) { setError('All amounts must be positive numbers.'); return; }
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || '';
      const lineItems = rows.map(r => ({ description: r.description.trim(), amount: parseFloat(r.amount) }));

      let url = `${API}/quotes/${request.id}/submit`;
      let body: any = { lineItems, advisorNote: advisorNote.trim() || undefined, validityHours };

      if (proactive) {
        url  = `${API}/quotes/proactive`;
        body = { clientId: request.client.id, lineItems, advisorNote: advisorNote.trim() || undefined, validityHours, categorySlug: request.categorySlug };
      }

      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setView('success');
        onSubmitted?.(data.data.id ?? request.id);
      } else {
        setError(data.message || 'Failed to submit quote');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleClose = () => {
    setView('detail');
    setRows([{ description: '', amount: '' }]);
    setAdvisorNote('');
    setValidityHours(72);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', border: '1px solid rgba(212,175,55,0.25)' }}>

        <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg,#D4AF37,#4F46E5,#D4AF37)' }} />

        <div className="px-5 pt-4 pb-3 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)' }}>
              {isEdit ? <Edit3 size={16} className="text-indigo-400" /> : <FileText size={16} className="text-indigo-400" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                {view === 'detail'  ? (proactive ? 'Send Fee Quote' : 'Quote Request') :
                 view === 'compose' ? (isEdit ? 'Edit Quote' : proactive ? 'Compose Quote' : 'Compose Quote') :
                                     (isEdit ? 'Quote Updated!' : 'Quote Sent!')}
              </h2>
              <p className="text-white/40 text-xs mt-0.5">{request.client.fullName}</p>
            </div>
          </div>
          {isEdit && view === 'compose' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 mr-1">
              EDITING
            </span>
          )}
          <button onClick={handleClose} className="text-white/30 hover:text-white/70 transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-5 overflow-y-auto flex-1">

          {/* ── DETAIL VIEW (only for new requests) ── */}
          {view === 'detail' && !isEdit && !proactive && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.3)' }}>
                  <User size={15} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{request.client.fullName}</p>
                  <p className="text-xs text-white/40">{request.client.phoneNumber}</p>
                </div>
                <span className="ml-auto text-[10px] text-white/30">
                  {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              {request.categorySlug && (
                <div className="flex items-center gap-2">
                  <Tag size={11} className="text-white/40" />
                  <span className="text-xs font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                    {request.categorySlug.toUpperCase()}
                  </span>
                </div>
              )}

              {request.clientMessage ? (
                <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-[10px] font-semibold text-white/35 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MessageSquare size={10} /> Client&apos;s Message
                  </p>
                  <p className="text-sm text-white/70 leading-relaxed">{request.clientMessage}</p>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-xs text-white/30 italic">No message provided by client.</p>
                </div>
              )}

              <button onClick={() => setView('compose')}
                className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: 'white', boxShadow: '0 6px 20px rgba(79,70,229,0.35)' }}>
                Compose Quote <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* ── COMPOSE VIEW ── */}
          {view === 'compose' && (
            <div className="space-y-3.5">
              {/* Client banner for proactive */}
              {proactive && (
                <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10 flex items-center gap-3">
                  <User size={14} className="text-indigo-300 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">{request.client.fullName}</p>
                    <p className="text-xs text-white/40">{request.client.phoneNumber}</p>
                  </div>
                </div>
              )}

              {isEdit && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 text-xs text-amber-300">
                  You&apos;re editing an existing quote. The client will be notified of the update.
                </div>
              )}

              <p className="text-white/50 text-xs leading-relaxed">
                Add individual service items and their charges. The client will see this as a detailed breakdown.
              </p>

              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={row.description}
                      onChange={e => setDesc(i, e.target.value)}
                      placeholder="Description (e.g. Documentation fee)"
                      className="flex-1 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60 transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">₹</span>
                      <input
                        type="number" min="1"
                        value={row.amount}
                        onChange={e => setAmt(i, e.target.value)}
                        placeholder="0"
                        className="w-full border border-white/15 rounded-xl pl-6 pr-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60 transition-all text-right"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      />
                    </div>
                    <button onClick={() => delRow(i)}
                      className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={addRow}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-xl hover:bg-indigo-500/10">
                  <Plus size={12} /> Add Item
                </button>
                {total > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-white/40">Total: </span>
                    <span className="text-base font-black tabular-nums" style={{ color: '#D4AF37' }}>
                      ₹{total.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1 flex items-center gap-1">
                  <MessageSquare size={10} /> Note for Client <span className="text-white/30 font-normal">(optional)</span>
                </label>
                <textarea
                  value={advisorNote}
                  onChange={e => setAdvisorNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Any additional info, payment terms, disclaimers…"
                  className="w-full border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 transition-all resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1 flex items-center gap-1">
                  <Clock size={10} /> Quote Valid For
                </label>
                <div className="flex gap-2">
                  {[24, 48, 72, 168].map(h => (
                    <button key={h} onClick={() => setValidityHours(h)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        validityHours === h
                          ? 'border-indigo-500/60 text-indigo-300 bg-indigo-500/15'
                          : 'border-white/10 text-white/40 hover:border-white/20'
                      }`}>
                      {h < 48 ? `${h}h` : `${h / 24}d`}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-red-300 text-xs">{error}</div>
              )}

              <div className="flex gap-2.5 pt-1">
                {!isEdit && !proactive && (
                  <button onClick={() => setView('detail')}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-all">
                    Back
                  </button>
                )}
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 6px 20px rgba(212,175,55,0.30)' }}>
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                    : isEdit
                    ? <><Edit3 size={14} /> Update Quote</>
                    : <><FileText size={14} /> Send Quote</>}
                </button>
              </div>
            </div>
          )}

          {/* ── SUCCESS VIEW ── */}
          {view === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(212,175,55,0.15)', border: '2px solid rgba(212,175,55,0.4)' }}>
                <CheckCircle2 size={30} style={{ color: '#D4AF37' }} />
              </div>
              <div>
                <h3 className="text-white font-black text-base">
                  {isEdit ? 'Quote Updated!' : 'Quote Sent!'}
                </h3>
                <p className="text-white/50 text-xs mt-1.5 leading-relaxed">
                  {request.client.fullName} has been notified and can view your fee breakdown now.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl px-4 py-3 text-left border border-white/10">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Total Quoted</p>
                <p className="text-2xl font-black tabular-nums" style={{ color: '#D4AF37' }}>
                  ₹{total.toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={handleClose}
                className="w-full py-3 rounded-xl font-bold text-sm text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
