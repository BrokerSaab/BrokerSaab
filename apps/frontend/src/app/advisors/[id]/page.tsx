'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Star, ShieldCheck, MapPin, Award, Languages, Calendar, Clock,
  ArrowLeft, User, BadgeCheck, Phone, Mail, Eye, Loader2, Copy,
  Check, DollarSign, MessageSquare, Briefcase, ChevronRight, FileText, Crown
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ContactUnlockModal from '@/components/ContactUnlockModal';
import FeeQuoteRequestModal from '@/components/FeeQuoteRequestModal';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '') || '';

function resolveImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

interface AdvisorDetail {
  id: string; fullName: string; businessName?: string; avatarUrl?: string; coverImageUrl?: string;
  bio?: string; experienceYears: number; licenseNumber?: string;
  verificationStatus: string; isAuthorizedDealer: boolean; dealerAuthorizedAt?: string;
  state?: string; consultationFee: string; languages: string[]; location: string;
  categories: string[]; specializations: string[]; averageRating: number; ratingsCount: number;
  reviews: { id: string; clientName: string; rating: number; comment: string; date: string }[];
  availability: { id: string; dayOfWeek: number; startTime: string; endTime: string }[];
  phoneNumber?: string; email?: string;
}

interface ContactStatus {
  creditsRemaining: number; creditsTotal: number;
  expiresAt: string | null; unlockedAdvisorIds: string[];
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
    </button>
  );
}

