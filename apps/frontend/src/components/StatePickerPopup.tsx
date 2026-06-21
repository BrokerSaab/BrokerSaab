'use client';

import React, { useEffect, useState } from 'react';
import { X, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import IndiaMapSVG from './IndiaMapSVG';
import DistrictGridMap from './DistrictGridMap';
import { INDIA_STATES_SORTED } from '@/data/indiaStates';
import { DISTRICTS_BY_STATE, getStateIdByDisplayName } from '@/data/indiaDistricts';

const STATE_KEY    = 'bs_user_state';
const DISTRICT_KEY = 'bs_user_district';

interface Props {
  forceOpen?: boolean;
  onForceClose?: () => void;
}

export default function StatePickerPopup({ forceOpen, onForceClose }: Props) {
  const [step, setStep]         = useState<'state' | 'district'>('state');
  const [selected, setSelected] = useState<string>('');           // state name
  const [district, setDistrict] = useState<string>('');           // district name

  const open = !!forceOpen;

  /* Reset internal state whenever the popup opens fresh */
  useEffect(() => {
    if (open) { setStep('state'); setSelected(''); setDistrict(''); }
  }, [open]);

  const stateId   = selected ? getStateIdByDisplayName(selected) : null;
  const districts = stateId ? (DISTRICTS_BY_STATE[stateId] ?? []) : [];

  /* Called when state is confirmed; goes to district step if districts exist */
  const handleStateConfirm = (stateName: string) => {
    if (!stateName || stateName === 'All India') {
      finish(stateName || 'All India', '');
      return;
    }
    const sid = getStateIdByDisplayName(stateName);
    const dlist = sid ? (DISTRICTS_BY_STATE[sid] ?? []) : [];
    if (dlist.length === 0) {
      finish(stateName, '');
    } else {
      setSelected(stateName);
      setStep('district');
    }
  };

  /* Final commit: persist + dispatch events + close */
  const finish = (stateName: string, districtName: string) => {
    sessionStorage.setItem(STATE_KEY, stateName);
    if (districtName) sessionStorage.setItem(DISTRICT_KEY, districtName);
    else sessionStorage.removeItem(DISTRICT_KEY);

    window.dispatchEvent(new CustomEvent('state-selected', { detail: { state: stateName } }));
    if (districtName) {
      window.dispatchEvent(new CustomEvent('district-selected', {
        detail: { state: stateName, district: districtName },
      }));
    }
    onForceClose?.();
  };

  if (!open) return null;

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ STEP 2 â€” District â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  if (step === 'district') {
    return (
      <div className="fixed inset-0 z-[99997] flex items-center justify-center p-3 sm:p-5">
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

        <div
          className="relative w-full animate-popIn flex flex-col"
          style={{
            maxWidth: '860px',
            maxHeight: '94dvh',
            borderRadius: '24px',
            overflow: 'hidden',
            background: 'linear-gradient(160deg, #071527 0%, #050e1b 60%, #04111c 100%)',
            border: '1px solid rgba(212,175,55,0.22)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Rainbow bar */}
          <div className="h-1 shrink-0"
            style={{ background: 'linear-gradient(90deg,#EF5350,#FF9800,#FFD600,#4CAF50,#2196F3,#9C27B0,#E91E63)' }} />

          {/* Header */}
          <div className="px-5 sm:px-7 py-4 border-b border-white/6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setStep('state'); setDistrict(''); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-white font-black text-lg sm:text-xl leading-tight">
                  ðŸ“ Pick your district in&nbsp;
                  <span style={{ color: '#D4AF37' }}>{selected}</span>
                </h2>
                <p className="text-white/50 text-xs mt-0.5">
                  Click a district on the map or pick from the list
                </p>
              </div>
            </div>
            <button
              onClick={() => finish(selected, '')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-0">

              {/* LEFT â€” District grid map */}
              <div className="px-4 sm:px-5 py-4 flex flex-col items-center justify-center border-r border-white/5 overflow-y-auto">
                <p className="text-white/35 text-[11px] uppercase tracking-widest font-semibold mb-3">
                  Click any district on the map
                </p>
                <DistrictGridMap
                  districts={districts}
                  selected={district}
                  onSelect={(d) => setDistrict(prev => prev === d ? '' : d)}
                  stateName={selected}
                />
              </div>

              {/* RIGHT â€” District list + confirm */}
              <div className="flex flex-col px-4 sm:px-5 py-4">
                <p className="text-white/35 text-[11px] uppercase tracking-widest font-semibold mb-3">
                  Or select from list
                </p>

                <div
                  className="flex-1 overflow-y-auto rounded-2xl"
                  style={{
                    maxHeight: '400px',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  {districts.map((d) => {
                    const isActive = district === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setDistrict(isActive ? '' : d)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isActive ? 'rgba(212,175,55,0.12)' : 'transparent',
                          color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.7)',
                        }}
                        onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: isActive ? '#D4AF37' : 'rgba(212,175,55,0.4)' }} />
                        <span className="font-medium flex-1 truncate">{d}</span>
                        {isActive && <span className="text-gold-400 text-sm shrink-0">âœ“</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Selected pill */}
                {district && (
                  <div className="mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                    <MapPin size={13} className="text-gold-400 shrink-0" />
                    <span className="text-gold-300 text-xs font-bold truncate">{district}</span>
                    <button onClick={() => setDistrict('')}
                      className="ml-auto text-white/30 hover:text-white/70 text-xs transition-colors shrink-0">âœ•</button>
                  </div>
                )}

                {/* Confirm */}
                <button
                  onClick={() => finish(selected, district)}
                  className="mt-3 w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: district
                      ? 'linear-gradient(135deg, #D4AF37, #B48C22)'
                      : 'rgba(255,255,255,0.06)',
                    color: district ? '#071527' : 'rgba(255,255,255,0.4)',
                    boxShadow: district ? '0 4px 16px rgba(212,175,55,0.4)' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  {district ? (
                    <><MapPin size={14} /> {district}, {selected} <ArrowRight size={14} /></>
                  ) : (
                    <>All {selected} â†’</>
                  )}
                </button>

                <button
                  onClick={() => finish(selected, '')}
                  className="mt-2 text-center w-full text-white/25 text-xs hover:text-white/50 transition-colors py-1"
                >
                  Skip â€” show all {selected}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ STEP 1 â€” State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div
      className="fixed inset-0 z-[99997] flex items-center justify-center p-3 sm:p-5"
      onClick={(e) => { if (e.target === e.currentTarget) finish('All India', ''); }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div
        className="relative w-full animate-popIn flex flex-col"
        style={{
          maxWidth: '860px',
          maxHeight: '94dvh',
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #071527 0%, #050e1b 60%, #04111c 100%)',
          border: '1px solid rgba(212,175,55,0.22)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Rainbow bar */}
        <div className="h-1 shrink-0"
          style={{ background: 'linear-gradient(90deg,#EF5350,#FF9800,#FFD600,#4CAF50,#2196F3,#9C27B0,#E91E63)' }} />

        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <MapPin size={20} className="text-gold-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg sm:text-xl leading-tight">
                ðŸ“ Where are you in India?
              </h2>
              <p className="text-white/50 text-xs mt-0.5">
                Click your state on the map or pick from the list below
              </p>
            </div>
          </div>
          <button
            onClick={() => finish('All India', '')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-all shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_260px] gap-0">

            {/* LEFT â€” SVG Map */}
            <div className="px-4 sm:px-6 py-4 flex flex-col items-center justify-center border-r border-white/5">
              <p className="text-white/35 text-[11px] uppercase tracking-widest font-semibold mb-3">
                Click any state on the map
              </p>
              <IndiaMapSVG
                selected={selected}
                onSelect={(name) => setSelected(selected === name ? '' : name)}
              />
            </div>

            {/* RIGHT â€” State list + confirm */}
            <div className="flex flex-col px-4 sm:px-5 py-4">
              <p className="text-white/35 text-[11px] uppercase tracking-widest font-semibold mb-3">
                Or select from list
              </p>

              <div className="flex-1 overflow-y-auto rounded-2xl"
                style={{ maxHeight: '420px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)' }}>
                {INDIA_STATES_SORTED.map((state) => {
                  const isActive = selected === state.name;
                  return (
                    <button
                      key={state.id}
                      onClick={() => setSelected(isActive ? '' : state.name)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isActive ? 'rgba(212,175,55,0.12)' : 'transparent',
                        color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.7)',
                      }}
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: isActive
                            ? '#D4AF37'
                            : state.region === 'south' ? '#4CAF50'
                            : state.region === 'north' ? '#2196F3'
                            : state.region === 'east' ? '#9C27B0'
                            : state.region === 'west' ? '#FF9800'
                            : state.region === 'northeast' ? '#00BCD4'
                            : '#FFD600',
                        }} />
                      <span className="font-medium flex-1 truncate">{state.name}</span>
                      {isActive && <span className="text-gold-400 text-sm shrink-0">âœ“</span>}
                    </button>
                  );
                })}
              </div>

              {selected && (
                <div className="mt-3 px-3 py-2 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                  <MapPin size={13} className="text-gold-400 shrink-0" />
                  <span className="text-gold-300 text-xs font-bold truncate">{selected}</span>
                  <button onClick={() => setSelected('')}
                    className="ml-auto text-white/30 hover:text-white/70 text-xs transition-colors shrink-0">âœ•</button>
                </div>
              )}

              <button
                onClick={() => selected ? handleStateConfirm(selected) : finish('All India', '')}
                className="mt-3 w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: selected
                    ? 'linear-gradient(135deg, #D4AF37, #B48C22)'
                    : 'rgba(255,255,255,0.06)',
                  color: selected ? '#071527' : 'rgba(255,255,255,0.4)',
                  boxShadow: selected ? '0 4px 16px rgba(212,175,55,0.4)' : undefined,
                  cursor: 'pointer',
                }}
              >
                {selected ? (
                  <><MapPin size={14} /> Select district in {selected} <ArrowRight size={14} /></>
                ) : (
                  <>Browse All India â†’</>
                )}
              </button>

              <button
                onClick={() => finish('All India', '')}
                className="mt-2 text-center w-full text-white/25 text-xs hover:text-white/50 transition-colors py-1"
              >
                Skip â€” show all states
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
