'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MapPin, ShieldCheck, AlertCircle, Loader2,
  ArrowLeft, XCircle, CheckCircle2, RefreshCw, BookOpen, Phone, Eye,
  UserCheck, MessageSquare, FileText, Bell, Ticket,
  X, ChevronRight, LayoutDashboard, CreditCard,
} from 'lucide-react';
import LiveClock from '@/components/LiveClock';
import { useAuth } from '@/contexts/AuthContext';
import FeeQuoteViewModal from '@/components/FeeQuoteViewModal';
import { getCategoryName } from '@/data/categoryMap';
import { io as ioClient } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '');
const resolveImg = (url?: string | null) => !url ? null : url.startsWith('http') ? url : `${BACKEND_BASE}${url.startsWith('/') ? url : `/${url}`}`;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '');

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
  chatRoom?: { id: string } | null;
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


  const [tickets,        setTickets]        = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const [activeSection, setActiveSection] = useState<'bookings' | 'quotes' | 'tickets' | 'contacts' | null>(null);

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
      // Advisors visiting this page want their client-side bookings, not advisor-side ones
      const url = user?.role === 'ADVISOR' ? `${API}/bookings?perspective=client` : `${API}/bookings`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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

  // Derived values used by tiles
  const pendingBookings      = bookings.filter(b => b.status === 'PENDING');
  const newQuotes            = quotes.filter(q => q.status === 'QUOTED' && !q.viewedAt);
  const activeTickets        = tickets.filter((t: any) => t.status !== 'CLOSED' && t.status !== 'CANCELLED');
  const actionNeededTickets  = tickets.filter((t: any) => t.status === 'AWAITING_CONFIRM');

  return (
    <>
    <div className="min-h-screen bg-[#F4F6FB]">

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <LayoutDashboard size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-tight">My Dashboard</h1>
              <p className="text-[10px] text-slate-400 leading-tight">{user?.fullName ?? 'Your activity at a glance'}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LiveClock className="text-[11px] text-slate-400 hidden sm:flex" showDate={false} />
            <Link href="/advisors"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
              <Phone size={12} /> Find Advisors
            </Link>
            <Link href="/contact" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all">
              <MessageSquare size={12} /> Support
            </Link>
            <button
              onClick={() => { fetchBookings(); fetchContactCredits(); fetchContactedAdvisors(); fetchQuotes(); fetchTickets(); }}
              className="text-slate-400 hover:text-indigo-500 transition-colors p-1.5 rounded-lg hover:bg-indigo-50" title="Refresh all">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ── Welcome ── */}
        <div>
          <h2 className="text-xl font-black text-slate-800">
            {user?.fullName ? `Hello, ${user.fullName.split(' ')[0]}` : 'Welcome back'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* ── Contact Credits Banner ── */}
        {contactCredits !== null && (
          <div className="flex items-center gap-4 px-4 py-3.5 rounded-2xl border flex-wrap"
            style={{
              borderColor: contactCredits.creditsRemaining > 0 ? 'rgba(212,175,55,0.35)' : 'rgba(249,115,22,0.3)',
              background:  contactCredits.creditsRemaining > 0 ? 'rgba(212,175,55,0.07)' : 'rgba(249,115,22,0.06)',
            }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: contactCredits.creditsRemaining > 0 ? 'rgba(212,175,55,0.15)' : 'rgba(249,115,22,0.12)' }}>
                <CreditCard size={16} style={{ color: contactCredits.creditsRemaining > 0 ? '#B48C22' : '#fb923c' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {contactCredits.creditsRemaining > 0
                    ? <><span className="font-extrabold" style={{ color: '#B48C22' }}>{contactCredits.creditsRemaining}</span> contact credits remaining</>
                    : 'No contact credits left'}
                </p>
                {contactCredits.expiresAt && (
                  <p className="text-[11px] text-slate-500">
                    Expires {new Date(contactCredits.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            <Link href="/buy-pack"
              className="px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
              {contactCredits.creditsRemaining === 0 ? 'Buy Pack' : 'Top Up'}
            </Link>
          </div>
        )}

        {/* ── Alert banners for action-required items ── */}
        {newQuotes.length > 0 && (
          <button
            onClick={() => { setActiveSection('quotes'); setSelectedQuote(newQuotes[0]); }}
            className="w-full flex items-center justify-between gap-3 py-3.5 px-5 rounded-2xl font-black text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: 'white', boxShadow: '0 6px 24px rgba(79,70,229,0.3)' }}>
            <div className="flex items-center gap-2">
              <Bell size={15} className="animate-pulse" />
              {newQuotes.length === 1 ? '1 New Fee Quote — Review Now' : `${newQuotes.length} New Fee Quotes — Review Now`}
            </div>
            <ChevronRight size={16} className="shrink-0" />
          </button>
        )}
        {actionNeededTickets.length > 0 && (
          <button
            onClick={() => setActiveSection('tickets')}
            className="w-full flex items-center justify-between gap-3 py-3.5 px-5 rounded-2xl font-black text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: 'white', boxShadow: '0 6px 24px rgba(124,58,237,0.28)' }}>
            <div className="flex items-center gap-2">
              <Ticket size={15} className="animate-pulse" />
              {actionNeededTickets.length === 1 ? '1 Work Ticket needs your confirmation' : `${actionNeededTickets.length} Work Tickets need your confirmation`}
            </div>
            <ChevronRight size={16} className="shrink-0" />
          </button>
        )}

        {/* ── 4 Summary Tiles ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Bookings Tile */}
          <button onClick={() => setActiveSection('bookings')}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all p-5 text-left group relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-2xl" />
            <div className="pl-3">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <Calendar size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Bookings</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {loading ? '—' : pendingBookings.length > 0 ? `${pendingBookings.length} pending` : 'All clear'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-3xl font-black text-slate-800 leading-none">
                    {loading ? <Loader2 size={20} className="animate-spin text-slate-200 mt-1" /> : bookings.length}
                  </span>
                  {!loading && pendingBookings.length > 0 && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                      {pendingBookings.length} pending
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 mb-3 min-h-[46px] flex items-center">
                {!loading && bookings.length > 0 ? (
                  <div className="w-full">
                    <p className="text-xs font-semibold text-slate-700 truncate">{bookings[0].advisor?.fullName ?? 'Advisor'}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(bookings[0].scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}<span className={STATUS_STYLES[bookings[0].status].text}>{STATUS_STYLES[bookings[0].status].label}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 w-full text-center">{loading ? 'Loading…' : 'No bookings yet'}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-indigo-500 group-hover:text-indigo-700 transition-colors">View all bookings</span>
                <ChevronRight size={14} className="text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </button>

          {/* Fee Quotes Tile */}
          <button onClick={() => setActiveSection('quotes')}
            className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all p-5 text-left group relative overflow-hidden ${newQuotes.length > 0 ? 'border-violet-200' : 'border-slate-100 hover:border-violet-200'}`}>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 rounded-l-2xl" />
            <div className="pl-3">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center relative">
                    <FileText size={20} className="text-violet-600" />
                    {newQuotes.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-600 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-pulse border-2 border-white">
                        {newQuotes.length}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Fee Quotes</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {quotesLoading ? '—' : newQuotes.length > 0 ? `${newQuotes.length} new` : `${quotes.length} total`}
                    </p>
                  </div>
                </div>
                <span className="text-3xl font-black text-slate-800 leading-none">
                  {quotesLoading ? <Loader2 size={20} className="animate-spin text-slate-200 mt-1" /> : quotes.length}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 mb-3 min-h-[46px] flex items-center">
                {!quotesLoading && quotes.length > 0 ? (
                  <div className="w-full">
                    <p className="text-xs font-semibold text-slate-700 truncate">{quotes[0].advisor.fullName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {quotes[0].totalAmount ? `₹${parseFloat(quotes[0].totalAmount).toLocaleString('en-IN')} · ` : ''}
                      <span className={quotes[0].status === 'QUOTED' && !quotes[0].viewedAt ? 'text-indigo-600 font-semibold' : ''}>{quotes[0].status}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 w-full text-center">{quotesLoading ? 'Loading…' : 'No quotes yet'}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-violet-500 group-hover:text-violet-700 transition-colors">View all quotes</span>
                <ChevronRight size={14} className="text-violet-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </button>

          {/* Work Tickets Tile */}
          <button onClick={() => setActiveSection('tickets')}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all p-5 text-left group relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-2xl" />
            <div className="pl-3">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center relative">
                    <Ticket size={20} className="text-emerald-600" />
                    {actionNeededTickets.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 rounded-full text-[9px] font-black text-white flex items-center justify-center animate-pulse border-2 border-white">!</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Work Tickets</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ticketsLoading ? '—' : actionNeededTickets.length > 0 ? 'Action needed' : `${activeTickets.length} active`}
                    </p>
                  </div>
                </div>
                <span className="text-3xl font-black text-slate-800 leading-none">
                  {ticketsLoading ? <Loader2 size={20} className="animate-spin text-slate-200 mt-1" /> : tickets.length}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 mb-3 min-h-[46px] flex items-center">
                {!ticketsLoading && tickets.length > 0 ? (
                  <div className="w-full">
                    <p className="text-xs font-semibold text-slate-700 truncate">{tickets[0].advisor?.fullName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {tickets[0].ticketNumber} · ₹{Number(tickets[0].totalAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 w-full text-center">{ticketsLoading ? 'Loading…' : 'No work tickets yet'}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-500 group-hover:text-emerald-700 transition-colors">View all tickets</span>
                <ChevronRight size={14} className="text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </button>

          {/* Unlocked Contacts Tile */}
          <button onClick={() => setActiveSection('contacts')}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all p-5 text-left group relative overflow-hidden" style={{ ['--tw-border-opacity' as any]: 1 }}>
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: '#D4AF37' }} />
            <div className="pl-3">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center border" style={{ background: 'rgba(212,175,55,0.10)', borderColor: 'rgba(212,175,55,0.3)' }}>
                    <UserCheck size={20} style={{ color: '#B48C22' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Unlocked Contacts</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {contactedLoading ? '—' : `${contactedAdvisors.length} advisors`}
                    </p>
                  </div>
                </div>
                <span className="text-3xl font-black text-slate-800 leading-none">
                  {contactedLoading ? <Loader2 size={20} className="animate-spin text-slate-200 mt-1" /> : contactedAdvisors.length}
                </span>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 mb-3 min-h-[46px] flex items-center">
                {!contactedLoading && contactedAdvisors.length > 0 ? (
                  <div className="flex items-center gap-2 w-full">
                    {contactedAdvisors[0].advisor.avatarUrl ? (
                      <img src={resolveImg(contactedAdvisors[0].advisor.avatarUrl)!} alt={contactedAdvisors[0].advisor.fullName}
                        className="w-6 h-6 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-black text-white shrink-0">
                        {contactedAdvisors[0].advisor.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{contactedAdvisors[0].advisor.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{contactedAdvisors[0].advisor.location}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 w-full text-center">{contactedLoading ? 'Loading…' : 'No contacts unlocked yet'}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold group-hover:opacity-70 transition-opacity" style={{ color: '#B48C22' }}>View all contacts</span>
                <ChevronRight size={14} style={{ color: '#B48C22' }} className="group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </button>
        </div>

        {/* ── Quick action links ── */}
        <div className="flex flex-wrap gap-2 pb-4">
          <Link href="/advisors"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all">
            <Phone size={13} /> Browse Advisors
          </Link>
          <Link href="/buy-pack"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border"
            style={{ borderColor: 'rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.06)', color: '#B48C22' }}>
            <CreditCard size={13} /> Buy Contact Pack
          </Link>
          <Link href="/contact"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-white transition-all">
            <MessageSquare size={13} /> Support
          </Link>
        </div>

      </div>
    </div>

    {/* ── Section Detail Drawer ── */}
    {activeSection && (
      <>
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10001]" onClick={() => setActiveSection(null)} />
        <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[10002] flex flex-col">

          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3">
              {/* Back button when viewing a quote detail inline */}
              {activeSection === 'quotes' && selectedQuote ? (
                <button onClick={() => setSelectedQuote(null)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors">
                  <ArrowLeft size={16} className="text-violet-600" />
                </button>
              ) : (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  activeSection === 'bookings' ? 'bg-indigo-50 border border-indigo-100' :
                  activeSection === 'quotes'   ? 'bg-violet-50 border border-violet-100' :
                  activeSection === 'tickets'  ? 'bg-emerald-50 border border-emerald-100' :
                  'border'
                }`} style={activeSection === 'contacts' ? { background: 'rgba(212,175,55,0.10)', borderColor: 'rgba(212,175,55,0.3)' } : {}}>
                  {activeSection === 'bookings' && <Calendar size={16} className="text-indigo-600" />}
                  {activeSection === 'quotes'   && <FileText size={16} className="text-violet-600" />}
                  {activeSection === 'tickets'  && <Ticket size={16} className="text-emerald-600" />}
                  {activeSection === 'contacts' && <UserCheck size={16} style={{ color: '#B48C22' }} />}
                </div>
              )}
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {activeSection === 'quotes' && selectedQuote
                    ? `Quote from ${selectedQuote.advisor.fullName}`
                    : activeSection === 'bookings' ? 'My Bookings'
                    : activeSection === 'quotes'   ? 'Fee Quotes'
                    : activeSection === 'tickets'  ? 'Work Tickets'
                    : 'Unlocked Contacts'}
                </h2>
                <p className="text-[10px] text-slate-400">
                  {activeSection === 'quotes' && selectedQuote
                    ? getCategoryName(selectedQuote.categorySlug)
                    : activeSection === 'bookings' ? `${bookings.length} total`
                    : activeSection === 'quotes'   ? `${quotes.length} total`
                    : activeSection === 'tickets'  ? `${tickets.length} total`
                    : `${contactedAdvisors.length} advisors`}
                </p>
              </div>
            </div>
            <button onClick={() => { setActiveSection(null); setSelectedQuote(null); }}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          {/* Drawer scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F8F9FC]">

            {/* Bookings list */}
            {activeSection === 'bookings' && (
              loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-20">
                  <Calendar size={38} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold text-sm">No bookings yet</p>
                  <Link href="/advisors" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50">
                    Browse Advisors
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(booking => {
                    const s = STATUS_STYLES[booking.status];
                    const canCancelThis = canCancel(booking);
                    const hLeft = hoursLeft(booking);
                    return (
                      <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-[10px] text-slate-400 font-mono">{booking.bookingNumber}</p>
                            <h3 className="font-bold text-sm text-slate-800 mt-0.5">{booking.advisor?.fullName ?? 'Advisor'}</h3>
                            {booking.advisor?.businessName && <p className="text-xs text-slate-500">{booking.advisor.businessName}</p>}
                          </div>
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
                            {s.icon} {s.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-indigo-400/60" />
                            {new Date(booking.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-indigo-400/60" />
                            {booking.startTime} – {booking.endTime}
                          </div>
                          {booking.advisor?.location && (
                            <div className="flex items-center gap-1.5 col-span-2">
                              <MapPin size={12} className="text-indigo-400/60" />
                              {booking.advisor.location}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm" style={{ color: '#B48C22' }}>₹{booking.totalFee}</span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{booking.mode}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {booking.status === 'PENDING' && canCancelThis && (
                              <span className="text-[10px] text-amber-600">{hLeft}h left to cancel</span>
                            )}
                            {canCancelThis && (
                              <button onClick={() => handleCancel(booking.id)} disabled={cancelling === booking.id}
                                className="flex items-center gap-1 text-[11px] font-semibold text-red-600 border border-red-200 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 hover:bg-red-50">
                                {cancelling === booking.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />} Cancel
                              </button>
                            )}
                            {booking.status === 'ACCEPTED' && (
                              <span className="flex items-center gap-1 text-[11px] text-blue-600"><CheckCircle2 size={12} /> Confirmed</span>
                            )}
                            {booking.status === 'COMPLETED' && (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600"><ShieldCheck size={12} /> Done</span>
                            )}
                          </div>
                        </div>
                        {booking.status === 'PENDING' && !canCancelThis && (
                          <p className="text-[10px] text-slate-400 mt-2">Cancellation window (24h) has passed. Contact support for disputes.</p>
                        )}
                        {/* Chat Room button */}
                        {booking.chatRoom?.id && booking.status !== 'CANCELLED' && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                            <Link href={`/chat/${booking.chatRoom.id}`}
                              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all">
                              <MessageSquare size={12} /> Open Consultation Chat
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Quotes list / inline detail */}
            {activeSection === 'quotes' && (
              selectedQuote ? (
                /* ── Inline quote detail ── */
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  {/* validity badge row */}
                  <div className="px-4 pt-3 pb-0 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedQuote.categorySlug && (
                        <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                          {getCategoryName(selectedQuote.categorySlug)}
                        </span>
                      )}
                      {selectedQuote.status === 'ACCEPTED' && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 size={9} /> Accepted
                        </span>
                      )}
                      {selectedQuote.status === 'CANCELLED' && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                          Declined
                        </span>
                      )}
                      {selectedQuote.status === 'EXPIRED' && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-500/10 border border-slate-500/30 px-2 py-0.5 rounded-full">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>
                  <FeeQuoteViewModal
                    inline
                    quote={selectedQuote}
                    isOpen={true}
                    onClose={() => setSelectedQuote(null)}
                    onDeclined={(id) => {
                      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: 'CANCELLED' } : q));
                      setSelectedQuote(null);
                    }}
                    onAccepted={(quoteId, ticketId) => {
                      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: 'ACCEPTED' } : q));
                      fetchQuotes();
                      fetchTickets();
                      if (ticketId) router.push(`/tickets/${ticketId}`);
                    }}
                  />
                </div>
              ) : quotesLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>
              ) : quotes.length === 0 ? (
                <div className="text-center py-20">
                  <FileText size={38} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold text-sm">No fee quotes yet</p>
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
                        onClick={() => { setSelectedQuote(q); }}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white transition-all hover:shadow-md active:scale-[0.99] ${isNew ? 'border-indigo-200' : 'border-slate-100 shadow-sm'}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-violet-50 border border-violet-100">
                          <FileText size={15} className="text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{q.advisor.fullName}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {q.totalAmount ? `₹${parseFloat(q.totalAmount).toLocaleString('en-IN')} · ` : ''}{getCategoryName(q.categorySlug)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>{q.status}</span>
                          {isNew && <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            )}

            {/* Tickets list */}
            {activeSection === 'tickets' && (
              ticketsLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-20">
                  <Ticket size={38} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold text-sm">No work tickets yet</p>
                  <p className="text-slate-400 text-xs mt-1">Work tickets appear when an advisor begins tracked work for you.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t: any) => {
                    const statusColor =
                      t.status === 'OPEN'             ? 'text-blue-700 bg-blue-50 border-blue-200' :
                      t.status === 'IN_PROGRESS'      ? 'text-amber-700 bg-amber-50 border-amber-200' :
                      t.status === 'AWAITING_CONFIRM' ? 'text-purple-700 bg-purple-50 border-purple-200' :
                      t.status === 'PAYOUT_RELEASED'  ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                      t.status === 'DISPUTED'         ? 'text-red-600 bg-red-50 border-red-200' :
                                                        'text-slate-500 bg-slate-50 border-slate-200';
                    const needsAction = t.status === 'AWAITING_CONFIRM';
                    return (
                      <button key={t.id}
                        onClick={() => { router.push(`/tickets/${t.id}`); setActiveSection(null); }}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all hover:shadow-sm ${needsAction ? 'border-purple-200 bg-purple-50/60' : 'border-slate-100 bg-white shadow-sm'}`}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 border border-emerald-100">
                          <Ticket size={15} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{t.advisor?.fullName}</p>
                          <p className="text-[11px] text-slate-500">
                            {t.ticketNumber} · ₹{Number(t.totalAmount).toLocaleString('en-IN')}
                            {t.stages?.length ? ` · ${t.stages.filter((s: any) => s.status === 'CONFIRMED').length}/${t.stages.length} stages` : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>{t.status.replace('_', ' ')}</span>
                          {needsAction && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            )}

            {/* Contacts list */}
            {activeSection === 'contacts' && (
              contactedLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 size={20} className="animate-spin mr-2" /> Loading…</div>
              ) : contactedError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-10 text-center">
                  <AlertCircle size={28} className="text-red-400 mx-auto mb-2" />
                  <p className="text-red-600 text-sm font-medium">{contactedError}</p>
                  <button onClick={fetchContactedAdvisors} className="mt-3 text-xs text-indigo-600 underline">Try again</button>
                </div>
              ) : contactedAdvisors.length === 0 ? (
                <div className="text-center py-20">
                  <UserCheck size={38} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold text-sm">No contacts unlocked yet</p>
                  <p className="text-slate-400 text-xs mt-1">Advisors you contact will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contactedAdvisors.map(({ id, unlockedAt, isFree, advisor }) => {
                    const initials = advisor.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <div key={id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          {advisor.avatarUrl ? (
                            <img src={resolveImg(advisor.avatarUrl)!} alt={advisor.fullName}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black text-white shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link href={`/advisors/${advisor.id}`} onClick={() => setActiveSection(null)}
                                className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate">
                                {advisor.fullName}
                              </Link>
                              <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">
                              {advisor.categories.length > 0 ? advisor.categories.slice(0, 2).join(' · ') : advisor.location}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${isFree ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                            {isFree ? 'Free' : 'Credit used'}
                          </span>
                        </div>
                        <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-y-1.5 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5"><Phone size={11} className="text-slate-400 shrink-0" /> {advisor.phoneNumber}</div>
                          {advisor.email && <div className="flex items-center gap-1.5 truncate"><Eye size={11} className="text-slate-400 shrink-0" /> {advisor.email}</div>}
                          <div className="flex items-center gap-1.5"><MapPin size={11} className="text-slate-400 shrink-0" /> {advisor.location}</div>
                          <div className="flex items-center gap-1.5"><BookOpen size={11} className="text-slate-400 shrink-0" /> {advisor.experienceYears}y experience</div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-right">
                          Unlocked {new Date(unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )
            )}

          </div>
        </div>
      </>
    )}

    </>
  );
}
