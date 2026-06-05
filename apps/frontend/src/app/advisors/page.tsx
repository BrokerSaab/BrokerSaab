'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, Award, MapPin, Languages, ShieldCheck, BadgeCheck,
  ArrowLeft, ArrowRight, Search, Loader2, UserCheck, X,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600',
  'from-violet-500 to-violet-600',
  'from-amber-500 to-amber-600',
  'from-cyan-500 to-cyan-600',
];

const SLUG_TO_CATEGORY_NAME: Record<string, string> = {
  'm1': 'Birth, Death & Marriage Papers',
  'm2': 'Identity Cards & Documents',
  'm3': 'Income, Caste & Residence',
  'm4': 'Property & Land Papers',
  'm5': 'Tax / GST Filing',
  'm6': 'Business Registration',
  'm7': 'Brand & IP Protection',
  'm8': 'Bank, Loan & Credit',
  'm9': 'Insurance (Bima)',
  'm10': 'Vehicle & RTO Work',
  'm11': 'Legal & Court Help',
  'm12': 'Job, PF & Labour',
  'm13': 'School & College Papers',
  'm14': 'Pension & Govt Schemes',
  'm15': 'Savings & Investment',
  'm16': 'Passport, Visa & Foreign',
  'm17': 'Electricity, Water & Gas',
  'm18': 'Farmer & Agriculture',
  'm19': 'Online Form & Doc Help',
  'property-broker': 'Property & Land Papers',
  'property-registration': 'Property & Land Papers',
  'real-estate-advisory': 'Property & Land Papers',
  'legal-advisor': 'Legal & Court Help',
  'civil-law': 'Legal & Court Help',
  'criminal-law': 'Legal & Court Help',
  'criminal-defence': 'Legal & Court Help',
  'family-law': 'Legal & Court Help',
  'corporate-law': 'Business Registration',
  'tax-consultant': 'Tax / GST Filing',
  'documentation-expert': 'Online Form & Doc Help',
  'loan-consultant': 'Bank, Loan & Credit',
  'financial-advisor': 'Savings & Investment',
  'insurance-advisor': 'Insurance (Bima)',
  'insurance-claims': 'Insurance (Bima)',
};

const TOP_STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat',
  'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Punjab',
  'Madhya Pradesh', 'Bihar', 'Kerala', 'Odisha', 'Haryana',
];

interface AdvisorCard {
  id: string;
  fullName: string;
  businessName: string;
  experienceYears: number;
  consultationFee: number;
  location: string;
  state?: string;
  rating: number;
  reviewsCount: number;
  category: string;
  languages: string[];
  avatarColor: string;
  isAuthorizedDealer: boolean;
  avatarUrl?: string | null;
}

