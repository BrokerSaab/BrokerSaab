'use client';

import { useState } from 'react';

const PALETTE = [
  '#FFD600','#64B5F6','#F48FB1','#FF9800','#81C784','#EF5350',
  '#F8BBD9','#AED581','#80CBC4','#FFE082','#7986CB','#4FC3F7',
  '#FF8A65','#A5D6A7','#FFCC80','#CE93D8','#1565C0','#9575CD',
  '#388E3C','#26A69A','#FFA726','#FF7043','#66BB6A','#43A047',
  '#FF5722','#7B1FA2','#90A4AE','#1B5E20','#E91E63','#F06292',
  '#26C6DA','#29B6F6','#00BCD4','#0288D1','#4DB6AC','#DCE775',
];

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function abbreviate(name: string, maxLen = 10): string {
  if (name.length <= maxLen) return name;
  const words = name.split(/[\s\-&]+/);
  if (words.length === 1) return name.slice(0, maxLen);
  // Two words: first word + first letter of second
  if (words.length === 2) return words[0].length <= 8 ? words[0] : words[0].slice(0, 7) + '.';
  // Three+ words: use first two words if they fit
  const twoWords = words.slice(0, 2).join(' ');
  return twoWords.length <= maxLen ? twoWords : words[0];
}

interface Props {
  districts: string[];
  selected: string;
  onSelect: (district: string) => void;
  stateName: string;
}

export default function DistrictGridMap({ districts, selected, onSelect, stateName }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);

  const tileMin = districts.length > 35 ? '52px' : districts.length > 20 ? '62px' : '72px';

  return (
    <div className="relative w-full">
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[99999] px-3 py-1.5 rounded-xl text-xs font-black text-white whitespace-nowrap"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 14,
            background: 'rgba(5,14,27,0.97)',
            border: '1.5px solid rgba(212,175,55,0.55)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.55)',
            transform: 'translateY(-100%)',
          }}
        >
          📍 {tooltip.name}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${tileMin}, 1fr))`,
          gap: '4px',
          padding: '10px',
          background: 'rgba(5,14,27,0.35)',
          borderRadius: '12px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
        }}
      >
        {districts.map((district) => {
          const isSel = selected === district;
          const isHov = hovered === district;
          const color = hashColor(district);
          const bg = isSel ? '#D4AF37' : isHov ? '#fff176' : color;

          return (
            <button
              key={district}
              onClick={() => onSelect(district)}
              onMouseEnter={(e) => {
                setHovered(district);
                setTooltip({ x: e.clientX, y: e.clientY, name: district });
              }}
              onMouseMove={(e) => {
                if (hovered === district) setTooltip({ x: e.clientX, y: e.clientY, name: district });
              }}
              onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              style={{
                background: bg,
                border: isSel ? '2px solid #B48C22' : isHov ? '1.5px solid #FFD600' : '1px solid rgba(255,255,255,0.3)',
                borderRadius: '6px',
                minHeight: '42px',
                padding: '4px 3px',
                cursor: 'pointer',
                opacity: isSel ? 1 : 0.9,
                filter: isSel
                  ? 'drop-shadow(0 0 8px rgba(212,175,55,0.9))'
                  : isHov
                  ? 'drop-shadow(0 0 6px rgba(255,214,0,0.65)) brightness(1.15)'
                  : 'brightness(0.93)',
                transition: 'all 0.13s ease',
                fontSize: '8.5px',
                fontWeight: 700,
                color: isSel ? '#071527' : 'rgba(5,14,27,0.88)',
                textAlign: 'center',
                lineHeight: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                wordBreak: 'break-word',
                hyphens: 'auto',
              }}
            >
              {abbreviate(district)}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-3 flex items-center justify-center">
          <span
            className="px-4 py-1.5 rounded-full text-sm font-black"
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #B48C22)',
              color: '#071527',
              boxShadow: '0 0 16px rgba(212,175,55,0.4)',
            }}
          >
            ✓ {selected}
          </span>
        </div>
      )}
    </div>
  );
}
