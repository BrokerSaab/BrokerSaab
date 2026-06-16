'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, ImagePlus, Loader2, CheckCircle2, User, FileText, Upload, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function imgSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return url.startsWith('/uploads') ? url : `/uploads${url}`;
}

export default function AdvisorProfileImagesPage() {
  const { isLoggedIn, authReady, user } = useAuth();
  const router = useRouter();

  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);
  const [coverUrl,     setCoverUrl]     = useState<string | null>(null);
  const [fullName,     setFullName]     = useState('');

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview,  setCoverPreview]  = useState<string | null>(null);
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null);
  const [coverFile,    setCoverFile]    = useState<File | null>(null);

  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingCover,  setSavingCover]  = useState(false);
  const [avatarDone,   setAvatarDone]   = useState(false);
  const [coverDone,    setCoverDone]    = useState(false);
  const [error,        setError]        = useState('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef  = useRef<HTMLInputElement>(null);

  const token = () => localStorage.getItem('accessToken') || '';

  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) { router.push('/auth'); return; }
    if (user?.role !== 'ADVISOR') { router.push('/'); return; }
    fetch(`${API}/advisors/me/images`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAvatarUrl(d.avatarUrl ?? null);
          setCoverUrl(d.coverImageUrl ?? null);
          setFullName(d.fullName ?? '');
        }
      })
      .catch(() => {});
  }, [authReady, isLoggedIn]);

  const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarDone(false);
    setError('');
  };

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setCoverDone(false);
    setError('');
  };

  const saveAvatar = async () => {
    if (!avatarFile) return;
    setSavingAvatar(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', avatarFile);
      const r = await fetch(`${API}/advisors/upload/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd });
      const d = await r.json();
      if (d.success) { setAvatarUrl(d.avatarUrl); setAvatarFile(null); setAvatarDone(true); setTimeout(() => setAvatarDone(false), 3000); }
      else setError(d.message || 'Upload failed');
    } catch { setError('Upload failed. Please try again.'); }
    finally { setSavingAvatar(false); }
  };

  const saveCover = async () => {
    if (!coverFile) return;
    setSavingCover(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', coverFile);
      const r = await fetch(`${API}/advisors/upload/cover`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd });
      const d = await r.json();
      if (d.success) { setCoverUrl(d.coverImageUrl); setCoverFile(null); setCoverDone(true); setTimeout(() => setCoverDone(false), 3000); }
      else setError(d.message || 'Upload failed');
    } catch { setError('Upload failed. Please try again.'); }
    finally { setSavingCover(false); }
  };

  const displayAvatar = avatarPreview ?? imgSrc(avatarUrl);
  const displayCover  = coverPreview  ?? imgSrc(coverUrl);

  // ── KYC document upload state ─────────────────────────────────────
  const KYC_DOCS = [
    { type: 'AADHAAR_CARD',     label: 'Aadhaar Card',      hint: 'Front & back scan · PDF or image',    needsNum: true  },
    { type: 'PASSPORT_PHOTO',   label: 'Passport Photo',    hint: 'Clear face photo on plain background', needsNum: false },
    { type: 'LICENSE_COPY',     label: 'License / Certificate', hint: 'Professional licence or degree',  needsNum: false },
    { type: 'GST_CERTIFICATE',  label: 'GST Certificate',   hint: 'Optional — for GST-registered advisors', needsNum: false },
  ] as const;

  const [kycFiles,    setKycFiles]    = useState<Record<string, File | null>>({});
  const [kycNums,     setKycNums]     = useState<Record<string, string>>({});
  const [kycLoading,  setKycLoading]  = useState<Record<string, boolean>>({});
  const [kycDone,     setKycDone]     = useState<Record<string, boolean>>({});
  const [kycError,    setKycError]    = useState<Record<string, string>>({});
  const kycRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadKycDoc = async (docType: string) => {
    const file = kycFiles[docType];
    if (!file) return;
    setKycLoading(p => ({ ...p, [docType]: true }));
    setKycError(p => ({ ...p, [docType]: '' }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', docType);
      if (docType === 'AADHAAR_CARD' && kycNums[docType]) fd.append('aadhaarNumber', kycNums[docType].replace(/\D/g,''));
      const r = await fetch(`${API}/advisors/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const d = await r.json();
      if (d.success) {
        setKycDone(p => ({ ...p, [docType]: true }));
        setKycFiles(p => ({ ...p, [docType]: null }));
        setTimeout(() => setKycDone(p => ({ ...p, [docType]: false })), 4000);
      } else {
        setKycError(p => ({ ...p, [docType]: d.message || 'Upload failed' }));
      }
    } catch {
      setKycError(p => ({ ...p, [docType]: 'Network error. Please try again.' }));
    }
    setKycLoading(p => ({ ...p, [docType]: false }));
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle,#D4AF37,transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">

        {/* Back */}
        <Link href="/advisor/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-[#D4AF37] text-xs mb-6 transition-colors">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        <h1 className="text-xl font-black text-white mb-1">Edit Profile Images</h1>
        <p className="text-white/40 text-sm mb-7">Upload a profile photo and a cover banner visible on your public advisor page.</p>

        {error && (
          <div className="mb-5 flex items-start gap-2 bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
            <span className="mt-0.5 shrink-0">⚠</span><span>{error}</span>
          </div>
        )}

        {/* ── COVER IMAGE ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden mb-5 shadow-2xl" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>

          {/* Cover preview */}
          <div
            className="relative w-full h-44 group cursor-pointer"
            style={{ background: displayCover ? undefined : 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}
            onClick={() => coverInputRef.current?.click()}
          >
            {displayCover && (
              <img src={displayCover} alt="Cover" className="w-full h-full object-cover" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 group-hover:bg-black/40 transition-all">
              {!displayCover && (
                <div className="flex flex-col items-center gap-2 text-white/50">
                  <ImagePlus size={32} />
                  <p className="text-sm font-semibold">Click to add cover photo</p>
                  <p className="text-xs opacity-60">Recommended: 1200 × 400 px · JPG / PNG · Max 5 MB</p>
                </div>
              )}
              {displayCover && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                  <Camera size={28} className="text-white drop-shadow" />
                  <span className="text-white text-xs font-bold drop-shadow">Change Cover Photo</span>
                </div>
              )}
            </div>
            {/* "COVER PHOTO" label */}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ background: 'rgba(0,0,0,0.55)', color: '#D4AF37' }}>
              Cover Photo
            </div>
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverPick} />
          </div>

          {/* Profile avatar overlapping */}
          <div className="relative px-5 pb-5">
            <div className="absolute -top-10 left-5">
              <div
                className="relative group cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                {displayAvatar ? (
                  <img src={displayAvatar} alt={fullName} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-black text-white border-4 border-white shadow-xl">
                    {initials || <User size={28} />}
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                  <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                  <Camera size={11} className="text-[#0B1F3A]" />
                </div>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarPick} />
              </div>
            </div>

            {/* Name + hint */}
            <div className="ml-24 pt-2 pb-1 min-h-[3rem] flex items-center">
              <div>
                <p className="font-black text-gray-900 text-base">{fullName || 'Your Name'}</p>
                <p className="text-gray-400 text-xs">Click your photo or cover above to change</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Avatar save */}
          <div className="bg-white rounded-2xl p-4 shadow-lg" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}>
                <Camera size={15} className="text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800">Profile Photo</p>
                <p className="text-[10px] text-gray-400">Square image · Shown as your avatar</p>
              </div>
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="w-full py-2 rounded-xl text-xs font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#D4AF37]/50 hover:text-[#B48C22] transition-all mb-2"
            >
              {avatarFile ? `✓ ${avatarFile.name.slice(0, 22)}…` : 'Choose Photo'}
            </button>
            {avatarFile && (
              <button
                onClick={saveAvatar}
                disabled={savingAvatar}
                className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}
              >
                {savingAvatar ? <><Loader2 size={13} className="animate-spin" /> Uploading…</> : avatarDone ? <><CheckCircle2 size={13} /> Saved!</> : 'Save Profile Photo'}
              </button>
            )}
            {avatarDone && !avatarFile && (
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-bold py-1">
                <CheckCircle2 size={13} /> Profile photo updated!
              </div>
            )}
          </div>

          {/* Cover save */}
          <div className="bg-white rounded-2xl p-4 shadow-lg" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(79,70,229,0.1)' }}>
                <ImagePlus size={15} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800">Cover Banner</p>
                <p className="text-[10px] text-gray-400">Wide image · Banner behind your profile</p>
              </div>
            </div>
            <button
              onClick={() => coverInputRef.current?.click()}
              className="w-full py-2 rounded-xl text-xs font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-all mb-2"
            >
              {coverFile ? `✓ ${coverFile.name.slice(0, 22)}…` : 'Choose Cover Image'}
            </button>
            {coverFile && (
              <button
                onClick={saveCover}
                disabled={savingCover}
                className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', color: '#D4AF37' }}
              >
                {savingCover ? <><Loader2 size={13} className="animate-spin" /> Uploading…</> : coverDone ? <><CheckCircle2 size={13} /> Saved!</> : 'Save Cover Image'}
              </button>
            )}
            {coverDone && !coverFile && (
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-bold py-1">
                <CheckCircle2 size={13} /> Cover image updated!
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-5 rounded-2xl p-4 space-y-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">Image Tips</p>
          {[
            'Profile photo: Use a clear face photo on a plain background. Square format works best.',
            'Cover banner: Use a professional scene, your office, or a branded image. 1200×400 px recommended.',
            'Accepted formats: JPG, PNG, WebP · Max file size: 5 MB each.',
            'Images appear on your public advisor profile immediately after upload.',
          ].map(tip => (
            <div key={tip} className="flex items-start gap-2 text-white/40 text-xs">
              <span className="text-[#D4AF37]/60 shrink-0 mt-0.5">•</span>
              <span className="leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>

        {/* ── KYC DOCUMENTS ───────────────────────────────────── */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <ShieldCheck size={15} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">KYC Documents</h2>
              <p className="text-white/40 text-xs">Upload verification documents visible to the admin review team.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {KYC_DOCS.map(({ type, label, hint, needsNum }) => {
              const file    = kycFiles[type];
              const loading = kycLoading[type];
              const done    = kycDone[type];
              const err     = kycError[type];
              return (
                <div key={type} className="bg-white rounded-2xl p-4 shadow-lg" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(11,31,58,0.08)' }}>
                      <FileText size={14} className="text-[#0B1F3A]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800">{label}</p>
                      <p className="text-[10px] text-gray-400">{hint}</p>
                    </div>
                  </div>

                  {/* Aadhaar number field */}
                  {needsNum && (
                    <input
                      type="text"
                      maxLength={14}
                      placeholder="Aadhaar number (12 digits)"
                      value={kycNums[type] || ''}
                      onChange={e => setKycNums(p => ({ ...p, [type]: e.target.value.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 ') }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none mb-2 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all placeholder:text-gray-300 font-mono tracking-widest"
                    />
                  )}

                  {/* File picker */}
                  <button
                    onClick={() => kycRefs.current[type]?.click()}
                    className="w-full py-2 rounded-xl text-xs font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#D4AF37]/50 hover:text-[#B48C22] transition-all mb-2"
                  >
                    {file ? `✓ ${file.name.slice(0, 24)}…` : 'Choose File'}
                  </button>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    ref={el => { kycRefs.current[type] = el; }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setKycFiles(p => ({ ...p, [type]: f }));
                      setKycError(p => ({ ...p, [type]: '' }));
                    }}
                  />

                  {err && <p className="text-[10px] text-red-500 mb-2">⚠ {err}</p>}

                  {file && (
                    <button
                      onClick={() => uploadKycDoc(type)}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}
                    >
                      {loading ? <><Loader2 size={12} className="animate-spin" /> Uploading…</> : <><Upload size={12} /> Upload Document</>}
                    </button>
                  )}

                  {done && !file && (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-bold py-1">
                      <CheckCircle2 size={12} /> Uploaded successfully!
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] text-white/40 leading-relaxed">
              <strong className="text-[#D4AF37]/70">Note:</strong> Uploaded documents are reviewed by the BrokerSaab team. Accepted formats: JPG, PNG, WebP, PDF · Max 5 MB each. Only Aadhaar Card and Passport Photo are mandatory for Regular advisors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
