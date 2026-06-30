'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle, ShieldCheck,
  MessageSquare, Plus, ChevronRight, Star,
  Send, AlertTriangle, RefreshCw, Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryName } from '@/data/categoryMap';
import { io as ioClient } from 'socket.io-client';

const API    = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://brokersaab-backend.onrender.com');

interface Stage {
  id: string; title: string; description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'AWAITING_CONFIRM' | 'CONFIRMED';
  advisorComment?: string; sortOrder: number;
  completedAt?: string; confirmedAt?: string; createdAt: string;
}

interface Comment {
  id: string; authorRole: string; authorName: string; content: string; createdAt: string;
}

interface Ticket {
  id: string; ticketNumber: string; status: string;
  totalAmount: string; commission: string; netAmount: string;
  paymentRef?: string; closedAt?: string;
  closingComment?: string; userRating?: number; userReview?: string; payoutReleasedAt?: string;
  createdAt: string; updatedAt: string;
  client:  { id: string; fullName: string; avatarUrl?: string; phoneNumber: string };
  advisor: { id: string; fullName: string; avatarUrl?: string };
  stages:   Stage[];
  comments: Comment[];
  quote: { id: string; categorySlug?: string; lineItems: { description: string; amount: string }[] };
}

const STAGE_STATUS_MAP = {
  PENDING:          { label: 'Pending',               color: 'text-gray-500',    bg: 'bg-gray-100',    icon: <Clock size={12} /> },
  IN_PROGRESS:      { label: 'In Progress',           color: 'text-amber-600',   bg: 'bg-amber-50',    icon: <Clock size={12} /> },
  AWAITING_CONFIRM: { label: 'Awaiting Confirmation', color: 'text-purple-600',  bg: 'bg-purple-50',   icon: <AlertCircle size={12} /> },
  CONFIRMED:        { label: 'Confirmed',             color: 'text-emerald-600', bg: 'bg-emerald-50',  icon: <CheckCircle2 size={12} /> },
};

