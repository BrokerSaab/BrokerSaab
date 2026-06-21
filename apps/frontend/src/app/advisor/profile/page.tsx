'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Camera, ImagePlus, Loader2, CheckCircle2, User, FileText,
  Upload, ShieldCheck, Edit3, Save, X, Clock, CheckCircle, XCircle, Lock,
  AlertCircle, Phone, CreditCard, BadgeCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

function imgSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return url.startsWith('/uploads') ? url : `/uploads${url}`;
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

const LANGUAGE_OPTIONS = ['Hindi','English','Tamil','Telugu','Kannada','Malayalam','Marathi',
  'Bengali','Gujarati','Punjabi','Odia','Assamese','Urdu'];

type ChangeRequest = {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  PENDING:  { bg: 'bg-amber-50 border-amber-200',  text: 'text-amber-700',  label: 'Pending review', icon: Clock },
  APPROVED: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Approved',       icon: CheckCircle },
  REJECTED: { bg: 'bg-red-50 border-red-200',      text: 'text-red-700',    label: 'Rejected',        icon: XCircle },
};

const FIELD_LABELS: Record<string, string> = {
  phoneNumber:   'Mobile Number',
  aadhaarNumber: 'Aadhaar Number',
  licenseNumber: 'License Number',
  fullName:      'Full Name',
};

const KYC_DOCS = [
  { type: 'AADHAAR_CARD',    label: 'Aadhaar Card',           hint: 'Front & back scan Â· PDF or image',        needsNum: true  },
  { type: 'PASSPORT_PHOTO',  label: 'Passport Photo',         hint: 'Clear face photo on plain background',    needsNum: false },
  { type: 'LICENSE_COPY',    label: 'License / Certificate',  hint: 'Professional licence or degree',          needsNum: false },
  { type: 'GST_CERTIFICATE', label: 'GST Certificate',        hint: 'Optional â€” for GST-registered advisors', needsNum: false },
] as const;