function AdvisorsListingInner() {
  const searchParams  = useSearchParams();
  const categoryParam  = searchParams.get('category') || '';
  const categoriesParam = searchParams.get('categories') || ''; // comma-separated multi
  const stateParam     = searchParams.get('state') || '';
  const searchParam    = searchParams.get('search') || '';

  // Display name: show first category from either single or multi param
  const firstSlug = categoryParam || categoriesParam.split(',')[0] || '';
  const categoryDisplayName = SLUG_TO_CATEGORY_NAME[firstSlug] || null;

  const [advisors, setAdvisors]         = useState<AdvisorCard[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [totalCount, setTotal]          = useState(0);
  const [searchInput, setSearch]        = useState(searchParam);
  const [debouncedSearch, setDb]        = useState(searchParam);
  const [selectedState, setStateFilter] = useState(stateParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDb(v), 300);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ limit: '18' });
      if (categoriesParam) params.set('categories', categoriesParam);
      else if (categoryParam) params.set('category', categoryParam);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (selectedState && selectedState !== 'All India') params.set('state', selectedState);

      const res  = await fetch(`${API}/advisors?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setAdvisors(
          (data.data as any[]).map((a, i) => ({
            id:                a.id,
            fullName:          a.fullName,
            businessName:      a.businessName || '',
            experienceYears:   a.experienceYears,
            consultationFee:   Number(a.consultationFee),
            location:          a.location,
            state:             a.state,
            rating:            a.averageRating || 0,
            reviewsCount:      a.reviewCount || a.ratingsCount || 0,
            category:          a.categories?.[0]?.category?.name || a.categories?.[0]?.name || 'Professional',
            languages:         a.languages || [],
            avatarColor:       AVATAR_COLORS[i % AVATAR_COLORS.length],
            isAuthorizedDealer: !!a.isAuthorizedDealer,
            avatarUrl:          a.avatarUrl || null,
          }))
        );
        setTotal(data.total || data.data?.length || 0);
      } else {
        setError('Could not load advisors. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [categoryParam, categoriesParam, debouncedSearch, selectedState]);

  useEffect(() => { load(); }, [load]);

  const backHref = categoryParam ? `/?category=${categoryParam}` : '/';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0 font-medium"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate">
              {categoryDisplayName ? `Advisors for ${categoryDisplayName}` : 'All Verified Advisors'}
            </h1>
            {!loading && totalCount > 0 && (
              <p className="text-[11px] text-gray-400">
                {totalCount} advisor{totalCount !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, location, specialty…"
            className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 bg-white text-gray-800 placeholder-gray-400 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={selectedState}
          onChange={(e) => setStateFilter(e.target.value)}
          className="border border-gray-200 rounded-xl text-sm px-3 py-2.5 outline-none focus:border-yellow-400 bg-white text-gray-700 min-w-[160px] cursor-pointer"
        >
          <option value="">All India</option>
          {TOP_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-gray-200 rounded-full w-20" />
                    <div className="h-5 bg-gray-200 rounded-full w-40" />
                    <div className="h-3 bg-gray-100 rounded-full w-32" />
                  </div>
                  <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0 ml-4" />
                </div>
                <div className="h-px bg-gray-100" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-3 bg-gray-100 rounded-full" />
                  <div className="h-3 bg-gray-100 rounded-full" />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                  <div className="h-9 bg-gray-200 rounded-xl w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 space-y-4">
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={load}
              className="text-sm font-semibold text-gray-700 bg-white border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
            >
              Retry
            </button>
          </div>
        ) : advisors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 space-y-4">
            <UserCheck className="mx-auto text-gray-300" size={48} />
            <p className="text-gray-500 text-sm">No advisors found for this criteria.</p>
            <button
              onClick={() => { handleSearchChange(''); setStateFilter(''); }}
              className="text-sm font-semibold text-gray-700 bg-white border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {advisors.map((advisor) => (
              <div
                key={advisor.id}
                className={`bg-white rounded-2xl border flex flex-col justify-between overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                  advisor.isAuthorizedDealer
                    ? 'border-amber-300 shadow-[0_0_0_1px_rgba(212,175,55,0.2)]'
                    : 'border-gray-200'
                }`}
              >
                {advisor.isAuthorizedDealer && (
                  <div className="px-5 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 flex items-center gap-2">
                    <BadgeCheck size={13} className="text-amber-600 shrink-0" />
                    <span className="text-amber-700 text-[10px] font-bold uppercase tracking-widest">
                      BrokerSaab Authorised Dealer
                    </span>
                  </div>
                )}

                <div className="p-5 space-y-4 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100 mb-2">
                        {advisor.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <span className="truncate">{advisor.fullName}</span>
                        <ShieldCheck className="text-emerald-500 shrink-0" size={15} />
                      </h3>
                      {advisor.businessName && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{advisor.businessName}</p>
                      )}
                    </div>
                    {advisor.avatarUrl ? (
                      <img
                        src={advisor.avatarUrl.startsWith('http') ? advisor.avatarUrl : `/uploads${advisor.avatarUrl.replace('/uploads','')}`}
                        alt={advisor.fullName}
                        className="w-12 h-12 rounded-full object-cover shrink-0 shadow-md border-2 border-white"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${advisor.avatarColor} flex items-center justify-center text-white font-black text-base shrink-0 shadow-md`}>
                        {advisor.fullName.split(' ').slice(-1)[0]?.[0] ?? '?'}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-gray-100 py-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Award size={13} className="text-amber-500 shrink-0" />
                      {advisor.experienceYears} yrs exp
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={13} className="text-blue-500 shrink-0" />
                      <span className="truncate">{advisor.location.split(',')[0]}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Star className="text-amber-400 fill-amber-400 shrink-0" size={13} />
                      <span className="font-bold text-gray-800">
                        {advisor.rating > 0 ? advisor.rating.toFixed(1) : 'New'}
                      </span>
                      {advisor.reviewsCount > 0 && (
                        <span className="text-gray-400">
                          ({advisor.reviewsCount} review{advisor.reviewsCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    {advisor.languages.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Languages size={12} className="text-gray-300 shrink-0" />
                        <span className="truncate">{advisor.languages.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Fee</p>
                    <p className="text-lg font-extrabold text-gray-900">
                      ₹{advisor.consultationFee.toLocaleString('en-IN')}
                      <span className="text-xs font-normal text-gray-400 ml-1">/ session</span>
                    </p>
                  </div>
                  <Link
                    href={`/advisors/${advisor.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527' }}
                  >
                    View Profile <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdvisorsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-3" /> Loading advisors…
        </div>
      }
    >
      <AdvisorsListingInner />
    </Suspense>
  );
}
