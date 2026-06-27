'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, RefreshCw, Ticket, AlertCircle,
  CheckCircle2, Clock, FileText, Image as ImageIcon, Paperclip, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

interface TicketAttachment {
  id: string; fileUrl: string; fileName: string; fileType: string;
  uploaderName: string; uploaderRole: string; createdAt: string;
}

interface TicketActivity {
  action: string; fromStatus?: string; toStatus?: string;
  note?: string; performedByName: string; performedByRole: string; createdAt: string;
}

interface SupportTicket {
  id: string; ticketNumber: string; subject: string; description: string;
  category: string; priority: string; status: string;
  closingNotes?: string; resolvedAt?: string; closedAt?: string;
  attachments: TicketAttachment[];
  activities: TicketActivity[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OPEN:        { label: 'Open',        color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: <Clock size={11} /> },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <RefreshCw size={11} /> },
  RESOLVED:    { label: 'Resolved',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={11} /> },
  CLOSED:      { label: 'Closed',      color: 'bg-slate-50 text-slate-500 border-slate-200',   icon: <CheckCircle2 size={11} /> },
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: 'text-red-600', HIGH: 'text-amber-600', MEDIUM: 'text-blue-600', LOW: 'text-slate-400',
};

export default function SupportPage() {
  const { isLoggedIn, authReady, user } = useAuth();
  const router = useRouter();

  const [tickets, setTickets]   = useState<SupportTicket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) { router.push('/auth/admin'); return; }
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoggedIn]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res   = await fetch(`${API}/support/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  if (!authReady || loading) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center">
        <Loader2 size={26} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href={user?.role === 'ADVISOR' ? '/advisor/dashboard' : '/'} className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Ticket size={15} className="text-indigo-500" /> My Support Tickets
            </h1>
            <p className="text-xs text-slate-400">{user?.fullName}</p>
          </div>
          <button onClick={fetchTickets} className="text-slate-400 hover:text-slateigo-600 transition-colors p-2">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Raise a new ticket CTA */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-indigo-800">Need help?</p>
            <p className="text-xs text-indigo-600">Use the chat widget (bottom-right) to raise a new support ticket with attachments.</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
            <Ticket size={18} className="text-indigo-600" />
          </div>
        </div>

        {/* Ticket list */}
        {tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <Ticket size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm font-medium">No support tickets yet</p>
            <p className="text-slate-400 text-xs mt-1">Open the chat widget to raise your first ticket</p>
          </div>
        ) : (
          tickets.map(ticket => {
            const sc      = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
            const isOpen  = expanded === ticket.id;
            return (
              <div key={ticket.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Ticket header — always visible */}
                <button
                  onClick={() => setExpanded(isOpen ? null : ticket.id)}
                  className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-600">{ticket.ticketNumber}</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </span>
                      <span className={`text-[10px] font-semibold ${PRIORITY_COLOR[ticket.priority] ?? 'text-slate-400'}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                        {ticket.category?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate">{ticket.subject}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {ticket.attachments?.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-slate-400">
                          <Paperclip size={10} /> {ticket.attachments.length}
                        </span>
                      )}
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={15} className="text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown size={15} className="text-slate-400 shrink-0 mt-0.5" />}
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-50">

                    {/* Description */}
                    <div className="mt-4 bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-slate-100">
                      {ticket.description}
                    </div>

                    {/* Attachments */}
                    {ticket.attachments?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Attachments ({ticket.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {ticket.attachments.map(att => {
                            const isImg = att.fileType.startsWith('image/');
                            return (
                              <a
                                key={att.id}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                              >
                                {isImg
                                  ? <ImageIcon size={13} className="text-blue-500 shrink-0" />
                                  : <FileText size={13} className="text-amber-500 shrink-0" />
                                }
                                <span className="text-xs text-slate-600 group-hover:text-indigo-700 truncate max-w-[140px]">{att.fileName}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Closing notes (if resolved/closed) */}
                    {ticket.closingNotes && (
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1.5">
                          <CheckCircle2 size={11} /> Admin Response
                        </p>
                        <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">{ticket.closingNotes}</p>
                      </div>
                    )}

                    {/* Activity timeline */}
                    {ticket.activities?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Timeline</p>
                        <div className="space-y-2">
                          {ticket.activities.map((act, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <div className="mt-0.5 w-4 h-4 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-600">
                                  {act.toStatus ? `Status → ${act.toStatus.replace('_', ' ')}` : act.action.replace('_', ' ')}
                                  {act.note && act.action !== 'STATUS_CHANGED' && ` — ${act.note}`}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {act.performedByName} · {new Date(act.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolved/closed notice */}
                    {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <p className="text-xs text-emerald-700">
                          This ticket was {ticket.status.toLowerCase()} on{' '}
                          {new Date(ticket.closedAt || ticket.resolvedAt || ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
