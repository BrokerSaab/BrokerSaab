'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MapPin, ShieldCheck, AlertCircle, Loader2,
  ArrowLeft, XCircle, CheckCircle2, RefreshCw, BookOpen, Phone, Eye,
  UserCheck, MessageSquare, FileText, Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import FeeQuoteViewModal from '@/components/FeeQuoteViewModal';
import { io as ioClient } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://brokersaab-backend.onrender.com');

type BookingStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

interface FeeQuote {
  id: string; status: string; categorySlug?: string;
  clientMessage?: string; advisorNote?: string;
  totalAmount?: string; validUntil?: string; viewedAt?: string;
  createdAt: string;
  lineItems: { id: string; description: string; amount: string; sortOrder: number }[];
  advisor: { id: string; fullName: string; avatarUrl?: string };
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
  PENDING:   { label: 'Pending',   bg: 'bg-amber-500/10',   text: 'text-amber-400',  icon: <Clock size={13} /> },
  ACCEPTED:  { label: 'Accepted',  bg: 'bg-blue-500/10',    text: 'text-blue-400',   icon: <CheckCircle2 size={13} /> },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400',icon: <ShieldCheck size={13} /> },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/10',     text: 'text-red-400',    icon: <XCircle size={13} /> },
  DISPUTED:  { label: 'Disputed',  bg: 'bg-orange-500/10',  text: 'text-orange-400', icon: <AlertCircle size={13} /> },
};

function canCancel(booking: Booking): boolean {
  if (booking.status !== 'PENDING') return false;
  const created = new Date(booking.createdAt).getTime();
  const now = Date.now();
  const hours24 = 24 * 60 * 60 * 1000;
  return now - created < hours24;
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
    startTime: '10:00',
    endTime: '11:00',
    status: 'PENDING',
    totalFee: '1500',
    mode: 'VIDEO',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    advisor: { id: '1', fullName: 'Advocate Rajesh Sen', businessName: 'Sen & Associates', location: 'Mumbai, Maharashtra' },
  },
  {
    id: 'demo-2',
    bookingNumber: 'BS-20260601-0042',
    scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '14:00',
    endTime: '15:00',
    status: 'COMPLETED',
    totalFee: '2000',
    mode: 'PHONE',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    advisor: { id: '2', fullName: 'CA Amit Singhania', businessName: 'Singhania & Co', location: 'New Delhi, NCR' },
  },
];

