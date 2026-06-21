'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, RefreshCw, TicketCheck, Plus, X,
  Activity, UserCheck, Lock, Clock, ChevronRight, AlertCircle,
  MessageSquare, Send, ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TicketCategory = 'GENERAL' | 'BILLING' | 'TECHNICAL' | 'BOOKING_ISSUE' | 'ADVISOR_ISSUE' | 'OTHER';

interface TicketActivity {
  action: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  performedByName: string;
  performedByRole: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  closingNotes?: string;
  resolvedAt?: string;
  closedAt?: string;
  assignedToAdmin?: { fullName: string };
  activities: TicketActivity[];
  createdAt: string;
  updatedAt: string;
}

function ActivityIcon({ action }: { action: string }) {
  if (action === 'ASSIGNED') return <UserCheck size={13} className="text-indigo-400 shrink-0" />;
  if (action === 'CLOSED')   return <Lock size={13} className="text-slate-400 shrink-0" />;
  return <Activity size={13} className="text-gold-400 shrink-0" />;
}

export default function ContactPage() {
  const { isLoggedIn, user, openLoginModal } = useAuth();
  const { t } = useLanguage();

  const STATUS_STYLE: Record<TicketStatus, { label: string; bg: string; text: string; border: string }> = {
    OPEN:        { label: t('contact.status.open'),       bg: 'bg-amber-500/10',  text: 'text-amber-400',  border: 'border-amber-500/30' },
    IN_PROGRESS: { label: t('contact.status.inProgress'), bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    RESOLVED:    { label: t('contact.status.resolved'),   bg: 'bg-emerald-500/10',text: 'text-emerald-400',border: 'border-emerald-500/30' },
    CLOSED:      { label: t('contact.status.closed'),     bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/30' },
  };

  const PRIORITY_STYLE: Record<TicketPriority, { label: string; text: string; bg: string }> = {
    LOW:    { label: t('contact.priority.low'),    text: 'text-slate-400',  bg: 'bg-slate-500/10' },
    MEDIUM: { label: t('contact.priority.medium'), text: 'text-blue-400',   bg: 'bg-blue-500/10' },
    HIGH:   { label: t('contact.priority.high'),   text: 'text-amber-400',  bg: 'bg-amber-500/10' },
    URGENT: { label: t('contact.priority.urgent'), text: 'text-red-400',    bg: 'bg-red-500/10' },
  };

  const CATEGORY_LABELS: Record<TicketCategory, string> = {
    GENERAL:       t('contact.category.general'),
    BILLING:       t('contact.category.billing'),
    TECHNICAL:     t('contact.category.technical'),
    BOOKING_ISSUE: t('contact.category.bookingIssue'),
    ADVISOR_ISSUE: t('contact.category.advisorIssue'),
    OTHER:         t('contact.category.other'),
  };

  const activityLabel = (act: TicketActivity): string => {
    if (act.action === 'ASSIGNED') return act.note || t('contact.activity.assigned');
    if (act.action === 'CLOSED')   return t('contact.activity.closed');
    if (act.toStatus)              return `Status â†’ ${act.toStatus.replace('_', ' ')}`;
    return act.note || act.action;
  };

  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [loading, setLoading]         = useState(false);
  const [selected, setSelected]       = useState<Ticket | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState('');

  // New ticket form state
  const [subject,     setSubject]     = useState('');
  const [category,    setCategory]    = useState<TicketCategory>('GENERAL');
  const [priority,    setPriority]    = useState<TicketPriority>('MEDIUM');
  const [description, setDescription] = useState('');

  const token = () => sessionStorage.getItem('accessToken') || '';

  const fetchTickets = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/support/tickets`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
        if (selected) {
          const refreshed = data.tickets.find((t: Ticket) => t.id === selected.id);
          if (refreshed) setSelected(refreshed);
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!subject.trim() || !description.trim()) {
      setSubmitError(t('contact.requiredError'));
      return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), category, priority }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets(prev => [data.ticket, ...prev]);
        setSelected(data.ticket);
        setShowForm(false);
        setSubject(''); setDescription(''); setCategory('GENERAL'); setPriority('MEDIUM');
      } else {
        setSubmitError(data.message || t('contact.failedSubmit'));
      }
    } catch {
      setSubmitError(t('contact.networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  const openNew = () => { setShowForm(true); setSelected(null); };
  const selectTicket = (t: Ticket) => { setSelected(t); setShowForm(false); };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <div className="bg-navy-800 border-b border-gold-500/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <TicketCheck size={18} className="text-gold-400" /> {t('contact.pageTitle')}
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">{t('contact.pageSub')}</p>
            </div>
          </div>
        </div>
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="bg-slate-900 border border-gold-500/10 rounded-2xl p-10 space-y-5">
            <ShieldCheck size={40} className="text-indigo-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">{t('contact.signInTitle')}</h2>
            <p className="text-slate-400 text-sm">{t('contact.signInSub')}</p>
            <button onClick={() => openLoginModal()} className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold">
              {t('contact.signInBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-navy-800 border-b border-gold-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <TicketCheck size={18} className="text-gold-400" /> {t('contact.pageTitle')}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {user?.fullName ? `${t('contact.loggedInAs')} ${user.fullName}` : t('contact.yourTickets')}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openNew}
              className="btn-gold inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
            >
              <Plus size={14} /> {t('contact.raiseTicket')}
            </button>
            <button onClick={fetchTickets} className="text-slate-400 hover:text-gold-400 transition-colors p-2" title="Refresh">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* â”€â”€ Left: Ticket List â”€â”€ */}
          <div className="lg:w-2/5 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('contact.myTickets')} {tickets.length > 0 && <span className="ml-1 text-indigo-400">({tickets.length})</span>}
            </p>

            {loading && tickets.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" /> {t('contact.loading')}
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl px-5 py-10 text-center">
                <MessageSquare size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">{t('contact.noTickets')}</p>
                <p className="text-slate-500 text-xs mt-1">{t('contact.raiseHint')}</p>
              </div>
            ) : (
              tickets.map(t => {
                const s = STATUS_STYLE[t.status as TicketStatus] || STATUS_STYLE.OPEN;
                const p = PRIORITY_STYLE[t.priority as TicketPriority] || PRIORITY_STYLE.MEDIUM;
                const isActive = selected?.id === t.id && !showForm;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectTicket(t)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all hover:border-indigo-500/30 ${
                      isActive
                        ? 'bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/20'
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono text-gold-400/80 font-bold">{t.ticketNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate mb-2">{t.subject}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                        {p.label}
                      </span>
                      <span className="text-[10px] text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[t.category as TicketCategory] || t.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <ChevronRight size={13} className="text-slate-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* â”€â”€ Right: Form or Detail â”€â”€ */}
          <div className="lg:w-3/5">

            {/* New Ticket Form */}
            {showForm && (
              <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus size={16} className="text-gold-400" /> {t('contact.newTicket')}
                  </h2>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                      <AlertCircle size={14} /> {submitError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">{t('contact.subject')} *</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder={t('contact.subjectPlaceholder')}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      maxLength={200}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">{t('contact.category')}</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as TicketCategory)}
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                      >
                        {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map(k => (
                          <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">{t('contact.priorityLabel')}</label>
                      <select
                        value={priority}
                        onChange={e => setPriority(e.target.value as TicketPriority)}
                        className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors appearance-none"
                      >
                        <option value="LOW">{t('contact.priority.low')}</option>
                        <option value="MEDIUM">{t('contact.priority.medium')}</option>
                        <option value="HIGH">{t('contact.priority.high')}</option>
                        <option value="URGENT">{t('contact.priority.urgent')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">{t('contact.description')} *</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={t('contact.descPlaceholder')}
                      rows={5}
                      maxLength={2000}
                      className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                    <p className="text-[10px] text-slate-600 mt-1 text-right">{description.length}/2000</p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-gold w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                  >
                    {submitting ? <><Loader2 size={15} className="animate-spin" /> {t('contact.submitting')}</> : <><Send size={15} /> {t('contact.submit')}</>}
                  </button>
                </form>
              </div>
            )}

            {/* Ticket Detail */}
            {!showForm && selected && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-gold-400">{selected.ticketNumber}</span>
                    <h3 className="text-base font-bold text-white mt-1">{selected.subject}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white transition-colors mt-1">
                    <X size={16} />
                  </button>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const s = STATUS_STYLE[selected.status as TicketStatus] || STATUS_STYLE.OPEN;
                    return <span className={`text-xs font-bold px-3 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>{s.label}</span>;
                  })()}
                  {(() => {
                    const p = PRIORITY_STYLE[selected.priority as TicketPriority] || PRIORITY_STYLE.MEDIUM;
                    return <span className={`text-xs font-semibold px-3 py-1 rounded-full ${p.bg} ${p.text}`}>{p.label} {t('contact.priorityLabel')}</span>;
                  })()}
                  <span className="text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full">
                    {CATEGORY_LABELS[selected.category as TicketCategory] || selected.category}
                  </span>
                  {selected.assignedToAdmin && (
                    <span className="text-xs text-slate-300 bg-slate-500/10 px-3 py-1 rounded-full flex items-center gap-1">
                      <UserCheck size={11} /> {selected.assignedToAdmin.fullName}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selected.description}
                </div>

                {/* Closing Notes */}
                {selected.closingNotes && (
                  <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lock size={11} /> {t('contact.closingNotes')}
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{selected.closingNotes}</p>
                  </div>
                )}

                {/* Activity Timeline */}
                {selected.activities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('contact.activityTimeline')}</p>
                    <div className="space-y-3">
                      {selected.activities.map((act, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            <ActivityIcon action={act.action} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 font-medium">{activityLabel(act)}</p>
                            {act.note && act.action !== 'ASSIGNED' && (
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{act.note}</p>
                            )}
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              {act.performedByName} Â· {new Date(act.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-600">
                  {t('contact.raisedOn')} {new Date(selected.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            {/* Empty right pane */}
            {!showForm && !selected && (
              <div className="hidden lg:flex items-center justify-center h-64 border border-dashed border-slate-800 rounded-2xl">
                <div className="text-center space-y-2">
                  <TicketCheck size={32} className="text-slate-700 mx-auto" />
                  <p className="text-slate-500 text-sm">{t('contact.selectOrRaise')}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
