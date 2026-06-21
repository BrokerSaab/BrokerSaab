'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Search, MapPin, Star, Award, ShieldCheck, Languages, ArrowRight, UserCheck,
  Home, Shield, FileCheck, Briefcase, Percent, FileText, Coins, Landmark,
  Scale, Building2, CreditCard, Phone, Mail, CheckCircle2, Users, Clock, ChevronDown,
  User, Sun, Moon, BadgeCheck, Loader2, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

import {
  SubModule, Module, ModuleColor, ICON_MAP, MODULE_COLORS, MODULES_DATA
} from '@/data/servicesData';
import { Info, X } from 'lucide-react';
import LaunchOfferPopup from '@/components/LaunchOfferPopup';
import StatePickerPopup from '@/components/StatePickerPopup';
import ServiceDetailModal from '@/components/ServiceDetailModal';
import ContactUnlockModal from '@/components/ContactUnlockModal';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DATA â€” Mock Advisors
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
interface AdvisorCard {
  id: string;
  fullName: string;
  businessName: string;
  experienceYears: number;
  consultationFee: number;
  location: string;
  rating: number;
  reviewsCount: number;
  category: string;
  languages: string[];
  avatarColor: string;
  isAuthorizedDealer?: boolean;
  avatarUrl?: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const CATEGORY_TO_SLUG: Record<string, string> = {
  'Birth, Death & Marriage Papers': 'm1',
  'Identity Cards & Documents': 'm2',
  'Income, Caste & Residence': 'm3',
  'Property & Land Papers': 'm4',
  'Tax / GST Filing': 'm5',
  'Business Registration': 'm6',
  'Brand & IP Protection': 'm7',
  'Bank, Loan & Credit': 'm8',
  'Insurance (Bima)': 'm9',
  'Vehicle & RTO Work': 'm10',
  'Legal & Court Help': 'm11',
  'Job, PF & Labour': 'm12',
  'School & College Papers': 'm13',
  'Pension & Govt Schemes': 'm14',
  'Savings & Investment': 'm15',
  'Passport, Visa & Foreign': 'm16',
  'Electricity, Water & Gas': 'm17',
  'Farmer & Agriculture': 'm18',
  'Online Form & Doc Help': 'm19',
  'Study Abroad Consulting': 'm21',
  'Domestic College Admission': 'm22',
  'Job Placement & Recruitment': 'm23',
  'Visa & PR Immigration': 'm24',
  'Others / Custom Service': 'm25',
  'Tour & Travel': 'm26',
};

const SLUG_TO_CATEGORY_NAME: Record<string, string> = {
  'm1': 'Birth, Death & Marriage Papers',
  'm2': 'Identity Cards & Documents',
  'm3': 'Income, Caste & Residence',
  'm4': 'Property & Land Papers',
  'm5': 'Tax / GST Filing',
  'm6': 'Business Registration',
  'm7': 'Brand & IP Protection',
  'm21': 'Study Abroad Consulting',
  'm22': 'Domestic College Admission',
  'm23': 'Job Placement & Recruitment',
  'm24': 'Visa & PR Immigration',
  'm25': 'Others / Custom Service',
  'm26': 'Tour & Travel',
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
  'legal-advisor': 'Legal & Court Help',
  'property-registration': 'Property & Land Papers',
  'corporate-law': 'Business Registration',
  'civil-law': 'Legal & Court Help',
  'criminal-law': 'Legal & Court Help',
  'criminal-defence': 'Legal & Court Help',
  'family-law': 'Legal & Court Help',
  'tax-consultant': 'Tax / GST Filing',
  'documentation-expert': 'Online Form & Doc Help',
  'loan-consultant': 'Bank, Loan & Credit',
  'financial-advisor': 'Savings & Investment',
  'insurance-advisor': 'Insurance (Bima)',
  'insurance-claims': 'Insurance (Bima)',
  'real-estate-advisory': 'Property & Land Papers',
};

/* 19 distinct vibrant accents â€” one per submodule position within any expanded panel */
const SUB_PALETTE = [
  '#F43F5E','#14B8A6','#8B5CF6','#F59E0B','#10B981',
  '#3B82F6','#EAB308','#0EA5E9','#6366F1','#F97316',
  '#06B6D4','#EC4899','#D946EF','#84CC16','#2563EB',
  '#FBBF24','#22C55E','#A855F7','#E11D48',
];

/* Matching soft light background tints for each accent */
const SUB_BG_TINTS = [
  'rgba(244,63,94,0.06)','rgba(20,184,166,0.06)','rgba(139,92,246,0.06)','rgba(245,158,11,0.06)','rgba(16,185,129,0.06)',
  'rgba(59,130,246,0.06)','rgba(234,179,8,0.06)','rgba(14,165,233,0.06)','rgba(99,102,241,0.06)','rgba(249,115,22,0.06)',
  'rgba(6,182,212,0.06)','rgba(236,72,153,0.06)','rgba(217,70,239,0.06)','rgba(132,204,22,0.06)','rgba(37,99,235,0.06)',
  'rgba(251,191,36,0.06)','rgba(34,197,94,0.06)','rgba(168,85,247,0.06)','rgba(225,29,72,0.06)',
];

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600',
  'from-rose-500 to-rose-600', 'from-violet-500 to-violet-600',
  'from-amber-500 to-amber-600', 'from-cyan-500 to-cyan-600',
];

