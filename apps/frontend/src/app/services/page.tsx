'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Search, ArrowRight, ChevronDown, Info,
  FileHeart, UserCheck, Award, Home, Percent, Briefcase, Lightbulb, Landmark,
  ShieldCheck, Car, Scale, Users, GraduationCap, HeartHandshake, TrendingUp,
  Globe, Zap, Sprout, Laptop, Sun, Moon, HelpCircle,
  User, Headphones, X, Sparkles, AlertCircle, CheckCircle2, FileText
} from 'lucide-react';

import {
  SubModule, Module, ModuleColor, ICON_MAP, MODULE_COLORS, MODULES_DATA
} from '@/data/servicesData';

const POPULAR_SEARCHES = [
  { labelEn: "Registry", labelHi: "रजिस्ट्री", query: "registry" },
  { labelEn: "Bainama", labelHi: "बैनामा", query: "bainama" },
  { labelEn: "Sale Deed", labelHi: "सेल डीड", query: "sale deed" },
  { labelEn: "GST Filing", labelHi: "GST फाइलिंग", query: "GST return" },
  { labelEn: "DL Renewal", labelHi: "ड्राइविंग लाइसेंस", query: "DL renewal" },
  { labelEn: "Aadhaar", labelHi: "आधार अपडेट", query: "aadhaar" },
  { labelEn: "ITR", labelHi: "टैक्स रिटर्न", query: "ITR" },
  { labelEn: "Notary", labelHi: "नोटरी", query: "notary" },
  { labelEn: "Labour Card", labelHi: "लेबर कार्ड", query: "labour card" }
];

/* ═══════════════════════════════════════════════
   TOTAL SUBMODULE COUNT
   ═══════════════════════════════════════════════ */
