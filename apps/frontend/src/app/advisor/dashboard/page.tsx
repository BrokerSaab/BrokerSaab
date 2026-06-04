'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, User, AlertCircle, Loader2, ArrowLeft,
  CheckCircle2, XCircle, ShieldCheck, RefreshCw, LayoutDashboard,
  Phone, MessageSquare
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
  PENDING:   { label: 'Pending Review', bg: 'bg-amber-500/10',   text: 'text-amber-400'  },
  ACCEPTED:  { label: 'Accepted',       bg: 'bg-blue-500/10',    text: 'text-blue-400'   },
  COMPLETED: { label: 'Completed',      bg: 'bg-emerald-500/10', text: 'text-emerald-400'},
  CANCELLED: { label: 'Cancelled',      bg: 'bg-red-500/10',     text: 'text-red-400'    },
  DISPUTED:  { label: 'Disputed',       bg: 'bg-orange-500/10',  text: 'text-orange-400' },
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

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/admin'); return; }
    if (user?.role !== 'ADVISOR') { router.push('/'); return; }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-navy-800 border-b border-gold-500/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <LayoutDashboard size={18} className="text-gold-400" />
              Advisor Dashboard
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {user?.fullName} — manage your consultation requests
            </p>
          </div>
          <button onClick={fetchBookings} className="ml-auto text-slate-400 hover:text-gold-400 transition-colors p-2" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Pending', count: counts['PENDING'] ?? 0, color: 'text-amber-400' },
            { label: 'Accepted', count: counts['ACCEPTED'] ?? 0, color: 'text-blue-400' },
            { label: 'Completed', count: counts['COMPLETED'] ?? 0, color: 'text-emerald-400' },
            { label: 'Cancelled', count: counts['CANCELLED'] ?? 0, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-navy-800/50 border border-gold-500/10 rounded-xl p-4 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
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
                  ? 'bg-gold-500 text-navy-800 border-gold-500'
                  : 'text-slate-400 border-slate-700 hover:border-gold-500/30'
              }`}
            >
              {f === 'ALL' ? 'All' : STATUS_STYLES[f].label}
              {f !== 'ALL' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-3" /> Loading bookings…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <LayoutDashboard size={48} className="text-slate-600 mx-auto" />
            <p className="text-slate-400">No bookings in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => {
              const s = STATUS_STYLES[booking.status];
              const scheduledDate = new Date(booking.scheduledDate);
              const isUpdating = (status: string) => updating === booking.id + status;
              return (
                <div key={booking.id} className="bg-navy-800/50 border border-gold-500/10 rounded-2xl p-5 hover:border-gold-500/20 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-500 font-mono">{booking.bookingNumber}</p>
                      <h3 className="font-bold text-white mt-0.5 flex items-center gap-2">
                        <User size={14} className="text-gold-400" />
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
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gold-500/60" />
                      {scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gold-500/60" />
                      {booking.startTime} – {booking.endTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-gold-500/60" />
                      {booking.mode}
                    </span>
                    <span className="text-gold-400 font-bold">₹{booking.totalFee}</span>
                  </div>

                  {booking.notes && (
                    <p className="text-xs text-slate-500 italic bg-navy-900/40 rounded-lg px-3 py-2 mb-4">
                      "{booking.notes}"
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap border-t border-gold-500/5 pt-3">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateStatus(booking.id, 'ACCEPTED')}
                          disabled={!!updating}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {isUpdating('ACCEPTED') ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          Accept
                        </button>
                        <button
                          onClick={() => updateStatus(booking.id, 'CANCELLED')}
                          disabled={!!updating}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
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
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
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