export default function AdvisorProfilePage() {
  const { id: advisorId } = useParams<{ id: string }>();
  const { user, isLoggedIn, openLoginModal } = useAuth();

  const [advisor, setAdvisor]           = useState<AdvisorDetail | null>(null);
  const [loading, setLoading]           = useState(true);
  const [contactStatus, setContactStatus] = useState<ContactStatus | null>(null);
  const [revealedContact, setRevealed]  = useState<{ phone: string; email: string } | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooked, setIsBooked]         = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<'RAZORPAY' | 'STRIPE' | 'WALLET'>('RAZORPAY');
  const [showQuoteModal,  setShowQuoteModal]  = useState(false);
  const [quoteRequested,  setQuoteRequested]  = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  const token = () => typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') || '' : '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const t = token();
      if (t) headers.Authorization = `Bearer ${t}`;
      const res = await fetch(`${API}/advisors/${advisorId}`, { headers });
      const data = await res.json();
      if (data.success) setAdvisor(data.data);
    } catch { /* keep loading=false */ }
    finally { setLoading(false); }
  }, [advisorId]);

  const fetchContactStatus = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch(`${API}/contacts/status`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setContactStatus(data.data);
    } catch { /* ignore */ }
  }, [isLoggedIn]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchContactStatus(); }, [fetchContactStatus]);

  const handleRevealContact = async () => {
    if (!isLoggedIn) { openLoginModal(); return; }
    setUnlockLoading(true);
    try {
      const res = await fetch(`${API}/contacts/unlock/${advisorId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (data.success && data.phoneNumber) {
        setRevealed({ phone: data.phoneNumber, email: data.email || '' });
      } else if (data.requiresPurchase) {
        setShowModal(true);
      }
    } catch { /* ignore */ }
    finally { setUnlockLoading(false); }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { openLoginModal(); return; }
    if (!selectedSlot) return;
    try {
      const res = await fetch(`${API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ advisorId, slotId: selectedSlot, paymentGateway }),
      });
      const data = await res.json();
      if (data.success) setIsBooked(true);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm text-gray-500">Loading advisor profile…</p>
        </div>
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
            <User size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Advisor Not Found</h2>
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const initials = advisor.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isAlreadyUnlocked = !!revealedContact || (contactStatus?.unlockedAdvisorIds || []).includes(advisorId);
  const creditsLeft = contactStatus?.creditsRemaining ?? 0;
  const showFreeLabel = !isAlreadyUnlocked && (contactStatus?.unlockedAdvisorIds?.length ?? 0) === 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── COVER PHOTO ── tall area, only back link inside */}
      <div className="relative h-44 sm:h-60 overflow-hidden">
        {advisor.coverImageUrl ? (
          <>
            <img src={resolveImg(advisor.coverImageUrl)!} alt="Cover"
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900" />
        )}
        {/* Back link — pill style, floats top-left */}
        <Link href="/"
          className="absolute top-4 left-4 sm:left-6 inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all hover:bg-black/50 group">
          <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Advisors
        </Link>
      </div>

      {/* ── PROFILE BAR — white strip, avatar overlaps cover above ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">

          {/* Avatar + name row — items-end so name aligns with avatar bottom */}
          <div className="flex items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16 pb-4">

            {/* Avatar (overlaps up into cover via negative margin on parent) */}
            <div className="relative shrink-0 z-10">
              {advisor.avatarUrl ? (
                <img src={resolveImg(advisor.avatarUrl)!} alt={advisor.fullName}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover shadow-2xl"
                  style={{ border: '4px solid white' }} />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-2xl"
                  style={{ border: '4px solid white' }}>
                  {initials}
                </div>
              )}
              {/* Crown badge */}
              {advisor.isAuthorizedDealer && (
                <div className="absolute -top-2 -right-1 z-20">
                  <span className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: 'rgba(212,175,55,0.5)' }} />
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-xl"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', boxShadow: '0 0 14px rgba(212,175,55,0.75)' }}>
                    <Crown size={14} className="text-slate-900" fill="currentColor" />
                  </div>
                </div>
              )}
            </div>

            {/* Name + badges + stats — sits to the right, bottom-aligned */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{advisor.fullName}</h1>
                <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                {advisor.isAuthorizedDealer && (
                  <span className="relative inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#1e1b4b' }}>
                    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(212,175,55,0.45)' }} />
                    <Crown size={8} fill="currentColor" /> Authorised
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <StarRating rating={advisor.averageRating} size={11} />
                  <span className="font-bold text-amber-600 ml-0.5">{advisor.averageRating > 0 ? advisor.averageRating.toFixed(1) : 'New'}</span>
                  <span className="text-slate-400">({advisor.ratingsCount})</span>
                </div>
                <span className="flex items-center gap-1"><Award size={11} className="text-amber-500" />{advisor.experienceYears} yrs exp</span>
                <span className="flex items-center gap-1"><MapPin size={11} className="text-blue-500" />{advisor.location.split(',')[0]}</span>
                {advisor.state && <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">📍 {advisor.state}</span>}
              </div>
            </div>
          </div>

          {/* Category badges — full width row below avatar+name */}
          {advisor.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-4">
              {advisor.categories.slice(0, 4).map(cat => (
                <span key={cat} className="text-[10px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full">
                  {cat}
                </span>
              ))}
              {advisor.categories.length > 4 && (
                <span className="text-[10px] text-slate-400 px-2 py-1">+{advisor.categories.length - 4} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-28 lg:pb-16 mt-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT — Main content ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* About */}
            {advisor.bio && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <User size={14} className="text-indigo-600" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">About</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{advisor.bio}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Award size={14} className="text-indigo-500 shrink-0" />
                    <span><strong className="text-gray-900">{advisor.experienceYears}</strong> years exp</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Languages size={14} className="text-indigo-500 shrink-0" />
                    <span>{advisor.languages.join(', ')}</span>
                  </div>
                  {advisor.licenseNumber && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Briefcase size={14} className="text-indigo-500 shrink-0" />
                      <span>Lic: <strong className="text-gray-900">{advisor.licenseNumber}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services */}
            {(advisor.categories.length > 0 || advisor.specializations.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Briefcase size={14} className="text-blue-600" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Services</h2>
                </div>
                {advisor.categories.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Service Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {advisor.categories.map(cat => (
                        <span key={cat} className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {advisor.specializations.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Specialisations</p>
                    <div className="space-y-1.5">
                      {advisor.specializations.map(sp => (
                        sp.length > 40
                          ? (
                            <p key={sp} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 leading-relaxed">
                              {sp}
                            </p>
                          )
                          : (
                            <span key={sp} className="inline-block text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1.5 rounded-full mr-2 mb-1">
                              {sp}
                            </span>
                          )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Availability */}
            {advisor.availability.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Calendar size={14} className="text-emerald-600" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Availability</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...new Map(advisor.availability.map(s => [s.dayOfWeek, s])).values()].map(slot => (
                    <div key={slot.dayOfWeek} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-white">{DAYS[slot.dayOfWeek]}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-emerald-800">{slot.startTime} – {slot.endTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                    <MessageSquare size={14} className="text-amber-600" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">Reviews</h2>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={advisor.averageRating} />
                  <span className="text-sm font-black text-gray-800">{advisor.averageRating > 0 ? advisor.averageRating.toFixed(1) : '—'}</span>
                  <span className="text-xs text-gray-400">({advisor.ratingsCount})</span>
                </div>
              </div>

              {advisor.reviews.length > 0 ? (
                <div className="space-y-3">
                  {advisor.reviews.map(r => (
                    <div key={r.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">{r.clientName}</span>
                        <span className="text-[11px] text-gray-400">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <StarRating rating={r.rating} size={12} />
                      <p className="text-xs text-gray-600 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No reviews yet</p>
                  <p className="text-xs text-gray-300 mt-1">Be the first to book a consultation</p>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT — Booking sidebar ── */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* Fee card */}
            <div ref={bookingRef} className="rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
                <p className="text-xs text-white/70 uppercase tracking-widest font-bold">Consultation Fee</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black text-white">₹{advisor.consultationFee}</span>
                  <span className="text-sm text-white/60">/ session</span>
                </div>
              </div>

              {/* Connect section */}
              <div className="bg-white p-5 space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Contact Advisor</p>
                  {revealedContact ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={13} className="text-emerald-500 shrink-0" />
                        <span className="text-gray-900 font-mono">{revealedContact.phone}</span>
                        <button onClick={() => { navigator.clipboard.writeText(revealedContact.phone); }} className="ml-auto p-1 rounded hover:bg-gray-200">
                          <Copy size={12} className="text-gray-400" />
                        </button>
                      </div>
                      {revealedContact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={13} className="text-emerald-500 shrink-0" />
                          <span className="text-gray-600 text-xs truncate">{revealedContact.email}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={handleRevealContact} disabled={unlockLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-md">
                      {unlockLoading ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                      {unlockLoading ? 'Connecting…' : isLoggedIn
                        ? (showFreeLabel ? 'Connect — FREE 🎁' : creditsLeft > 0 ? `Connect (${creditsLeft} left)` : 'Connect — Buy Credits')
                        : 'Sign in to Connect'}
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Fee Quote Request */}
                {user?.role === 'CLIENT' && (
                  quoteRequested ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <Check size={14} className="text-indigo-600 shrink-0" />
                      <span className="text-xs font-semibold text-indigo-700">Quote Requested — awaiting advisor response</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => { if (!isLoggedIn) { openLoginModal(); return; } setShowQuoteModal(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-300 text-indigo-700 bg-indigo-50 font-semibold text-sm hover:bg-indigo-100 transition-all">
                      <FileText size={14} /> Ask for Fee Quote
                    </button>
                  )
                )}

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Booking */}
                {isBooked ? (
                  <div className="text-center space-y-3 py-2">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                      <Check size={24} className="text-emerald-600" />
                    </div>
                    <p className="font-bold text-emerald-600">Booking Confirmed!</p>
                    <p className="text-xs text-gray-500">Your escrow transaction has been recorded.</p>
                    <Link href="/bookings" className="block text-xs text-center py-2 px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-all">
                      Track Consultation →
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleBooking} className="space-y-4">
                    {isLoggedIn && user ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                        <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                        <span className="text-[11px] text-gray-500">Booking as <span className="text-gray-900 font-semibold">{user.fullName}</span></span>
                      </div>
                    ) : null}

                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5 mb-2">
                        <Calendar size={11} /> Select Slot
                      </label>
                      <div className="space-y-1.5 max-h-44 overflow-y-auto">
                        {advisor.availability.length > 0 ? advisor.availability.map(slot => (
                          <button type="button" key={slot.id} onClick={() => setSelectedSlot(slot.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs flex justify-between items-center transition-all ${
                              selectedSlot === slot.id
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600'
                            }`}>
                            <span className="font-semibold">{DAYS[slot.dayOfWeek]}</span>
                            <span className="flex items-center gap-1 text-[11px] opacity-80">
                              <Clock size={10} /> {slot.startTime} – {slot.endTime}
                            </span>
                          </button>
                        )) : <p className="text-[11px] text-gray-400 text-center py-3">No slots configured yet</p>}
                      </div>
                    </div>

                    {selectedSlot && (
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5 mb-2">
                          <DollarSign size={11} /> Payment
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['RAZORPAY', 'STRIPE', 'WALLET'] as const).map(gw => (
                            <button type="button" key={gw} onClick={() => setPaymentGateway(gw)}
                              className={`py-2 rounded-lg text-[9px] font-bold transition-all text-center border ${
                                paymentGateway === gw ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-indigo-300'
                              }`}>
                              {gw}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button type="submit" disabled={!selectedSlot}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        selectedSlot
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-md'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      }`}>
                      {!isLoggedIn ? 'Sign In & Book' : 'Book Consultation'}
                      {selectedSlot && <ChevronRight size={15} />}
                    </button>
                  </form>
                )}

                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  🛡️ Escrow Protected — funds held until consultation is complete
                </p>
              </div>
            </div>

            {/* Trust signals card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              {[
                { icon: ShieldCheck, color: 'text-emerald-500', label: 'KYC Verified', sub: 'Identity confirmed by BrokerSaab' },
                { icon: Award, color: 'text-amber-500', label: 'Licensed Professional', sub: 'Government-issued credentials on file' },
                { icon: Star, color: 'text-indigo-500', label: 'Rated & Reviewed', sub: 'Real client feedback only' },
              ].map(({ icon: Icon, color, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon size={16} className={`${color} shrink-0`} />
                  <div>
                    <p className="text-xs font-bold text-gray-800">{label}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Mobile CTA Bar (visible below lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold leading-tight">per session</p>
            <p className="text-xl font-black" style={{ color: '#B48C22' }}>₹{advisor.consultationFee}</p>
          </div>
          {!revealedContact && (
            <button
              onClick={handleRevealContact}
              disabled={unlockLoading}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all disabled:opacity-50 whitespace-nowrap">
              {unlockLoading ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
              Connect
            </button>
          )}
          {user?.role === 'CLIENT' && !quoteRequested && (
            <button
              onClick={() => { if (!isLoggedIn) { openLoginModal(); return; } setShowQuoteModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all whitespace-nowrap">
              <FileText size={12} /> Quote
            </button>
          )}
          <button
            onClick={() => {
              if (!isLoggedIn) { openLoginModal(); return; }
              bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
            Book <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <ContactUnlockModal
        advisorId={advisorId}
        advisorName={advisor.fullName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUnlockSuccess={(phone, email, creditsRemaining) => {
          setRevealed({ phone, email });
          setContactStatus(prev => prev ? { ...prev, creditsRemaining, unlockedAdvisorIds: [...(prev.unlockedAdvisorIds || []), advisorId] } : prev);
          setShowModal(false);
        }}
      />

      <FeeQuoteRequestModal
        advisorId={advisorId}
        advisorName={advisor.fullName}
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        onSuccess={() => { setQuoteRequested(true); setShowQuoteModal(false); }}
      />
    </div>
  );
}
