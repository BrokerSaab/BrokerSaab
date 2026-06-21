'use client';

import React, { useState } from 'react';
import { X, FileText, ChevronDown, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const CATEGORIES = [
  { slug: 'm1',  name: 'Birth, Death & Marriage Papers' },
  { slug: 'm2',  name: 'Identity Cards & Documents' },
  { slug: 'm3',  name: 'Income, Caste & Residence' },
  { slug: 'm4',  name: 'Property & Land Papers' },
  { slug: 'm5',  name: 'Tax / GST Filing' },
  { slug: 'm6',  name: 'Business Registration' },
  { slug: 'm7',  name: 'Brand & IP Protection' },
  { slug: 'm8',  name: 'Bank, Loan & Credit' },
  { slug: 'm9',  name: 'Insurance (Bima)' },
  { slug: 'm10', name: 'Vehicle & RTO Work' },
  { slug: 'm11', name: 'Legal & Court Help' },
  { slug: 'm12', name: 'Job, PF & Labour' },
  { slug: 'm13', name: 'School & College Papers' },
  { slug: 'm14', name: 'Pension & Govt Schemes' },
  { slug: 'm15', name: 'Savings & Investment' },
  { slug: 'm16', name: 'Passport, Visa & Foreign' },
  { slug: 'm17', name: 'Electricity, Water & Gas' },
  { slug: 'm18', name: 'Farmer & Agriculture' },
  { slug: 'm19', name: 'Online Form & Doc Help' },
  { slug: 'm20', name: 'Central Government Schemes' },
  { slug: 'm21', name: 'Study Abroad Consulting' },
  { slug: 'm22', name: 'Domestic College Admission' },
  { slug: 'm23', name: 'Job Placement & Recruitment' },
  { slug: 'm24', name: 'Visa & PR Immigration' },
  { slug: 'm25', name: 'Others / Custom Service' },
  { slug: 'm26', name: 'Tour & Travel' },
];

interface Props {
  advisorId: string;
  advisorName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (quoteId: string) => void;
}

type Step = 'form' | 'success';

export default function FeeQuoteRequestModal({ advisorId, advisorName, isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [categorySlug, setCategorySlug] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('accessToken') || '';
      const res = await fetch(`${API}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          advisorId,
          ...(categorySlug   ? { categorySlug }   : {}),
          ...(clientMessage.trim() ? { clientMessage: clientMessage.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('success');
        onSuccess?.(data.data.id);
      } else {
        setError(data.message || 'Failed to send request');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleClose = () => {
    setStep('form');
    setCategorySlug('');
    setClientMessage('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', border: '1px solid rgba(212,175,55,0.25)' }}>

        {/* Gold top bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg,#D4AF37,#4F46E5,#D4AF37)' }} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.4)' }}>
              <FileText size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">Request Fee Quote</h2>
              <p className="text-white/40 text-xs mt-0.5">{advisorName}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/30 hover:text-white/70 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {step === 'form' ? (
            <div className="space-y-4">
              <p className="text-white/50 text-xs leading-relaxed">
                Ask the advisor for a detailed fee breakdown before committing. They'll respond with a full cost estimate.
              </p>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5">Service Category <span className="text-white/30 font-normal">(optional)</span></label>
                <div className="relative">
                  <select
                    value={categorySlug}
                    onChange={e => setCategorySlug(e.target.value)}
                    className="w-full appearance-none bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <option value="" className="bg-[#1a1040] text-white">â€” Select a category â€”</option>
                    {CATEGORIES.map(c => (
                      <option key={c.slug} value={c.slug} className="bg-[#1a1040] text-white">{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-1.5 flex items-center gap-1">
                  <MessageSquare size={11} /> Your Message <span className="text-white/30 font-normal">(optional)</span>
                </label>
                <textarea
                  value={clientMessage}
                  onChange={e => setClientMessage(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe what you need help with, any specific requirements, timeline, etc."
                  className="w-full bg-white/6 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <p className="text-right text-[10px] text-white/20 mt-1">{clientMessage.length}/1000</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: 'white', boxShadow: '0 6px 20px rgba(79,70,229,0.35)' }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sendingâ€¦</> : <><FileText size={16} /> Send Quote Request</>}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(79,70,229,0.15)', border: '2px solid rgba(79,70,229,0.4)' }}>
                <CheckCircle2 size={32} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-black text-base">Quote Request Sent!</h3>
                <p className="text-white/50 text-xs mt-1.5 leading-relaxed">
                  {advisorName} has been notified and will send you a detailed fee breakdown within 48 hours.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl px-4 py-3 text-left border border-white/10">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">What happens next?</p>
                <ul className="space-y-1 text-xs text-white/50">
                  <li>â€¢ Advisor reviews your request</li>
                  <li>â€¢ They send a detailed breakdown of all charges</li>
                  <li>â€¢ You get notified and can compare advisor quotes</li>
                  <li>â€¢ Decide and book when you're ready</li>
                </ul>
              </div>
              <button onClick={handleClose}
                className="w-full py-3 rounded-xl font-bold text-sm text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
