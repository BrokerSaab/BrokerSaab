'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MapPin, ShieldCheck, AlertCircle, Loader2,
  ArrowLeft, XCircle, CheckCircle2, RefreshCw, BookOpen, Phone, Eye,
  UserCheck, MessageSquare, FileText, Bell, Ticket
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import FeeQuoteViewModal from '@/components/FeeQuoteViewModal';
import { io as ioClient } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '');
const resolveImg = (url?: string | null) => !url ? null : url.startsWith('http') ? url : `${BACKEND_BASE}${url.startsWith('/') ? url : `/${url}`}`;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://brokersaab-backend.onrender.com');

type BookingStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface FeeQuote {
  id: string; status: string; categorySlug?: string;
  clientMessage?: string; advisorNote?: string;
  totalAmount?: string; validUntil?: string; viewedAt?: string;
  createdAt: string;
  lineItems: { id: string; description: string; amount: string; sortOrder: number }[];
  advisor: { id: string; fullName: string; avatarUrl?: string };
  serviceTicket?: { id: string; ticketNumber: string; status: string } | null;
}

interface Booking {
  id: string;
  bookingNumber: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalFee: string;
  mode: string;
  notes?: string;
  createdAt: string;
  advisor?: {
    id: string;
    fullName: string;
    businessName?: string;
    location: string;
    avatarUrl?: string;
  };
}

const STATUS_STYLES: Record<BookingStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'Pending',   bg: 'bg-amber-100',   text: 'text-amber-700',   icon: <Clock size={13} /> },
  ACCEPTED:  { label: 'Accepted',  bg: 'bg-blue-100',    text: 'text-blue-700',    icon: <CheckCircle2 size={13} /> },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <ShieldCheck size={13} /> },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-100',     text: 'text-red-700',     icon: <XCircle size={13} /> },
  DISPUTED:  { label: 'Disputed',  bg: 'bg-orange-100',  text: 'text-orange-700',  icon: <AlertCircle size={13} /> },
};

function canCancel(booking: Booking): boolean {
  if (booking.status !== 'PENDING') return false;
  const created = new Date(booking.createdAt).getTime();
  return Date.now() - created < 24 * 60 * 60 * 1000;
}

function hoursLeft(booking: Booking): number {
  const created = new Date(booking.createdAt).getTime();
  const expiresAt = created + 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60)));
}

const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'demo-1',
    bookingNumber: 'BS-20260602-0001',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '10:00', endTime: '11:00', status: 'PENDING', totalFee: '1500', mode: 'VIDEO',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    advisor: { id: '1', fullName: 'Advocate Rajesh Sen', businessName: 'Sen & Associates', location: 'Mumbai, Maharashtra' },
  },
  {
    id: 'demo-2',
    bookingNumber: 'BS-20260601-0042',
    scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '14:00', endTime: '15:00', status: 'COMPLETED', totalFee: '2000', mode: 'PHONE',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    advisor: { id: '2', fullName: 'CA Amit Singhania', businessName: 'Singhania & Co', location: 'New Delhi, NCR' },
  },
];

