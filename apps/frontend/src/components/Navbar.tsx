'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronDown, Menu, X, UserPlus, Phone, User, LogOut, BookOpen, LayoutDashboard, ShieldCheck,
  Home, Shield, FileCheck, Briefcase, Percent, FileText, Coins, Landmark,
  Scale, Building2, CreditCard, Languages, ArrowRight,
  FileHeart, UserCheck, Award, Lightbulb, Car, Users, GraduationCap,
  HeartHandshake, TrendingUp, Globe, Zap, Sprout, Laptop,
  Flag, Plane, School, ClipboardList, Sparkles, MapPin, Stethoscope, Package, Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MODULE_COLORS } from '@/data/servicesData';

/* ═══════════════════════════════════════════════
   ALL 25 SERVICE MODULES FOR MEGA-MENU
   ═══════════════════════════════════════════════ */
interface NavModule {
  id: string;
  titleEn: string;
  titleHi: string;
  icon: React.ComponentType<any>;
}

const NAV_MODULES: NavModule[] = [
  { id: 'm1',  titleEn: 'Birth, Death & Marriage',    titleHi: 'जन्म, मृत्यु और विवाह',        icon: FileHeart      },
  { id: 'm2',  titleEn: 'Identity Cards & Docs',      titleHi: 'पहचान पत्र (Aadhaar, PAN)',     icon: UserCheck      },
  { id: 'm3',  titleEn: 'Income, Caste & Residence',  titleHi: 'आय, जाति और निवास',             icon: Award          },
  { id: 'm4',  titleEn: 'Property & Land Papers',     titleHi: 'जमीन और संपत्ति',               icon: Home           },
  { id: 'm5',  titleEn: 'Tax / GST Filing',           titleHi: 'टैक्स / GST फाइलिंग',          icon: Percent        },
  { id: 'm6',  titleEn: 'Business Registration',      titleHi: 'व्यापार रजिस्ट्रेशन',           icon: Briefcase      },
  { id: 'm7',  titleEn: 'Brand & IP Protection',      titleHi: 'ब्रांड और आविष्कार सुरक्षा',    icon: Lightbulb      },
  { id: 'm8',  titleEn: 'Bank, Loan & Credit',        titleHi: 'बैंक, लोन और क्रेडिट',          icon: Landmark       },
  { id: 'm9',  titleEn: 'Insurance (Bima)',            titleHi: 'बीमा (Bima)',                   icon: ShieldCheck    },
  { id: 'm10', titleEn: 'Vehicle & RTO Work',         titleHi: 'गाड़ी और RTO',                  icon: Car            },
  { id: 'm11', titleEn: 'Legal & Court Help',         titleHi: 'कानूनी और कोर्ट सहायता',        icon: Scale          },
  { id: 'm12', titleEn: 'Job, PF & Labour',           titleHi: 'नौकरी, PF और श्रमिक',           icon: Users          },
  { id: 'm13', titleEn: 'School & College Papers',    titleHi: 'स्कूल और कॉलेज कागज़',          icon: GraduationCap  },
  { id: 'm14', titleEn: 'Pension & Govt Schemes',     titleHi: 'पेंशन और सरकारी योजना',         icon: HeartHandshake },
  { id: 'm15', titleEn: 'Savings & Investment',       titleHi: 'बचत और निवेश',                  icon: TrendingUp     },
  { id: 'm16', titleEn: 'Passport, Visa & Foreign',   titleHi: 'पासपोर्ट, वीज़ा और विदेश',      icon: Globe          },
  { id: 'm17', titleEn: 'Electricity, Water & Gas',   titleHi: 'बिजली, पानी और गैस',            icon: Zap            },
  { id: 'm18', titleEn: 'Farmer & Agriculture',       titleHi: 'किसान और खेती सेवाएं',          icon: Sprout         },
  { id: 'm19', titleEn: 'Online Form & Doc Help',     titleHi: 'ऑनलाइन फॉर्म सहायता',          icon: Laptop         },
  { id: 'm20', titleEn: 'Central Govt Schemes',       titleHi: 'केंद्र सरकार योजनाएं',          icon: Flag           },
  { id: 'm21', titleEn: 'Study Abroad Consulting',    titleHi: 'विदेश में पढ़ाई',                icon: Plane          },
  { id: 'm22', titleEn: 'Domestic College Admission', titleHi: 'भारत में कॉलेज दाखिला',         icon: School         },
  { id: 'm23', titleEn: 'Job Placement & Recruit',    titleHi: 'नौकरी और रोजगार',               icon: ClipboardList  },
  { id: 'm24', titleEn: 'Visa & PR Immigration',      titleHi: 'वीज़ा और PR',                   icon: FileCheck      },
  { id: 'm26', titleEn: 'Tour & Travel',              titleHi: 'टूर और ट्रैवल',                 icon: MapPin         },
  { id: 'm27', titleEn: 'Local Medical Rep',          titleHi: 'लोकल मेडिकल प्रतिनिधि',        icon: Stethoscope    },
  { id: 'm28', titleEn: 'Local Distributors',         titleHi: 'लोकल वितरक',                    icon: Package        },
  { id: 'm25', titleEn: 'Others / Custom Service',    titleHi: 'अन्य / कस्टम सेवा',             icon: Sparkles       },
];

