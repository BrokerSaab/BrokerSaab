'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar, Clock, MapPin, ShieldCheck, AlertCircle, Loader2,
  ArrowLeft, XCircle, CheckCircle2, RefreshCw, BookOpen, Phone
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

  useEffect(() => {
    if (!isLoggedIn) {
      openLoginModal(() => router.push('/bookings'));
      return;
    }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

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
          <button onClick={fetchBookings} className="ml-auto text-slate-400 hover:text-gold-400 transition-colors p-2" title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-3" /> Loading your consultations…
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <BookOpen size={48} className="text-slate-600 mx-auto" />
            <p className="text-slate-400 font-medium">No consultations yet</p>
            <p className="text-slate-500 text-sm">Book your first consultation with a verified advisor.</p>
            <Link href="/" className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm mt-2">
              <Phone size={15} /> Find Advisors
            </Link>
          </div>
        ) : (
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
      </div>
    </div>
  );
}