const TICKET_STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN:             { label: 'Open',              color: 'text-blue-600 bg-blue-50 border-blue-200' },
  IN_PROGRESS:      { label: 'In Progress',       color: 'text-amber-600 bg-amber-50 border-amber-200' },
  AWAITING_CONFIRM: { label: 'Stage Confirmation',color: 'text-purple-600 bg-purple-50 border-purple-200' },
  DISPUTED:         { label: 'Disputed',          color: 'text-red-600 bg-red-50 border-red-200' },
  CLOSED:           { label: 'Closed',            color: 'text-gray-500 bg-gray-100 border-gray-200' },
  PAYOUT_RELEASED:  { label: 'Completed & Paid',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

export default function TicketDetailPage() {
  const { id }        = useParams<{ id: string }>();
  const { user }      = useAuth();
  const router        = useRouter();
  const role          = user?.role ?? '';
  const isClient      = role === 'CLIENT';
  const isAdvisor     = role === 'ADVISOR';

  const [ticket,    setTicket]    = useState<Ticket | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const [comment,   setComment]   = useState('');
  const [sending,   setSending]   = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  const [showAddStage,   setShowAddStage]   = useState(false);
  const [stageTitle,     setStageTitle]     = useState('');
  const [stageDesc,      setStageDesc]      = useState('');
  const [addingStage,    setAddingStage]    = useState(false);

  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [stageComment,  setStageComment]  = useState('');
  const [stageCommentFor, setStageCommentFor] = useState<string | null>(null);

  const [showClose,      setShowClose]      = useState(false);
  const [closeComment,   setCloseComment]   = useState('');
  const [closeRating,    setCloseRating]    = useState(0);
  const [closeReview,    setCloseReview]    = useState('');
  const [closing,        setClosing]        = useState(false);
  const [closeError,     setCloseError]     = useState('');

  const [showDispute,    setShowDispute]    = useState(false);
  const [disputeReason,  setDisputeReason]  = useState('');
  const [disputing,      setDisputing]      = useState(false);

  const fetchTicket = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const res   = await fetch(`${API}/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (data.success) setTicket(data.data);
      else setError(data.message || 'Ticket not found');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = ioClient(WS_URL, { transports: ['websocket'] });
    if (isClient)  socket.on('connect', () => socket.emit('join_user_room', user.id));
    if (isAdvisor) socket.on('connect', () => socket.emit('join_advisor_room', user.id));
    socket.on('ticket_updated', ({ ticketId }: any) => { if (ticketId === id) fetchTicket(); });
    socket.on('ticket_comment', ({ ticketId }: any) => { if (ticketId === id) fetchTicket(); });
    socket.on('ticket_closed',  ({ ticketId }: any) => { if (ticketId === id) fetchTicket(); });
    return () => { socket.disconnect(); };
  }, [user?.id, id]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.comments.length]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      await fetch(`${API}/tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ content: comment.trim() }),
      });
      setComment('');
      fetchTicket();
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const addStage = async () => {
    if (!stageTitle.trim()) return;
    setAddingStage(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      await fetch(`${API}/tickets/${id}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title: stageTitle.trim(), description: stageDesc.trim() || undefined }),
      });
      setStageTitle(''); setStageDesc(''); setShowAddStage(false);
      fetchTicket();
    } catch { /* ignore */ }
    finally { setAddingStage(false); }
  };

  const updateStageStatus = async (stageId: string, status: 'IN_PROGRESS' | 'AWAITING_CONFIRM') => {
    setUpdatingStage(stageId + status);
    try {
      const token = sessionStorage.getItem('accessToken');
      await fetch(`${API}/tickets/${id}/stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status, advisorComment: stageComment || undefined }),
      });
      setStageComment(''); setStageCommentFor(null);
      fetchTicket();
    } catch { /* ignore */ }
    finally { setUpdatingStage(null); }
  };

  const confirmStage = async (stageId: string) => {
    setUpdatingStage(stageId + 'CONFIRM');
    try {
      const token = sessionStorage.getItem('accessToken');
      await fetch(`${API}/tickets/${id}/stages/${stageId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTicket();
    } catch { /* ignore */ }
    finally { setUpdatingStage(null); }
  };

  const closeTicket = async () => {
    if (!closeComment.trim() || closeRating === 0) return;
    setClosing(true);
    setCloseError('');
    try {
      const token = sessionStorage.getItem('accessToken');
      const res   = await fetch(`${API}/tickets/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ closingComment: closeComment.trim(), userRating: closeRating, userReview: closeReview.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) { setShowClose(false); fetchTicket(); }
      else setCloseError(data.message || 'Failed to close ticket. Please try again.');
    } catch { setCloseError('Network error. Please try again.'); }
    finally { setClosing(false); }
  };

  const raiseDispute = async () => {
    setDisputing(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      await fetch(`${API}/tickets/${id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ reason: disputeReason }),
      });
      setShowDispute(false); setDisputeReason('');
      fetchTicket();
    } catch { /* ignore */ }
    finally { setDisputing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
    </div>
  );

  if (error || !ticket) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <AlertCircle size={40} className="text-red-400" />
      <p className="text-red-500 font-semibold">{error || 'Ticket not found'}</p>
      <button onClick={() => router.back()} className="text-indigo-600 text-sm hover:underline">Go back</button>
    </div>
  );

  const statusInfo = TICKET_STATUS_MAP[ticket.status] ?? { label: ticket.status, color: 'text-gray-500 bg-gray-100 border-gray-200' };
  const isClosed   = ticket.status === 'CLOSED' || ticket.status === 'PAYOUT_RELEASED';
  const canClose   = isClient && !isClosed && ticket.status !== 'DISPUTED';
  const confirmedStages = ticket.stages.filter(s => s.status === 'CONFIRMED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — brand navy */}
      <div style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-white/40">{ticket.ticketNumber}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <h1 className="text-sm font-black text-white mt-0.5 truncate">
              {isClient ? ticket.advisor.fullName : ticket.client.fullName}
            </h1>
          </div>
          <button onClick={fetchTicket} className="text-white/40 hover:text-white/70 transition-colors p-1.5">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Escrow info */}
        <div className="rounded-2xl overflow-hidden bg-white border border-amber-200 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-amber-500" />
              <span className="text-xs font-bold text-gray-700">Escrow Hold</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-black tabular-nums" style={{ color: '#B8960C' }}>
                ₹{Number(ticket.totalAmount).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-400">
                {isClosed ? 'Released to advisor' : 'Held securely by BrokerSaab'}
              </p>
            </div>
          </div>
          {ticket.quote.categorySlug && (
            <div className="px-4 pb-3 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                {getCategoryName(ticket.quote.categorySlug)}
              </span>
              <span className="text-[10px] text-gray-400">
                {ticket.stages.length > 0 ? `${confirmedStages}/${ticket.stages.length} stages confirmed` : 'No stages yet'}
              </span>
            </div>
          )}
        </div>

        {/* Closed / Payout info */}
        {isClosed && (
          <div className="rounded-2xl px-4 py-3 border border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <p className="text-sm font-bold text-emerald-700">Work Completed & Payment Released</p>
            </div>
            {ticket.closingComment && (
              <p className="text-xs text-emerald-700/70 leading-relaxed mb-2">"{ticket.closingComment}"</p>
            )}
            {ticket.userRating && (
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={13} className={n <= ticket.userRating! ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                ))}
                <span className="text-xs text-gray-400 ml-1">{ticket.userRating}/5</span>
              </div>
            )}
          </div>
        )}

        {/* ── STAGES ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <ChevronRight size={14} className="text-indigo-500" /> Work Stages
            </h2>
            {isAdvisor && !isClosed && (
              <button onClick={() => setShowAddStage(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all">
                <Plus size={11} /> Add Stage
              </button>
            )}
          </div>

          {/* Add stage form */}
          {showAddStage && isAdvisor && (
            <div className="mb-3 rounded-2xl p-4 border border-indigo-200 bg-indigo-50 space-y-2.5">
              <input
                value={stageTitle}
                onChange={e => setStageTitle(e.target.value)}
                placeholder="Stage title (e.g. Document collection)"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
              />
              <textarea
                value={stageDesc}
                onChange={e => setStageDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-all resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowAddStage(false); setStageTitle(''); setStageDesc(''); }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={addStage} disabled={addingStage || !stageTitle.trim()}
                  className="flex-[2] py-2 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)' }}>
                  {addingStage ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Add Stage
                </button>
              </div>
            </div>
          )}

          {ticket.stages.length === 0 ? (
            <div className="rounded-2xl px-5 py-8 text-center border border-gray-100 bg-gray-50">
              <Clock size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No stages added yet</p>
              {isAdvisor && <p className="text-gray-400 text-xs mt-1">Add stages to track your work progress</p>}
              {isClient  && <p className="text-gray-400 text-xs mt-1">The advisor will add work stages shortly</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {ticket.stages.map((stage, idx) => {
                const stageInfo = STAGE_STATUS_MAP[stage.status];
                const isAwait   = stage.status === 'AWAITING_CONFIRM';
                return (
                  <div key={stage.id} className={`rounded-2xl border transition-all ${
                    isAwait ? 'border-purple-200 bg-purple-50' :
                    stage.status === 'CONFIRMED' ? 'border-emerald-200 bg-emerald-50' :
                    stage.status === 'IN_PROGRESS' ? 'border-amber-200 bg-amber-50' :
                    'border-gray-100 bg-gray-50'
                  }`}>
                    <div className="px-4 py-3 flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                        stage.status === 'CONFIRMED' ? 'bg-emerald-500 text-white' :
                        isAwait ? 'bg-purple-500 text-white' :
                        stage.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>{idx + 1}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-800">{stage.title}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stageInfo.bg} ${stageInfo.color}`}>
                            {stageInfo.label}
                          </span>
                        </div>
                        {stage.description && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{stage.description}</p>
                        )}
                        {stage.advisorComment && (
                          <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2">
                            <p className="text-[10px] font-semibold text-indigo-500 mb-0.5">Advisor note</p>
                            <p className="text-xs text-indigo-700">{stage.advisorComment}</p>
                          </div>
                        )}
                        {stage.confirmedAt && (
                          <p className="text-[10px] text-emerald-600 mt-1">
                            Confirmed {new Date(stage.confirmedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}

                        {/* Advisor actions */}
                        {isAdvisor && !isClosed && stage.status !== 'CONFIRMED' && (
                          <div className="mt-2.5 space-y-2">
                            {stageCommentFor === stage.id ? (
                              <div className="space-y-2">
                                <input
                                  value={stageComment}
                                  onChange={e => setStageComment(e.target.value)}
                                  placeholder="Add a note for client (optional)"
                                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => { setStageCommentFor(null); setStageComment(''); }}
                                    className="flex-1 py-1.5 rounded-xl text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                                  <button onClick={() => updateStageStatus(stage.id, 'AWAITING_CONFIRM')} disabled={!!updatingStage}
                                    className="flex-[2] py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                                    {updatingStage === stage.id + 'AWAITING_CONFIRM' ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                    Request Confirmation
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                {stage.status === 'PENDING' && (
                                  <button onClick={() => updateStageStatus(stage.id, 'IN_PROGRESS')} disabled={!!updatingStage}
                                    className="flex-1 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all disabled:opacity-50 flex items-center justify-center gap-1">
                                    {updatingStage === stage.id + 'IN_PROGRESS' ? <Loader2 size={11} className="animate-spin" /> : <Clock size={11} />}
                                    Start
                                  </button>
                                )}
                                {(stage.status === 'IN_PROGRESS' || stage.status === 'PENDING') && (
                                  <button onClick={() => setStageCommentFor(stage.id)}
                                    className="flex-1 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-all flex items-center justify-center gap-1">
                                    <Edit3 size={11} /> Done — Request Confirm
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Client confirmation */}
                        {isClient && isAwait && (
                          <div className="mt-2.5">
                            <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 mb-2">
                              <p className="text-xs text-purple-700 font-semibold">
                                ⚠️ The advisor marked this stage as done. Please review and confirm.
                              </p>
                              <p className="text-[10px] text-purple-500 mt-0.5">
                                Once confirmed, the advisor can proceed to the next stage.
                              </p>
                            </div>
                            <button onClick={() => confirmStage(stage.id)} disabled={!!updatingStage}
                              className="w-full py-2 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:brightness-110"
                              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                              {updatingStage === stage.id + 'CONFIRM' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                              Confirm Stage Completion
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── COMMENTS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-indigo-500" /> Activity & Comments
          </h2>

          {ticket.comments.length === 0 ? (
            <div className="rounded-2xl px-5 py-6 text-center border border-gray-100 bg-gray-50 mb-3">
              <MessageSquare size={24} className="text-gray-300 mx-auto mb-1.5" />
              <p className="text-gray-400 text-xs">No comments yet. Start the conversation.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
              {ticket.comments.map(c => {
                const isMe = (isClient && c.authorRole === 'CLIENT') || (isAdvisor && c.authorRole === 'ADVISOR');
                return (
                  <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 ${
                      isMe
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 border border-gray-200'
                    }`}>
                      <p className={`text-[10px] font-semibold mb-0.5 ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                        {isMe ? 'You' : c.authorName} · {c.authorRole}
                      </p>
                      <p className={`text-xs leading-relaxed ${isMe ? 'text-white' : 'text-gray-800'}`}>{c.content}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-300' : 'text-gray-400'}`}>
                        {new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={commentEndRef} />
            </div>
          )}

          {!isClosed && (
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendComment()}
                placeholder="Add a comment…"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
              />
              <button onClick={sendComment} disabled={sending || !comment.trim()}
                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)' }}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* ── CLIENT ACTIONS ── */}
        {isClient && !isClosed && (
          <div className="space-y-3">
            {!showClose && !showDispute && (
              <div className="flex gap-3">
                <button onClick={() => setShowDispute(true)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-all flex items-center justify-center gap-2 bg-white">
                  <AlertTriangle size={14} /> Raise Dispute
                </button>
                <button onClick={() => setShowClose(true)}
                  className="flex-[2] py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white' }}>
                  <CheckCircle2 size={14} /> Close & Release Payment
                </button>
              </div>
            )}

            {/* Close form */}
            {showClose && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <p className="text-sm font-bold text-emerald-700">Close Ticket & Release Payment</p>
                <p className="text-xs text-emerald-600/80 leading-relaxed">
                  By closing this ticket, you confirm the work is done and ₹{Number(ticket.netAmount).toLocaleString('en-IN')} will be released to the advisor.
                  This cannot be undone.
                </p>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Your Rating</p>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setCloseRating(n)}
                        className="p-1.5 hover:scale-110 transition-transform">
                        <Star size={22} className={n <= closeRating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={closeComment}
                  onChange={e => setCloseComment(e.target.value)}
                  placeholder="Closing comment (required) — describe the work outcome"
                  rows={3}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                />
                <textarea
                  value={closeReview}
                  onChange={e => setCloseReview(e.target.value)}
                  placeholder="Public review (optional)"
                  rows={2}
                  className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 transition-all resize-none"
                />
                {closeError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <AlertCircle size={13} className="text-red-500 shrink-0" />
                    <p className="text-xs text-red-600">{closeError}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setShowClose(false); setCloseError(''); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all bg-white">Cancel</button>
                  <button onClick={closeTicket} disabled={closing || !closeComment.trim() || closeRating === 0}
                    className="flex-[2] py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                    {closing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Confirm & Release ₹{Number(ticket.netAmount).toLocaleString('en-IN')}
                  </button>
                </div>
              </div>
            )}

            {/* Dispute form */}
            {showDispute && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
                <p className="text-sm font-bold text-red-700">Raise a Dispute</p>
                <p className="text-xs text-red-600/80">Our team will review and hold the payment until resolved.</p>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue in detail…"
                  rows={3}
                  className="w-full bg-white border border-red-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-red-400 transition-all resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowDispute(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all bg-white">Cancel</button>
                  <button onClick={raiseDispute} disabled={disputing}
                    className="flex-[2] py-2.5 rounded-xl text-xs font-black text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {disputing ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
                    Submit Dispute
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advisor advisory note */}
        {isAdvisor && !isClosed && ticket.status === 'AWAITING_CONFIRM' && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3">
            <p className="text-xs font-bold text-purple-700">Waiting for client confirmation</p>
            <p className="text-[11px] text-purple-500 mt-0.5">
              The client needs to confirm a stage before you can continue. You'll be notified when confirmed.
            </p>
          </div>
        )}

        {isAdvisor && isClosed && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-emerald-700">Payment Released!</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              ₹{Number(ticket.netAmount).toLocaleString('en-IN')} has been credited to your wallet.
            </p>
          </div>
        )}

        <p className="text-[10px] text-gray-400 text-center pb-4">
          Ticket created {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          {ticket.paymentRef && ` · Ref: ${ticket.paymentRef}`}
        </p>
      </div>
    </div>
  );
}
