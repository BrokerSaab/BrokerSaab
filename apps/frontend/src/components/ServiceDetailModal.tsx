'use client';

import React, { useEffect, useCallback } from 'react';
import { X, ArrowRight, Info, Search } from 'lucide-react';
import Link from 'next/link';
import { Module, MODULE_COLORS, ICON_MAP } from '@/data/servicesData';

/* accent palette matching SUB_PALETTE in page.tsx */
const SUB_PALETTE = [
  '#F43F5E','#14B8A6','#8B5CF6','#F59E0B','#10B981',
  '#3B82F6','#EAB308','#0EA5E9','#6366F1','#F97316',
  '#06B6D4','#EC4899','#D946EF','#84CC16','#2563EB',
  '#FBBF24','#22C55E','#A855F7','#E11D48',
];

interface Props {
  module: Module | null;
  colorIdx: number;
  language: 'EN' | 'HI';
  viewMode: 'user' | 'advisor';
  onClose: () => void;
  onSelectSub: (categoryName: string) => void;
}

export default function ServiceDetailModal({ module, colorIdx, language, viewMode, onClose, onSelectSub }: Props) {
  const hi = language === 'HI';

  /* Close on ESC */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Lock body scroll while open */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!module) return null;

  const colors = MODULE_COLORS[colorIdx % MODULE_COLORS.length];
  const IconComp = ICON_MAP[module.iconName] || Search;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative w-full sm:max-w-5xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slideUp sm:animate-popIn overflow-hidden"
        style={{ maxHeight: '92vh' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-start gap-4 px-5 sm:px-8 pt-6 pb-5 shrink-0"
          style={{ background: `linear-gradient(135deg, ${colors.accent}18, ${colors.accent}06)`, borderBottom: `1px solid ${colors.accent}25` }}
        >
          {/* Drag handle (mobile) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 sm:hidden" />

          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${colors.iconBg}`}
            style={{ boxShadow: `0 8px 24px ${colors.accent}40` }}
          >
            <IconComp size={28} />
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] font-black uppercase tracking-widest mb-1"
              style={{ color: colors.accent }}
            >
              {hi ? 'सेवा श्रेणी' : 'Service Category'}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {hi ? module.titleHi : module.titleEn}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2">
              {hi ? module.descriptionHi : module.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0 -mt-1"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* ── Sub-module count bar ── */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          <span className="text-xs font-semibold text-slate-500">
            {hi ? `${module.subModules.length} उप-सेवाएं उपलब्ध` : `${module.subModules.length} sub-services available`}
          </span>
          <span
            className="text-[10px] font-bold px-3 py-1 rounded-full"
            style={{ background: `${colors.accent}15`, color: colors.accent }}
          >
            {hi ? 'विशेषज्ञ चुनें →' : 'Select a service →'}
          </span>
        </div>

        {/* ── Sub-module grid (scrollable) ── */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-8 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {module.subModules.map((sub, idx) => {
              const accent = SUB_PALETTE[(colorIdx * 2 + idx * 3) % SUB_PALETTE.length];
              const href = viewMode === 'advisor' ? '/advisors/onboarding' : sub.route;

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    if (viewMode !== 'advisor') {
                      /* map sub.route slug to category name for advisor filter */
                      const slug = sub.route.split('=')[1];
                      onSelectSub(slug);
                    } else {
                      window.location.href = '/advisors/onboarding';
                    }
                  }}
                  className="group text-left rounded-2xl p-4 sm:p-5 border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] w-full"
                  style={{
                    borderColor: `${accent}30`,
                    background: `linear-gradient(145deg, #fff 0%, ${accent}06 100%)`,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.04)`,
                  }}
                >
                  {/* Icon + Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 3px 10px ${accent}40` }}
                    >
                      <Search size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-slate-900 text-sm leading-tight group-hover:text-slate-800">
                        {hi ? sub.nameHi : sub.nameEn}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {hi ? sub.nameEn : sub.nameHi}
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {sub.keywords.slice(0, 4).map((kw) => (
                      <span
                        key={kw}
                        className="text-[9.5px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}
                      >
                        {kw}
                      </span>
                    ))}
                    {sub.keywords.length > 4 && (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md text-slate-400">
                        +{sub.keywords.length - 4}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div
                    className="flex items-center gap-1.5 text-xs font-bold group-hover:gap-2.5 transition-all"
                    style={{ color: accent }}
                  >
                    <span>{hi ? 'विशेषज्ञ खोजें' : 'Find Expert'}</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between px-5 sm:px-8 py-4 shrink-0"
          style={{ borderTop: `1px solid ${colors.accent}20`, background: `${colors.accent}06` }}
        >
          <p className="text-xs text-slate-400 hidden sm:block">
            {hi ? 'किसी भी उप-सेवा पर क्लिक करके विशेषज्ञ खोजें' : 'Click any sub-service to find a verified expert'}
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all"
            >
              {hi ? 'बंद करें' : 'Close'}
            </button>
            <button
              onClick={() => {
                onClose();
                setTimeout(() => {
                  const el = document.getElementById('advisors-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 ${colors.iconBg}`}
            >
              {hi ? 'सभी विशेषज्ञ देखें' : 'Browse All Experts'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