// Split into 5 columns for the mega-menu (28 modules total)
const COL_1 = NAV_MODULES.slice(0,  6);
const COL_2 = NAV_MODULES.slice(6,  12);
const COL_3 = NAV_MODULES.slice(12, 18);
const COL_4 = NAV_MODULES.slice(18, 23);
const COL_5 = NAV_MODULES.slice(23, 28);

export default function Navbar() {
  const { user, isLoggedIn, openLoginModal, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  /* Returns className string for a nav link based on whether it is currently active */
  const navLink = (href: string, exact = true) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    // Tighter padding in Hindi so longer nav labels don't overflow
    const px = language === 'HI' ? 'px-2.5' : 'px-4';
    const fontSize = language === 'HI' ? 'text-xs' : 'text-sm';
    return active
      ? `${fontSize} font-semibold tracking-wide transition-all duration-200 ${px} py-2 rounded-md text-gold-400 bg-gold-500/12 border border-gold-500/25 relative`
      : `${fontSize} font-medium tracking-wide transition-all duration-200 ${px} py-2 rounded-md text-white/80 hover:text-gold-400 hover:bg-white/5 border border-transparent`;
  };

  const mobileNavLink = (href: string, exact = true) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return active
      ? 'block text-sm font-semibold text-gold-400 py-2 border-l-2 border-gold-400 pl-3'
      : 'block text-sm font-medium text-white/75 hover:text-gold-400 py-2 border-l-2 border-transparent pl-3 hover:border-gold-500/40 transition-all';
  };
  const [mounted, setMounted] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Only show auth-dependent UI after hydration to avoid SSR mismatch
  useEffect(() => setMounted(true), []);
  const loggedIn = mounted && isLoggedIn;
  const userMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setServicesOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setServicesOpen(false), 250);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  const handleModuleClick = useCallback((moduleId: string, e: React.MouseEvent) => {
    const cardEl = document.getElementById(`card-${moduleId}`);
    if (cardEl) {
      e.preventDefault();
      setServicesOpen(false);
      setMobileOpen(false);
      window.dispatchEvent(new CustomEvent('select-module', { detail: { moduleId } }));
    } else {
      e.preventDefault();
      setServicesOpen(false);
      setMobileOpen(false);
      router.push(`/?module=${moduleId}`);
    }
  }, [router]);

  const handleServicesNavClick = useCallback((e: React.MouseEvent) => {
    const el = document.getElementById('services-section');
    if (el) {
      e.preventDefault();
      setServicesOpen(false);
      setMobileOpen(false);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setServicesOpen(false);
      setMobileOpen(false);
      router.push('/#services-section');
    }
  }, [router]);

  /* ── Render a single module link in the mega-menu ── */
  const renderModuleLink = useCallback((mod: NavModule) => {
    const Icon = mod.icon;
    const colorIdx = NAV_MODULES.findIndex(m => m.id === mod.id);
    const colors = MODULE_COLORS[colorIdx % MODULE_COLORS.length];
    const acc = colors.accent;
    const isHovered = hoveredModule === mod.id;
    const seqNum = colorIdx + 1;

    return (
      <Link
        key={mod.id}
        href={`/?module=${mod.id}`}
        onClick={(e) => handleModuleClick(mod.id, e)}
        onMouseEnter={() => setHoveredModule(mod.id)}
        onMouseLeave={() => setHoveredModule(null)}
        className="flex items-start gap-2 px-2.5 py-2 rounded-xl border-2 transition-all duration-200"
        style={{
          background:      isHovered ? 'white' : 'rgba(255,255,255,0.82)',
          borderColor:     isHovered ? acc : `${acc}35`,
          transform:       isHovered ? 'scale(1.11)' : 'scale(1)',
          transformOrigin: 'center center',
          zIndex:          isHovered ? 20 : 1,
          position:        'relative',
          boxShadow:       isHovered
            ? `0 8px 24px ${acc}35, 0 0 0 2px white`
            : '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Icon */}
        <div
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-white shadow-sm mt-0.5"
          style={{ background: `linear-gradient(135deg,${acc},${acc}cc)` }}
        >
          <Icon size={13} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <span
            className="text-[11px] font-bold block leading-tight transition-colors"
            style={{
              color:      isHovered ? acc : '#1e293b',
              whiteSpace: isHovered ? 'normal' : 'nowrap',
              overflow:   isHovered ? 'visible' : 'hidden',
              textOverflow: isHovered ? 'unset' : 'ellipsis',
            }}
          >
            {language === 'EN' ? mod.titleEn : mod.titleHi}
          </span>
          <span
            className="text-[9px] font-medium leading-tight block mt-0.5"
            style={{
              color:      isHovered ? `${acc}aa` : '#94a3b8',
              whiteSpace: 'nowrap',
              overflow:   'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {language === 'EN' ? mod.titleHi : mod.titleEn}
          </span>
        </div>

        {/* Sequential number badge */}
        <span
          className="text-[8.5px] font-black px-1 py-0.5 rounded shrink-0 border leading-none mt-0.5"
          style={{
            color:       isHovered ? 'white' : '#94a3b8',
            borderColor: isHovered ? acc : '#e2e8f0',
            background:  isHovered ? acc : 'white',
          }}
        >
          #{seqNum}
        </span>
      </Link>
    );
  }, [language, handleModuleClick, hoveredModule]);

  return (
    <nav className="bg-[#050e1b]/95 backdrop-blur-md py-3.5 sticky top-0 border-b border-gold-500/10 shadow-xl shadow-black/40 z-[9999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* ── LOGO ── */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <img
            alt="BrokerSaab Logo"
            src="/logo-icon.png"
            className="h-11 w-auto object-contain hover:scale-105 transition-transform duration-200"
          />
          <div className="hidden sm:flex flex-col justify-center gap-0.5">
            <span className="text-lg font-extrabold text-white tracking-tight leading-none">
              Broker<span className="text-gold-400">Saab</span>
            </span>
            <span className="text-[9px] text-blue-300 font-semibold uppercase tracking-[0.18em] leading-none">
              {t('nav.trustedPlatform')}
            </span>
          </div>
        </Link>

        {/* ── DESKTOP NAV ── */}
        <div className="hidden lg:flex items-center gap-1">
          <Link href="/" className={navLink('/')}>
            {t('nav.home')}
            {pathname === '/' && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gold-400" />}
          </Link>

          <Link href="/about" className={navLink('/about')}>
            {t('nav.about')}
            {pathname === '/about' && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gold-400" />}
          </Link>

          {/* ── Services Mega Dropdown (All 26 Modules) ── */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/#services-section"
              onClick={handleServicesNavClick}
              className={`text-sm font-medium tracking-wide transition-all duration-200 px-4 py-2 rounded-md flex items-center gap-1 ${
                servicesOpen
                  ? 'text-gold-400 bg-gold-500/10 border border-gold-500/30'
                  : 'text-white hover:text-gold-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{t('nav.services')}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
              />
            </Link>

            {/* ── Mega-menu: 5-column grid with all 28 modules ── */}
            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 translate-y-1 w-[1060px] rounded-3xl border border-emerald-500/25 shadow-[0_20px_50px_rgba(0,0,0,0.10)] z-50 transition-all duration-300 ease-in-out ${
                servicesOpen
                  ? 'opacity-100 visible translate-y-2'
                  : 'opacity-0 invisible -translate-y-2 pointer-events-none'
              }`}
              style={{ position: 'absolute' }}
            >
              {/* Background layer — overflow-hidden so it clips to border-radius */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#f2fbf6] to-[#e6f7ec] rounded-3xl -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-400/5 rounded-full blur-[80px]" />
              </div>

              {/* Top accent bar */}
              <div className="h-[3.5px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-t-3xl" />

              {/* Grid content — overflow visible so hovered tiles can scale out */}
              <div className="px-5 pt-4 pb-4" style={{ overflow: 'visible' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {language === 'EN' ? 'All Service Categories' : 'सभी सेवा श्रेणियां'}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {language === 'EN' ? '28 modules · 185+ sub-services' : '28 श्रेणियां · 185+ उप-सेवाएं'}
                    </p>
                  </div>
                  <Link
                    href="/#services-section"
                    onClick={handleServicesNavClick}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                  >
                    <span>{language === 'EN' ? 'View All' : 'सभी देखें'}</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {/* 5-column grid */}
                <div className="grid grid-cols-5 gap-1" style={{ overflow: 'visible' }}>
                  <div className="space-y-1" style={{ overflow: 'visible' }}>
                    {COL_1.map(renderModuleLink)}
                  </div>
                  <div className="space-y-1" style={{ overflow: 'visible' }}>
                    {COL_2.map(renderModuleLink)}
                  </div>
                  <div className="space-y-1" style={{ overflow: 'visible' }}>
                    {COL_3.map(renderModuleLink)}
                  </div>
                  <div className="space-y-1" style={{ overflow: 'visible' }}>
                    {COL_4.map(renderModuleLink)}
                  </div>
                  <div className="space-y-1" style={{ overflow: 'visible' }}>
                    {COL_5.map(renderModuleLink)}
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="px-5 py-3 border-t border-slate-200/80 flex items-center justify-between bg-emerald-50/30 rounded-b-3xl">
                <span className="text-[10px] text-slate-500 font-medium">
                  {language === 'EN' ? 'Hover to preview · Click to explore advisors' : 'होवर करें · क्लिक करके विशेषज्ञ खोजें'}
                </span>
                <Link
                  href="/#services-section"
                  onClick={handleServicesNavClick}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl shadow-sm transition-colors"
                >
                  {language === 'EN' ? 'Browse Full Catalog' : 'पूरा कैटलॉग देखें'}
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>

          <Link href="/how-we-work" className={navLink('/how-we-work')}>
            {t('nav.howWeWork')}
            {pathname === '/how-we-work' && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gold-400" />}
          </Link>

          <Link href="/contact" className={navLink('/contact')}>
            {t('nav.contact')}
            {pathname === '/contact' && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-gold-400" />}
          </Link>
        </div>

        {/* ── DESKTOP CTA BUTTONS ── */}
        <div className="hidden lg:flex items-center gap-2">
          
          {/* Not logged in: Register as Advisor + Sign In */}
          {!loggedIn && (
            <>
              <Link
                href="/advisors/onboarding"
                className={`text-white hover:text-gold-400 hover:bg-white/10 font-medium transition-all py-2 rounded-md flex items-center gap-1.5 border border-white/20 hover:border-gold-500/30 ${language === 'HI' ? 'px-2 text-xs' : 'px-3 text-sm'}`}
              >
                <UserPlus size={14} /> {t('nav.registerAdvisor')}
              </Link>
              <button
                onClick={() => openLoginModal()}
                className={`text-white hover:text-gold-400 hover:bg-white/10 font-medium transition-all py-2 rounded-md border border-white/20 hover:border-gold-500/30 ${language === 'HI' ? 'px-2 text-xs' : 'px-3 text-sm'}`}
              >
                {t('nav.signIn')}
              </button>
            </>
          )}


          {/* Logged in: user dropdown with dashboard link inside */}
          {loggedIn && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-white/10 text-white border border-white/20 hover:bg-white/15 font-medium transition-all px-3 py-2.5 rounded-md text-sm"
              >
                <User size={15} className="text-gold-400 shrink-0" />
                <span className="max-w-[80px] truncate">{user?.fullName?.split(' ')[0] ?? 'Account'}</span>
                <ChevronDown size={13} className={`transition-transform shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#050e1b]/95 backdrop-blur-md border border-gold-500/20 rounded-xl shadow-xl py-1.5 z-50">
                  {/* Role-aware dashboard link lives inside the dropdown */}
                  {(user?.role === 'CLIENT' || user?.role === 'ADVISOR') && (
                    <Link href="/bookings" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <BookOpen size={14} className="text-gold-400" /> {t('nav.myConsultations')}
                    </Link>
                  )}
                  {user?.role === 'CLIENT' && (
                    <Link href="/wallet" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <Wallet size={14} className="text-gold-400" /> My Wallet
                    </Link>
                  )}
                  {user?.role === 'ADVISOR' && (
                    <Link href="/advisor/dashboard" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <LayoutDashboard size={14} className="text-gold-400" /> {t('nav.advisorWorkspace')}
                    </Link>
                  )}
                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'SUB_ADMIN') && (
                    <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <ShieldCheck size={14} className="text-gold-400" /> {t('nav.adminSuite')}
                    </Link>
                  )}
                  <div className="border-t border-white/5 my-1" />
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); window.location.href = '/'; }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LogOut size={14} className="text-red-400" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Language Dropdown (Right-most side) */}
          <div className="relative ml-2" ref={langDropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white/5 border border-white/20 hover:border-gold-500/30 hover:bg-white/10 text-white hover:text-gold-400 font-medium text-sm transition-all"
              title="Select Language / भाषा चुनें"
            >
              <Languages size={15} className="text-gold-400" />
              <span>{language === 'EN' ? 'English' : 'हिंदी'}</span>
              <ChevronDown size={13} className={`transition-transform shrink-0 ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {langDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-32 bg-[#050e1b]/95 backdrop-blur-md border border-gold-500/20 rounded-xl shadow-xl py-1.5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('EN');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors block ${
                    language === 'EN' ? 'text-gold-400 bg-white/5 font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('HI');
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors block ${
                    language === 'HI' ? 'text-gold-400 bg-white/5 font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE CONTROLS ── */}
        <div className="lg:hidden flex items-center gap-2">
          {/* Mobile Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
            className="flex items-center justify-center p-1.5 rounded-md bg-white/5 border border-white/20 text-gold-400 font-bold text-xs w-8 h-8"
            aria-label="Toggle Language"
          >
            {language}
          </button>

          {/* Always-visible Sign In / user chip on mobile */}
          {loggedIn ? (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center gap-1.5 bg-white/10 text-white border border-white/20 font-semibold px-3 py-2 rounded-md text-sm hover:bg-white/20 transition-colors max-w-[100px]"
            >
              <User size={14} className="text-gold-400 shrink-0" />
              <span className="truncate">{user?.fullName?.split(' ')[0] ?? 'You'}</span>
            </button>
          ) : (
            <button
              onClick={() => openLoginModal()}
              className="bg-gold-500 text-navy-800 font-semibold px-4 py-2 rounded-md text-sm hover:bg-gold-400 transition-colors"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 hover:bg-white/10 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen
              ? <X size={24} className="text-white" />
              : <Menu size={24} className="text-white" />
            }
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#050e1b]/95 backdrop-blur-md border-t border-gold-500/20 shadow-2xl z-50 animate-slideDown max-h-[80vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
            <Link href="/" onClick={() => setMobileOpen(false)} className={mobileNavLink('/')}>
              {t('nav.home')}
            </Link>
            <Link href="/about" onClick={() => setMobileOpen(false)} className={mobileNavLink('/about')}>
              {t('nav.about')}
            </Link>

            {/* Mobile Services — All 26 Modules */}
            <div className="border-y border-gold-500/10 py-3">
              <Link href="/#services-section" onClick={(e) => { setMobileOpen(false); handleServicesNavClick(e); }} className="block text-sm font-bold text-gold-400 mb-3 uppercase tracking-wide">
                {t('nav.services')} — {language === 'EN' ? 'All Categories' : 'सभी श्रेणियां'}
              </Link>
              <div className="grid grid-cols-2 gap-2">
                {NAV_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <Link
                      key={mod.id}
                      href={`/?module=${mod.id}`}
                      onClick={(e) => { setMobileOpen(false); handleModuleClick(mod.id, e); }}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-navy-700/40 text-xs font-medium text-slate-300 border border-gold-500/5 active:border-gold-500 transition-colors"
                    >
                      <Icon size={13} className="text-gold-500 shrink-0" />
                      <span className="truncate">{language === 'EN' ? mod.titleEn : mod.titleHi}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <Link href="/how-we-work" onClick={() => setMobileOpen(false)} className={mobileNavLink('/how-we-work')}>
              {t('nav.howWeWork')}
            </Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)} className={mobileNavLink('/contact')}>
              {t('nav.contact')}
            </Link>

            {/* Logged-in user — role-aware dashboard links */}
            {loggedIn && (
              <div className="border-t border-gold-500/10 pt-3 space-y-2">
                {(user?.role === 'CLIENT' || user?.role === 'ADVISOR') && (
                  <Link href="/bookings" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold text-slate-200 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                    <BookOpen size={15} className="text-gold-400" /> My Consultations
                  </Link>
                )}
                {user?.role === 'CLIENT' && (
                  <Link href="/wallet" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold text-slate-200 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                    <Wallet size={15} className="text-gold-400" /> My Wallet
                  </Link>
                )}
                {user?.role === 'ADVISOR' && (
                  <Link href="/advisor/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold text-slate-200 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                    <LayoutDashboard size={15} className="text-gold-400" /> Advisor Dashboard
                  </Link>
                )}
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'SUB_ADMIN') && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-semibold text-slate-200 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                    <ShieldCheck size={15} className="text-gold-400" /> Admin Suite
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileOpen(false); window.location.href = '/'; }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm font-semibold text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}

            {!loggedIn && (
            <div className="pt-3 space-y-2">
              <Link
                href="/advisors/onboarding"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full border border-gold-500/30 text-gold-400 font-medium py-2.5 rounded-md text-sm"
              >
                <UserPlus size={16} />
                {t('nav.registerAdvisor')}
              </Link>
            </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