const TOTAL_SUBMODULES = MODULES_DATA.reduce((acc, m) => acc + m.subModules.length, 0);

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

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
function ServiceCatalogContent() {
  const { language } = useLanguage();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'user' | 'advisor'>('user');
  const expandRef = useRef<HTMLDivElement>(null);

  // Listen to select-module event from navbar
  useEffect(() => {
    const handleSelectModule = (e: Event) => {
      const { moduleId } = (e as CustomEvent).detail;
      setExpandedModule(moduleId);
      setTimeout(() => {
        const el = document.getElementById(`card-${moduleId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    };
    window.addEventListener('select-module', handleSelectModule);
    return () => window.removeEventListener('select-module', handleSelectModule);
  }, []);

  /* ── SEARCH FILTER ── */
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

      if (matchesModuleEn || matchesModuleHi) return mod;
      if (matchedSubs.length > 0) return { ...mod, subModules: matchedSubs };
      return null;
    }).filter(Boolean) as Module[];
  }, [searchQuery]);

  /* ── Read URL ?module=mX param to auto-expand ── */
  const searchParams = useSearchParams();
  const moduleFromUrl = searchParams.get('module');

  useEffect(() => {
    if (moduleFromUrl && MODULES_DATA.some(m => m.id === moduleFromUrl)) {
      setExpandedModule(moduleFromUrl);
      // Scroll to that module card after a short delay
      setTimeout(() => {
        const el = document.getElementById(`card-${moduleFromUrl}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }
  }, [moduleFromUrl]);

  /* ── Auto-expand first match on search ── */
  useEffect(() => {
    if (searchQuery && filteredModules.length > 0) {
      setExpandedModule(filteredModules[0].id);
    }
  }, [searchQuery, filteredModules]);

  /* ── Scroll into expansion panel ── */
  useEffect(() => {
    if (expandedModule && expandRef.current) {
      setTimeout(() => {
        expandRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [expandedModule]);

  const toggleExpand = useCallback((moduleId: string) => {
    setExpandedModule(prev => prev === moduleId ? null : moduleId);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0F1E] text-slate-100' : 'bg-[#F4F6FB] text-slate-800'}`}>

      {/* ═══════════════════════════════════════
           HERO / HEADER SECTION
         ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-24 pb-16 md:pt-28 md:pb-20">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10" style={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(11,61,145,0.35) 0%, rgba(10,15,30,0) 70%)'
            : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(11,61,145,0.08) 0%, rgba(244,246,251,0) 70%)'
        }} />
        {/* Decorative grid dots */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle, ${isDark ? '#D4AF37' : '#0B3D91'} 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top row: View Mode Toggle + Theme Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
            {/* User / Advisor Toggle */}
            <div className={`inline-flex rounded-xl p-1 text-xs font-bold ${isDark ? 'bg-slate-800/80 border border-slate-700/50' : 'bg-white border border-slate-200 shadow-sm'}`}>
              <button
                onClick={() => setViewMode('user')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'user'
                    ? 'bg-[#0B3D91] text-white shadow-md'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User size={14} />
                <span>{language === 'EN' ? 'I Need Help' : 'मुझे सहायता चाहिए'}</span>
              </button>
              <button
                onClick={() => setViewMode('advisor')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'advisor'
                    ? 'bg-[#D4AF37] text-[#0A0F1E] shadow-md'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Headphones size={14} />
                <span>{language === 'EN' ? 'I\'m an Advisor' : 'मैं सलाहकार हूँ'}</span>
              </button>
            </div>

            {/* Theme Switcher */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isDark
                  ? 'bg-slate-800/80 text-amber-400 border border-slate-700/50 hover:bg-slate-700/80'
                  : 'bg-white text-[#0B3D91] border border-slate-200 shadow-sm hover:bg-slate-50'
              }`}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {/* Title Block */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
              style={{
                background: isDark ? 'rgba(212,175,55,0.1)' : 'rgba(11,61,145,0.06)',
                color: isDark ? '#D4AF37' : '#0B3D91',
                border: `1px solid ${isDark ? 'rgba(212,175,55,0.2)' : 'rgba(11,61,145,0.12)'}`
              }}
            >
              <Sparkles size={12} />
              <span>{language === 'EN' ? `${MODULES_DATA.length} Modules · ${TOTAL_SUBMODULES}+ Services` : `${MODULES_DATA.length} श्रेणियां · ${TOTAL_SUBMODULES}+ सेवाएं`}</span>
            </div>
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-[1.15] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'EN' ? (
                <>Find Your <span style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D580)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Legal & Documentation</span> Service</>
              ) : (
                <>अपनी <span style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D580)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>कानूनी और दस्तावेज़ीकरण</span> सेवा खोजें</>
              )}
            </h1>
            <p className={`text-sm sm:text-base leading-relaxed max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'EN'
                ? viewMode === 'user'
                  ? 'Search in Hindi, English, or colloquial terms. Type "registry", "bainama", "GST", or whatever you call it.'
                  : 'Browse all service categories to register as a verified advisor and start receiving client bookings.'
                : viewMode === 'user'
                  ? 'हिंदी, अंग्रेज़ी या बोलचाल की भाषा में खोजें। "रजिस्ट्री", "बैनामा", "GST" या जो भी आप कहते हैं वो टाइप करें।'
                  : 'सभी सेवा श्रेणियां देखें और सत्यापित सलाहकार के रूप में पंजीकरण करें।'}
            </p>
          </div>

          {/* ── STICKY SEARCH BAR ── */}
          <div className="sticky top-16 z-40 max-w-2xl mx-auto mb-4">
            <div className={`rounded-2xl p-1 flex items-center transition-all duration-300 backdrop-blur-xl ${
              isDark
                ? 'bg-slate-900/80 border border-white/10 shadow-2xl shadow-black/30 focus-within:border-[#D4AF37]/40'
                : 'bg-white/90 border border-slate-200 shadow-xl focus-within:border-[#0B3D91]/40'
            }`}>
              <Search className={`ml-4 shrink-0 ${isDark ? 'text-[#D4AF37]' : 'text-[#0B3D91]'}`} size={20} />
              <input
                type="text"
                placeholder={language === 'EN'
                  ? 'Search: "registry", "bainama", "GST", "DL", "passport"...'
                  : 'खोजें: "रजिस्ट्री", "बैनामा", "GST", "DL", "पासपोर्ट"...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-sm sm:text-base py-3 px-3 placeholder:text-slate-400 text-inherit"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setExpandedModule(null); }}
                  className={`p-1.5 mr-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}>
                  <X size={16} />
                </button>
              )}
              <button
                style={{ backgroundColor: '#0B3D91' }}
                className="text-white font-semibold px-5 sm:px-7 py-3 rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
              >
                {language === 'EN' ? 'Search' : 'खोजें'}
              </button>
            </div>
          </div>

          {/* Popular Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            <span className={`text-xs font-medium mr-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {language === 'EN' ? 'Try:' : 'खोजें:'}
            </span>
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag.query}
                onClick={() => setSearchQuery(tag.query)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all active:scale-95 ${
                  isDark
                    ? 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#0B3D91]/30 hover:text-[#0B3D91]'
                }`}
              >
                {language === 'EN' ? tag.labelEn : tag.labelHi}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
           MODULE GRID WITH ACCORDION
         ═══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Results Count */}
        {searchQuery && (
          <div className={`text-xs font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Search size={14} />
            <span>
              {filteredModules.length > 0
                ? language === 'EN'
                  ? `Found ${filteredModules.length} module(s) matching "${searchQuery}"`
                  : `"${searchQuery}" से ${filteredModules.length} श्रेणी मिली`
                : language === 'EN'
                  ? `No results for "${searchQuery}"`
                  : `"${searchQuery}" के लिए कोई परिणाम नहीं`}
            </span>
          </div>
        )}

        {/* Empty state */}
        {filteredModules.length === 0 && (
          <div className={`text-center py-20 rounded-2xl border space-y-4 max-w-lg mx-auto ${
            isDark ? 'bg-slate-900/30 border-white/5' : 'bg-white border-slate-200'
          }`}>
            <AlertCircle className="mx-auto" size={48} style={{ color: '#D4AF37' }} />
            <h3 className="text-lg font-bold">{language === 'EN' ? 'No Services Found' : 'कोई सेवा नहीं मिली'}</h3>
            <p className={`text-sm px-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'EN'
                ? <>Try a simpler keyword like &ldquo;registry&rdquo;, &ldquo;GST&rdquo;, or &ldquo;DL&rdquo;.</>
                : <>सरल शब्द आज़माएं जैसे &ldquo;रजिस्ट्री&rdquo;, &ldquo;GST&rdquo;, या &ldquo;DL&rdquo;।</>}
            </p>
            <button onClick={() => { setSearchQuery(''); setExpandedModule(null); }}
              className="text-xs font-semibold text-white px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: '#0B3D91' }}>
              {language === 'EN' ? 'Reset Search' : 'खोज रीसेट करें'}
            </button>
          </div>
        )}

        {/* ── THE CARD GRID ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredModules.map((mod, idx) => {
            const colorIdx = MODULES_DATA.findIndex(m => m.id === mod.id);
            const colors = MODULE_COLORS[colorIdx % MODULE_COLORS.length];
            const IconComp = ICON_MAP[mod.iconName] || HelpCircle;
            const isExpanded = expandedModule === mod.id;
            const moduleNum = mod.id.replace('m', '');

            return (
              <React.Fragment key={mod.id}>
                {/* ── MODULE CARD ── */}
                <button
                  id={`card-${mod.id}`}
                  onClick={() => toggleExpand(mod.id)}
                  className={`group relative text-left rounded-2xl p-4 sm:p-5 transition-all duration-300 border-2 cursor-pointer overflow-hidden ${
                    isExpanded
                      ? isDark
                        ? `${colors.bgDark} ${colors.borderDark} ring-2 ring-gold-500/20 shadow-lg -translate-y-1`
                        : `${colors.bg} ${colors.border} ring-2 ring-gold-500/20 shadow-lg -translate-y-1`
                      : isDark
                        ? `bg-slate-900/50 ${colors.borderDark} hover:bg-slate-800/60 shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_16px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1.5 hover:scale-[1.01]`
                        : `${colors.bg} ${colors.border} shadow-[0_8px_20px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,0.9)] hover:shadow-[0_16px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:scale-[1.01]`
                  }`}
                >
                  {/* Module number badge */}
                  <div className={`absolute top-2.5 right-2.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isDark ? 'bg-white/5 text-slate-500' : 'bg-white/80 border border-slate-200/50 text-slate-600 shadow-sm'
                  }`}>
                    #{moduleNum}
                  </div>

                  {/* Icon */}
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white mb-3 sm:mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 shrink-0 ${colors.iconBg}`}>
                    <IconComp size={20} className="sm:w-6 sm:h-6" />
                  </div>

                  {/* Title */}
                  <h3 className={`text-xs sm:text-sm font-extrabold leading-tight mb-1 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {language === 'EN' ? mod.titleEn : mod.titleHi}
                  </h3>
                  <p className={`text-[10px] sm:text-[11px] font-semibold leading-snug mb-3 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    {language === 'EN' ? mod.titleHi : mod.titleEn}
                  </p>

                  {/* Service count + expand indicator */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isDark ? 'bg-white/5 text-slate-400' : 'bg-white/80 border border-slate-200/50 text-slate-600 shadow-sm'
                    }`}>
                      {mod.subModules.length} {language === 'EN' ? 'services' : 'सेवाएं'}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : 'group-hover:translate-y-0.5'
                      } ${isDark ? 'text-slate-500' : 'text-slate-600'}`}
                      style={{ color: isExpanded ? colors.accent : undefined }}
                    />
                  </div>
                </button>

                {/* ── EXPANDED SUBMODULE PANEL ── */}
                {isExpanded && (
                  <div
                    ref={expandRef}
                    className={`col-span-2 sm:col-span-3 lg:col-span-4 rounded-2xl border p-5 sm:p-6 animate-expandPanel ${
                      isDark
                        ? `${colors.bgDark} ${colors.borderDark} shadow-2xl`
                        : `${colors.bg} ${colors.border} shadow-xl`
                    }`}
                  >
                    {/* Panel Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b"
                      style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shadow ${colors.iconBg}`}>
                          <IconComp size={18} />
                        </div>
                        <div>
                          <h3 className={`text-base sm:text-lg font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {language === 'EN' ? mod.titleEn : mod.titleHi}
                          </h3>
                          <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {language === 'EN' ? mod.descriptionHi : mod.description}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setExpandedModule(null)}
                        className={`self-start sm:self-auto p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-black/5 text-slate-400'}`}>
                        <X size={18} />
                      </button>
                    </div>

                    {/* Submodules Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {mod.subModules.map((sub, subIdx) => {
                        const SubIcon = getSubModuleIcon(mod.id, sub.nameEn);

                        return (
                          <Link
                            key={sub.id}
                            href={viewMode === 'advisor' ? '/register-advisor' : sub.route}
                            className="group/sub relative rounded-2xl p-4.5 border-t border-l border-r-2 border-b-4 transition-all duration-200 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-lg active:translate-y-0.5 active:border-b-2 active:border-r-[1px] animate-subCardIn flex flex-col justify-between"
                            style={{
                              animationDelay: `${subIdx * 40}ms`,
                              background: isDark
                                ? `linear-gradient(135deg, #1e293b 0%, ${colors.accent}0d 60%, #0f172a 100%)`
                                : `linear-gradient(135deg, #ffffff 0%, ${colors.accent}08 60%, ${colors.accent}12 100%)`,
                              borderTopColor: isDark ? `${colors.accent}35` : `${colors.accent}30`,
                              borderLeftColor: isDark ? `${colors.accent}35` : `${colors.accent}30`,
                              borderRightColor: isDark ? `${colors.accent}50` : `${colors.accent}45`,
                              borderBottomColor: isDark ? `${colors.accent}aa` : `${colors.accent}90`,
                              boxShadow: isDark
                                ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.15)'
                                : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                            }}
                          >
                            <div className="flex items-start gap-3 mb-3 w-full">
                              {/* Dynamic Symbol Badge - Solid colorful gradient with white icon */}
                              <div className="flex items-center justify-center shrink-0 mt-0.5">
                                <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm p-1.5 text-white ${colors.iconBg}`}
                                  style={{
                                    boxShadow: `0 2px 8px ${colors.accent}30`
                                  }}>
                                  <SubIcon size={13} style={{ color: '#ffffff' }} />
                                </div>
                              </div>

                              {/* Typography Contrast */}
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-[13px] font-black leading-tight transition-colors ${isDark ? 'text-white group-hover/sub:text-[#D4AF37]' : 'text-slate-900 group-hover/sub:text-black'}`}>
                                  {language === 'EN' ? sub.nameEn : sub.nameHi}
                                </h4>
                                <p className={`text-[10px] font-bold mt-1 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500 group-hover/sub:text-slate-700'}`}>
                                  {language === 'EN' ? sub.nameHi : sub.nameEn}
                                </p>
                              </div>
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            </div>

                            {/* Keywords - Dynamic soft-colored badges with clean contrast */}
                            <div className="flex flex-wrap gap-1.5 mb-3.5">
                              {sub.keywords.slice(0, 3).map((kw, kIdx) => (
                                <span key={kIdx}
                                  className="text-[9.5px] font-bold px-2 py-0.5 rounded-md border shadow-sm transition-all duration-300 group-hover/sub:bg-white"
                                  style={isDark ? {
                                    background: `${colors.accent}20`,
                                    borderColor: `${colors.accent}35`,
                                    color: '#fff'
                                  } : {
                                    backgroundColor: `${colors.accent}0d`,
                                    borderColor: `${colors.accent}20`,
                                    color: '#334155'
                                  }}>
                                  {kw}
                                </span>
                              ))}
                              {sub.keywords.length > 3 && (
                                <span
                                  className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md border shadow-sm transition-all duration-300 group-hover/sub:bg-white"
                                  style={isDark ? {
                                    background: `${colors.accent}15`,
                                    borderColor: `${colors.accent}25`,
                                    color: '#fff'
                                  } : {
                                    backgroundColor: `${colors.accent}0a`,
                                    borderColor: `${colors.accent}15`,
                                    color: '#475569'
                                  }}>
                                  +{sub.keywords.length - 3}
                                </span>
                              )}
                            </div>

                            {/* Cross-reference */}
                            {sub.crossRef && (
                              <div
                                className="flex items-center gap-1.5 text-[9.5px] font-bold mb-3 px-2 py-1.5 rounded-md border"
                                style={isDark ? {
                                  background: `${colors.accent}20`,
                                  borderColor: `${colors.accent}30`,
                                  color: '#fff'
                                } : {
                                  color: colors.accent
                                }}>
                                <Info size={9.5} className="shrink-0" />
                                <span>Cross-ref: <strong>{sub.crossRef}</strong></span>
                              </div>
                            )}

                            {/* CTA */}
                            <div className="flex items-center gap-1 text-[11px] font-extrabold transition-all group-hover/sub:translate-x-0.5"
                              style={{ color: isDark ? '#D4AF37' : colors.accent }}>
                              <span>
                                {viewMode === 'advisor'
                                  ? (language === 'EN' ? 'Register as Advisor' : 'सलाहकार पंजीकरण')
                                  : (language === 'EN' ? 'Find Expert' : 'विशेषज्ञ खोजें')}
                              </span>
                              <ArrowRight size={12} className="group-hover/sub:translate-x-0.5 transition-transform" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════
           FOOTER CTA
         ═══════════════════════════════════════ */}
      <section className={`py-16 border-t ${isDark ? 'bg-slate-950/50 border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <HelpCircle size={40} className="mx-auto animate-pulse" style={{ color: '#D4AF37' }} />
          <h2 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {language === 'EN' ? 'Confused by Legal Terminology?' : 'कानूनी शब्दों को लेकर उलझन में हैं?'}
          </h2>
          <p className={`text-sm leading-relaxed max-w-lg mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {language === 'EN'
              ? 'Our catalog maps thousands of local names (bainama, satbara, fard, khatauni) to their standard legal categories. Just type whatever you call it in the search bar!'
              : 'हमारा कैटलॉग हजारों स्थानीय नामों (बैनामा, सातबारा, खतौनी, फर्द) को उनके मानक कानूनी वर्गीकरण से जोड़ता है। ऊपर सर्च बार में कुछ भी लिखकर खोजें!'}
          </p>
          <Link
            href="/advisors"
            className="inline-flex items-center gap-2 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-lg active:scale-95"
            style={{ backgroundColor: '#0B3D91' }}
          >
            <span>{language === 'EN' ? 'Browse All Verified Advisors' : 'सभी सत्यापित सलाहकारों की सूची देखें'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>


    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function ServiceCatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-pulse">Loading Catalog...</div>
      </div>
    }>
      <ServiceCatalogContent />
    </Suspense>
  );
}