export default function BookingsPage() {
  const { isLoggedIn, user, openLoginModal } = useAuth();
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

  // Fee Quotes
  const [quotes,          setQuotes]          = useState<FeeQuote[]>([]);
  const [quotesLoading,   setQuotesLoading]   = useState(false);
  const [selectedQuote,   setSelectedQuote]   = useState<FeeQuote | null>(null);
  const [showQuoteModal,  setShowQuoteModal]  = useState(false);

  const fetchQuotes = async () => {
    setQuotesLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/quotes`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setQuotes(data.data);
    } catch { /* ignore */ }
    finally { setQuotesLoading(false); }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => router.push('/bookings'));
      return;
    }
    fetchBookings();
    fetchContactCredits();
    fetchContactedAdvisors();
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Socket: join user room + listen for quote_submitted
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
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/contacts/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setContactCredits({ creditsRemaining: data.creditsRemaining, expiresAt: data.expiresAt });
    } catch { /* ignore */ }
  };

  const fetchContactedAdvisors = async () => {
    setContactedLoading(true);
    setContactedError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/contacts/my-unlocks`, { headers: { Authorization: `Bearer ${token}` } });
      let data: any = null;
      try { data = await res.json(); } catch { /* non-JSON body */ }
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
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      } else {
        setBookings(DEMO_BOOKINGS);
      }
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
      const token = localStorage.getItem('accessToken');
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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-navy-800 border-b border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={18} className="text-gold-400" />
              My Consultations
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {user?.fullName ? `Bookings for ${user.fullName}` : 'Your booking history'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/#services-section" className="btn-gold inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold">
              <Phone size={13} /> Find Advisors
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 transition-all">
              <MessageSquare size={13} /> Support
            </Link>
            <button onClick={fetchBookings} className="text-slate-400 hover:text-gold-400 transition-colors p-2" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Contact credits widget */}
        {contactCredits !== null && (
          <div className="mb-5 flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border flex-wrap"
            style={{ borderColor: contactCredits.creditsRemaining > 0 ? 'rgba(212,175,55,0.25)' : 'rgba(249,115,22,0.25)', background: contactCredits.creditsRemaining > 0 ? 'rgba(212,175,55,0.06)' : 'rgba(249,115,22,0.06)' }}>
            <div className="flex items-center gap-3">
              <Eye size={16} style={{ color: contactCredits.creditsRemaining > 0 ? '#D4AF37' : '#fb923c' }} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {contactCredits.creditsRemaining > 0
                    ? <><span className="font-extrabold" style={{ color: '#D4AF37' }}>{contactCredits.creditsRemaining}</span> advisor contacts remaining in your pack</>
                    : 'No contact credits left'}
                </p>
                {contactCredits.expiresAt && (
                  <p className="text-xs text-slate-500">Pack valid until {new Date(contactCredits.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                )}
              </div>
            </div>
            {contactCredits.creditsRemaining === 0 && (
              <Link href="/buy-pack" className="px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
                Buy Pack — ₹116.82
              </Link>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-3" /> Loading your consultations…
          </div>
        ) : bookings.length === 0 ? null : (
          <div className="space-y-4">
            {bookings.map(booking => {
              const s = STATUS_STYLES[booking.status];
              const scheduledDate = new Date(booking.scheduledDate);
              const canCancelThis = canCancel(booking);
              const hLeft = hoursLeft(booking);
              return (
                <div key={booking.id} className="bg-navy-800/50 border border-gold-500/10 rounded-2xl p-5 hover:border-gold-500/20 transition-all">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-500 font-mono">{booking.bookingNumber}</p>
                      <h3 className="font-bold text-white mt-0.5">
                        {booking.advisor?.fullName ?? 'Advisor'}
                      </h3>
                      {booking.advisor?.businessName && (
                        <p className="text-xs text-slate-400">{booking.advisor.businessName}</p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                      {s.icon} {s.label}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gold-500/60" />
                      {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gold-500/60" />
                      {booking.startTime} – {booking.endTime}
                    </div>
                    {booking.advisor?.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-gold-500/60" />
                        {booking.advisor.location}
                      </div>
                    )}
                  </div>

                  {/* Fee + mode */}
                  <div className="flex items-center justify-between border-t border-gold-500/5 pt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-gold-400 font-bold text-sm">₹{booking.totalFee}</span>
                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{booking.mode}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {booking.status === 'PENDING' && (
                        <div className="text-xs text-amber-400/70">
                          {canCancelThis ? `${hLeft}h left to cancel` : 'Awaiting advisor'}
                        </div>
                      )}
                      {canCancelThis && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        >
                          {cancelling === booking.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                          Cancel
                        </button>
                      )}
                      {booking.status === 'ACCEPTED' && (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <CheckCircle2 size={13} /> Advisor confirmed
                        </div>
                      )}
                      {booking.status === 'COMPLETED' && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400">
                          <ShieldCheck size={13} /> Consultation done
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 24-hour cancellation note */}
                  {booking.status === 'PENDING' && !canCancelThis && (
                    <p className="text-xs text-slate-500 mt-2">
                      Cancellation window (24 hours) has passed. Contact support for disputes.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* ── FEE QUOTES ── */}
        {(() => {
          const newQuotes = quotes.filter(q => q.status === 'QUOTED' && !q.viewedAt);
          return (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-indigo-400" />
                  <h2 className="text-sm font-bold text-white">Fee Quotes</h2>
                  {quotes.length > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {quotes.length}
                    </span>
                  )}
                </div>
                <button onClick={fetchQuotes} className="text-slate-500 hover:text-indigo-400 transition-colors p-1" title="Refresh">
                  <RefreshCw size={13} />
                </button>
              </div>

              {/* Blinking "New Quotes" CTA */}
              {newQuotes.length > 0 && (
                <button
                  onClick={() => { setSelectedQuote(newQuotes[0]); setShowQuoteModal(true); }}
                  className="w-full mb-3 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm animate-pulse transition-all"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: 'white', boxShadow: '0 6px 24px rgba(79,70,229,0.45)' }}
                >
                  <Bell size={15} />
                  {newQuotes.length === 1 ? '1 New Fee Quote Ready — View Now' : `${newQuotes.length} New Fee Quotes Ready — View Now`}
                </button>
              )}

              {quotesLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 size={18} className="animate-spin mr-2" /> Loading quotes…
                </div>
              ) : quotes.length === 0 ? (
                <div className="border border-white/5 rounded-2xl px-5 py-7 text-center bg-white/[0.02]">
                  <FileText size={28} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-medium">No fee quotes yet</p>
                  <p className="text-slate-500 text-xs mt-1">Ask an advisor for a fee breakdown before booking.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {quotes.map(q => {
                    const isNew = q.status === 'QUOTED' && !q.viewedAt;
                    const statusColor =
                      q.status === 'QUOTED'    ? 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30' :
                      q.status === 'VIEWED'    ? 'text-blue-300 bg-blue-500/15 border-blue-500/30' :
                      q.status === 'ACCEPTED'  ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' :
                      q.status === 'CANCELLED' ? 'text-red-300 bg-red-500/10 border-red-500/20' :
                      q.status === 'EXPIRED'   ? 'text-gray-400 bg-gray-500/10 border-gray-500/20' :
                                                 'text-amber-300 bg-amber-500/15 border-amber-500/30';
                    return (
                      <button key={q.id}
                        onClick={() => { setSelectedQuote(q); setShowQuoteModal(true); }}
                        className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all hover:brightness-110 ${isNew ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/8 bg-white/[0.03]'}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.25)' }}>
                          <FileText size={15} className="text-indigo-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{q.advisor.fullName}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {q.totalAmount ? `₹${parseFloat(q.totalAmount).toLocaleString('en-IN')} · ` : ''}
                            {q.categorySlug ?? 'General query'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                            {q.status}
                          </span>
                          {isNew && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── CONTACTED ADVISORS ── */}
        <div className="mt-10">
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck size={15} className="text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Advisors You've Contacted</h2>
              {contactedAdvisors.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {contactedAdvisors.length}
                </span>
              )}
            </div>
            <button onClick={fetchContactedAdvisors} className="text-slate-500 hover:text-indigo-400 transition-colors p-1" title="Refresh">
              <RefreshCw size={13} />
            </button>
          </div>

          {contactedLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 size={20} className="animate-spin mr-2" /> Loading…
            </div>
          ) : contactedError ? (
            <div className="border border-red-500/20 rounded-2xl px-5 py-6 text-center bg-red-500/5">
              <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
              <p className="text-red-400 text-sm font-medium">{contactedError}</p>
              <button onClick={fetchContactedAdvisors} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                Try again
              </button>
            </div>
          ) : contactedAdvisors.length === 0 ? (
            <div className="border border-white/5 rounded-2xl px-5 py-7 text-center bg-white/[0.02]">
              <Eye size={28} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-medium">No contacts revealed yet</p>
              <p className="text-slate-500 text-xs mt-1">Advisors whose contact details you unlock will appear here.</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-white/10">
              {contactedAdvisors.map(({ id, unlockedAt, isFree, advisor }, idx) => {
                const initials = advisor.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                const isLast = idx === contactedAdvisors.length - 1;
                return (
                  <div
                    key={id}
                    className={`flex items-center gap-4 px-4 py-3.5 bg-white/[0.03] hover:bg-indigo-500/10 transition-all ${!isLast ? 'border-b border-white/5' : ''}`}
                  >
                    {/* Avatar */}
                    {advisor.avatarUrl ? (
                      <img
                        src={advisor.avatarUrl.startsWith('http') ? advisor.avatarUrl : `/uploads${advisor.avatarUrl.replace('/uploads', '')}`}
                        alt={advisor.fullName}
                        className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                        {initials}
                      </div>
                    )}

                    {/* Name + service */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/advisors/${advisor.id}`}
                          className="text-sm font-bold text-white hover:text-indigo-300 transition-colors truncate"
                        >
                          {advisor.fullName}
                        </Link>
                        <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {advisor.categories.length > 0
                          ? advisor.categories.slice(0, 2).join(' · ')
                          : advisor.location}
                      </p>
                    </div>

                    {/* Right side: badge + date */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isFree
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      }`}>
                        {isFree ? '🎁 Free' : '🪙 Credit used'}
                      </span>
                      <span className="text-[10px] text-slate-500">
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
    />
    </>
  );
}
