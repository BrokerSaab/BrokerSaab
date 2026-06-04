'use client';

import { useState } from 'react';
import IndiaMap from '@svg-maps/india';

/* ── Vibrant colour palette (one per state, matching the reference image style) ── */
const STATE_COLORS: Record<string, string> = {
  jk: '#FFD600', // J&K — vivid yellow
  hp: '#64B5F6', // Himachal — sky blue
  pb: '#F48FB1', // Punjab — pink
  ut: '#FF9800', // Uttarakhand — orange
  hr: '#81C784', // Haryana — light green
  dl: '#EF5350', // Delhi — red
  rj: '#F8BBD9', // Rajasthan — soft pink (large)
  up: '#EF5350', // UP — red
  br: '#8D6E63', // Bihar — brown
  wb: '#AED581', // West Bengal — lime
  sk: '#80CBC4', // Sikkim — teal
  as: '#FFE082', // Assam — pale yellow
  ar: '#7986CB', // Arunachal — indigo
  nl: '#4FC3F7', // Nagaland — cyan
  mn: '#FF8A65', // Manipur — orange
  ml: '#A5D6A7', // Meghalaya — green
  mz: '#FFCC80', // Mizoram — amber
  tr: '#CE93D8', // Tripura — purple
  gj: '#1565C0', // Gujarat — deep blue
  mp: '#9575CD', // MP — violet
  jh: '#388E3C', // Jharkhand — forest green
  ct: '#26A69A', // Chhattisgarh — teal
  or: '#FFA726', // Odisha — orange
  mh: '#FF7043', // Maharashtra — deep orange
  ga: '#66BB6A', // Goa — green
  tg: '#43A047', // Telangana — emerald
  ap: '#FF5722', // Andhra — red-orange
  ka: '#7B1FA2', // Karnataka — dark purple
  tn: '#90A4AE', // Tamil Nadu — blue-grey
  kl: '#1B5E20', // Kerala — dark green
  py: '#E91E63', // Puducherry — pink
  ch: '#F06292', // Chandigarh — pink
  dn: '#26C6DA', // DNH — cyan
  dd: '#29B6F6', // D&D — light blue
  ld: '#00BCD4', // Lakshadweep — cyan
  an: '#0288D1', // Andaman — blue
};

/* Human-readable names override (some are long in the package) */
const DISPLAY_NAMES: Record<string, string> = {
  jk: 'Jammu & Kashmir',
  hp: 'Himachal Pradesh',
  pb: 'Punjab',
  ut: 'Uttarakhand',
  hr: 'Haryana',
  dl: 'Delhi',
  rj: 'Rajasthan',
  up: 'Uttar Pradesh',
  br: 'Bihar',
  wb: 'West Bengal',
  sk: 'Sikkim',
  as: 'Assam',
  ar: 'Arunachal Pradesh',
  nl: 'Nagaland',
  mn: 'Manipur',
  ml: 'Meghalaya',
  mz: 'Mizoram',
  tr: 'Tripura',
  gj: 'Gujarat',
  mp: 'Madhya Pradesh',
  jh: 'Jharkhand',
  ct: 'Chhattisgarh',
  or: 'Odisha',
  mh: 'Maharashtra',
  ga: 'Goa',
  tg: 'Telangana',
  ap: 'Andhra Pradesh',
  ka: 'Karnataka',
  tn: 'Tamil Nadu',
  kl: 'Kerala',
  py: 'Puducherry',
  ch: 'Chandigarh',
  dn: 'D&NH and D&D',
  dd: 'Daman and Diu',
  ld: 'Lakshadweep',
  an: 'Andaman & Nicobar',
};

interface Props {
  selected: string;       // state name
  onSelect: (name: string) => void;
}

export default function IndiaMapSVG({ selected, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (hovered && tooltip) {
      const svg = e.currentTarget.getBoundingClientRect();
      setTooltip(prev => prev ? { ...prev, x: e.clientX - svg.left, y: e.clientY - svg.top } : null);
    }
  };

  const getStateFill = (id: string, name: string): string => {
    const isSelected = selected === (DISPLAY_NAMES[id] || name);
    const isHovered = hovered === id;
    if (isSelected) return '#D4AF37';           // gold when selected
    if (isHovered) return '#fff176';             // bright yellow on hover
    return STATE_COLORS[id] || '#B0BEC5';
  };

  const getStateOpacity = (id: string, name: string): number => {
    const isSelected = selected === (DISPLAY_NAMES[id] || name);
    return isSelected ? 1 : 0.88;
  };

  return (
    <div className="relative w-full">
      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 px-3 py-1.5 rounded-xl text-xs font-black text-white whitespace-nowrap"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            background: 'rgba(5,14,27,0.95)',
            border: '1.5px solid rgba(212,175,55,0.5)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            transform: 'translateY(-100%)',
          }}
        >
          📍 {tooltip.name}
        </div>
      )}

      <svg
        viewBox={IndiaMap.viewBox}
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.4))' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHovered(null); setTooltip(null); }}
      >
        {/* Subtle background */}
        <rect x="0" y="0" width="612" height="696" fill="rgba(5,14,27,0.3)" rx="8" />

        {IndiaMap.locations.map((loc) => {
          const displayName = DISPLAY_NAMES[loc.id] || loc.name;
          const isSelected = selected === displayName;
          const isHovered = hovered === loc.id;
          const fill = getStateFill(loc.id, loc.name);
          const opacity = getStateOpacity(loc.id, loc.name);

          return (
            <path
              key={loc.id}
              id={loc.id}
              d={loc.path}
              fill={fill}
              opacity={opacity}
              stroke={isSelected ? '#B48C22' : isHovered ? '#FFD600' : 'rgba(255,255,255,0.5)'}
              strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0.7}
              style={{
                cursor: 'pointer',
                transition: 'fill 0.15s ease, stroke 0.15s ease, opacity 0.15s ease',
                filter: isSelected
                  ? 'drop-shadow(0 0 8px rgba(212,175,55,0.8))'
                  : isHovered
                  ? 'drop-shadow(0 0 6px rgba(255,214,0,0.6)) brightness(1.15)'
                  : 'brightness(0.95)',
              }}
              onClick={() => onSelect(displayName)}
              onMouseEnter={(e) => {
                setHovered(loc.id);
                const svg = (e.target as SVGPathElement).ownerSVGElement!.getBoundingClientRect();
                setTooltip({ x: e.clientX - svg.left, y: e.clientY - svg.top, name: displayName });
              }}
              onMouseLeave={() => { setHovered(null); setTooltip(null); }}
            />
          );
        })}

        {/* Gold pulse ring on selected state centroid — decorative */}
        {IndiaMap.locations.map((loc) => {
          const displayName = DISPLAY_NAMES[loc.id] || loc.name;
          if (selected !== displayName) return null;
          return (
            <circle key={`sel-${loc.id}`} r="6" fill="#D4AF37" opacity="0.85"
              style={{ animation: 'none' }}
              /* Rough centroid approximation using viewBox centre — good enough for pulse dot */
            />
          );
        })}
      </svg>

      {/* Selected state banner below map */}
      {selected && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="px-4 py-1.5 rounded-full text-sm font-black"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #B48C22)', color: '#071527', boxShadow: '0 0 16px rgba(212,175,55,0.4)' }}>
            ✓ {selected} selected
          </span>
        </div>
      )}
    </div>
  );
}
