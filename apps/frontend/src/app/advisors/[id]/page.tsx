'use client';

import React, { useState } from 'react';
import { Star, ShieldCheck, MapPin, Award, Languages, Calendar, Clock, DollarSign, ArrowLeft, User, BadgeCheck, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Slot {
  id: string;
  dayOfWeek: string;
  time: string;
}

const MOCK_SLOTS: Slot[] = [
  { id: 's1', dayOfWeek: 'Monday', time: '10:00 AM - 11:00 AM' },
  { id: 's2', dayOfWeek: 'Monday', time: '02:00 PM - 03:00 PM' },
  { id: 's3', dayOfWeek: 'Tuesday', time: '11:00 AM - 12:00 PM' },
  { id: 's4', dayOfWeek: 'Wednesday', time: '04:00 PM - 05:00 PM' },
  { id: 's5', dayOfWeek: 'Thursday', time: '09:00 AM - 10:00 AM' }
];

export default function AdvisorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const { user, isLoggedIn, openLoginModal } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<'STRIPE' | 'RAZORPAY' | 'WALLET'>('STRIPE');

  // Find simulated advisor details
  const advisor = {
    id: unwrappedParams.id,
    fullName: 'Advocate Rajesh Sen',
    businessName: 'Sen & Associates Corporate Law',
    avatarUrl: null,
    bio: 'Advocate Rajesh Sen has over 12 years of core expertise practicing corporate regulatory law, drafting high-value business contracts, resolving equity litigation, and managing property registrations in Mumbai. Recognized for precision and professional integrity.',
    experienceYears: 12,
    licenseNumber: 'BAR-MUM-2014-9843',
    consultationFee: 1500,
    location: 'Mumbai, Maharashtra',
    rating: 4.9,
    reviewsCount: 142,
    category: 'Corporate Law',
    languages: ['English', 'Hindi', 'Marathi'],
    isAuthorizedDealer: true,
    dealerAuthorizedAt: '2026-03-15T00:00:00.000Z',
    state: 'Maharashtra',
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    if (!isLoggedIn) { openLoginModal(); return; }
    setIsBooked(true);
  };

  return (
    <div className="space-y-8 py-6">

      {/* Back to Catalog */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-gold-400 hover:text-gold-300 font-semibold transition-colors">
        <ArrowLeft size={14} />
        Back to Advisors Catalog
      </Link>

      {/* Authorised Dealer Banner */}
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
            <p className="text-white/60 text-xs leading-relaxed">
              Enhanced verification completed — enhanced KYC, background check, and BrokerSaab conduct agreement signed.
              Choosing this advisor gives you added confidence and platform-backed trust.
            </p>
          </div>
          {advisor.dealerAuthorizedAt && (
            <div className="text-right shrink-0">
              <div className="text-amber-400/60 text-[9px] uppercase tracking-widest font-bold">Authorised since</div>
              <div className="text-amber-400 font-bold text-sm">
                {new Date(advisor.dealerAuthorizedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Portfolio & Credentials */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Portfolio Header */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-gold-500/10 border-2 border-gold-500/40 flex items-center justify-center text-2xl font-black text-gold-400">
                  RS
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
                <span className="text-xs font-semibold text-gold-400">{advisor.licenseNumber}</span>
              </div>
            </div>

            <div className="border-t border-gold-500/10 pt-6">
              <h2 className="text-base font-bold text-slate-200 mb-3">Professional Statement</h2>
              <p className="text-sm text-slate-400 leading-relaxed font-light">{advisor.bio}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gold-500/10 pt-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Award className="text-gold-500" size={18} />
                <span>{advisor.experienceYears} Years Practice</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-gold-500" size={18} />
                <span>{advisor.location}</span>
              </div>
              {advisor.state && (
                <div className="flex items-center gap-2">
                  <Building2 className="text-blue-400" size={18} />
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                    📍 {advisor.state}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Languages className="text-gold-500" size={18} />
                <span>{advisor.languages.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Client Reviews Section */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gold-500/10 pb-4">
              <h2 className="text-base font-bold text-slate-200">Reviews & Ratings ({advisor.reviewsCount})</h2>
              <div className="flex items-center gap-1.5 text-sm text-gold-400 font-bold">
                <Star className="fill-gold-500" size={16} />
                <span>{advisor.rating} / 5.0</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-navy-800/20 border border-gold-500/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-200">Subhash Mehta (Corporate Partner)</span>
                  <span className="text-slate-500">2 days ago</span>
                </div>
                <div className="flex text-gold-500"><Star size={12} className="fill-gold-500"/><Star size={12} className="fill-gold-500"/><Star size={12} className="fill-gold-500"/><Star size={12} className="fill-gold-500"/><Star size={12} className="fill-gold-500"/></div>
                <p className="text-xs text-slate-400 font-light">"Rajesh drafted our shareholder partnership agreements meticulously. Excellent consultation."</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-800/20 border border-gold-500/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-200">Anjali Rao (Real Estate Client)</span>
                  <span className="text-slate-500">1 week ago</span>
                </div>
                <div className="flex text-gold-500"><Star size={12} className="fill-gold-500"/><Star size={12} className="fill-gold-500"/><Star size={12} className="fill-gold-500"/><Star size={12} className="fill-gold-500"/><Star size={12} className="fill-gold-500"/></div>
                <p className="text-xs text-slate-400 font-light">"Cleared all doubts about commercial property deeds instantly. Worth the booking fee."</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Booking Wizard Widget */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border-gold-500/30 sticky top-24 space-y-6">
            
            {/* Price banner */}
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">CONSULTATION FEE</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-gold-400">₹{advisor.consultationFee}</span>
                <span className="text-xs text-slate-500">/ 60 minutes session</span>
              </div>
            </div>

            {/* Auth-aware: Booking as badge OR sign-in prompt */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300">
                  Booking as: <span className="font-semibold">{user.fullName}</span>
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openLoginModal()}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gold-400/80 hover:text-gold-400 transition-colors py-2 border border-gold-500/20 rounded-xl hover:border-gold-500/40 hover:bg-gold-500/5"
              >
                <User size={13} />
                Sign in to book this consultation
              </button>
            )}

            {isBooked ? (
              <div className="p-6 rounded-xl bg-gold-500/5 border border-gold-500/30 text-center space-y-4">
                <ShieldCheck size={48} className="text-gold-500 mx-auto" />
                <h3 className="text-base font-bold text-gold-400">Booking Confirmed!</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  Your escrow transaction has been recorded. The advisor has received your request notification details.
                </p>
                <div className="text-xs bg-navy-800/40 rounded p-2 text-slate-300 font-mono">
                  Room: BS-ROOM-MUM-{Math.floor(1000 + Math.random() * 9000)}
                </div>
                <Link href="/bookings" className="btn-gold block text-xs py-2 mt-4 text-center">
                  Track Consultation
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-6">
                
                {/* Availability Slots selector */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar size={14} className="text-gold-500" />
                    Select Appointment Slot
                  </label>
                  
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {MOCK_SLOTS.map((slot) => (
                      <button
                        type="button"
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${
                          selectedSlot === slot.id
                            ? 'bg-gold-500/10 border-gold-500 text-gold-400'
                            : 'bg-navy-800/20 border-gold-500/10 hover:border-gold-500/30 text-slate-300'
                        }`}
                      >
                        <span className="font-semibold">{slot.dayOfWeek}</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={12} className="text-gold-500/60" />
                          {slot.time}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gateway option select */}
                {selectedSlot && (
                  <div className="space-y-3 border-t border-gold-500/5 pt-4">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-gold-500" />
                      Select Escrow Payment System
                    </label>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {['STRIPE', 'RAZORPAY', 'WALLET'].map((gw) => (
                        <button
                          type="button"
                          key={gw}
                          onClick={() => setPaymentGateway(gw as any)}
                          className={`py-2 rounded-lg border text-[10px] text-center font-bold tracking-wider transition-all ${
                            paymentGateway === gw
                              ? 'bg-gold-500/10 border-gold-500 text-gold-400'
                              : 'bg-navy-800/20 border-gold-500/10 hover:border-gold-500/25 text-slate-400'
                          }`}
                        >
                          {gw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checkout Trigger */}
                <button
                  type="submit"
                  disabled={!selectedSlot}
                  className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider transition-all uppercase ${
                    selectedSlot
                      ? 'btn-gold'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  {!isLoggedIn && selectedSlot ? 'Sign In & Reserve Slot' : 'Pay Escrow & Reserve Slot'}
                </button>
              </form>
            )}

            {/* Escrow Disclaimer badge */}
            <div className="text-[10px] text-slate-500 leading-normal font-light border-t border-gold-500/5 pt-4">
              🛡️ **Escrow Protected**: Funds are held in a secure BrokerSaab node, and will only release to advisor when consultation is completed. Cancel free up to 2 hours before scheduled slot.
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
