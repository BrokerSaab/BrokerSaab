'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, Check, ChevronDown, ChevronRight,
  FileHeart, UserCheck, Award, Home, Percent, Briefcase, Lightbulb, Landmark,
  ShieldCheck, Car, Scale, Users, GraduationCap, HeartHandshake, TrendingUp,
  Globe, Zap, Sprout, Laptop, Flag, Plane, School, ClipboardList, FileCheck,
  Sparkles, Layers, Save, MapPin
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES_DATA } from '@/data/servicesData';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const OPEN_SLUGS = ['m21', 'm22', 'm23', 'm24', 'm25'];

const ADVISOR_CATEGORIES = [
  { name: 'Birth, Death & Marriage Papers', slug: 'm1',  icon: FileHeart,     color: 'bg-rose-100',   iconColor: 'text-rose-600',   desc: 'Official civil registrations & personal certificates' },
  { name: 'Identity Cards & Documents',     slug: 'm2',  icon: UserCheck,     color: 'bg-teal-100',   iconColor: 'text-teal-600',   desc: 'National identity cards (Aadhaar, PAN) & corrections' },
  { name: 'Income, Caste & Residence',      slug: 'm3',  icon: Award,         color: 'bg-violet-100', iconColor: 'text-violet-600', desc: 'Revenue certificates, domicile & legal heirship' },
  { name: 'Property & Land Papers',         slug: 'm4',  icon: Home,          color: 'bg-amber-100',  iconColor: 'text-amber-600',  desc: 'Sale deeds, registrations, mutation & title checks' },
  { name: 'Tax / GST Filing',               slug: 'm5',  icon: Percent,       color: 'bg-emerald-100',iconColor: 'text-emerald-600',desc: 'GST registrations, returns & Income Tax filing (ITR)' },
  { name: 'Business Registration',          slug: 'm6',  icon: Briefcase,     color: 'bg-blue-100',   iconColor: 'text-blue-600',   desc: 'Sole proprietorships, Pvt Ltd, NGOs & trade licences' },
  { name: 'Brand & IP Protection',          slug: 'm7',  icon: Lightbulb,     color: 'bg-yellow-100', iconColor: 'text-yellow-600', desc: 'Trademark registration, copyright & patent search' },
  { name: 'Bank, Loan & Credit',            slug: 'm8',  icon: Landmark,      color: 'bg-sky-100',    iconColor: 'text-sky-600',    desc: 'Home loans, business funding & credit card support' },
  { name: 'Insurance (Bima)',               slug: 'm9',  icon: ShieldCheck,   color: 'bg-indigo-100', iconColor: 'text-indigo-600', desc: 'Life, health, vehicle insurance & claims help' },
  { name: 'Vehicle & RTO Work',             slug: 'm10', icon: Car,           color: 'bg-orange-100', iconColor: 'text-orange-600', desc: 'Driving licenses, ownership transfer & permits' },
  { name: 'Legal & Court Help',             slug: 'm11', icon: Scale,         color: 'bg-slate-100',  iconColor: 'text-slate-600',  desc: 'Notaries, legal notices, civil/criminal litigation & bail' },
  { name: 'Job, PF & Labour',               slug: 'm12', icon: Users,         color: 'bg-cyan-100',   iconColor: 'text-cyan-600',   desc: 'PF withdrawals, ESI & contractor labor registration' },
  { name: 'School & College Papers',        slug: 'm13', icon: GraduationCap, color: 'bg-pink-100',   iconColor: 'text-pink-600',   desc: 'Migration certificates, transcripts & marksheet checks' },
  { name: 'Pension & Govt Schemes',         slug: 'm14', icon: HeartHandshake,color: 'bg-rose-100',   iconColor: 'text-rose-600',   desc: 'Ayushman card, welfare schemes & PM-KISAN pension' },
  { name: 'Savings & Investment',           slug: 'm15', icon: TrendingUp,    color: 'bg-emerald-100',iconColor: 'text-emerald-600',desc: 'Mutual funds, wealth planning & portfolio advice' },
  { name: 'Passport, Visa & Foreign',       slug: 'm16', icon: Globe,         color: 'bg-blue-100',   iconColor: 'text-blue-600',   desc: 'Passport application assistance, student visas & stamps' },
  { name: 'Electricity, Water & Gas',       slug: 'm17', icon: Zap,           color: 'bg-yellow-100', iconColor: 'text-yellow-600', desc: 'New utility connections, load extensions & name changes' },
  { name: 'Farmer & Agriculture',           slug: 'm18', icon: Sprout,        color: 'bg-green-100',  iconColor: 'text-green-600',  desc: 'PM-KISAN entries, subsidies & agricultural certificates' },
  { name: 'Online Form & Doc Help',         slug: 'm19', icon: Laptop,        color: 'bg-purple-100', iconColor: 'text-purple-600', desc: 'Electronic form submissions, scans & document help' },
  { name: 'Central Government Schemes',     slug: 'm20', icon: Flag,          color: 'bg-orange-100', iconColor: 'text-orange-600', desc: 'PM-KISAN, Ayushman, Mudra Loan, PMAY & other central welfare schemes' },
  { name: 'Study Abroad Consulting',        slug: 'm21', icon: Plane,         color: 'bg-sky-100',    iconColor: 'text-sky-600',    desc: 'Foreign university admissions, SOP/LOR, student visa & pre-departure' },
  { name: 'Domestic College Admission',     slug: 'm22', icon: School,        color: 'bg-indigo-100', iconColor: 'text-indigo-600', desc: 'NEET/JEE/CAT counseling, seat allotment & college enrollment help' },
  { name: 'Job Placement & Recruitment',    slug: 'm23', icon: ClipboardList, color: 'bg-teal-100',   iconColor: 'text-teal-600',   desc: 'Resume building, interview prep, offer negotiation & post-placement' },
  { name: 'Visa & PR Immigration',          slug: 'm24', icon: FileCheck,     color: 'bg-red-100',    iconColor: 'text-red-600',    desc: 'Canada/UK/Australia PR, work permits, EOI, ITA & landing support' },
  { name: 'Others / Custom Service',        slug: 'm25', icon: Sparkles,      color: 'bg-indigo-100', iconColor: 'text-indigo-600', desc: 'Any unique expertise not listed above — describe your own specialisation' },
  { name: 'Tour & Travel',                  slug: 'm26', icon: MapPin,        color: 'bg-orange-100', iconColor: 'text-orange-600', desc: 'Bus, train & flight bookings, hotel stays, tour packages, cab services & travel insurance' },
];