export default function BookingsPage() {
  const { isLoggedIn, authReady, user, openLoginModal } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [contactCredits, setContactCredits] = useState<{ creditsRemaining: number; expiresAt: string | null } | null>(null);

  interface ContactedAdvisor {
    id: string; unlockedAt: string; isFree: boolean;
    advisor: {
      id: string; fullName: string; businessName?: string; avatarUrl?: string;
      location: string; state?: string; consultationFee: string;
      phoneNumber: string; email?: string; experienceYears: number; categories: string[];
    };
  }
  const [contactedAdvisors, setContactedAdvisors] = useState<ContactedAdvisor[]>([]);
  const [contactedLoading, setContactedLoading]   = useState(false);
  const [contactedError, setContactedError]       = useState('');

  const [quotes,         setQuotes]         = useState<FeeQuote[]>([]);
  const [quotesLoading,  setQuotesLoading]  = useState(false);
  const [selectedQuote,  setSelectedQuote]  = useState<FeeQuote | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const [tickets,        setTickets]        = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTickets(data.data);
    } catch { /* ignore */ }
    finally { setTicketsLoading(false); }
  };

  const fetchQuotes = async () => {
    setQuotesLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/quotes`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setQuotes(data.data);
    } catch { /* ignore */ }
    finally { setQuotesLoading(false); }
  };

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) {
      openLoginModal(() => router.push('/bookings'));
      return;
    }
    fetchBookings();
    fetchContactCredits();
    fetchContactedAdvisors();
    fetchQuotes();
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    const socket = ioClient(WS_URL, { transports: ['websocket'], autoConnect: true });
    socket.on('connect', () => socket.emit('join_user_room', user.id));
    socket.on('quote_submitted', () => fetchQuotes());
    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.id]);

  const fetchContactCredits = async () => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/contacts/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setContactCredits({ creditsRemaining: data.creditsRemaining, expiresAt: data.expiresAt });
    } catch { /* ignore */ }
  };

  const fetchContactedAdvisors = async () => {
    setContactedLoading(true);
    setContactedError('');
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/contacts/my-unlocks`, { headers: { Authorization: `Bearer ${token}` } });
      let data: any = null;
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (data?.success) {
        setContactedAdvisors(data.data);
      } else if (!res.ok) {
        setContactedError(`Service temporarily unavailable (${res.status}). Please try again shortly.`);
      } else {
        setContactedError(data?.message || 'Failed to load contacted advisors.');
      }
    } catch {
      setContactedError('Cannot reach the server. Please check your connection and retry.');
    } finally {
      setContactedLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/bookings`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBookings(data.success ? data.data : DEMO_BOOKINGS);
    } catch {
      setBookings(DEMO_BOOKINGS);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(bookingId);
    try {
      const token = sessionStorage.getItem('accessToken');
      const res = await fetch(`${API}/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
      } else {
        alert(data.message || 'Could not cancel booking.');
      }
    } catch {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
    } finally {
      setCancelling(null);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={15} style={{ color: '#D4AF37' }} />
              My Consultations
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {user?.fullName ? `Bookings for ${user.fullName}` : 'Your booking history'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/#services-section"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
              <Phone size={13} /> Find Advisors
            </Link>
            <Link href="/contact"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all">
              <MessageSquare size={13} /> Support
            </Link>
            <button onClick={fetchBookings} className="text-slate-400 hover:text-slate-600 transition-colors p-2" title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* Contact credits widget */}
        {contactCredits !== null && (
          <div className="mb-5 flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border flex-wrap"
            style={{
              borderColor: contactCredits.creditsRemaining > 0 ? 'rgba(212,175,55,0.35)' : 'rgba(249,115,22,0.25)',
              background:  contactCredits.creditsRemaining > 0 ? 'rgba(212,175,55,0.08)' : 'rgba(249,115,22,0.06)',
            }}>
            <div className="flex items-center gap-3">
              <Eye size={16} style={{ color: contactCredits.creditsRemaining > 0 ? '#D4AF37' : '#fb923c' }} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {contactCredits.creditsRemaining > 0
                    ? <><span className="font-extrabold" style={{ color: '#B48C22' }}>{contactCredits.creditsRemaining}</span> advisor contacts remaining in your pack</>
                    : 'No contact credits left'}
                </p>
                {contactCredits.expiresAt && (
                  <p className="text-xs text-slate-500">
                    Pack valid until {new Date(contactCredits.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            {contactCredits.creditsRemaining === 0 && (
              <Link href="/buy-pack"
                className="px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
                Buy Pack
              </Link>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Bookings */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 size={22} className="animate-spin mr-3" /> Loading your consultations...
          </div>
        ) : bookings.length === 0 ? null : (
          <div className="space-y-4 mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bookings</p>
            {bookings.map(booking => {
              const s = STATUS_STYLES[booking.status];
              const scheduledDate = new Date(booking.scheduledDate);
              const canCancelThis = canCancel(booking);
              const hLeft = hoursLeft(booking);
              return (
                <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400 font-mono">{booking.bookingNumber}</p>
                      <h3 className="font-bold text-slate-800 mt-0.5">{booking.advisor?.fullName ?? 'Advisor'}</h3>
                      {booking.advisor?.businessName && (
                        <p className="text-xs text-slate-500">{booking.advisor.businessName}</p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                      {s.icon} {s.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-indigo-400/60" />
                      {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-400/60" />
                      {booking.startTime} &ndash; {booking.endTime}
                    </div>
                    {booking.advisor?.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-indigo-400/60" />
                        {booking.advisor.location}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm" style={{ color: '#B48C22' }}>
                        &#8377;{booking.totalFee}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{booking.mode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.status === 'PENDING' && (
                        <div className="text-xs text-amber-600">
                          {canCancelThis ? `${hLeft}h left to cancel` : 'Awaiting advisor'}
                        </div>
                      )}
                      {canCancelThis && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50">
                          {cancelling === booking.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                          Cancel
                        </button>
                      )}
                      {booking.status === 'ACCEPTED' && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <CheckCircle2 size={13} /> Advisor confirmed
                        </div>
                      )}
                      {booking.status === 'COMPLETED' && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600">
                          <ShieldCheck size={13} /> Consultation done
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.status === 'PENDING' && !canCancelThis && (
                    <p className="text-xs text-slate-400 mt-2">
                      Cancellation window (24 hours) has passed. Contact support for disputes.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Fee Quotes */}
        {(() => {
          const newQuotes = quotes.filter(q => q.status === 'QUOTED' && !q.viewedAt);
          return (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-indigo-500" />
                  <h2 className="text-sm font-bold text-slate-800">Fee Quotes</h2>
                  {quotes.length > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {quotes.length}
                    </span>
                  )}
                </div>
                <button onClick={fetchQuotes} className="text-slate-400 hover:text-indigo-500 transition-colors p-1" title="Refresh">
                  <RefreshCw size={13} />
                </button>
              </div>

              {newQuotes.length > 0 && (
                <button
                  onClick={() => { setSelectedQuote(newQuotes[0]); setShowQuoteModal(true); }}
                  className="w-full mb-3 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm animate-pulse transition-all"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: 'white', boxShadow: '0 6px 24px rgba(79,70,229,0.35)' }}>
                  <Bell size={15} />
                  {newQuotes.length === 1 ? '1 New Fee Quote Ready — View Now' : `${newQuotes.length} New Fee Quotes Ready — View Now`}
                </button>
              )}

              {quotesLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 size={18} className="animate-spin mr-2" /> Loading quotes...
                </div>
              ) : quotes.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl px-5 py-7 text-center shadow-sm">
                  <FileText size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-medium">No fee quotes yet</p>
                  <p className="text-slate-400 text-xs mt-1">Ask an advisor for a fee breakdown before booking.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.map(q => {
                    const isNew = q.status === 'QUOTED' && !q.viewedAt;
                    const statusColor =
                      q.status === 'QUOTED'    ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
                      q.status === 'VIEWED'    ? 'text-blue-700 bg-blue-50 border-blue-200' :
                      q.status === 'ACCEPTED'  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      q.status === 'CANCELLED' ? 'text-red-600 bg-red-50 border-red-200' :
                      q.status === 'EXPIRED'   ? 'text-slate-500 bg-slate-50 border-slate-200' :
                                                 'text-amber-700 bg-amber-50 border-amber-200';
                    return (
                      <button key={q.id}
                        onClick={() => { setSelectedQuote(q); setShowQuoteModal(true); }}
                        className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all hover:shadow-sm ${isNew ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100 bg-white shadow-sm'}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-indigo-100 border border-indigo-200">
                          <FileText size={15} className="text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{q.advisor.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {q.totalAmount ? `₹${parseFloat(q.totalAmount).toLocaleString('en-IN')} · ` : ''}
                            {q.categorySlug ?? 'General query'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                            {q.status}
                          </span>
                          {isNew && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Service Tickets */}
        {(tickets.length > 0 || ticketsLoading) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Ticket size={15} className="text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-800">My Work Tickets</h2>
                {tickets.length > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {tickets.length}
                  </span>
                )}
              </div>
              <button onClick={fetchTickets} className="text-slate-400 hover:text-emerald-600 transition-colors p-1">
                <RefreshCw size={13} />
              </button>
            </div>
            {ticketsLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 size={18} className="animate-spin mr-2" /> Loading tickets...
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((t: any) => {
                  const statusColor =
                    t.status === 'OPEN'            ? 'text-blue-700 bg-blue-50 border-blue-200' :
                    t.status === 'IN_PROGRESS'     ? 'text-amber-700 bg-amber-50 border-amber-200' :
                    t.status === 'AWAITING_CONFIRM'? 'text-purple-700 bg-purple-50 border-purple-200' :
                    t.status === 'PAYOUT_RELEASED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                    t.status === 'DISPUTED'        ? 'text-red-600 bg-red-50 border-red-200' :
                                                      'text-slate-500 bg-slate-50 border-slate-200';
                  const needsAction = t.status === 'AWAITING_CONFIRM';
                  return (
                    <button key={t.id}
                      onClick={() => router.push(`/tickets/${t.id}`)}
                      className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all hover:shadow-sm ${needsAction ? 'border-purple-200 bg-purple-50' : 'border-slate-100 bg-white shadow-sm'}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 border border-emerald-200">
                        <Ticket size={15} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{t.advisor?.fullName}</p>
                        <p className="text-[11px] text-slate-500">
                          {t.ticketNumber} &nbsp;&middot;&nbsp; &#8377;{Number(t.totalAmount).toLocaleString('en-IN')}
                          {t.stages?.length ? ` · ${t.stages.filter((s: any) => s.status === 'CONFIRMED').length}/${t.stages.length} stages` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                        {needsAction && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Contacted Advisors */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck size={15} className="text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-800">Advisors You&apos;ve Contacted</h2>
              {contactedAdvisors.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {contactedAdvisors.length}
                </span>
              )}
            </div>
            <button onClick={fetchContactedAdvisors} className="text-slate-400 hover:text-indigo-500 transition-colors p-1" title="Refresh">
              <RefreshCw size={13} />
            </button>
          </div>

          {contactedLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading...
            </div>
          ) : contactedError ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-6 text-center">
              <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
              <p className="text-red-600 text-sm font-medium">{contactedError}</p>
              <button onClick={fetchContactedAdvisors} className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                Try again
              </button>
            </div>
          ) : contactedAdvisors.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl px-5 py-7 text-center shadow-sm">
              <Eye size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm font-medium">No contacts revealed yet</p>
              <p className="text-slate-400 text-xs mt-1">Advisors whose contact details you unlock will appear here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              {contactedAdvisors.map(({ id, unlockedAt, isFree, advisor }, idx) => {
                const initials = advisor.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                const isLast = idx === contactedAdvisors.length - 1;
                return (
                  <div key={id}
                    className={`flex items-center gap-4 px-4 py-3.5 hover:bg-indigo-50 transition-all ${!isLast ? 'border-b border-slate-100' : ''}`}>
                    {advisor.avatarUrl ? (
                      <img
                        src={resolveImg(advisor.avatarUrl)!}
                        alt={advisor.fullName}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/advisors/${advisor.id}`}
                          className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate">
                          {advisor.fullName}
                        </Link>
                        <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {advisor.categories.length > 0
                          ? advisor.categories.slice(0, 2).join(' · ')
                          : advisor.location}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isFree
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {isFree ? 'Free' : 'Credit used'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>

    <FeeQuoteViewModal
      quote={selectedQuote}
      isOpen={showQuoteModal}
      onClose={() => setShowQuoteModal(false)}
      onDeclined={(id) => {
        setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: 'CANCELLED' } : q));
        setShowQuoteModal(false);
      }}
      onAccepted={(quoteId, ticketId) => {
        setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'ACCEPTED' } : q));
        fetchQuotes();
        fetchTickets();
        if (ticketId) router.push(`/tickets/${ticketId}`);
      }}
    />
    </>
  );
}
