'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, ShieldCheck, MapPin, Award, Languages, Calendar, Clock, DollarSign, ArrowLeft, User, BadgeCheck, Building2, Phone, Mail, Eye, EyeOff, Loader2, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ContactUnlockModal from '@/components/ContactUnlockModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface AdvisorDetail {
  id: string; fullName: string; businessName?: string; avatarUrl?: string;
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

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-slate-400 hover:text-white" />}
    </button>
  );
}

export default function AdvisorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams   = React.use(params);
  const advisorId         = unwrappedParams.id;
  const { user, isLoggedIn, openLoginModal } = useAuth();

  const [advisor, setAdvisor]             = useState<AdvisorDetail | null>(null);
  const [loading, setLoading]             = useState(true);
  const [contactStatus, setContactStatus] = useState<ContactStatus | null>(null);
  const [revealedContact, setRevealed]    = useState<{ phone: string; email: string } | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [showModal, setShowModal]         = useState(false);

  const [selectedSlot, setSelectedSlot]       = useState<string | null>(null);
  const [isBooked, setIsBooked]               = useState(false);
  const [paymentGateway, setPaymentGateway]   = useState<'STRIPE' | 'RAZORPAY' | 'WALLET'>('RAZORPAY');

  const token = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') || '' : '');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const t = token();
      if (t) headers['Authorization'] = `Bearer ${t}`;

      const [advRes, statusRes] = await Promise.all([
        fetch(`${API}/advisors/${advisorId}`, { headers }),
        isLoggedIn ? fetch(`${API}/contacts/status`, { headers: { Authorization: `Bearer ${t}` } }) : Promise.resolve(null),
      ]);

      const advData = await advRes.json();
      if (advData.success) {
        setAdvisor(advData.data);
        if (advData.data.phoneNumber) setRevealed({ phone: advData.data.phoneNumber, email: advData.data.email || '' });
      }

      if (statusRes) {
        const statusData = await statusRes.json();
        if (statusData.success) setContactStatus(statusData);
      }
    } catch { /* keep existing state */ } finally { setLoading(false); }
  }, [advisorId, isLoggedIn]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRevealContact = async () => {
    if (!isLoggedIn) { openLoginModal(); return; }
    if (revealedContact) return;

    const alreadyUnlocked = contactStatus?.unlockedAdvisorIds?.includes(advisorId);
    const isFirst         = (contactStatus?.unlockedAdvisorIds?.length ?? 0) === 0;
    const hasCredits      = (contactStatus?.creditsRemaining ?? 0) > 0;

    if (alreadyUnlocked || isFirst || hasCredits) {
      setUnlockLoading(true);
      try {
        const res  = await fetch(`${API}/contacts/unlock/${advisorId}`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` } });
        const data = await res.json();
        if (data.success && data.phoneNumber) {
          setRevealed({ phone: data.phoneNumber, email: data.email || '' });
          setContactStatus((prev) => prev ? { ...prev, creditsRemaining: data.creditsRemaining ?? prev.creditsRemaining, unlockedAdvisorIds: [...(prev.unlockedAdvisorIds || []), advisorId] } : prev);
        } else if (data.requiresPurchase) {
          setShowModal(true);
        }
      } catch { /* ignore */ } finally { setUnlockLoading(false); }
    } else {
      setShowModal(true);
    }
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (!isLoggedIn) { openLoginModal(); return; }
    setIsBooked(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-slate-400">
      <Loader2 size={28} className="animate-spin mr-3" /> Loading advisor profile…
    </div>
  );

  if (!advisor) return (
    <div className="text-center py-32 text-slate-400">
      <p className="text-lg font-bold mb-2">Advisor not found</p>
      <Link href="/" className="text-gold-400 hover:underline text-sm">Back to advisors</Link>
    </div>
  );

  const initials = advisor.fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const isAlreadyUnlocked = !!revealedContact;
  const showFreeLabel     = !isAlreadyUnlocked && (contactStatus?.unlockedAdvisorIds?.length ?? 0) === 0;
  const creditsLeft       = contactStatus?.creditsRemaining ?? 0;

  return (
    <div className="space-y-8 py-6">

      <Link href="/" className="inline-flex items-center gap-2 text-xs text-gold-400 hover:text-gold-300 font-semibold transition-colors">
        <ArrowLeft size={14} /> Back to Advisors Catalog
      </Link>

      {/* Authorized banner */}
      {advisor.isAuthorizedDealer && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0">
            <BadgeCheck size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 font-black text-base">BrokerSaab Authorised Dealer</span>
              <span className="text-[9px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
            </div>
            <p className="text-white/60 text-xs leading-relaxed">Enhanced verification — KYC, background check, and BrokerSaab conduct agreement signed.</p>
          </div>
          {advisor.dealerAuthorizedAt && (
            <div className="text-right shrink-0">
              <div className="text-amber-400/60 text-[9px] uppercase tracking-widest font-bold">Authorised since</div>
              <div className="text-amber-400 font-bold text-sm">{new Date(advisor.dealerAuthorizedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — Profile details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-gold-500/10 border-2 border-gold-500/40 flex items-center justify-center text-2xl font-black text-gold-400">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-100">{advisor.fullName}</h1>
                    <ShieldCheck className="text-gold-500" size={20} />
                  </div>
                  <p className="text-sm text-slate-400 font-light">{advisor.businessName}</p>
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-gold-500/5 border border-gold-500/25 flex flex-col items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">LICENSE ID</span>
                <span className="text-xs font-semibold text-gold-400">{advisor.licenseNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="border-t border-gold-500/10 pt-6">
              <h2 className="text-base font-bold text-slate-200 mb-3">Professional Statement</h2>
              <p className="text-sm text-slate-400 leading-relaxed font-light">{advisor.bio}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gold-500/10 pt-6 text-sm text-slate-300">
              <div className="flex items-center gap-2"><Award className="text-gold-500" size={18} /><span>{advisor.experienceYears} Years Practice</span></div>
              <div className="flex items-center gap-2"><MapPin className="text-gold-500" size={18} /><span>{advisor.location}</span></div>
              {advisor.state && (
                <div className="flex items-center gap-2">
                  <Building2 className="text-blue-400" size={18} />
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>📍 {advisor.state}</span>
                </div>
              )}
              <div className="flex items-center gap-2"><Languages className="text-gold-500" size={18} /><span>{advisor.languages.join(', ')}</span></div>
            </div>
          </div>

          {/* Reviews */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gold-500/10 pb-4">
              <h2 className="text-base font-bold text-slate-200">Reviews & Ratings ({advisor.ratingsCount})</h2>
              <div className="flex items-center gap-1.5 text-sm text-gold-400 font-bold">
                <Star className="fill-gold-500" size={16} />
                <span>{advisor.averageRating} / 5.0</span>
              </div>
            </div>
            <div className="space-y-4">
              {advisor.reviews.length > 0 ? advisor.reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-navy-800/20 border border-gold-500/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-200">{r.clientName}</span>
                    <span className="text-slate-500">{new Date(r.date).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex text-gold-500">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < r.rating ? 'fill-gold-500' : 'text-slate-600'} />)}
                  </div>
                  <p className="text-xs text-slate-400 font-light">{r.comment}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-6">No reviews yet. Be the first to book a consultation.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Booking sidebar */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-gold-500/30 sticky top-24 space-y-5">

            {/* Fee */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">CONSULTATION FEE</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-gold-400">₹{advisor.consultationFee}</span>
                <span className="text-xs text-slate-500">/ session</span>
              </div>
            </div>

            {/* ── Contact Reveal Section ── */}
            <div className="border-t border-gold-500/10 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">CONNECT</span>
                {!isAlreadyUnlocked && contactStatus && (
                  <span className="text-[10px] text-gold-400 font-semibold">
                    {showFreeLabel ? 'FREE first connect' : creditsLeft > 0 ? `${creditsLeft} credits left` : ''}
                  </span>
                )}
              </div>

              {isAlreadyUnlocked ? (
                <div className="space-y-2 bg-gold-500/5 rounded-xl border border-gold-500/20 p-3">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-gold-400 shrink-0" />
                    <span className="text-white font-mono text-sm">{revealedContact.phone}</span>
                    <CopyBtn text={revealedContact.phone} />
                  </div>
                  {revealedContact.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-gold-400 shrink-0" />
                      <span className="text-white text-sm truncate">{revealedContact.email}</span>
                      <CopyBtn text={revealedContact.email} />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleRevealContact}
                  disabled={unlockLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all hover:scale-[1.01]"
                  style={{ borderColor: 'rgba(212,175,55,0.4)', color: '#D4AF37', background: 'rgba(212,175,55,0.08)' }}>
                  {unlockLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                  {unlockLoading ? 'Connecting…' : isLoggedIn
                    ? (showFreeLabel ? 'Connect — FREE 🎁' : creditsLeft > 0 ? `Connect (${creditsLeft} credits left)` : 'Connect — Buy Pack ₹116.82')
                    : 'Sign in to Connect'}
                </button>
              )}
            </div>

            {/* Auth check */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300">Booking as: <span className="font-semibold">{user.fullName}</span></span>
              </div>
            ) : (
              <button onClick={() => openLoginModal()}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gold-400/80 hover:text-gold-400 transition-colors py-2 border border-gold-500/20 rounded-xl hover:border-gold-500/40 hover:bg-gold-500/5">
                <User size={13} /> Sign in to book this consultation
              </button>
            )}

            {/* Booking form */}
            {isBooked ? (
              <div className="p-6 rounded-xl bg-gold-500/5 border border-gold-500/30 text-center space-y-4">
                <ShieldCheck size={48} className="text-gold-500 mx-auto" />
                <h3 className="text-base font-bold text-gold-400">Booking Confirmed!</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">Your escrow transaction has been recorded. The advisor has received your request.</p>
                <Link href="/bookings" className="btn-gold block text-xs py-2 mt-4 text-center">Track Consultation</Link>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-5">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar size={14} className="text-gold-500" /> Select Appointment Slot
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {advisor.availability.length > 0 ? advisor.availability.map((slot) => (
                      <button type="button" key={slot.id} onClick={() => setSelectedSlot(slot.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${selectedSlot === slot.id ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-navy-800/20 border-gold-500/10 hover:border-gold-500/30 text-slate-300'}`}>
                        <span className="font-semibold">{DAYS[slot.dayOfWeek]}</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={12} className="text-gold-500/60" /> {slot.startTime} – {slot.endTime}
                        </span>
                      </button>
                    )) : <p className="text-xs text-slate-500 text-center py-4">No slots configured yet.</p>}
                  </div>
                </div>

                {selectedSlot && (
                  <div className="space-y-3 border-t border-gold-500/5 pt-4">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-gold-500" /> Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['STRIPE', 'RAZORPAY', 'WALLET'] as const).map((gw) => (
                        <button type="button" key={gw} onClick={() => setPaymentGateway(gw)}
                          className={`py-2 rounded-lg border text-[10px] text-center font-bold tracking-wider transition-all ${paymentGateway === gw ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-navy-800/20 border-gold-500/10 hover:border-gold-500/25 text-slate-400'}`}>
                          {gw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" disabled={!selectedSlot}
                  className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider transition-all uppercase ${selectedSlot ? 'btn-gold' : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}`}>
                  {!isLoggedIn && selectedSlot ? 'Sign In & Reserve Slot' : 'Pay Escrow & Reserve Slot'}
                </button>
              </form>
            )}

            <div className="text-[10px] text-slate-500 leading-normal font-light border-t border-gold-500/5 pt-4">
              🛡️ Escrow Protected: Funds held securely, released only after consultation is completed.
            </div>
          </div>
        </div>
      </div>

      {/* Contact Unlock Modal */}
      <ContactUnlockModal
        advisorId={advisorId}
        advisorName={advisor.fullName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUnlockSuccess={(phone, email, creditsRemaining) => {
          setRevealed({ phone, email });
          setContactStatus((prev) => prev ? { ...prev, creditsRemaining, unlockedAdvisorIds: [...(prev.unlockedAdvisorIds || []), advisorId] } : prev);
          setShowModal(false);
        }}
      />
    </div>
  );
}
