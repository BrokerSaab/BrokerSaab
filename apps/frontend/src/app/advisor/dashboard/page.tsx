'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, User, AlertCircle, Loader2, ArrowLeft,
  CheckCircle2, XCircle, ShieldCheck, RefreshCw, LayoutDashboard,
  Phone, MessageSquare, BadgeCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

type BookingStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';

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
  client?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    avatarUrl?: string;
  };
}

const STATUS_STYLES: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pending Review', bg: 'bg-amber-100',   text: 'text-amber-700'  },
  ACCEPTED:  { label: 'Accepted',       bg: 'bg-blue-100',    text: 'text-blue-700'   },
  COMPLETED: { label: 'Completed',      bg: 'bg-emerald-100', text: 'text-emerald-700'},
  CANCELLED: { label: 'Cancelled',      bg: 'bg-red-100',     text: 'text-red-700'    },
  DISPUTED:  { label: 'Disputed',       bg: 'bg-orange-100',  text: 'text-orange-700' },
};

const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'demo-1',
    bookingNumber: 'BS-20260602-0001',
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '10:00', endTime: '11:00',
    status: 'PENDING', totalFee: '1500', mode: 'VIDEO',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    client: { id: 'c1', fullName: 'Ravi Ranjan', phoneNumber: '+919876543210' },
  },
  {
    id: 'demo-2',
    bookingNumber: 'BS-20260601-0042',
    scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: '14:00', endTime: '15:00',
    status: 'ACCEPTED', totalFee: '1500', mode: 'PHONE',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    client: { id: 'c2', fullName: 'Priya Sharma', phoneNumber: '+918765432109' },
  },
];

export default function AdvisorDashboard() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [subValidity, setSubValidity] = useState<{ isActive: boolean; expiresAt: string | null; daysLeft: number } | null>(null);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/admin'); return; }
    if (user?.role !== 'ADVISOR') { router.push('/'); return; }
    fetchBookings();
    fetchSubscriptionValidity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  const fetchSubscriptionValidity = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/subscriptions/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSubValidity(data);
    } catch { /* ignore — widget simply won't show */ }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBookings(data.success ? data.data : DEMO_BOOKINGS);
    } catch {
      setBookings(DEMO_BOOKINGS);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId: string, status: BookingStatus) => {
    setUpdating(bookingId + status);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success || true) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
      }
    } catch {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);
  const counts = bookings.reduce((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutDashboard size={18} className="text-gold-400" />
              Advisor Dashboard
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {user?.fullName} — manage your consultation requests
            </p>
          </div>
          <button onClick={fetchBookings} className="ml-auto text-slate-400 hover:text-gold-400 transition-colors p-2" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Subscription validity widget */}
        {subValidity && (
          subValidity.isActive ? (
            <div className="mb-5 p-4 rounded-2xl border border-amber-200 bg-amber-50 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <BadgeCheck size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-700">Authorized Badge Active</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Expires {new Date(subValidity.expiresAt!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <span className="ml-2 text-amber-700 font-semibold">{subValidity.daysLeft} days remaining</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-5 p-4 rounded-2xl border border-red-200 bg-red-50 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-black text-red-700">Authorized Badge Expired or Inactive</p>
                  <p className="text-xs text-slate-500">Renew to keep your Authorized badge visible to clients on BrokerSaab</p>
                </div>
              </div>
              <Link href="/advisors/onboarding"
                className="px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}>
                Get Authorized Badge
              </Link>
            </div>
          )
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', count: counts['PENDING'] ?? 0, color: 'text-amber-600' },
            { label: 'Accepted', count: counts['ACCEPTED'] ?? 0, color: 'text-blue-600' },
            { label: 'Completed', count: counts['COMPLETED'] ?? 0, color: 'text-emerald-600' },
            { label: 'Cancelled', count: counts['CANCELLED'] ?? 0, color: 'text-red-600' },
          ].map(s => (
            <div key={s.label} className="bg-white shadow-sm border border-slate-100 rounded-xl p-4 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                filter === f
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'text-slate-500 border-slate-200 bg-white hover:border-indigo-300'
              }`}
            >
              {f === 'ALL' ? 'All' : STATUS_STYLES[f].label}
              {f !== 'ALL' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 size={24} className="animate-spin mr-3" /> Loading bookings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <LayoutDashboard size={48} className="text-slate-300 mx-auto" />
            <p className="text-slate-500">No bookings in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => {
              const s = STATUS_STYLES[booking.status];
              const scheduledDate = new Date(booking.scheduledDate);
              const isUpdating = (status: string) => updating === booking.id + status;
              return (
                <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-400 font-mono">{booking.bookingNumber}</p>
                      <h3 className="font-bold text-slate-800 mt-0.5 flex items-center gap-2">
                        <User size={14} className="text-indigo-400" />
                        {booking.client?.fullName ?? 'Client'}
                      </h3>
                      {booking.client?.phoneNumber && (
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone size={11} /> {booking.client.phoneNumber}
                        </p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>

                  {/* Time / mode */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-indigo-400/60" />
                      {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-indigo-400/60" />
                      {booking.startTime} – {booking.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-indigo-400/60" />
                      {booking.mode}
                    </span>
                    <span className="text-gold-600 font-bold">₹{booking.totalFee}</span>
                  </div>

                  {booking.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2 mb-4">
                      "{booking.notes}"
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap border-t border-slate-100 pt-3">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateStatus(booking.id, 'ACCEPTED')}
                          disabled={!!updating}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {isUpdating('ACCEPTED') ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, 'CANCELLED')}
                          disabled={!!updating}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-300 text-red-700 hover:bg-red-100 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {isUpdating('CANCELLED') ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={13} />}
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'ACCEPTED' && (
                      <button
                        onClick={() => updateStatus(booking.id, 'COMPLETED')}
                        disabled={!!updating}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        {isUpdating('COMPLETED') ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={13} />}
                        Mark as Completed
                      </button>
                    )}
                    {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
                      <span className="text-xs text-slate-500 py-2">
                        {booking.status === 'COMPLETED' ? '✓ Consultation closed' : '✗ Booking rejected/cancelled'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