// No mock advisors â€” only real approved advisors from the API are shown

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
// Fetch function lives outside component so React Query can cache it properly
async function fetchAdvisors(categories: string[], search: string, state?: string, district?: string): Promise<AdvisorCard[]> {
  const params = new URLSearchParams({ limit: '50' });
  if (categories.length > 0) {
    // Collect all unique slugs for the selected categories and pass as comma-separated
    const slugs = [...new Set(categories.map(c => CATEGORY_TO_SLUG[c]).filter(Boolean))];
    if (slugs.length === 1) {
      params.set('category', slugs[0]);
    } else if (slugs.length > 1) {
      params.set('categories', slugs.join(','));
    }
  }
  if (search.trim()) params.set('search', search.trim());
  if (state && state !== 'All India') params.set('state', state);
  if (district) params.set('location', district);

  try {
    const res = await fetch(`${API}/advisors?${params.toString()}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data.map((adv: any, i: number) => ({
        id: adv.id,
        fullName: adv.fullName,
        businessName: adv.businessName || '',
        experienceYears: adv.experienceYears,
        consultationFee: Number(adv.consultationFee),
        location: adv.location,
        rating: adv.averageRating || 0,
        reviewsCount: adv.reviewCount || 0,
        category: adv.categories?.[0]?.category?.name || adv.categories?.[0]?.name || 'Verified Professional',
        languages: adv.languages || [],
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        isAuthorizedDealer: adv.isAuthorizedDealer || false,
        avatarUrl: adv.avatarUrl || null,
      }));
    }
  } catch { /* network error â€” return empty */ }
  return [];
}
const HINDI_TILES: Record<string, { title: string; description: string; popularTag: string }> = {
  'Property Brokerage': {
    title: 'à¤ªà¥à¤°à¥‰à¤ªà¤°à¥à¤Ÿà¥€ à¤¬à¥à¤°à¥‹à¤•à¤°à¥‡à¤œ',
    description: 'RERA-à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤¬à¥à¤°à¥‹à¤•à¤°à¥‹à¤‚ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤µà¤¾à¤£à¤¿à¤œà¥à¤¯à¤¿à¤• à¤”à¤° à¤†à¤µà¤¾à¤¸à¥€à¤¯ à¤¸à¤‚à¤ªà¤¤à¥à¤¤à¤¿à¤¯à¤¾à¤‚ à¤–à¤°à¥€à¤¦à¥‡à¤‚, à¤¬à¥‡à¤šà¥‡à¤‚ à¤¯à¤¾ à¤•à¤¿à¤°à¤¾à¤ à¤ªà¤° à¤²à¥‡à¤‚à¥¤',
    popularTag: 'à¤¸à¤°à¥à¤µà¤¾à¤§à¤¿à¤• à¤²à¥‹à¤•à¤ªà¥à¤°à¤¿à¤¯'
  },
  'Legal Court Advisor': {
    title: 'à¤•à¤¾à¤¨à¥‚à¤¨à¥€ à¤¨à¥à¤¯à¤¾à¤¯à¤¾à¤²à¤¯ à¤¸à¤²à¤¾à¤¹à¤•à¤¾à¤°',
    description: 'à¤¦à¥€à¤µà¤¾à¤¨à¥€ à¤”à¤° à¤†à¤ªà¤°à¤¾à¤§à¤¿à¤• à¤°à¤•à¥à¤·à¤¾, à¤œà¤®à¤¾à¤¨à¤¤ à¤•à¥€ à¤¸à¥à¤¨à¤µà¤¾à¤ˆ à¤”à¤° à¤µà¤¿à¤¶à¥‡à¤·à¤œà¥à¤ž à¤®à¥à¤•à¤¦à¤®à¥‡à¤¬à¤¾à¤œà¥€ à¤µà¤•à¥€à¤²à¥¤',
    popularTag: 'à¤µà¤¿à¤¶à¥à¤µà¤¸à¤¨à¥€à¤¯'
  },
  'Property Registry': {
    title: 'à¤¸à¤‚à¤ªà¤¤à¥à¤¤à¤¿ à¤ªà¤‚à¤œà¥€à¤•à¤°à¤£',
    description: 'à¤¸à¥à¤Ÿà¤¾à¤®à¥à¤ª à¤¶à¥à¤²à¥à¤•, à¤‰à¤ª-à¤ªà¤‚à¤œà¥€à¤¯à¤• à¤«à¤¾à¤‡à¤²à¤¿à¤‚à¤— à¤”à¤° à¤ªà¥‚à¤°à¥à¤£ à¤°à¤œà¤¿à¤¸à¥à¤Ÿà¥à¤°à¥€ à¤¨à¤¿à¤·à¥à¤ªà¤¾à¤¦à¤¨à¥¤',
    popularTag: 'à¤†à¤µà¤¶à¥à¤¯à¤•'
  },
  'Corporate Law': {
    title: 'à¤•à¥‰à¤°à¥à¤ªà¥‹à¤°à¥‡à¤Ÿ à¤•à¤¾à¤¨à¥‚à¤¨',
    description: 'à¤•à¤‚à¤ªà¤¨à¥€ à¤¨à¤¿à¤—à¤®à¤¨, à¤à¤²à¤à¤²à¤ªà¥€ à¤ªà¤‚à¤œà¥€à¤•à¤°à¤£, à¤…à¤¨à¥à¤ªà¤¾à¤²à¤¨ à¤”à¤° à¤¶à¤¾à¤¸à¤¨à¥¤',
    popularTag: 'à¤¬à¤¿à¤œà¤¨à¥‡à¤¸'
  },
  'Tax Consultancy': {
    title: 'à¤•à¤° à¤¸à¤²à¤¾à¤¹à¤•à¤¾à¤°',
    description: 'à¤œà¥€à¤à¤¸à¤Ÿà¥€ à¤«à¤¾à¤‡à¤²à¤¿à¤‚à¤—, à¤†à¤¯à¤•à¤° à¤°à¤¿à¤Ÿà¤°à¥à¤¨ à¤¦à¤¾à¤–à¤¿à¤² à¤•à¤°à¤¨à¤¾ à¤”à¤° à¤•à¤° à¤¯à¥‹à¤œà¤¨à¤¾à¥¤',
    popularTag: 'à¤•à¤° à¤¬à¤šà¤¤'
  },
  'Documentation Drafting': {
    title: 'à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼à¥€à¤•à¤°à¤£ à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ªà¤£',
    description: 'à¤¡à¥€à¤¡, à¤à¤—à¥à¤°à¥€à¤®à¥‡à¤‚à¤Ÿ, à¤µà¤¸à¥€à¤¯à¤¤, à¤ªà¤¾à¤µà¤° à¤‘à¤« à¤…à¤Ÿà¥‰à¤°à¥à¤¨à¥€ à¤”à¤° à¤¸à¤®à¤à¥Œà¤¤à¥‹à¤‚ à¤•à¤¾ à¤¡à¥à¤°à¤¾à¤«à¥à¤Ÿà¤¿à¤‚à¤—à¥¤',
    popularTag: 'à¤«à¤¾à¤¸à¥à¤Ÿ à¤Ÿà¥à¤°à¥ˆà¤•'
  },
  'Capital & Loans': {
    title: 'à¤ªà¥‚à¤‚à¤œà¥€ à¤”à¤° à¤‹à¤£',
    description: 'à¤—à¥ƒà¤¹ à¤‹à¤£, à¤µà¥à¤¯à¤µà¤¸à¤¾à¤¯ à¤‹à¤£, à¤¸à¤‚à¤ªà¤¤à¥à¤¤à¤¿ à¤ªà¤° à¤‹à¤£ à¤”à¤° à¤µà¤¿à¤¤à¥à¤¤à¥€à¤¯ à¤µà¤¿à¤¤à¥à¤¤à¤ªà¥‹à¤·à¤£à¥¤',
    popularTag: 'à¤†à¤¸à¤¾à¤¨ à¤µà¤¿à¤¤à¥à¤¤'
  },
  'Wealth Management': {
    title: 'à¤§à¤¨ à¤ªà¥à¤°à¤¬à¤‚à¤§à¤¨',
    description: 'à¤®à¥à¤¯à¥à¤šà¥à¤…à¤² à¤«à¤‚à¤¡, à¤ªà¤°à¤¿à¤µà¤¾à¤° à¤Ÿà¥à¤°à¤¸à¥à¤Ÿ, à¤ªà¥‹à¤°à¥à¤Ÿà¤«à¥‹à¤²à¤¿à¤¯à¥‹ à¤ªà¥à¤°à¤¬à¤‚à¤§à¤¨ à¤”à¤° à¤¸à¤‚à¤ªà¤¤à¥à¤¤à¤¿ à¤¯à¥‹à¤œà¤¨à¤¾à¥¤',
    popularTag: 'à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤¨à¤¿à¤µà¥‡à¤¶'
  },
  'Family Law': {
    title: 'à¤ªà¤¾à¤°à¤¿à¤µà¤¾à¤°à¤¿à¤• à¤•à¤¾à¤¨à¥‚à¤¨',
    description: 'à¤¤à¤²à¤¾à¤•, à¤¬à¤¾à¤² à¤¹à¤¿à¤°à¤¾à¤¸à¤¤, à¤­à¤°à¤£-à¤ªà¥‹à¤·à¤£ à¤”à¤° à¤—à¥‹à¤¦ à¤²à¥‡à¤¨à¥‡ à¤•à¥‡ à¤®à¤¾à¤®à¤²à¥‡à¥¤',
    popularTag: 'à¤¸à¤‚à¤µà¥‡à¤¦à¤¨à¤¶à¥€à¤²'
  },
  'Criminal Defence': {
    title: 'à¤†à¤ªà¤°à¤¾à¤§à¤¿à¤• à¤¬à¤šà¤¾à¤µ',
    description: 'à¤œà¤®à¤¾à¤¨à¤¤ à¤…à¤°à¥à¤œà¥€, à¤ªà¥à¤²à¤¿à¤¸ à¤®à¥à¤•à¤¦à¤®à¥‡à¤¬à¤¾à¤œà¥€, à¤”à¤° à¤¸à¤¤à¥à¤°/à¤‰à¤šà¥à¤š à¤¨à¥à¤¯à¤¾à¤¯à¤¾à¤²à¤¯ à¤°à¤•à¥à¤·à¤¾à¥¤',
    popularTag: 'à¤¤à¤¤à¥à¤•à¤¾à¤² à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾'
  },
  'Real Estate Advisory': {
    title: 'à¤°à¤¿à¤¯à¤² à¤à¤¸à¥à¤Ÿà¥‡à¤Ÿ à¤¸à¤²à¤¾à¤¹',
    description: 'à¤¶à¥€à¤°à¥à¤·à¤• à¤–à¥‹à¤œ, à¤¸à¤‚à¤ªà¤¤à¥à¤¤à¤¿ à¤®à¥‚à¤²à¥à¤¯à¤¾à¤‚à¤•à¤¨ à¤”à¤° à¤­à¥‚à¤®à¤¿ à¤µà¤¿à¤µà¤¾à¤¦ à¤•à¤¾à¤¨à¥‚à¤¨à¥€ à¤œà¤¾à¤‚à¤šà¥¤',
    popularTag: 'à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨'
  },
  'Insurance Claims': {
    title: 'à¤¬à¥€à¤®à¤¾ à¤¦à¤¾à¤µà¥‡',
    description: 'à¤…à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤¬à¥€à¤®à¤¾ à¤¦à¤¾à¤µà¥‹à¤‚ à¤•à¤¾ à¤¨à¤¿à¤ªà¤Ÿà¤¾à¤¨, à¤¦à¥à¤°à¥à¤˜à¤Ÿà¤¨à¤¾ à¤¦à¤¾à¤µà¥‹à¤‚ à¤”à¤° à¤•à¤¾à¤¨à¥‚à¤¨à¥€ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾à¥¤',
    popularTag: 'à¤¦à¤¾à¤µà¤¾ à¤¸à¤®à¤°à¥à¤¥à¤¨'
  }
};

// Helper to dynamically get a relevant icon for sub-modules
const getSubModuleIcon = (moduleId: string | null, subName: string) => {
  const name = subName.toLowerCase();
  if (
    name.includes('certificate') ||
    name.includes('praman patra') ||
    name.includes('papers') ||
    name.includes('deed') ||
    name.includes('agreement') ||
    name.includes('will') ||
    name.includes('records')
  ) {
    return FileText;
  }
  if (
    name.includes('tax') ||
    name.includes('gst') ||
    name.includes('filing') ||
    name.includes('itr') ||
    name.includes('tds')
  ) {
    return Percent;
  }
  if (
    name.includes('registration') ||
    name.includes('incorporation') ||
    name.includes('pvt ltd') ||
    name.includes('ngo') ||
    name.includes('msme') ||
    name.includes('firm')
  ) {
    return Briefcase;
  }
  if (
    name.includes('legal') ||
    name.includes('court') ||
    name.includes('divorce') ||
    name.includes('notary') ||
    name.includes('notice') ||
    name.includes('litigation')
  ) {
    return Scale;
  }
  if (
    name.includes('card') ||
    name.includes('aadhaar') ||
    name.includes('pan') ||
    name.includes('voter') ||
    name.includes('ration') ||
    name.includes('passport') ||
    name.includes('id')
  ) {
    return UserCheck;
  }
  if (
    name.includes('loan') ||
    name.includes('bank') ||
    name.includes('credit') ||
    name.includes('funding') ||
    name.includes('solvency')
  ) {
    return Landmark;
  }
  if (
    name.includes('insurance') ||
    name.includes('bima') ||
    name.includes('protection') ||
    name.includes('shield')
  ) {
    return ShieldCheck;
  }
  return FileText;
};

/* â”€â”€ Ticker segment â€” rendered twice for seamless seamless loop â”€â”€ */
function TickerContent() {
  return (
    <span className="inline-flex items-center gap-6 px-8">

      {/* Badge: Launching */}
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[11px] tracking-widest uppercase"
        style={{ background: '#facc15', color: '#1e0a3c' }}>
        ðŸš€ LAUNCHING OFFER
      </span>

      {/* User offer */}
      <span className="inline-flex items-center gap-2">
        <span className="text-white font-bold text-sm">ðŸ‘¤ Users</span>
        <span className="text-purple-300 line-through text-xs">â‚¹999</span>
        <span className="font-black text-xl leading-none"
          style={{ color: '#facc15', textShadow: '0 0 16px rgba(250,204,21,0.9)' }}>
          â‚¹99
        </span>
        <span className="text-purple-200 text-xs font-semibold">/yr</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black"
          style={{ background: '#16a34a', color: '#fff' }}>
          90% OFF
        </span>
      </span>

      {/* Dot separator */}
      <span style={{ color: '#a78bfa', fontSize: '22px', lineHeight: 1, fontWeight: 900 }}>â€¢</span>

      {/* Advisor offer */}
      <span className="inline-flex items-center gap-2">
        <span className="text-white font-bold text-sm">ðŸ¤ Advisors</span>
        <span className="text-purple-300 line-through text-xs">â‚¹4,999</span>
        <span className="font-black text-xl leading-none"
          style={{ color: '#facc15', textShadow: '0 0 16px rgba(250,204,21,0.9)' }}>
          â‚¹499
        </span>
        <span className="text-purple-200 text-xs font-semibold">/yr</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black"
          style={{ background: '#16a34a', color: '#fff' }}>
          90% OFF
        </span>
      </span>

      {/* Dot separator */}
      <span style={{ color: '#a78bfa', fontSize: '22px', lineHeight: 1, fontWeight: 900 }}>â€¢</span>

      {/* Validity + CTA hint */}
      <span className="inline-flex items-center gap-2">
        <span className="text-purple-100 font-semibold text-sm">âœ… Valid <strong className="text-white">1 Full Year</strong></span>
        <span className="px-3 py-0.5 rounded-full text-[11px] font-black text-purple-900"
          style={{ background: 'rgba(250,204,21,0.9)', border: '1px solid rgba(250,204,21,0.5)' }}>
          ðŸ‘† Click to Grab
        </span>
      </span>

    </span>
  );
}

/* â”€â”€ Hero slideshow â€” 4 AI-style professional photos, rotate every 5 s â”€â”€ */
const HERO_SLIDES = [
  {
    src: '/hero-professionals.png',
    alt: 'Verified professionals collaborating',
    labelEN: 'Collaborating Advisors',  labelHI: 'à¤¸à¤¹à¤¯à¥‹à¤—à¥€ à¤¸à¤²à¤¾à¤¹à¤•à¤¾à¤°',
    titleEN: 'Verified Experts',        titleHI: 'à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤µà¤¿à¤¶à¥‡à¤·à¤œà¥à¤ž',
  },
  {
    src: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    alt: 'Property & real estate advisory',
    labelEN: 'Property Experts',        labelHI: 'à¤¸à¤‚à¤ªà¤¤à¥à¤¤à¤¿ à¤µà¤¿à¤¶à¥‡à¤·à¤œà¥à¤ž',
    titleEN: 'Verified Brokers',        titleHI: 'à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤¬à¥à¤°à¥‹à¤•à¤°',
  },
  {
    src: 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=800&q=80',
    alt: 'Legal & court advisory',
    labelEN: 'Legal Advisors',          labelHI: 'à¤•à¤¾à¤¨à¥‚à¤¨à¥€ à¤¸à¤²à¤¾à¤¹à¤•à¤¾à¤°',
    titleEN: 'Licensed Advocates',      titleHI: 'à¤²à¤¾à¤‡à¤¸à¥‡à¤‚à¤¸à¥€ à¤…à¤§à¤¿à¤µà¤•à¥à¤¤à¤¾',
  },
  {
    src: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    alt: 'Financial & tax advisory',
    labelEN: 'Financial Advisors',      labelHI: 'à¤µà¤¿à¤¤à¥à¤¤à¥€à¤¯ à¤¸à¤²à¤¾à¤¹à¤•à¤¾à¤°',
    titleEN: 'CA & Tax Experts',        titleHI: 'CA à¤”à¤° à¤Ÿà¥ˆà¤•à¥à¤¸ à¤µà¤¿à¤¶à¥‡à¤·à¤œà¥à¤ž',
  },
];

export default function DiscoverPage() {
  const { isLoggedIn, openLoginModal } = useAuth();
  const { language, t } = useLanguage();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [serviceModal, setServiceModal] = useState<string | null>(null); // module id open in fullscreen modal

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  const [viewMode, setViewMode] = useState<'user' | 'advisor'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Build a flat list of all searchable suggestions from modules + sub-modules + keywords
  const ALL_SUGGESTIONS = useMemo(() => {
    const seen = new Set<string>();
    const items: { label: string; category: string; moduleId: string }[] = [];
    MODULES_DATA.forEach(mod => {
      const addItem = (label: string, category: string) => {
        const key = label.toLowerCase();
        if (!seen.has(key)) { seen.add(key); items.push({ label, category, moduleId: mod.id }); }
      };
      addItem(mod.titleEn, 'Category');
      mod.subModules.forEach(sub => {
        addItem(sub.nameEn, mod.titleEn);
        sub.keywords.forEach(kw => addItem(kw, mod.titleEn));
      });
      // Open modules (no sub-modules) have module-level keywords for discoverability
      mod.moduleKeywords?.forEach(kw => addItem(kw, mod.titleEn));
    });
    return items;
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return ALL_SUGGESTIONS.filter(s => s.label.toLowerCase().includes(q)).slice(0, 7);
  }, [searchQuery, ALL_SUGGESTIONS]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter modules based on search query
  const filteredModules = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return MODULES_DATA;

    return MODULES_DATA.map(mod => {
      const matchedSubs = mod.subModules.filter(sub => {
        return sub.nameEn.toLowerCase().includes(query)
          || sub.nameHi.toLowerCase().includes(query)
          || sub.keywords.some(kw => kw.toLowerCase().includes(query));
      });

      const matchesModuleEn = mod.titleEn.toLowerCase().includes(query);
      const matchesModuleHi = mod.titleHi.toLowerCase().includes(query);
      const matchesModuleKeyword = mod.moduleKeywords?.some(kw => kw.toLowerCase().includes(query)) ?? false;

      if (matchesModuleEn || matchesModuleHi || matchesModuleKeyword) return mod;
      if (matchedSubs.length > 0) return { ...mod, subModules: matchedSubs };
      return null;
    }).filter(Boolean) as Module[];
  }, [searchQuery]);

  // Auto-expand first match on search
  React.useEffect(() => {
    if (searchQuery && filteredModules.length > 0) {
      setExpandedModule(filteredModules[0].id);
    }
  }, [searchQuery, filteredModules]);

  // Listen to select-module event from navbar â€” open full-screen modal
  React.useEffect(() => {
    const handleSelectModule = (e: Event) => {
      const { moduleId } = (e as CustomEvent).detail;
      setServiceModal(moduleId);
    };
    window.addEventListener('select-module', handleSelectModule);
    return () => window.removeEventListener('select-module', handleSelectModule);
  }, []);

  // Read URL query parameters on mount to support cross-page navigation
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modId = params.get('module');
      if (modId) {
        setServiceModal(modId);
      }

      const catParam = params.get('category');
      if (catParam) {
        const mappedName = SLUG_TO_CATEGORY_NAME[catParam];
        if (mappedName) {
          setSelectedCategory(mappedName);
          setSelectedCategories([mappedName]);
          setTimeout(() => {
            const el = document.getElementById('advisors-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 300);
        }
      }
    }
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: updates visible input immediately, fires query only after 300 ms idle
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  /* â”€â”€ Location state â€” must be declared before useQuery â”€â”€ */
  const [selectedState, setSelectedState] = useState<string>(() => {
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem('bs_user_state');
      return (saved && saved !== 'All India') ? saved : '';
    }
    return '';
  });

  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('bs_user_district') || '';
    }
    return '';
  });

  // React Query: cached, deduped, auto-retried â€” staleTime from QueryClient default (5 min)
  const { data: queryAdvisors, isLoading: loadingAdvisors } = useQuery({
    queryKey: ['advisors', selectedCategories, debouncedSearch, selectedState, selectedDistrict],
    queryFn: () => fetchAdvisors(selectedCategories, debouncedSearch, selectedState, selectedDistrict),
    placeholderData: (prev) => prev,
  });

  // Real advisors only â€” API already filters by status=APPROVED and category/search
  const advisors = useMemo<AdvisorCard[]>(() => queryAdvisors ?? [], [queryAdvisors]);

  const handleBookNow = useCallback((advisorId: string) => {
    if (isLoggedIn) router.push(`/advisors/${advisorId}`);
    else openLoginModal(() => router.push(`/advisors/${advisorId}`));
  }, [isLoggedIn, router, openLoginModal]);

  // â”€â”€ Connect flow (inline contact reveal on home page cards) â”€â”€
  const [connectLoading, setConnectLoading] = useState<string | null>(null);
  const [revealedContacts, setRevealedContacts] = useState<Record<string, { phone: string; email: string }>>({});
  const [unlockModal, setUnlockModal] = useState<{ id: string; name: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mockToast, setMockToast] = useState(false);

  // Real advisors have UUID format; mock ones have simple numeric IDs ('1'â€“'6')
  const isMockAdvisor = useCallback((id: string) => /^\d{1,3}$/.test(id), []);

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleConnect = useCallback(async (advisorId: string, advisorName: string) => {
    // Mock advisors are sample data â€” no real profile in DB
    if (isMockAdvisor(advisorId)) {
      setMockToast(true);
      setTimeout(() => setMockToast(false), 4000);
      return;
    }
    if (!isLoggedIn) {
      openLoginModal(() => handleConnect(advisorId, advisorName));
      return;
    }
    if (revealedContacts[advisorId]) return;
    setConnectLoading(advisorId);
    try {
      const token = sessionStorage.getItem('accessToken') || '';
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const res   = await fetch(`${API_URL}/contacts/unlock/${advisorId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.phoneNumber) {
        setRevealedContacts(prev => ({ ...prev, [advisorId]: { phone: data.phoneNumber, email: data.email || '' } }));
      } else if (data.requiresPurchase) {
        setUnlockModal({ id: advisorId, name: advisorName });
      } else {
        router.push(`/advisors/${advisorId}`);
      }
    } catch {
      router.push(`/advisors/${advisorId}`);
    } finally {
      setConnectLoading(null);
    }
  }, [isMockAdvisor, isLoggedIn, openLoginModal, revealedContacts, router]);

  const handleTileClick = useCallback((moduleId: string) => {
    const mod = MODULES_DATA.find(m => m.id === moduleId);
    // Modules with no sub-services â†’ skip modal, filter advisors directly
    if (mod && mod.subModules.length === 0) {
      const categoryName = SLUG_TO_CATEGORY_NAME[moduleId];
      if (categoryName) {
        setSelectedCategories([categoryName]);
        setSelectedCategory(categoryName);
      }
      setTimeout(() => {
        const el = document.getElementById('advisors-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return;
    }
    setServiceModal(moduleId);
  }, []);

  const [showOffer, setShowOffer] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  /* Listen to state-selected and district-selected events from the popup */
  React.useEffect(() => {
    const handleStateSelected = (e: Event) => {
      const state = (e as CustomEvent<{ state: string }>).detail.state;
      if (state && state !== 'All India') setSelectedState(state);
      else { setSelectedState(''); setSelectedDistrict(''); }
    };
    const handleDistrictSelected = (e: Event) => {
      const { district } = (e as CustomEvent<{ state: string; district: string }>).detail;
      setSelectedDistrict(district || '');
    };
    window.addEventListener('state-selected', handleStateSelected);
    window.addEventListener('district-selected', handleDistrictSelected);
    return () => {
      window.removeEventListener('state-selected', handleStateSelected);
      window.removeEventListener('district-selected', handleDistrictSelected);
    };
  }, []);

  return (
    <div>

      {/* â”€â”€ Launch Offer Popup (auto on load + click on ticker) â”€â”€ */}
      <LaunchOfferPopup forceOpen={showOffer} onForceClose={() => setShowOffer(false)} />

      {/* â”€â”€ India State Picker Popup (auto after 1.2s + button trigger) â”€â”€ */}
      <StatePickerPopup forceOpen={showStatePicker} onForceClose={() => setShowStatePicker(false)} />

      {/* â”€â”€ Contact Unlock Modal (when credits run out during Connect flow) â”€â”€ */}
      {unlockModal && (
        <ContactUnlockModal
          advisorId={unlockModal.id}
          advisorName={unlockModal.name}
          isOpen={!!unlockModal}
          onClose={() => setUnlockModal(null)}
          onUnlockSuccess={(phone, email) => {
            setRevealedContacts(prev => ({ ...prev, [unlockModal.id]: { phone, email } }));
            setUnlockModal(null);
          }}
        />
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          OFFER TICKER â€” Click anywhere to open the plan popup
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <button
        type="button"
        onClick={() => setShowOffer(true)}
        className="w-full overflow-hidden cursor-pointer select-none block"
        aria-label="Launching Offer â€” Click to view plan"
        style={{
          background: '#0f0a1e',
          borderTop: '1px solid rgba(250,204,21,0.25)',
          borderBottom: '1px solid rgba(250,204,21,0.25)',
        }}>

        {/* Inner coloured strip with the moving text */}
        <div className="relative flex items-center"
          style={{
            height: '46px',
            background: 'linear-gradient(90deg, #1e0a3c 0%, #2d0a6e 25%, #4c1d95 50%, #2d0a6e 75%, #1e0a3c 100%)',
          }}>

          {/* Diagonal shine sweep â€” purely decorative, doesn't block text */}
          <span className="animate-tickerShine absolute top-0 bottom-0 pointer-events-none z-0"
            style={{ width: '80px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

          {/* â”€â”€ THE SCROLLING TEXT â”€â”€
              Content is duplicated so the second copy fills the gap seamlessly
              when the first exits. translateX(0â†’-50%) moves exactly one copy width. */}
          <div className="animate-offerTicker z-10">

            {/* Copy A */}
            <TickerContent />

            {/* Copy B â€” identical, immediately follows A for seamless loop */}
            <TickerContent />

          </div>
        </div>
      </button>

      {/* â”€â”€ Persistent Location Bar â€” always visible â”€â”€ */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5"
        style={{
          background: selectedState
            ? 'linear-gradient(90deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))'
            : 'linear-gradient(90deg, rgba(212,175,55,0.08), rgba(10,20,40,0.9), rgba(212,175,55,0.08))',
          borderBottom: `1px solid ${selectedState ? 'rgba(212,175,55,0.22)' : 'rgba(212,175,55,0.35)'}`,
          borderTop: selectedState ? 'none' : '1px solid rgba(212,175,55,0.18)',
          backdropFilter: 'blur(8px)',
          boxShadow: selectedState ? 'none' : '0 2px 16px rgba(212,175,55,0.08)',
        }}>

        {/* Left: location pill */}
        <button
          onClick={() => setShowStatePicker(true)}
          className="flex items-center gap-2.5 group transition-all"
        >
          {/* Pulsing ring â€” only when no location set */}
          {!selectedState && (
            <span className="relative flex shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40"
                style={{ background: 'rgba(212,175,55,0.6)' }} />
              <span className="relative flex items-center justify-center w-7 h-7 rounded-full"
                style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.5)' }}>
                <MapPin size={14} style={{ color: '#D4AF37' }} />
              </span>
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all group-hover:scale-[1.03]"
            style={{
              background: selectedState ? 'rgba(212,175,55,0.18)' : 'rgba(212,175,55,0.14)',
              border: `1px solid ${selectedState ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.55)'}`,
              boxShadow: selectedState ? 'none' : '0 0 10px rgba(212,175,55,0.2)',
            }}>
            {selectedState && (
              <MapPin size={13} style={{ color: '#D4AF37' }} className="shrink-0" />
            )}
            <span className="text-xs font-bold"
              style={{ color: selectedState ? '#D4AF37' : '#e8c84a' }}>
              {selectedDistrict
                ? `${selectedDistrict}, ${selectedState}`
                : selectedState || 'Set your location'}
            </span>
            <ChevronDown size={11} style={{ color: '#D4AF37' }} />
          </div>
          {selectedState ? (
            <span className="text-[10px] text-white/40 hidden sm:inline">Change location</span>
          ) : (
            <span className="text-[11px] font-semibold hidden sm:inline" style={{ color: 'rgba(212,175,55,0.75)' }}>
              â€” tap to filter advisors by state
            </span>
          )}
        </button>

        {/* Right: showing count + clear */}
        <div className="flex items-center gap-3">
          {selectedState && (
            <span className="text-[11px] text-white/40 hidden sm:inline">
              Showing advisors in{' '}
              <strong className="text-white/60">
                {selectedDistrict ? `${selectedDistrict}, ${selectedState}` : selectedState}
              </strong>
            </span>
          )}
          {selectedDistrict && (
            <button
              onClick={() => { setSelectedDistrict(''); sessionStorage.removeItem('bs_user_district'); }}
              className="text-[10px] text-white/35 hover:text-white/70 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
            >
              <X size={11} /> District
            </button>
          )}
          {selectedState && (
            <button
              onClick={() => {
                setSelectedState('');
                setSelectedDistrict('');
                sessionStorage.removeItem('bs_user_state');
                sessionStorage.removeItem('bs_user_district');
              }}
              className="text-[10px] text-white/35 hover:text-white/70 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HERO â€” Dark navy gradient
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className={`relative transition-colors duration-300 ${
        theme === 'light' ? 'bg-[#F4F6FB] text-slate-800 border-b border-slate-200' : 'navy-gradient-bg text-white'
      }`}>
        <div className={`absolute inset-0 opacity-[0.03] pointer-events-none ${
          theme === 'light' ? 'mix-blend-overlay' : ''
        }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        {/* Top Control Bar (Toggles) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex justify-between items-center relative z-20">
          {/* User / Advisor toggle */}
          <div className={`inline-flex rounded-full p-1 border transition-all ${
            theme === 'light' ? 'bg-slate-200/50 border-slate-300' : 'bg-white/5 border-white/10'
          }`}>
            <button
              onClick={() => setViewMode('user')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'user'
                  ? 'bg-[#0C4EAA] text-white shadow-md scale-[1.02]'
                  : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
              }`}
            >
              <User size={13} />
              <span>I Need Help</span>
            </button>
            <button
              onClick={() => setViewMode('advisor')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                viewMode === 'advisor'
                  ? 'bg-[#0C4EAA] text-white shadow-md scale-[1.02]'
                  : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white')
              }`}
            >
              <Phone size={13} />
              <span>I'm an Advisor</span>
            </button>
          </div>

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
              theme === 'light'
                ? 'bg-slate-200/50 border-slate-300 text-slate-700 hover:bg-slate-300/50'
                : 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10'
            }`}
          >
            {theme === 'light' ? (
              <>
                <Moon size={13} className="text-slate-600" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun size={13} className="text-amber-400 fill-amber-400/20" />
                <span>Light</span>
              </>
            )}
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 md:pb-20 pt-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start min-w-0">
              {/* Heading â€” English uses large sizing; Hindi uses smaller size + looser line-height
                  because Devanagari glyphs are visually taller and words are longer */}
              <h1 className={`font-black tracking-tight w-full ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              } ${
                language === 'EN'
                  ? 'text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.15]'
                  : 'text-2xl sm:text-3xl md:text-5xl leading-[1.4]'
              }`}>
                {language === 'EN' ? (
                  <>Find your <span className="gold-gradient-text">Agents</span></>
                ) : (
                  <>à¤…à¤ªà¤¨à¥‡ <span className="gold-gradient-text">à¤à¤œà¥‡à¤‚à¤Ÿ</span> à¤–à¥‹à¤œà¥‡à¤‚</>
                )}
              </h1>

              {/* Subtitle */}
              <p className={`text-sm sm:text-base font-medium max-w-md ${
                language === 'HI' ? 'leading-[1.8]' : 'leading-relaxed'
              } ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {language === 'EN'
                  ? 'Find verified professionals by service, document type, or keyword.'
                  : 'à¤¸à¥‡à¤µà¤¾, à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œà¤¼ à¤¯à¤¾ à¤¶à¤¬à¥à¤¦ à¤¸à¥‡ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤ªà¥‡à¤¶à¥‡à¤µà¤° à¤–à¥‹à¤œà¥‡à¤‚à¥¤'}
              </p>

              {/* Search Bar */}
              <div className="relative w-full max-w-lg" ref={searchRef}>
                <div className={`rounded-xl p-1 flex items-center shadow-md border transition-all ${
                  theme === 'light'
                    ? 'bg-white border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10'
                    : 'bg-[#0c192d] border-white/10 focus-within:border-gold-500/40'
                }`}>
                  <Search className="text-gold-400 ml-3 shrink-0" size={15} />
                  <input
                    type="text"
                    placeholder={language === 'EN' ? 'Search services, e.g. "GST", "registry", "DL"â€¦' : 'à¤–à¥‹à¤œà¥‡à¤‚: "à¤œà¥€à¤à¤¸à¤Ÿà¥€", "à¤°à¤œà¤¿à¤¸à¥à¤Ÿà¥à¤°à¥€"â€¦'}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearchChange(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full bg-transparent border-0 outline-none text-sm py-2 px-2.5 placeholder:text-slate-400 ${
                      theme === 'light' ? 'text-slate-800' : 'text-white'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); handleSearchChange(''); setShowSuggestions(false); }}
                      className="text-slate-400 hover:text-slate-600 mr-1 transition-colors shrink-0"
                    >
                      <X size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowSuggestions(false);
                      const el = document.getElementById('services-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="bg-[#0C4EAA] text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-all shrink-0 mr-0.5 shadow-sm active:scale-95"
                  >
                    {language === 'EN' ? 'Search' : 'à¤–à¥‹à¤œà¥‡à¤‚'}
                  </button>
                </div>

                {/* Auto-suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-xl border shadow-xl z-[200] max-h-72 overflow-y-auto ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0c192d] border-white/10'
                  }`}>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onMouseDown={() => {
                          setSearchQuery(s.label);
                          handleSearchChange(s.label);
                          setShowSuggestions(false);
                          setTimeout(() => {
                            const el = document.getElementById('services-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors border-b last:border-b-0 ${
                          theme === 'light'
                            ? 'hover:bg-slate-50 text-slate-800 border-slate-100'
                            : 'hover:bg-white/5 text-white border-white/5'
                        }`}
                      >
                        <Search size={12} className="text-slate-400 shrink-0" />
                        <span className="text-sm font-medium flex-1 truncate">{s.label}</span>
                        <span className={`text-[10px] font-medium shrink-0 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {s.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* "Try:" popular tags */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 text-xs">
                <span className={`font-bold mr-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {language === 'EN' ? 'Try:' : 'à¤œà¥ˆà¤¸à¥‡:'}
                </span>
                {([
                  { en: 'Registry',    hi: 'à¤°à¤œà¤¿à¤¸à¥à¤Ÿà¥à¤°à¥€' },
                  { en: 'Bainama',     hi: 'à¤¬à¥ˆà¤¨à¤¾à¤®à¤¾' },
                  { en: 'Sale Deed',   hi: 'à¤¸à¥‡à¤² à¤¡à¥€à¤¡' },
                  { en: 'GST Filing',  hi: 'à¤œà¥€à¤à¤¸à¤Ÿà¥€' },
                  { en: 'DL Renewal',  hi: 'DL à¤¨à¤µà¥€à¤¨à¥€à¤•à¤°à¤£' },
                  { en: 'Aadhaar',     hi: 'à¤†à¤§à¤¾à¤°' },
                  { en: 'ITR',         hi: 'à¤†à¤ˆà¤Ÿà¥€à¤†à¤°' },
                  { en: 'Notary',      hi: 'à¤¨à¥‹à¤Ÿà¤°à¥€' },
                  { en: 'Labour Card', hi: 'à¤²à¥‡à¤¬à¤° à¤•à¤¾à¤°à¥à¤¡' },
                ] as { en: string; hi: string }[]).map((tag) => (
                  <button
                    key={tag.en}
                    onClick={() => {
                      setSearchQuery(tag.en);
                      handleSearchChange(tag.en);
                      const el = document.getElementById('services-section');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-bold transition-all shadow-sm ${
                      theme === 'light'
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-[#112240]/55 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {language === 'EN' ? tag.en : tag.hi}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column â€” Auto-rotating image carousel */}
            <div className="lg:col-span-5 relative w-full flex justify-center lg:justify-end mt-6 lg:mt-0">
              {/* Background glow orbs â€” hidden on mobile to reduce visual noise */}
              <div className="absolute w-72 h-72 bg-gold-500/10 rounded-full blur-3xl -top-12 -right-12 pointer-events-none animate-pulse hidden sm:block" />
              <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -bottom-12 -left-12 pointer-events-none animate-pulse hidden sm:block" />

              <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                {/* Slide container */}
                <div className="relative overflow-hidden rounded-2xl border border-gold-500/20 shadow-2xl w-full" style={{ aspectRatio: '1/1' }}>

                  {/* All slides stacked; active one fades in */}
                  {HERO_SLIDES.map((slide, idx) => (
                    <div
                      key={idx}
                      className="absolute inset-0 transition-opacity duration-1000"
                      style={{ opacity: idx === activeSlide ? 1 : 0, zIndex: idx === activeSlide ? 1 : 0 }}
                    >
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        className="w-full h-full object-cover"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  ))}

                  {/* Persistent dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050E1B]/85 via-transparent to-transparent pointer-events-none" style={{ zIndex: 2 }} />

                  {/* Floating info card â€” label updates per slide */}
                  <div className="absolute bottom-4 left-4 right-4 bg-navy-900/90 backdrop-blur-md border border-gold-500/20 p-4 rounded-xl flex items-center justify-between" style={{ zIndex: 3 }}>
                    <div>
                      <div className="text-[10px] text-gold-400 font-bold uppercase tracking-wider transition-all duration-500">
                        {language === 'EN' ? HERO_SLIDES[activeSlide].labelEN : HERO_SLIDES[activeSlide].labelHI}
                      </div>
                      <div className="text-sm font-semibold text-white transition-all duration-500">
                        {language === 'EN' ? HERO_SLIDES[activeSlide].titleEN : HERO_SLIDES[activeSlide].titleHI}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Dot indicators */}
                      <div className="flex gap-1.5">
                        {HERO_SLIDES.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSlide(idx)}
                            className="rounded-full transition-all duration-300"
                            style={{
                              width: idx === activeSlide ? '18px' : '6px',
                              height: '6px',
                              background: idx === activeSlide ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                            }}
                            aria-label={`Slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                      {/* Avatar stack */}
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-500 border-2 border-navy-900 flex items-center justify-center text-[9px] font-bold text-white">R</div>
                        <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-navy-900 flex items-center justify-center text-[9px] font-bold text-white">M</div>
                        <div className="w-7 h-7 rounded-full bg-rose-500 border-2 border-navy-900 flex items-center justify-center text-[9px] font-bold text-white">A</div>
                        <div className="w-7 h-7 rounded-full bg-gold-500 border-2 border-navy-900 flex items-center justify-center text-[9px] font-bold text-navy-950">+</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SERVICES â€” Light white/gray background with colorful tiles
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section id="services-section" className="py-14 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gold-600 bg-gold-500/10 border border-gold-500/20 px-4 py-1.5 rounded-full mb-4">
              {language === 'EN' ? 'Our Services' : 'à¤¹à¤®à¤¾à¤°à¥€ à¤¸à¥‡à¤µà¤¾à¤à¤‚'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
              {language === 'EN' ? 'Professional Service Categories' : 'à¤ªà¥‡à¤¶à¥‡à¤µà¤° à¤¸à¥‡à¤µà¤¾ à¤¶à¥à¤°à¥‡à¤£à¤¿à¤¯à¤¾à¤‚'}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              {language === 'EN' ? 'Select a service to find verified professionals near you.' : 'à¤…à¤ªà¤¨à¥‡ à¤ªà¤¾à¤¸ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤ªà¥‡à¤¶à¥‡à¤µà¤°à¥‹à¤‚ à¤•à¥‹ à¤–à¥‹à¤œà¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¥‡à¤µà¤¾ à¤•à¤¾ à¤šà¤¯à¤¨ à¤•à¤°à¥‡à¤‚à¥¤'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {filteredModules.map((mod) => {
              const origIdx = MODULES_DATA.findIndex(m => m.id === mod.id);
              const colors = MODULE_COLORS[origIdx >= 0 ? origIdx % MODULE_COLORS.length : 0];
              const IconComp = ICON_MAP[mod.iconName] || Home;
              const isExpanded = expandedModule === mod.id;
              const moduleNum = mod.id.replace('m', '');

              return (
                <React.Fragment key={mod.id}>
                  <button
                    id={`card-${mod.id}`}
                    onClick={() => handleTileClick(mod.id)}
                    className={`text-left rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 border-2 group relative overflow-hidden ${
                      isExpanded
                        ? `${colors.bg} ${colors.border} shadow-lg -translate-y-1 ring-2 ring-gold-500/30`
                        : `${colors.bg} ${colors.border} shadow-[0_8px_20px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:shadow-[0_16px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:scale-[1.01]`
                    }`}
                  >
                    {/* Icon & Tag */}
                    <div className="w-full">
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className={`p-2.5 sm:p-3 rounded-xl ${colors.iconBg} text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                          <IconComp size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider bg-white/80 border border-slate-200/50 text-slate-600 px-2.5 py-1 rounded-full shadow-sm">
                          #{moduleNum}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-800 mb-1 group-hover:text-slate-950 transition-colors leading-tight tracking-tight">
                        {language === 'EN' ? mod.titleEn : mod.titleHi}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-600 font-medium leading-relaxed mb-3 sm:mb-4 hidden sm:block">
                        {language === 'EN' ? mod.description : mod.descriptionHi}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className={`flex items-center justify-between w-full text-[10px] sm:text-xs font-bold pt-2 sm:pt-3 border-t border-slate-200/60 ${isExpanded ? colors.text : 'text-slate-600 group-hover:text-slate-800'}`}>
                      <span>
                        {isExpanded
                          ? (language === 'EN' ? 'âœ“ Selected' : 'âœ“ à¤šà¤¯à¤¨à¤¿à¤¤')
                          : (language === 'EN' ? 'Explore â†’' : 'à¤–à¥‹à¤œà¥‡à¤‚ â†’')}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* â”€â”€ EXPANDED SUBMODULE PANEL â”€â”€ */}
                  {isExpanded && (
                    <div
                      className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-2xl border animate-expandPanel overflow-hidden shadow-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${colors.accent}08 0%, #ffffff 40%, ${colors.accent}04 100%)`,
                        borderColor: `${colors.accent}35`,
                        boxShadow: `0 20px 60px ${colors.accent}18, 0 4px 16px rgba(0,0,0,0.08)`,
                      }}
                    >
                      {/* Coloured top accent strip */}
                      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${colors.accent}, ${colors.accent}90, transparent)` }} />

                      <div className="p-5 sm:p-6">
                      {/* Panel Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4"
                        style={{ borderBottom: `1px solid ${colors.accent}20` }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg ${colors.iconBg}`}
                            style={{ boxShadow: `0 6px 20px ${colors.accent}40` }}>
                            <IconComp size={20} />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-black text-slate-800">
                              {language === 'EN' ? mod.titleEn : mod.titleHi}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              {language === 'EN' ? mod.descriptionHi : mod.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[10px] font-bold px-3 py-1.5 rounded-full"
                            style={{ background: `${colors.accent}12`, color: colors.accent, border: `1px solid ${colors.accent}25` }}>
                            {mod.subModules.length} {language === 'EN' ? 'services' : 'à¤¸à¥‡à¤µà¤¾à¤à¤‚'}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); setExpandedModule(null); }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: colors.accent }}
                            onMouseEnter={e => (e.currentTarget.style.background = `${colors.accent}12`)}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <X size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Submodules Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {mod.subModules.map((sub, subIdx) => {
                          const SubIcon = getSubModuleIcon(mod.id, sub.nameEn);
                          const subAccent = SUB_PALETTE[(origIdx * 2 + subIdx * 3) % SUB_PALETTE.length];
                          const subBg = SUB_BG_TINTS[(origIdx * 2 + subIdx * 3) % SUB_BG_TINTS.length];

                          return (
                            <Link
                              key={sub.id}
                              href={viewMode === 'advisor' ? '/advisors/onboarding' : sub.route}
                              onClick={(e) => {
                                if (viewMode !== 'advisor') {
                                  e.preventDefault();
                                  // Use the parent MODULE's category (mod.id = 'm17') not the sub-route slug
                                  const moduleCategoryName = SLUG_TO_CATEGORY_NAME[mod.id];
                                  if (moduleCategoryName) {
                                    setSelectedCategory(moduleCategoryName);
                                    setSelectedCategories([moduleCategoryName]);
                                    setTimeout(() => {
                                      const el = document.getElementById('advisors-section');
                                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 150);
                                  }
                                }
                              }}
                              className="group/sub relative rounded-2xl border-t border-l border-r-2 border-b-4 transition-all duration-250 hover:scale-[1.02] hover:-translate-y-1.5 active:translate-y-0.5 active:border-b-2 active:border-r flex flex-col justify-between overflow-hidden"
                              style={{
                                padding: '16px',
                                background: `linear-gradient(145deg, #ffffff 0%, ${subBg} 100%)`,
                                borderTopColor: `${subAccent}28`,
                                borderLeftColor: `${subAccent}28`,
                                borderRightColor: `${subAccent}55`,
                                borderBottomColor: `${subAccent}99`,
                                boxShadow: `0 4px 0 ${subAccent}20, 0 8px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
                              }}
                            >
                              {/* Top-right number badge */}
                              <div className="absolute top-2.5 right-2.5 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: `${subAccent}18`, color: subAccent, border: `1px solid ${subAccent}30` }}>
                                {subIdx + 1}
                              </div>

                              <div className="flex items-start gap-3 mb-3 w-full">
                                {/* Dynamic per-submodule icon badge */}
                                <div className="flex items-center justify-center shrink-0 mt-0.5 w-8 h-8 rounded-lg"
                                  style={{
                                    background: `linear-gradient(135deg, ${subAccent}, ${subAccent}cc)`,
                                    boxShadow: `0 3px 10px ${subAccent}45`,
                                  }}>
                                  <SubIcon size={14} style={{ color: '#ffffff' }} />
                                </div>

                                {/* Typography */}
                                <div className="flex-1 min-w-0 pr-5">
                                  <h4 className="text-[13px] font-black leading-tight text-slate-900 group-hover/sub:text-black transition-colors">
                                    {language === 'EN' ? sub.nameEn : sub.nameHi}
                                  </h4>
                                  <p className="text-[10px] font-semibold mt-0.5 leading-snug text-slate-400 group-hover/sub:text-slate-600 transition-colors">
                                    {language === 'EN' ? sub.nameHi : sub.nameEn}
                                  </p>
                                </div>
                              </div>

                              {/* Keywords */}
                              <div className="flex flex-wrap gap-1.5 mb-3.5">
                                {sub.keywords.slice(0, 3).map((kw, kIdx) => (
                                  <span key={kIdx}
                                    className="text-[9.5px] font-bold px-2 py-0.5 rounded-md transition-all duration-200"
                                    style={{
                                      background: `${subAccent}10`,
                                      border: `1px solid ${subAccent}25`,
                                      color: subAccent,
                                    }}>
                                    {kw}
                                  </span>
                                ))}
                                {sub.keywords.length > 3 && (
                                  <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md"
                                    style={{ background: `${subAccent}08`, border: `1px solid ${subAccent}18`, color: subAccent }}>
                                    +{sub.keywords.length - 3}
                                  </span>
                                )}
                              </div>

                              {/* Cross-reference */}
                              {sub.crossRef && (
                                <div className="flex items-center gap-1.5 text-[9.5px] font-bold mb-2.5 px-2 py-1.5 rounded-md"
                                  style={{
                                    color: subAccent,
                                    background: `${subAccent}08`,
                                    border: `1px solid ${subAccent}20`,
                                  }}>
                                  <Info size={9.5} className="shrink-0" />
                                  <span>Cross-ref: <strong>{sub.crossRef}</strong></span>
                                </div>
                              )}

                              {/* CTA */}
                              <div className="flex items-center justify-between mt-auto pt-2.5 border-t"
                                style={{ borderColor: `${subAccent}15` }}>
                                <div className="flex items-center gap-1 text-[11px] font-black transition-all duration-200 group-hover/sub:translate-x-0.5"
                                  style={{ color: subAccent }}>
                                  <span>{language === 'EN' ? 'Find Expert' : 'à¤µà¤¿à¤¶à¥‡à¤·à¤œà¥à¤ž à¤–à¥‹à¤œà¥‡à¤‚'}</span>
                                  <ArrowRight size={12} className="group-hover/sub:translate-x-1 transition-transform" />
                                </div>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center"
                                  style={{ background: `${subAccent}15` }}>
                                  <ArrowRight size={10} style={{ color: subAccent }} />
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>


        </div>
      </section>


      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          ADVISORS â€” White background with clean cards
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {/* â”€â”€ Mock advisor toast â”€â”€ */}
      {mockToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-navy-800 text-white text-xs font-semibold px-5 py-3 rounded-2xl shadow-2xl border border-gold-500/30 flex items-center gap-2 animate-popIn max-w-sm text-center">
          <span>ðŸ§ª</span>
          <span>These are <strong>sample advisors</strong>. Onboard a real advisor to test the Connect flow with actual contact details.</span>
        </div>
      )}

      <section id="advisors-section" className="py-14 sm:py-16 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-5 mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                Verified Professionals ({advisors.length})
              </h2>
              {selectedCategories.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gold-600 font-medium">Filtering:</span>
                  {selectedCategories.map(cat => (
                    <span key={cat} className="text-xs font-semibold bg-gold-50 border border-gold-200 text-gold-700 px-2.5 py-0.5 rounded-full">
                      {cat}
                    </span>
                  ))}
                  <button
                    onClick={() => { setSelectedCategories([]); setSelectedCategory(null); }}
                    className="text-gray-400 hover:text-gray-600 underline text-xs"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            <span className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full shrink-0 self-start flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Escrow Protected
            </span>
          </div>

          {loadingAdvisors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 space-y-4 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded-full w-20" />
                      <div className="h-5 bg-gray-200 rounded-full w-40" />
                      <div className="h-3 bg-gray-100 rounded-full w-32" />
                    </div>
                    <div className="w-14 h-14 bg-gray-200 rounded-full shrink-0" />
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-3 bg-gray-100 rounded-full" />
                    <div className="h-3 bg-gray-100 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                    <div className="h-9 bg-gray-200 rounded-xl w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : advisors.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <UserCheck className="mx-auto text-gray-300" size={48} />
              <p className="text-gray-700 font-semibold">No verified professionals found</p>
              <p className="text-gray-400 text-sm max-w-sm mx-auto">
                {selectedCategories.length > 0
                  ? `No approved advisors found for the selected service. Try a different category or clear the filter.`
                  : debouncedSearch
                  ? `No advisor found matching "${debouncedSearch}". Check the spelling or try a different name.`
                  : 'No approved advisors on the platform yet. Check back soon!'}
              </p>
              <button
                onClick={() => { setSelectedCategories([]); setSelectedCategory(null); setSearchTerm(''); setDebouncedSearch(''); }}
                className="text-sm font-semibold text-gray-700 bg-white border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {advisors.map((advisor) => (
                <div
                  key={advisor.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                    advisor.isAuthorizedDealer
                      ? 'border-amber-300 shadow-[0_0_0_1px_rgba(212,175,55,0.25)] hover:border-amber-400'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Authorised Dealer top accent */}
                  {advisor.isAuthorizedDealer && (
                    <div className="-mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-0 px-5 sm:px-6 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 rounded-t-2xl flex items-center gap-2">
                      <BadgeCheck size={13} className="text-amber-600 shrink-0" />
                      <span className="text-amber-700 text-[10px] font-bold uppercase tracking-widest">
                        {language === 'EN' ? 'BrokerSaab Authorised Dealer' : 'BrokerSaab à¤…à¤§à¤¿à¤•à¥ƒà¤¤ à¤¡à¥€à¤²à¤°'}
                      </span>
                    </div>
                  )}
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100 mb-2">
                          {advisor.category}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
                          {advisor.fullName}
                          <ShieldCheck className="text-emerald-500 inline shrink-0" size={16} />
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{advisor.businessName}</p>
                      </div>
                      {advisor.avatarUrl ? (
                        <img
                          src={advisor.avatarUrl.startsWith('http') ? advisor.avatarUrl : `/uploads${advisor.avatarUrl.replace('/uploads','')}`}
                          alt={advisor.fullName}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 shadow-md border-2 border-white"
                        />
                      ) : (
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${advisor.avatarColor} flex items-center justify-center text-white font-black text-base sm:text-lg shrink-0 shadow-md`}>
                          {advisor.fullName.split(' ').slice(-1)[0]?.[0] || '?'}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 border-y border-gray-100 py-3 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-amber-500 shrink-0" />
                        <span>{advisor.experienceYears} Years Exp</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500 shrink-0" />
                        <span className="truncate">{advisor.location.split(',')[0]}</span>
                      </div>
                    </div>

                    {/* Rating & Languages */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700">
                        <Star className="text-amber-400 fill-amber-400" size={14} />
                        <span className="font-bold">{advisor.rating}</span>
                        <span className="text-gray-400">({advisor.reviewsCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Languages size={13} className="text-gray-300" />
                        <span>{advisor.languages.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-100 pt-4 shrink-0 space-y-3">
                    {revealedContacts[advisor.id] ? (
                      /* â”€â”€ Contact revealed inline â”€â”€ */
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Contact Revealed âœ“</p>
                        <div className="flex items-center gap-2 text-xs text-gray-800">
                          <Phone size={12} className="text-emerald-600 shrink-0" />
                          <span className="font-mono font-semibold">{revealedContacts[advisor.id].phone}</span>
                          <button type="button" onClick={() => copyText(revealedContacts[advisor.id].phone, `phone-${advisor.id}`)} className="ml-auto text-gray-400 hover:text-gray-600">
                            {copiedField === `phone-${advisor.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        {revealedContacts[advisor.id].email && (
                          <div className="flex items-center gap-2 text-xs text-gray-800">
                            <Mail size={12} className="text-emerald-600 shrink-0" />
                            <span className="truncate">{revealedContacts[advisor.id].email}</span>
                            <button type="button" onClick={() => copyText(revealedContacts[advisor.id].email, `email-${advisor.id}`)} className="ml-auto text-gray-400 hover:text-gray-600">
                              {copiedField === `email-${advisor.id}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Consultation Fee</p>
                          <p className="text-lg sm:text-xl font-extrabold text-gray-900">
                            â‚¹{advisor.consultationFee}
                            <span className="text-xs font-normal text-gray-400 ml-1">/ session</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                        <Link
                          href={`/advisors/${advisor.id}`}
                          className="flex-1 text-center text-xs font-semibold text-gray-700 border border-gray-300 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
                        >
                          View Profile
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleConnect(advisor.id, advisor.fullName)}
                          disabled={connectLoading === advisor.id}
                          className="flex-1 bg-gold-500 text-navy-800 font-semibold flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-lg shadow-md hover:bg-gold-400 hover:shadow-lg transition-all disabled:opacity-70"
                        >
                          {connectLoading === advisor.id
                            ? <><Loader2 size={13} className="animate-spin" /> Connectingâ€¦</>
                            : <><Phone size={13} /> Connect</>}
                        </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          HOW IT WORKS â€” Light gray background
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-14 sm:py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gold-600 bg-gold-500/10 border border-gold-500/20 px-4 py-1.5 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-10 sm:mb-12">
            Book a Consultation in 3 Simple Steps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: '01', title: 'Choose a Service', desc: 'Browse our verified service categories and find the right professional.', icon: Search, bg: 'bg-blue-50', iconBg: 'bg-blue-500' },
              { step: '02', title: 'Select an Advisor', desc: 'Review profiles, ratings, experience, and fees to pick the best match.', icon: UserCheck, bg: 'bg-emerald-50', iconBg: 'bg-emerald-500' },
              { step: '03', title: 'Book & Consult', desc: 'Pay securely via escrow, schedule your session, and get expert advice.', icon: Phone, bg: 'bg-amber-50', iconBg: 'bg-amber-500' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className={`${item.bg} rounded-2xl p-6 sm:p-8 text-center space-y-4 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl ${item.iconBg} flex items-center justify-center shadow-md`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <div className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
                    Step {item.step}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          CTA â€” Dark banner
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <section className="py-14 sm:py-16 navy-gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Get Expert Advice?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-xl mx-auto">
            Join thousands of satisfied clients. Book a verified advisor today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => isLoggedIn ? router.push('/advisors') : openLoginModal(() => router.push('/advisors'))}
              className="btn-gold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Phone size={18} />
              Book Consultation Now
            </button>
            <Link href="/advisors/onboarding" className="btn-outline text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center">
              Register as Advisor
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ Service Detail Modal â€” full-screen on service click â”€â”€ */}
      {serviceModal && (() => {
        const mod = MODULES_DATA.find(m => m.id === serviceModal) ?? null;
        const colorIdx = MODULES_DATA.findIndex(m => m.id === serviceModal);
        return (
          <ServiceDetailModal
            module={mod}
            colorIdx={colorIdx >= 0 ? colorIdx : 0}
            language={language}
            viewMode={viewMode}
            onClose={() => setServiceModal(null)}
            onSelectSubs={(slugs) => {
              setServiceModal(null);
              // Use the parent module's category name directly (mod.id = 'm17' â†’ 'Electricity, Water & Gas')
              // Sub-service slugs (s17-1, s17-2) are NOT in SLUG_TO_CATEGORY_NAME
              const moduleCategoryName = mod ? SLUG_TO_CATEGORY_NAME[mod.id] : null;
              const categoryNames = moduleCategoryName
                ? [moduleCategoryName]
                : Array.from(new Set(slugs.map(s => SLUG_TO_CATEGORY_NAME[s]).filter(Boolean)));
              if (categoryNames.length > 0) {
                setSelectedCategories(categoryNames);
                setSelectedCategory(categoryNames[0]);
                setTimeout(() => {
                  const el = document.getElementById('advisors-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
              }
            }}
          />
        );
      })()}
    </div>
  );
}