const OPEN_PLACEHOLDERS: Record<string, string> = {
  m21: 'E.g., I guide students for UK, US, Canada admissions — IELTS coaching, SOP review, visa documentation.',
  m22: 'E.g., I help NEET/JEE aspirants with counseling rounds, college shortlisting and enrollment.',
  m23: 'E.g., I place IT professionals in MNC jobs — resume building, LinkedIn, interview prep and offer negotiation.',
  m24: 'E.g., I specialize in Canada Express Entry, Australia PR, and UK Skilled Worker visa applications.',
  m25: 'E.g., I provide CA services, MCA compliance, FEMA advisory for NRIs and export-import businesses.',
};

export default function AdvisorServicesPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [selectedSubSlugs, setSelectedSubSlugs] = useState<string[]>([]);
  const [customSpecializations, setCustomSpecializations] = useState<Record<string, string>>({});
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { router.push('/auth/admin'); return; }
    if (user?.role !== 'ADVISOR') { router.push('/'); return; }
    fetchCurrentServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  const fetchCurrentServices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/advisors/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedSlugs(data.data.categorySlugs || []);
        const specs: { slug: string; name: string }[] = data.data.specializations || [];
        const openCustom: Record<string, string> = {};
        const regularSubs: string[] = [];
        for (const s of specs) {
          if (OPEN_SLUGS.includes(s.slug)) {
            openCustom[s.slug] = s.name;
          } else {
            regularSubs.push(s.slug);
          }
        }
        setCustomSpecializations(openCustom);
        setSelectedSubSlugs(regularSubs);
      }
    } catch {
      /* non-fatal — start with empty selection */
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (slug: string) => {
    setSelectedSlugs(prev => {
      if (prev.includes(slug)) {
        const module = MODULES_DATA.find(m => m.id === slug);
        const subSlugs = module?.subModules.map(s => s.id) ?? [];
        setSelectedSubSlugs(prev2 => prev2.filter(s => !subSlugs.includes(s)));
        if (OPEN_SLUGS.includes(slug)) {
          setCustomSpecializations(prev2 => {
            const next = { ...prev2 };
            delete next[slug];
            return next;
          });
        }
        return prev.filter(s => s !== slug);
      }
      setExpandedModule(slug);
      return [...prev, slug];
    });
  };

  const toggleSubSlug = (subSlug: string) => {
    setSelectedSubSlugs(prev =>
      prev.includes(subSlug) ? prev.filter(s => s !== subSlug) : [...prev, subSlug]
    );
  };

  const handleSave = async () => {
    setError('');
    if (selectedSlugs.length === 0) {
      setError('Please select at least one service module.');
      return;
    }
    const hasRegular = selectedSlugs.some(s => !OPEN_SLUGS.includes(s));
    if (hasRegular && selectedSubSlugs.length === 0) {
      setError('Please select at least one specific sub-service from your chosen modules.');
      return;
    }
    for (const slug of selectedSlugs.filter(s => OPEN_SLUGS.includes(s))) {
      if (!customSpecializations[slug]?.trim()) {
        const nm = ADVISOR_CATEGORIES.find(c => c.slug === slug)?.name ?? slug;
        setError(`Please describe your specialisation for "${nm}".`);
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      const regularSpecs = selectedSubSlugs.map(slug => {
        for (const mod of MODULES_DATA) {
          const sub = mod.subModules.find(s => s.id === slug);
          if (sub) return { slug, name: sub.nameEn };
        }
        return { slug, name: slug };
      });

      const openSpecs = Object.entries(customSpecializations)
        .filter(([slug, text]) => selectedSlugs.includes(slug) && OPEN_SLUGS.includes(slug) && text.trim())
        .map(([slug, text]) => ({ slug, name: text.trim() }));

      const allSpecs = [...regularSpecs, ...openSpecs];

      const [catRes, specRes] = await Promise.all([
        fetch(`${API}/advisors/categories`, {
          method: 'POST', headers,
          body: JSON.stringify({ categorySlugs: selectedSlugs }),
        }),
        fetch(`${API}/advisors/specializations`, {
          method: 'POST', headers,
          body: JSON.stringify({ specializations: allSpecs }),
        }),
      ]);

      if (!catRes.ok || !specRes.ok) {
        setError('Failed to save services. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/advisor/dashboard'), 1500);
    } catch {
      setError('Cannot reach the server. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
          <p className="text-white text-lg font-bold">Services updated!</p>
          <p className="text-slate-400 text-sm">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-white/5 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/advisor/dashboard" className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-white font-bold text-base flex items-center gap-2">
              <Layers size={16} className="text-indigo-400" />
              Manage Your Services
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Update the modules & specializations you offer to clients</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Info banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 text-sm text-indigo-300">
          Select all applicable service categories. For standard modules, pick your specific sub-services. For open modules (Study Abroad, Job Placement, etc.), describe your unique specialisation in a short paragraph.
        </div>

        {/* Step 1 — Category tiles */}
        <div>
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-black">1</span>
            Choose Your Service Modules
            {selectedSlugs.length > 0 && (
              <span className="ml-auto text-xs text-indigo-400 font-normal">{selectedSlugs.length} selected</span>
            )}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ADVISOR_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedSlugs.includes(cat.slug);
              return (
                <button
                  key={cat.slug}
                  onClick={() => toggleCategory(cat.slug)}
                  className={`relative text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                  <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center mb-2`}>
                    <Icon size={16} className={cat.iconColor} />
                  </div>
                  <p className={`text-xs font-semibold leading-tight mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {cat.name}
                  </p>
                  <p className="text-slate-500 text-[10px] leading-tight line-clamp-2">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — Specialization details */}
        {selectedSlugs.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-black">2</span>
              Add Specialization Details
            </h2>

            <div className="space-y-3">
              {selectedSlugs.map(slug => {
                const module = MODULES_DATA.find(m => m.id === slug);
                if (!module) return null;
                const cat = ADVISOR_CATEGORIES.find(c => c.slug === slug);
                const Icon = cat?.icon ?? Layers;
                const isExpanded = expandedModule === slug;
                const isOpenModule = module.subModules.length === 0;
                const selectedCount = module.subModules.filter(s => selectedSubSlugs.includes(s.id)).length;
                const customText = customSpecializations[slug] ?? '';

                return (
                  <div key={slug} className="bg-slate-900 border border-white/8 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : slug)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-all"
                    >
                      <div className={`w-7 h-7 rounded-lg ${cat?.color ?? 'bg-slate-700'} flex items-center justify-center shrink-0`}>
                        <Icon size={14} className={cat?.iconColor ?? 'text-slate-300'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{module.titleEn}</p>
                        {isOpenModule ? (
                          <p className={`text-xs ${customText.trim() ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {customText.trim() ? 'Specialisation added ✓' : 'Tap to describe your specialisation'}
                          </p>
                        ) : (
                          <p className="text-slate-500 text-xs">{selectedCount}/{module.subModules.length} selected</p>
                        )}
                      </div>
                      {isExpanded ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                    </button>

                    {isExpanded && (
                      isOpenModule ? (
                        <div className="border-t border-white/5 px-4 py-4">
                          <p className="text-slate-300 text-xs font-semibold mb-2">Your specialisation in this area:</p>
                          <textarea
                            rows={3}
                            maxLength={300}
                            value={customText}
                            onChange={e => setCustomSpecializations(prev => ({ ...prev, [slug]: e.target.value }))}
                            placeholder={OPEN_PLACEHOLDERS[slug] ?? 'Describe what you specifically offer in this service area…'}
                            className="w-full text-sm bg-slate-800 border border-white/10 focus:border-indigo-500 rounded-xl px-3 py-2.5 resize-none outline-none transition-colors text-slate-200 placeholder-slate-500"
                          />
                          <p className="text-[11px] text-slate-500 mt-1 text-right">{customText.length}/300 characters</p>
                        </div>
                      ) : (
                        <div className="border-t border-white/5 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {module.subModules.map(sub => {
                            const checked = selectedSubSlugs.includes(sub.id);
                            return (
                              <button
                                key={sub.id}
                                onClick={() => toggleSubSlug(sub.id)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                                  checked
                                    ? 'border-indigo-500/40 bg-indigo-500/10'
                                    : 'border-white/5 bg-white/2 hover:border-white/15 hover:bg-white/5'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  checked ? 'bg-indigo-500 border-indigo-500' : 'border-white/20 bg-transparent'
                                }`}>
                                  {checked && <Check size={10} className="text-white" />}
                                </div>
                                <div className="min-w-0">
                                  <p className={`text-xs font-medium leading-tight ${checked ? 'text-white' : 'text-slate-300'}`}>{sub.nameEn}</p>
                                  <p className="text-slate-500 text-[10px] mt-0.5 leading-tight">{sub.nameHi}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link href="/advisor/dashboard" className="text-slate-400 text-sm hover:text-white transition-colors">
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || selectedSlugs.length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save Services'}
          </button>
        </div>
      </div>
    </div>
  );
}