export default function AdvisorProfilePage() {
  const { isLoggedIn, authReady, user } = useAuth();
  const router = useRouter();
  const token = () => sessionStorage.getItem('accessToken') || '';

  // â”€â”€ Images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);
  const [coverUrl,     setCoverUrl]     = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview,  setCoverPreview]  = useState<string | null>(null);
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null);
  const [coverFile,    setCoverFile]    = useState<File | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingCover,  setSavingCover]  = useState(false);
  const [avatarDone,   setAvatarDone]   = useState(false);
  const [coverDone,    setCoverDone]    = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef  = useRef<HTMLInputElement>(null);

  // â”€â”€ Profile direct-edit form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving,  setProfileSaving]  = useState(false);
  const [profileDone,    setProfileDone]    = useState(false);
  const [fullName,     setFullName]     = useState('');
  const [bio,          setBio]          = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location,     setLocation]     = useState('');
  const [state,        setState]        = useState('');
  const [circle,       setCircle]       = useState('');
  const [subdivision,  setSubdivision]  = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [languages,    setLanguages]    = useState<string[]>([]);
  const [email,        setEmail]        = useState('');
  const [gstNumber,    setGstNumber]    = useState('');
  const [profileError, setProfileError] = useState('');

  // â”€â”€ Sensitive change requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [currentPhone,   setCurrentPhone]   = useState('');
  const [currentAadhaar, setCurrentAadhaar] = useState('');
  const [currentLicense, setCurrentLicense] = useState('');
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  // modal state for requesting a sensitive field change
  const [crModal, setCrModal]   = useState<{ field: string } | null>(null);
  const [crValue, setCrValue]   = useState('');
  const [crSubmitting, setCrSubmitting] = useState(false);
  const [crError, setCrError]   = useState('');
  const [crSuccess, setCrSuccess] = useState('');

  // â”€â”€ KYC docs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [kycFiles,   setKycFiles]   = useState<Record<string, File | null>>({});
  const [kycNums,    setKycNums]    = useState<Record<string, string>>({});
  const [kycLoading, setKycLoading] = useState<Record<string, boolean>>({});
  const [kycDone,    setKycDone]    = useState<Record<string, boolean>>({});
  const [kycError,   setKycError]   = useState<Record<string, string>>({});
  const kycRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!authReady) return;
    if (!isLoggedIn) { router.push('/auth'); return; }
    if (user?.role !== 'ADVISOR') { router.push('/'); return; }
    loadProfile();
    loadChangeRequests();
  }, [authReady, isLoggedIn]);

  const loadProfile = async () => {
    try {
      // images endpoint
      const img = await fetch(`${API}/advisors/me/images`, { headers: { Authorization: `Bearer ${token()}` } });
      const imgD = await img.json();
      if (imgD.success) {
        setAvatarUrl(imgD.avatarUrl ?? null);
        setCoverUrl(imgD.coverImageUrl ?? null);
        setFullName(imgD.fullName ?? '');
      }
      // full profile
      const me = await fetch(`${API}/advisors/me/full`, { headers: { Authorization: `Bearer ${token()}` } });
      const meD = await me.json();
      if (meD.success && meD.data) {
        const d = meD.data;
        setFullName(d.fullName ?? '');
        setBio(d.bio ?? '');
        setBusinessName(d.businessName ?? '');
        setLocation(d.location ?? '');
        setState(d.state ?? '');
        setCircle(d.circle ?? '');
        setSubdivision(d.subdivision ?? '');
        setExperienceYears(String(d.experienceYears ?? ''));
        setConsultationFee(String(d.consultationFee ?? ''));
        setLanguages(d.languages ?? []);
        setEmail(d.email ?? '');
        setGstNumber(d.gstNumber ?? '');
        setCurrentPhone(d.phoneNumber ?? '');
        setCurrentAadhaar(d.aadhaarLast4 ?? '');
        setCurrentLicense(d.licenseNumber ?? '');
      }
    } catch {}
  };

  const loadChangeRequests = async () => {
    try {
      const r = await fetch(`${API}/advisors/me/change-requests`, { headers: { Authorization: `Bearer ${token()}` } });
      const d = await r.json();
      if (d.success) setChangeRequests(d.data);
    } catch {}
  };

  const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // â”€â”€ Image handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveAvatar = async () => {
    if (!avatarFile) return;
    setSavingAvatar(true);
    try {
      const fd = new FormData(); fd.append('file', avatarFile);
      const r = await fetch(`${API}/advisors/upload/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd });
      const d = await r.json();
      if (d.success) { setAvatarUrl(d.avatarUrl); setAvatarFile(null); setAvatarDone(true); setTimeout(() => setAvatarDone(false), 3000); }
    } catch {}
    setSavingAvatar(false);
  };

  const saveCover = async () => {
    if (!coverFile) return;
    setSavingCover(true);
    try {
      const fd = new FormData(); fd.append('file', coverFile);
      const r = await fetch(`${API}/advisors/upload/cover`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd });
      const d = await r.json();
      if (d.success) { setCoverUrl(d.coverImageUrl); setCoverFile(null); setCoverDone(true); setTimeout(() => setCoverDone(false), 3000); }
    } catch {}
    setSavingCover(false);
  };

  // â”€â”€ Profile direct-edit save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const saveProfile = async () => {
    setProfileSaving(true); setProfileError('');
    try {
      const body: Record<string, any> = {
        bio, businessName, location, state, circle, subdivision,
        gstNumber,
        experienceYears: parseInt(experienceYears) || 0,
        consultationFee: parseFloat(consultationFee) || 0,
        languages,
      };
      if (email.trim()) body.email = email.trim();

      const r = await fetch(`${API}/advisors/me/profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) {
        setProfileEditing(false);
        setProfileDone(true);
        setTimeout(() => setProfileDone(false), 3000);
      } else {
        setProfileError(d.message || 'Failed to save');
      }
    } catch {
      setProfileError('Network error. Please try again.');
    }
    setProfileSaving(false);
  };

  // â”€â”€ Change request submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pendingFor = (field: string) => changeRequests.find(r => r.fieldName === field && r.status === 'PENDING');

  const submitChangeRequest = async () => {
    setCrSubmitting(true); setCrError(''); setCrSuccess('');
    try {
      const r = await fetch(`${API}/advisors/me/change-requests`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldName: crModal!.field, newValue: crValue.trim() }),
      });
      const d = await r.json();
      if (d.success) {
        setCrSuccess('Request submitted. Admin will review it shortly.');
        setCrValue('');
        loadChangeRequests();
        setTimeout(() => { setCrModal(null); setCrSuccess(''); }, 2000);
      } else {
        setCrError(d.message || 'Failed to submit');
      }
    } catch {
      setCrError('Network error. Please try again.');
    }
    setCrSubmitting(false);
  };

  // â”€â”€ KYC upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      const r = await fetch(`${API}/advisors/documents`, { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd });
      const d = await r.json();
      if (d.success) {
        setKycDone(p => ({ ...p, [docType]: true }));
        setKycFiles(p => ({ ...p, [docType]: null }));
        setTimeout(() => setKycDone(p => ({ ...p, [docType]: false })), 4000);
      } else {
        setKycError(p => ({ ...p, [docType]: d.message || 'Upload failed' }));
      }
    } catch {
      setKycError(p => ({ ...p, [docType]: 'Network error.' }));
    }
    setKycLoading(p => ({ ...p, [docType]: false }));
  };

  const displayAvatar = avatarPreview ?? imgSrc(avatarUrl);
  const displayCover  = coverPreview  ?? imgSrc(coverUrl);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-[0.08]" style={{ background: 'radial-gradient(circle,#D4AF37,transparent 70%)' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Back */}
        <Link href="/advisor/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-[#D4AF37] text-xs transition-colors">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-xl font-black text-white mb-0.5">Edit Profile</h1>
          <p className="text-white/40 text-sm">Update your profile details. Changes to mobile, Aadhaar, license and name require admin approval.</p>
        </div>

        {/* â”€â”€ COVER + AVATAR CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="relative w-full h-44 group cursor-pointer" style={{ background: displayCover ? undefined : 'linear-gradient(135deg,#0B1F3A,#1a1040)' }} onClick={() => coverRef.current?.click()}>
            {displayCover && <img src={displayCover} alt="Cover" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 group-hover:bg-black/40 transition-all">
              {!displayCover && <div className="flex flex-col items-center gap-2 text-white/50"><ImagePlus size={32} /><p className="text-sm font-semibold">Click to add cover photo</p></div>}
              {displayCover && <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1"><Camera size={28} className="text-white drop-shadow" /><span className="text-white text-xs font-bold drop-shadow">Change Cover</span></div>}
            </div>
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ background: 'rgba(0,0,0,0.55)', color: '#D4AF37' }}>Cover Photo</div>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} />
          </div>

          <div className="relative px-5 pb-5">
            <div className="absolute -top-10 left-5">
              <div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
                {displayAvatar
                  ? <img src={displayAvatar} alt={fullName} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-xl" />
                  : <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-black text-white border-4 border-white shadow-xl">{initials || <User size={28} />}</div>
                }
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                  <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 drop-shadow" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                  <Camera size={11} className="text-[#0B1F3A]" />
                </div>
                <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
              </div>
            </div>
            <div className="ml-24 pt-2 pb-1 min-h-[3rem] flex items-center">
              <div>
                <p className="font-black text-gray-900 text-base">{fullName || 'Your Name'}</p>
                <p className="text-gray-400 text-xs">Click your photo or cover to change</p>
              </div>
            </div>
          </div>
        </div>

        {/* Image save buttons */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Profile Photo', hint: 'Square image', file: avatarFile, done: avatarDone, saving: savingAvatar, onClick: () => avatarRef.current?.click(), onSave: saveAvatar, accent: '#D4AF37', Icon: Camera },
            { label: 'Cover Banner',  hint: 'Wide image',   file: coverFile,  done: coverDone,  saving: savingCover,  onClick: () => coverRef.current?.click(),  onSave: saveCover,  accent: '#6366F1', Icon: ImagePlus },
          ].map(({ label, hint, file, done, saving, onClick, onSave, accent, Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-lg" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
                  <Icon size={15} style={{ color: accent }} />
                </div>
                <div><p className="text-sm font-black text-gray-800">{label}</p><p className="text-[10px] text-gray-400">{hint}</p></div>
              </div>
              <button onClick={onClick} className="w-full py-2 rounded-xl text-xs font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-all mb-2">
                {file ? `âœ“ ${file.name.slice(0,22)}â€¦` : 'Choose Image'}
              </button>
              {file && (
                <button onClick={onSave} disabled={saving} className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50" style={{ background: `linear-gradient(135deg,${accent},${accent}bb)`, color: '#0B1F3A' }}>
                  {saving ? <><Loader2 size={13} className="animate-spin" />Uploadingâ€¦</> : <><Upload size={12} />Save</>}
                </button>
              )}
              {done && !file && <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-bold py-1"><CheckCircle2 size={13} /> Saved!</div>}
            </div>
          ))}
        </div>

        {/* â”€â”€ DIRECT EDIT PROFILE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.12)' }}>
                <Edit3 size={14} className="text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800">Profile Details</p>
                <p className="text-[10px] text-gray-400">Bio, location, fee, languages â€” saved immediately</p>
              </div>
            </div>
            {!profileEditing
              ? <button onClick={() => setProfileEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all">
                  <Edit3 size={12} /> Edit
                </button>
              : <button onClick={() => { setProfileEditing(false); setProfileError(''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all">
                  <X size={12} /> Cancel
                </button>
            }
          </div>

          <div className="px-5 py-4 space-y-4">
            {profileError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />{profileError}
              </div>
            )}
            {profileDone && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 size={13} /> Profile updated successfully!
              </div>
            )}

            {/* Row: business name + experience */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Business Name</label>
                <input disabled={!profileEditing} value={businessName} onChange={e => setBusinessName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300"
                  placeholder="Your business / firm name" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Experience (Years)</label>
                <input disabled={!profileEditing} type="number" min="0" value={experienceYears} onChange={e => setExperienceYears(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="0" />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bio / Description</label>
              <textarea disabled={!profileEditing} value={bio} onChange={e => setBio(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400 resize-none placeholder:text-gray-300"
                placeholder="Describe your expertise and servicesâ€¦" />
            </div>

            {/* Location + State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">City / Location</label>
                <input disabled={!profileEditing} value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300"
                  placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">State</label>
                {profileEditing
                  ? <select value={state} onChange={e => setState(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  : <input disabled value={state} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-400 bg-gray-50 outline-none" />
                }
              </div>
            </div>

            {/* Circle + Subdivision */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Circle / Block</label>
                <input disabled={!profileEditing} value={circle} onChange={e => setCircle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300"
                  placeholder="Administrative circle" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Subdivision</label>
                <input disabled={!profileEditing} value={subdivision} onChange={e => setSubdivision(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300"
                  placeholder="Revenue subdivision" />
              </div>
            </div>

            {/* Fee + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Consultation Fee (â‚¹)</label>
                <input disabled={!profileEditing} type="number" min="0" value={consultationFee} onChange={e => setConsultationFee(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Email <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
                <input disabled={!profileEditing} type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300"
                  placeholder="you@example.com" />
              </div>
            </div>

            {/* GST */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">GST Number <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
              <input disabled={!profileEditing} value={gstNumber} onChange={e => setGstNumber(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300 font-mono"
                placeholder="22AAAAA0000A1Z5" />
            </div>

            {/* Languages */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(lang => {
                  const selected = languages.includes(lang);
                  return (
                    <button key={lang} type="button"
                      disabled={!profileEditing}
                      onClick={() => setLanguages(prev => selected ? prev.filter(l => l !== lang) : [...prev, lang])}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-300'} disabled:cursor-not-allowed`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {profileEditing && (
              <button onClick={saveProfile} disabled={profileSaving}
                className="w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                {profileSaving ? <><Loader2 size={15} className="animate-spin" />Savingâ€¦</> : <><Save size={15} />Save Profile Changes</>}
              </button>
            )}
          </div>
        </div>

        {/* â”€â”€ SENSITIVE FIELDS (Change Requests) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <Lock size={14} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-800">Sensitive Fields</p>
              <p className="text-[10px] text-gray-400">Changes require admin verification â€” reviewed within 24 hours</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            {([
              { field: 'fullName',      label: 'Full Name',      current: fullName,        hint: 'Must match Aadhaar card exactly',  Icon: User },
              { field: 'phoneNumber',   label: 'Mobile Number',  current: currentPhone,    hint: '10-digit Indian number',           Icon: Phone },
              { field: 'aadhaarNumber', label: 'Aadhaar Number', current: currentAadhaar ? `****${currentAadhaar.slice(-4)}` : 'â€”', hint: '12-digit Aadhaar', Icon: CreditCard },
              { field: 'licenseNumber', label: 'License Number', current: currentLicense || 'â€”', hint: 'Professional licence / degree No.', Icon: BadgeCheck },
            ] as const).map(({ field, label, current, hint, Icon }) => {
              const pending = pendingFor(field);
              const history = changeRequests.filter(r => r.fieldName === field && r.status !== 'PENDING').slice(0, 1)[0];
              return (
                <div key={field} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(11,31,58,0.08)' }}>
                      <Icon size={14} className="text-[#0B1F3A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-700">{label}</p>
                      <p className="text-sm text-gray-800 font-mono truncate">{current}</p>
                      {pending && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <Clock size={10} className="text-amber-500 shrink-0" />
                          <span className="text-[10px] text-amber-600 font-semibold">Pending: {field === 'aadhaarNumber' ? '[new Aadhaar submitted]' : pending.newValue}</span>
                        </div>
                      )}
                      {history && !pending && (
                        <div className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${STATUS_STYLES[history.status].text} ${STATUS_STYLES[history.status].bg} border`}>
                          <span>{STATUS_STYLES[history.status].label}</span>
                          {history.reviewNote && <span>Â· {history.reviewNote}</span>}
                        </div>
                      )}
                      <p className="text-[9px] text-gray-400 mt-0.5">{hint}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setCrModal({ field }); setCrValue(''); setCrError(''); setCrSuccess(''); }}
                    disabled={!!pending}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                  >
                    {pending ? <><Clock size={10} />Pending</> : <><Edit3 size={10} />Request Change</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* â”€â”€ CHANGE REQUEST HISTORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {changeRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ border: '1px solid rgba(212,175,55,0.15)' }}>
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-black text-gray-800">Change Request History</p>
            </div>
            <div className="divide-y divide-gray-50">
              {changeRequests.map(cr => {
                const style = STATUS_STYLES[cr.status];
                const StatusIcon = style.icon;
                return (
                  <div key={cr.id} className="px-5 py-3 flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${style.bg} border`}>
                      <StatusIcon size={11} className={style.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-gray-700">{FIELD_LABELS[cr.fieldName] || cr.fieldName}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${style.bg} ${style.text}`}>{style.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {cr.fieldName === 'aadhaarNumber' ? 'New Aadhaar submitted' : `Requested: ${cr.newValue}`}
                      </p>
                      {cr.reviewNote && <p className="text-[10px] text-red-500 mt-0.5">Admin note: {cr.reviewNote}</p>}
                      <p className="text-[9px] text-gray-400 mt-0.5">{new Date(cr.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* â”€â”€ KYC DOCUMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <ShieldCheck size={15} className="text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">KYC Documents</h2>
              <p className="text-white/40 text-xs">Upload verification documents for the admin review team.</p>
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
                    <div><p className="text-sm font-black text-gray-800">{label}</p><p className="text-[10px] text-gray-400">{hint}</p></div>
                  </div>
                  {needsNum && (
                    <input type="text" maxLength={14} placeholder="Aadhaar number (12 digits)"
                      value={kycNums[type] || ''}
                      onChange={e => setKycNums(p => ({ ...p, [type]: e.target.value.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 ') }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none mb-2 focus:border-[#D4AF37] transition-all placeholder:text-gray-300 font-mono tracking-widest" />
                  )}
                  <button onClick={() => kycRefs.current[type]?.click()}
                    className="w-full py-2 rounded-xl text-xs font-semibold border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#D4AF37]/50 hover:text-[#B48C22] transition-all mb-2">
                    {file ? `âœ“ ${file.name.slice(0, 24)}â€¦` : 'Choose File'}
                  </button>
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
                    ref={el => { kycRefs.current[type] = el; }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) setKycFiles(p => ({ ...p, [type]: f })); setKycError(p => ({ ...p, [type]: '' })); }} />
                  {err && <p className="text-[10px] text-red-500 mb-2">âš  {err}</p>}
                  {file && (
                    <button onClick={() => uploadKycDoc(type)} disabled={loading}
                      className="w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                      {loading ? <><Loader2 size={12} className="animate-spin" />Uploadingâ€¦</> : <><Upload size={12} />Upload Document</>}
                    </button>
                  )}
                  {done && !file && <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-xs font-bold py-1"><CheckCircle2 size={12} /> Uploaded!</div>}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* â”€â”€ CHANGE REQUEST MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {crModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="font-black text-gray-800 text-sm">Request Change: {FIELD_LABELS[crModal.field]}</p>
              <button onClick={() => setCrModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
                <p className="font-bold mb-0.5">Admin approval required</p>
                <p>This change will be reviewed by our team. You may be contacted for verification.</p>
              </div>

              {crModal.field === 'aadhaarNumber' ? (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">New Aadhaar Number</label>
                  <input type="text" maxLength={14} placeholder="12-digit Aadhaar number"
                    value={crValue}
                    onChange={e => setCrValue(e.target.value.replace(/\D/g,'').replace(/(\d{4})(?=\d)/g,'$1 '))}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 transition-all font-mono tracking-widest placeholder:text-gray-300" />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">New {FIELD_LABELS[crModal.field]}</label>
                  <input type={crModal.field === 'phoneNumber' ? 'tel' : 'text'}
                    placeholder={crModal.field === 'phoneNumber' ? '10-digit mobile number' : `New ${FIELD_LABELS[crModal.field]}`}
                    value={crValue} onChange={e => setCrValue(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-400 transition-all placeholder:text-gray-300" />
                </div>
              )}

              {crError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{crError}</p>}
              {crSuccess && <p className="text-xs text-emerald-600 flex items-center gap-1 font-semibold"><CheckCircle2 size={11} />{crSuccess}</p>}

              <div className="flex gap-3">
                <button onClick={() => setCrModal(null)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={submitChangeRequest} disabled={!crValue.trim() || crSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-[#0B1F3A] flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                  {crSubmitting ? <><Loader2 size={13} className="animate-spin" />Submittingâ€¦</> : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
