'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus, CheckCircle2, Star, ArrowRight, AlertCircle, Loader2,
  Phone, Mail, Lock, Eye, EyeOff, User, Briefcase, FileCheck, Award,
  MapPin, Coins, FileText, Trash2, Plus, ShieldCheck, Check,
  Home, Shield, Scale, Percent, Landmark, CreditCard, Search, X,
  FileHeart, UserCheck, Lightbulb, Car, Users, GraduationCap,
  HeartHandshake, TrendingUp, Globe, Zap, Sprout, Laptop,
  ChevronDown, ChevronRight, Sparkles, ArrowLeft, Printer, Download, Clock
} from 'lucide-react';

import { MODULES_DATA, MODULE_COLORS, ICON_MAP } from '@/data/servicesData';
import { INDIA_STATES_SORTED } from '@/data/indiaStates';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────────
type Step = 'welcome' | 'phone_otp' | 'advisor_type' | 'account' | 'profile' | 'kyc' | 'services' | 'availability' | 'review' | 'payment' | 'success';

interface Slot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface FormData {
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  businessName: string;
  licenseNumber: string;
  experienceYears: string;
  location: string;
  state: string;
  city: string;
  consultationFee: string;
  languages: string[];
  bio: string;
  selectedSlugs: string[];
  selectedSubSlugs: string[];
  slots: Slot[];
  // New fields
  advisorType: 'REGULAR' | 'AUTHORIZED' | '';
  otpVerified: boolean;
  tempPhoneToken: string;
  aadhaarNumber: string;
  aadhaarConsentGiven: boolean;
  aadhaarFile: File | null;
  passportPhotoFile: File | null;
  licenseFile: File | null;
  gstNumber: string;
  gstCertFile: File | null;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const STEP_ORDER: Step[] = ['welcome', 'phone_otp', 'advisor_type', 'account', 'profile', 'kyc', 'services', 'availability', 'review', 'payment', 'success'];
const PROGRESS_STEPS = ['Verify', 'Type', 'Account', 'Profile', 'KYC', 'Services', 'Availability', 'Review'];

// GST constants (display-only — backend computes the actual charge)
const BASE_PRICE   = 1999;
const ORIGINAL_PRICE = 19999;
const DISCOUNT_AMT = ORIGINAL_PRICE - BASE_PRICE;
const CGST_AMT     = Math.round(BASE_PRICE * 0.09 * 100) / 100;  // 179.91
const SGST_AMT     = Math.round(BASE_PRICE * 0.09 * 100) / 100;  // 179.91
const TOTAL_PAYABLE = BASE_PRICE + CGST_AMT + SGST_AMT;          // 2358.82

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ADVISOR_CATEGORIES = [
  { name: 'Birth, Death & Marriage Papers', slug: 'm1', icon: FileHeart, color: 'bg-rose-100', iconColor: 'text-rose-600', desc: 'Official civil registrations & personal certificates' },
  { name: 'Identity Cards & Documents', slug: 'm2', icon: UserCheck, color: 'bg-teal-100', iconColor: 'text-teal-600', desc: 'National identity cards (Aadhaar, PAN) & corrections' },
  { name: 'Income, Caste & Residence', slug: 'm3', icon: Award, color: 'bg-violet-100', iconColor: 'text-violet-600', desc: 'Revenue certificates, domicile & legal heirship' },
  { name: 'Property & Land Papers', slug: 'm4', icon: Home, color: 'bg-amber-100', iconColor: 'text-amber-600', desc: 'Sale deeds, registrations, mutation & title checks' },
  { name: 'Tax / GST Filing', slug: 'm5', icon: Percent, color: 'bg-emerald-100', iconColor: 'text-emerald-600', desc: 'GST registrations, returns & Income Tax filing (ITR)' },
  { name: 'Business Registration', slug: 'm6', icon: Briefcase, color: 'bg-blue-100', iconColor: 'text-blue-600', desc: 'Sole proprietorships, Pvt Ltd, NGOs & trade licences' },
  { name: 'Brand & IP Protection', slug: 'm7', icon: Lightbulb, color: 'bg-yellow-100', iconColor: 'text-yellow-600', desc: 'Trademark registration, copyright & patent search' },
  { name: 'Bank, Loan & Credit', slug: 'm8', icon: Landmark, color: 'bg-sky-100', iconColor: 'text-sky-600', desc: 'Home loans, business funding & credit card support' },
  { name: 'Insurance (Bima)', slug: 'm9', icon: ShieldCheck, color: 'bg-indigo-100', iconColor: 'text-indigo-600', desc: 'Life, health, vehicle insurance & claims help' },
  { name: 'Vehicle & RTO Work', slug: 'm10', icon: Car, color: 'bg-orange-100', iconColor: 'text-orange-600', desc: 'Driving licenses, ownership transfer & permits' },
  { name: 'Legal & Court Help', slug: 'm11', icon: Scale, color: 'bg-slate-100', iconColor: 'text-slate-600', desc: 'Notaries, legal notices, civil/criminal litigation & bail' },
  { name: 'Job, PF & Labour', slug: 'm12', icon: Users, color: 'bg-cyan-100', iconColor: 'text-cyan-600', desc: 'PF withdrawals, ESI & contractor labor registration' },
  { name: 'School & College Papers', slug: 'm13', icon: GraduationCap, color: 'bg-pink-100', iconColor: 'text-pink-600', desc: 'Migration certificates, transcripts & marksheet checks' },
  { name: 'Pension & Govt Schemes', slug: 'm14', icon: HeartHandshake, color: 'bg-rose-100', iconColor: 'text-rose-600', desc: 'Ayushman card, welfare schemes & PM-KISAN pension' },
  { name: 'Savings & Investment', slug: 'm15', icon: TrendingUp, color: 'bg-emerald-100', iconColor: 'text-emerald-600', desc: 'Mutual funds, wealth planning & portfolio advice' },
  { name: 'Passport, Visa & Foreign', slug: 'm16', icon: Globe, color: 'bg-blue-100', iconColor: 'text-blue-600', desc: 'Passport application assistance, student visas & stamps' },
  { name: 'Electricity, Water & Gas', slug: 'm17', icon: Zap, color: 'bg-yellow-100', iconColor: 'text-yellow-600', desc: 'New utility connections, load extensions & name changes' },
  { name: 'Farmer & Agriculture', slug: 'm18', icon: Sprout, color: 'bg-green-100', iconColor: 'text-green-600', desc: 'PM-KISAN entries, subsidies & agricultural certificates' },
  { name: 'Online Form & Doc Help', slug: 'm19', icon: Laptop, color: 'bg-purple-100', iconColor: 'text-purple-600', desc: 'Electronic form submissions, scans & document help' },
];

const INITIAL_FORM: FormData = {
  phoneNumber: '', email: '', password: '', confirmPassword: '',
  fullName: '', businessName: '', licenseNumber: '', experienceYears: '',
  location: '', state: '', city: '', consultationFee: '', languages: [], bio: '',
  selectedSlugs: [], selectedSubSlugs: [], slots: [],
  advisorType: '', otpVerified: false, tempPhoneToken: '',
  aadhaarNumber: '', aadhaarConsentGiven: false,
  aadhaarFile: null, passportPhotoFile: null, licenseFile: null,
  gstNumber: '', gstCertFile: null,
};

// ── Validation ─────────────────────────────────────────────────────────────────
function validate(step: Step, data: FormData, confirmed: boolean): string | null {
  if (step === 'phone_otp') {
    if (!data.otpVerified) return 'Please verify your mobile number with OTP first.';
  }
  if (step === 'advisor_type') {
    if (!data.advisorType) return 'Please select your advisor type to continue.';
  }
  if (step === 'account') {
    if (!/.+@.+\..+/.test(data.email)) return 'Enter a valid email address.';
    if (data.password.length < 6) return 'Password must be at least 6 characters.';
    if (data.password !== data.confirmPassword) return 'Passwords do not match.';
  }
  if (step === 'kyc') {
    if (!data.aadhaarFile) return 'Please upload your Aadhaar card.';
    if (!/^[2-9][0-9]{11}$/.test(data.aadhaarNumber.replace(/\D/g, ''))) return 'Enter a valid 12-digit Aadhaar number (must not start with 0 or 1).';
    if (!data.aadhaarConsentGiven) return 'You must consent to Aadhaar data processing to continue.';
    if (!data.passportPhotoFile) return 'Please upload your passport-size photo.';
    if (data.advisorType === 'AUTHORIZED') {
      if (!data.licenseFile) return 'License copy is mandatory for Authorized Advisors.';
      if (!data.licenseNumber.trim()) return 'License number is mandatory for Authorized Advisors.';
    }
  }
  if (step === 'profile') {
    if (!data.fullName.trim()) return 'Full name is required.';
    const exp = parseInt(data.experienceYears);
    if (isNaN(exp) || exp < 0) return 'Enter valid years of experience (0 or more).';
    if (!data.state) return 'Please select your state.';
    if (!data.city.trim()) return 'Please enter your city or area.';
    if (data.consultationFee && (isNaN(parseFloat(data.consultationFee)) || parseFloat(data.consultationFee) < 0)) return 'Enter a valid consultation fee.';
    if (data.languages.length === 0) return 'Add at least one language.';
    if (data.bio.trim().length < 50) return 'Bio must be at least 50 characters.';
  }
  if (step === 'services') {
    if (data.selectedSlugs.length === 0) return 'Select at least one service category.';
    if (data.selectedSubSlugs.length === 0) return 'Select at least one specific sub-service (specialisation).';
  }
  if (step === 'availability') {
    for (const s of data.slots) {
      if (s.startTime >= s.endTime) return `Slot on ${DAYS[s.dayOfWeek]}: end time must be after start time.`;
    }
  }
  if (step === 'review') {
    if (!confirmed) return 'Please confirm that the information is accurate.';
  }
  return null;
}

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

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdvisorOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tcAccepted, setTcAccepted] = useState(false);
  const [tcScrolled, setTcScrolled] = useState(false);
  const tcScrollRef = useRef<HTMLDivElement>(null);
  const handleTcScroll = () => {
    const el = tcScrollRef.current;
    if (el && !tcScrolled && el.scrollTop + el.clientHeight >= el.scrollHeight - 20) setTcScrolled(true);
  };
  const [confirmed, setConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [langInput, setLangInput] = useState('');
  const langInputRef = useRef<HTMLInputElement>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const subModulesRef = useRef<HTMLDivElement>(null);

  const update = (field: keyof FormData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  // Scroll to sub-modules smoothly when a module is selected/expanded
  useEffect(() => {
    if (expandedModule) {
      const timer = setTimeout(() => {
        subModulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [expandedModule]);

  const handleClose = () => {
    if (window.confirm("Are you sure you want to cancel the onboarding registration? Any unsaved progress will be lost.")) {
      router.push('/');
    }
  };

  // ── OTP sub-state ────────────────────────────────────────────────────────────
  const [otpSubStep, setOtpSubStep] = useState<'phone' | 'sent' | 'verified'>('phone');
  const [otpValue, setOtpValue] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  // ── KYC upload state ──────────────────────────────────────────────────────────
  const [kycUploading, setKycUploading] = useState(false);
  const [uploadedAdvisorId, setUploadedAdvisorId] = useState('');
  const [uploadedToken, setUploadedToken] = useState('');

  // ── Payment state ─────────────────────────────────────────────────────────────
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{
    invoiceNo: string; paymentId: string; orderId: string; paidAt: Date;
  } | null>(null);

  // ── Progress indicator step index ────────────────────────────────────────────
  const progressIndex = (() => {
    const map: Partial<Record<Step, number>> = {
      phone_otp: 1, advisor_type: 2, account: 3, profile: 4, kyc: 5, services: 6, availability: 7, review: 8
    };
    return map[step] ?? 0;
  })();

  // AUTHORIZED advisors must pay before submit; payment step is inserted between review → success
  const isAuthorized = formData.advisorType === 'AUTHORIZED';

  // ── Onboarding progress fire-and-forget ──────────────────────────────────────
  const trackProgress = (currentStep: Step) => {
    const idx = STEP_ORDER.indexOf(currentStep) + 1;
    const phone = formData.phoneNumber ? `+91${formData.phoneNumber}` : '';
    if (!phone) return;
    fetch(`${API}/advisors/onboarding-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phone,
        currentStep: idx,
        stepLabel: currentStep,
        formSnapshot: { advisorType: formData.advisorType, fullName: formData.fullName, email: formData.email, state: formData.state },
      }),
    }).catch(() => {});
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goNext = () => {
    const err = validate(step, formData, confirmed);
    if (err) { setError(err); return; }
    setError('');
    const idx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[idx + 1];
    if (next) { setStep(next); trackProgress(next); }
  };

  const goBack = () => {
    setError('');
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  // ── Language chip handling ───────────────────────────────────────────────────
  const addLanguage = () => {
    const lang = langInput.trim();
    if (lang && !formData.languages.includes(lang)) {
      update('languages', [...formData.languages, lang]);
    }
    setLangInput('');
    langInputRef.current?.focus();
  };

  const handleLangKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLanguage(); }
  };

  const removeLanguage = (lang: string) =>
    update('languages', formData.languages.filter(l => l !== lang));

  // ── Availability slot helpers ────────────────────────────────────────────────
  const toggleDay = (day: number) => {
    const hasDay = formData.slots.some(s => s.dayOfWeek === day);
    if (hasDay) {
      update('slots', formData.slots.filter(s => s.dayOfWeek !== day));
    } else {
      const newSlot: Slot = { id: `${day}-${Date.now()}`, dayOfWeek: day, startTime: '09:00', endTime: '17:00' };
      update('slots', [...formData.slots, newSlot]);
    }
  };

  const addSlot = (day: number) => {
    const newSlot: Slot = { id: `${day}-${Date.now()}`, dayOfWeek: day, startTime: '09:00', endTime: '17:00' };
    update('slots', [...formData.slots, newSlot]);
  };

  const updateSlot = (id: string, field: 'startTime' | 'endTime', value: string) =>
    update('slots', formData.slots.map(s => s.id === id ? { ...s, [field]: value } : s));

  const removeSlot = (id: string) =>
    update('slots', formData.slots.filter(s => s.id !== id));

  const activeDays = [...new Set(formData.slots.map(s => s.dayOfWeek))].sort();

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const err = validate('review', formData, confirmed);
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');

    const finalBio = formData.bio.trim() +
      (formData.selectedSlugs.length > 0
        ? `\n\nSpecialises in: ${ADVISOR_CATEGORIES.filter(c => formData.selectedSlugs.includes(c.slug)).map(c => c.name).join(', ')}`
        : '');

    try {
      // 1. Sign up
      const signupRes = await fetch(`${API}/auth/advisor/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: `+91${formData.phoneNumber}`,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          businessName: formData.businessName || undefined,
          experienceYears: parseInt(formData.experienceYears),
          licenseNumber: formData.licenseNumber || undefined,
          gstNumber: formData.gstNumber || undefined,
          advisorType: formData.advisorType || 'REGULAR',
          location: formData.location || `${formData.city}, ${formData.state}`,
          state: formData.state,
          consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : undefined,
          languages: formData.languages,
          bio: finalBio,
        }),
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok || !signupData.success) {
        setError(signupData.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      const accessToken: string = signupData.tokens.accessToken;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', signupData.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(signupData.user));
      setUploadedAdvisorId(signupData.user.advisorId || '');
      setUploadedToken(accessToken);

      // 2. Upload KYC documents
      const uploadDoc = async (file: File, docType: string, extra?: Record<string, string>) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('documentType', docType);
        if (extra) Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
        try {
          await fetch(`${API}/advisors/documents`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: fd,
          });
        } catch { /* non-fatal */ }
      };

      if (formData.aadhaarFile) await uploadDoc(formData.aadhaarFile, 'AADHAAR_CARD', { aadhaarNumber: formData.aadhaarNumber.replace(/\D/g, '') });
      if (formData.passportPhotoFile) await uploadDoc(formData.passportPhotoFile, 'PASSPORT_PHOTO');
      if (formData.licenseFile) await uploadDoc(formData.licenseFile, 'LICENSE_COPY');
      if (formData.gstCertFile) await uploadDoc(formData.gstCertFile, 'GST_CERTIFICATE');

      // 3. Set categories — fatal: without this advisors won't appear in search
      if (formData.selectedSlugs.length > 0) {
        const catRes = await fetch(`${API}/advisors/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ categorySlugs: formData.selectedSlugs }),
        });
        if (!catRes.ok) {
          const catData = await catRes.json().catch(() => ({}));
          console.error('[onboarding] Category save failed:', catData.message);
          // Non-blocking — log but continue so advisor is still registered
        }
      }

      // 2b. Set specialisations (sub-services)
      if (formData.selectedSubSlugs.length > 0) {
        try {
          const specsPayload = formData.selectedSubSlugs.map(subId => {
            for (const mod of MODULES_DATA) {
              const sub = mod.subModules.find(s => s.id === subId);
              if (sub) {
                return { slug: sub.id, name: sub.nameEn };
              }
            }
            return null;
          }).filter(Boolean);

          if (specsPayload.length > 0) {
            await fetch(`${API}/advisors/specializations`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
              body: JSON.stringify({ specializations: specsPayload }),
            });
          }
        } catch (err) {
          console.error('[onboarding] Failed to save specialisations:', err);
        }
      }

      // 3. Set availability
      if (formData.slots.length > 0) {
        try {
          await fetch(`${API}/advisors/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
              slots: formData.slots.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
            }),
          });
        } catch {
          // non-fatal
        }
      }

      setStep('success');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Print / PDF download ─────────────────────────────────────────────────────
  const printApplication = () => {
    const selectedCats = ADVISOR_CATEGORIES.filter(c => formData.selectedSlugs.includes(c.slug));
    const subNames: string[] = formData.selectedSubSlugs.map(subId => {
      for (const mod of MODULES_DATA) {
        const s = mod.subModules.find(x => x.id === subId);
        if (s) return s.nameEn;
      }
      return '';
    }).filter(Boolean);

    const availLines = DAYS.map((day, i) => {
      const slots = formData.slots.filter(s => s.dayOfWeek === i);
      if (!slots.length) return '';
      return `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;">${day}</td><td style="padding:6px 12px;color:#374151;">${slots.map(s => `${s.startTime} – ${s.endTime}`).join(', ')}</td></tr>`;
    }).filter(Boolean).join('');

    const printDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>BrokerSaab Advisor Application — ${formData.fullName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; padding: 32px; max-width: 800px; margin: 0 auto; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #D4AF37; padding-bottom:16px; margin-bottom:24px; }
  .logo { font-size:22px; font-weight:900; color:#0B1F3A; }
  .logo span { color:#D4AF37; }
  .badge { background:linear-gradient(135deg,#D4AF37,#B48C22); color:#0B1F3A; font-weight:800; font-size:11px; padding:4px 12px; border-radius:20px; }
  .section { margin-bottom:20px; border:2px solid #e5e7eb; border-radius:12px; overflow:hidden; }
  .section-header { padding:8px 16px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; }
  .section-body { padding:14px 16px; background:#fafafa; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px 24px; }
  .field label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#6b7280; display:block; margin-bottom:2px; }
  .field span { font-size:13px; font-weight:600; color:#111827; }
  .chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:8px; border:2px solid; font-size:11px; font-weight:700; margin:3px; }
  .spec-chip { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:6px; border:2px solid; font-size:11px; font-weight:600; margin:2px; }
  .avail-table { width:100%; border-collapse:collapse; }
  .avail-table td { font-size:12px; }
  .footer { margin-top:28px; border-top:1px solid #e5e7eb; padding-top:12px; display:flex; justify-content:space-between; font-size:10px; color:#9ca3af; }
  @media print { body { padding:20px; } }
</style></head><body>
<div class="header">
  <div class="logo">Broker<span>Saab</span> <span style="font-size:13px;font-weight:600;color:#6b7280;">Advisor Application</span></div>
  ${formData.advisorType === 'AUTHORIZED' ? '<span class="badge">★ Authorized Advisor</span>' : '<span style="font-size:11px;color:#6b7280;font-weight:600;">Regular Advisor</span>'}
</div>

<div class="section">
  <div class="section-header" style="background:linear-gradient(90deg,#1e3a5f,#2d5a8e);color:#bfdbfe;">Account &amp; Profile Details</div>
  <div class="section-body"><div class="grid2">
    <div class="field"><label>Full Name</label><span>${formData.fullName}</span></div>
    <div class="field"><label>Phone</label><span>+91 ${formData.phoneNumber}</span></div>
    <div class="field"><label>Email</label><span>${formData.email}</span></div>
    ${formData.businessName ? `<div class="field"><label>Business / Firm</label><span>${formData.businessName}</span></div>` : ''}
    <div class="field"><label>Experience</label><span>${formData.experienceYears} years</span></div>
    <div class="field"><label>Location</label><span>${formData.location || `${formData.city}, ${formData.state}`}</span></div>
    ${formData.consultationFee ? `<div class="field"><label>Consultation Fee</label><span>₹${formData.consultationFee} / session</span></div>` : ''}
    ${formData.licenseNumber ? `<div class="field"><label>License No.</label><span>${formData.licenseNumber}</span></div>` : ''}
    ${formData.gstNumber ? `<div class="field"><label>GST No.</label><span>${formData.gstNumber}</span></div>` : ''}
    ${formData.aadhaarFile ? `<div class="field"><label>Aadhaar (masked)</label><span>XXXX-XXXX-${formData.aadhaarNumber.slice(-4) || '****'}</span></div>` : ''}
    <div class="field" style="grid-column:1/-1"><label>Languages</label><span>${formData.languages.join(', ')}</span></div>
    ${formData.bio ? `<div class="field" style="grid-column:1/-1"><label>Professional Bio</label><span style="font-size:12px;">${formData.bio}</span></div>` : ''}
  </div></div>
</div>

${selectedCats.length > 0 ? `<div class="section">
  <div class="section-header" style="background:linear-gradient(90deg,#064e3b,#065f46);color:#a7f3d0;">Service Categories (${selectedCats.length})</div>
  <div class="section-body">${selectedCats.map((c, i) => {
    const color = MODULE_COLORS[ADVISOR_CATEGORIES.findIndex(a => a.slug === c.slug) % MODULE_COLORS.length].accent;
    return `<span class="chip" style="border-color:${color};color:${color};background:${color}12;">${c.name}</span>`;
  }).join('')}</div>
</div>` : ''}

${subNames.length > 0 ? `<div class="section">
  <div class="section-header" style="background:linear-gradient(90deg,#3b0764,#5b21b6);color:#ddd6fe;">Specialisations (${subNames.length})</div>
  <div class="section-body">${subNames.map(name => `<span class="spec-chip" style="border-color:#7c3aed50;color:#5b21b6;background:#f5f3ff;">${name}</span>`).join('')}</div>
</div>` : ''}

${availLines ? `<div class="section">
  <div class="section-header" style="background:linear-gradient(90deg,#0c4a6e,#0369a1);color:#bae6fd;">Weekly Availability</div>
  <div class="section-body"><table class="avail-table">${availLines}</table></div>
</div>` : ''}

<div class="footer">
  <span>BrokerSaab Technology Pvt. Ltd. · Trusted Advisory Platform</span>
  <span>Generated: ${printDate}</span>
</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  // ── GST Invoice download ─────────────────────────────────────────────────────
  const downloadInvoice = () => {
    if (!invoiceData) return;
    const inv = invoiceData;
    const dateStr = inv.paidAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Tax Invoice — BrokerSaab — ${inv.invoiceNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;background:#fff;padding:0;}
  .page{max-width:794px;margin:0 auto;padding:36px 40px;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid #D4AF37;}
  .logo-wrap{display:flex;align-items:center;gap:10px;}
  .logo-box{width:44px;height:44px;background:#0B1F3A;border-radius:10px;display:flex;align-items:center;justify-content:center;}
  .logo-box span{color:#D4AF37;font-weight:900;font-size:14px;}
  .company-name{font-size:22px;font-weight:900;color:#0B1F3A;letter-spacing:-0.5px;}
  .company-sub{font-size:11px;color:#6b7280;margin-top:2px;}
  .inv-title{text-align:right;}
  .inv-title h1{font-size:18px;font-weight:900;color:#D4AF37;letter-spacing:1px;text-transform:uppercase;}
  .inv-title p{font-size:11px;color:#6b7280;margin-top:3px;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;}
  .box{border:1.5px solid #e5e7eb;border-radius:10px;padding:14px;}
  .box-label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px;}
  .box h3{font-size:14px;font-weight:700;color:#111827;}
  .box p{font-size:11px;color:#6b7280;margin-top:2px;line-height:1.5;}
  table{width:100%;border-collapse:collapse;margin-bottom:0;}
  thead tr{background:#0B1F3A;}
  thead th{padding:10px 14px;color:#D4AF37;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;text-align:left;}
  thead th:last-child{text-align:right;}
  tbody tr{border-bottom:1px solid #f3f4f6;}
  tbody td{padding:12px 14px;font-size:12px;color:#374151;vertical-align:top;}
  tbody td:last-child{text-align:right;font-weight:600;}
  .total-section{border:2px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-top:20px;}
  .total-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:12px;}
  .total-row.discount{color:#059669;}
  .total-row.tax{color:#374151;}
  .total-row.grand{background:#0B1F3A;color:#D4AF37;font-size:15px;font-weight:900;padding:12px 16px;}
  .badge{display:inline-block;background:linear-gradient(135deg,#D4AF37,#B48C22);color:#0B1F3A;font-size:9px;font-weight:900;padding:3px 10px;border-radius:20px;letter-spacing:.05em;margin-top:4px;}
  .footer{margin-top:28px;padding-top:16px;border-top:1.5px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-start;font-size:10px;color:#9ca3af;}
  .guarantee-box{background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;padding:12px 16px;margin-top:20px;font-size:11px;color:#166534;}
  @media print{.page{padding:24px 28px;}}
</style></head><body><div class="page">

<div class="header">
  <div class="logo-wrap">
    <div class="logo-box"><span>BS</span></div>
    <div>
      <div class="company-name">BrokerSaab</div>
      <div class="company-sub">BrokerSaab Technology Pvt. Ltd.</div>
      <div class="company-sub">GSTIN: 27AABCB1234A1Z5 &nbsp;|&nbsp; PAN: AABCB1234A</div>
      <div class="company-sub">Mumbai, Maharashtra — 400001 &nbsp;|&nbsp; support@brokersaab.com</div>
    </div>
  </div>
  <div class="inv-title">
    <h1>Tax Invoice</h1>
    <p><strong>Invoice No:</strong> ${inv.invoiceNo}</p>
    <p><strong>Date:</strong> ${dateStr}</p>
    <p><strong>Payment ID:</strong> ${inv.paymentId}</p>
    <p><strong>Order ID:</strong> ${inv.orderId}</p>
    <span class="badge">PAID ✓</span>
  </div>
</div>

<div class="two-col">
  <div class="box">
    <div class="box-label">From (Seller)</div>
    <h3>BrokerSaab Technology Pvt. Ltd.</h3>
    <p>GSTIN: 27AABCB1234A1Z5<br/>SAC Code: 9983<br/>Mumbai, Maharashtra — 400001<br/>India</p>
  </div>
  <div class="box">
    <div class="box-label">Bill To (Buyer)</div>
    <h3>${formData.fullName}</h3>
    <p>${formData.email}<br/>+91 ${formData.phoneNumber}<br/>${formData.state || 'India'}${formData.gstNumber ? '<br/>GSTIN: ' + formData.gstNumber : ''}</p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:50%">Description</th>
      <th>HSN/SAC</th>
      <th>Qty</th>
      <th>Unit Price (₹)</th>
      <th>Taxable Amt (₹)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <strong>Authorized Advisor Subscription — Annual Plan</strong><br/>
        <span style="font-size:10px;color:#6b7280;">Platform access, Authorized badge &amp; priority search listing<br/>Validity: 12 months from activation</span>
      </td>
      <td>9983</td>
      <td>1</td>
      <td>₹${BASE_PRICE.toLocaleString('en-IN')}.00</td>
      <td>₹${BASE_PRICE.toLocaleString('en-IN')}.00</td>
    </tr>
  </tbody>
</table>

<div class="total-section">
  <div class="total-row" style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
    <span>MRP / Original Price</span><span>₹${ORIGINAL_PRICE.toLocaleString('en-IN')}.00</span>
  </div>
  <div class="total-row discount" style="border-bottom:1px solid #e5e7eb;">
    <span>Promotional Discount (90.005% off)</span><span>− ₹${DISCOUNT_AMT.toLocaleString('en-IN')}.00</span>
  </div>
  <div class="total-row" style="font-weight:700;border-bottom:1px solid #e5e7eb;">
    <span>Taxable Amount (after discount)</span><span>₹${BASE_PRICE.toFixed(2)}</span>
  </div>
  <div class="total-row tax" style="border-bottom:1px solid #e5e7eb;">
    <span>CGST @ 9% (Central GST)</span><span>₹${CGST_AMT.toFixed(2)}</span>
  </div>
  <div class="total-row tax" style="border-bottom:1px solid #e5e7eb;">
    <span>SGST @ 9% (State GST — Maharashtra)</span><span>₹${SGST_AMT.toFixed(2)}</span>
  </div>
  <div class="total-row grand">
    <span>TOTAL AMOUNT PAID (Inclusive of GST)</span><span>₹${TOTAL_PAYABLE.toFixed(2)}</span>
  </div>
</div>

<div class="guarantee-box">
  <strong>100% Refund Policy:</strong> If your advisor profile is rejected by the BrokerSaab review team, the full amount of ₹${TOTAL_PAYABLE.toFixed(2)} will be refunded to your original payment method within 3–5 business days. No deductions.
</div>

<div class="footer">
  <div>
    <p>This is a computer-generated invoice. No signature required.</p>
    <p style="margin-top:4px;">BrokerSaab Technology Pvt. Ltd. · CIN: U72900MH2024PTC000000</p>
    <p style="margin-top:2px;">This invoice is valid subject to realization of payment.</p>
  </div>
  <div style="text-align:right;">
    <p>Generated: ${dateStr}</p>
    <p style="margin-top:4px;font-weight:700;color:#0B1F3A;">Thank you for choosing BrokerSaab!</p>
  </div>
</div>

</div></body></html>`;

    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  // ── Shared input style ───────────────────────────────────────────────────────
  const inputWrap = 'flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/20 transition-all bg-white';
  const inputIcon = 'px-3 text-slate-400';
  const inputBase = 'flex-1 px-3 py-3 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-800 to-slate-900 flex flex-col items-center justify-center p-4 py-12">

      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-3">
          <span className="text-navy-800 font-black text-lg">BS</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">BrokerSaab</span>
        <span className="text-slate-400 text-xs">Trusted Advisory Platform</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

        {/* Card Header */}
        {step !== 'success' && (
          <div className="bg-gradient-to-r from-navy-800 to-navy-700 px-6 py-4 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-gold-400" />
                <span className="font-semibold text-sm">Advisor Registration</span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">Join thousands of verified advisors on BrokerSaab</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Close onboarding"
              title="Cancel Onboarding"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Progress Bar (steps 2–6) */}
        {progressIndex > 0 && step !== 'success' && (
          <div className="flex items-center px-6 py-4 bg-gray-50 border-b border-gray-100">
            {PROGRESS_STEPS.map((label, i) => {
              const num = i + 1;
              const done = num < progressIndex;
              const active = num === progressIndex;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done ? 'bg-navy-800 text-white' :
                      active ? 'bg-gold-500 text-navy-800' :
                      'border-2 border-gray-200 text-gray-400 bg-white'
                    }`}>
                      {done ? <Check size={14} /> : num}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${done ? 'text-gold-600' : active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < PROGRESS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-gold-500' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Error Badge */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step: Welcome ── */}
        {step === 'welcome' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gold-500/10 border-2 border-gold-500/30 flex items-center justify-center mx-auto mb-4">
                <UserPlus size={30} className="text-gold-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Become a <span className="gold-gradient-text">Verified Advisor</span>
              </h1>
              <p className="text-sm text-gray-500">Join BrokerSaab and start earning from your expertise — completely free to register.</p>
            </div>

            {/* How It Works */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How It Works</h2>
              <div className="space-y-3">
                {[
                  { n: '1', title: 'Fill your professional profile', desc: 'Share your name, license, fees, and expertise in a few minutes.' },
                  { n: '2', title: 'Select your service categories', desc: 'Choose the legal or financial services you specialise in.' },
                  { n: '3', title: 'Set your availability', desc: 'Pick the days and hours you are available for consultations.' },
                  { n: '4', title: 'Submit for admin review', desc: 'Our team verifies credentials and goes live within 24–48 hours.' },
                ].map(item => (
                  <div key={item.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-navy-800 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{item.n}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Requirements */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Requirements</h2>
                <ul className="space-y-2">
                  {[
                    'Active phone number & email',
                    'At least one service category',
                    'Professional bio (50+ characters)',
                    'License number (optional but recommended)',
                  ].map(req => (
                    <li key={req} className="flex gap-2 items-start text-sm text-gray-700">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div className="bg-gold-500/5 rounded-2xl p-4 border border-gold-500/20">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Benefits</h2>
                <ul className="space-y-2">
                  {[
                    'Earn consultation fees directly',
                    'Set your own flexible hours',
                    'Verified badge builds trust',
                    'Escrow-protected payments',
                  ].map(b => (
                    <li key={b} className="flex gap-2 items-start text-sm text-gray-700">
                      <Star size={15} className="text-gold-500 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ── Advisor-specific Terms & Conditions ── */}
            <div className="mb-5 rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#0a0505] to-[#0d0818]">
                <Scale size={15} className="text-amber-400 shrink-0" />
                <span className="text-amber-400 text-[11px] font-black uppercase tracking-wider">Advisor Terms & Conditions</span>
                <span className="ml-auto text-amber-400/60 text-[10px]">Must accept to proceed</span>
              </div>

              {/* Scrollable T&C */}
              <div ref={tcScrollRef} onScroll={handleTcScroll}
                className="overflow-y-auto px-4 py-3 space-y-2.5"
                style={{ maxHeight: '200px', background: '#f8f7f0' }}>
                {[
                  { color: '#ef4444', title: 'No Platform Liability for Fraud or Misbehaviour', body: 'BrokerSaab is a third-party technology marketplace. The platform is NOT liable for any fraudulent activity, misrepresentation, negligence, or professional misconduct by any advisor listed on the platform — including you. Users engage with you as an independent professional, not as a BrokerSaab employee or representative.' },
                  { color: '#f59e0b', title: 'Disputes — Indian Judiciary', body: 'All disputes, complaints, or proceedings arising from your advisory services or your use of BrokerSaab shall be subject exclusively to the jurisdiction of the competent courts of India. BrokerSaab will not represent either party in any dispute.' },
                  { color: '#3b82f6', title: 'Document Authenticity & Accuracy', body: 'You confirm that all KYC documents, license information, qualifications, and professional credentials submitted to BrokerSaab are genuine, current, and accurate. Submitting false or fraudulent documents is an offence under applicable Indian law and will result in immediate account termination and referral to law enforcement.' },
                  { color: '#8b5cf6', title: 'Independent Professional Responsibility', body: 'You are solely responsible for the quality, accuracy, and legality of all advice, services, and documents you provide to clients. BrokerSaab does not supervise, endorse, or guarantee your advice. Professional liability remains entirely with you.' },
                  { color: '#10b981', title: 'Platform Commission & Conduct', body: 'BrokerSaab deducts a 15% service commission from all completed consultation payments. You agree to maintain professional conduct, honour confirmed bookings, and not solicit clients to transact outside the platform. Violations will result in immediate suspension and forfeiture of wallet balance.' },
                ].map((clause, i) => (
                  <div key={i} className="rounded-xl border overflow-hidden"
                    style={{ borderColor: `${clause.color}30`, background: `${clause.color}06` }}>
                    <div className="px-3 py-1.5 border-b flex items-center gap-2"
                      style={{ borderColor: `${clause.color}20`, background: `${clause.color}0c` }}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: clause.color }} />
                      <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: clause.color }}>{clause.title}</span>
                    </div>
                    <p className="px-3 py-2 text-[11px] text-gray-600 leading-relaxed">{clause.body}</p>
                  </div>
                ))}
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <p className="text-[11px] text-red-700 leading-relaxed font-medium">
                    <strong>Governing Law:</strong> These terms are governed by the laws of the Republic of India. BrokerSaab will fully cooperate with Indian law enforcement in any investigation of fraud, forgery, or misconduct.
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 text-center pb-1">Effective: June 2026 · BrokerSaab Technology Pvt. Ltd.</p>
              </div>

              {/* Accept checkbox */}
              <div className="px-4 py-3 border-t border-gray-200 bg-white space-y-2.5">
                {!tcScrolled && (
                  <p className="text-[10px] text-amber-600 text-center">↓ Scroll to read all advisor terms before accepting</p>
                )}
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                    style={{ borderColor: tcAccepted ? '#10b981' : '#d1d5db', background: tcAccepted ? '#10b981' : 'white' }}
                    onClick={() => setTcAccepted(p => !p)}>
                    {tcAccepted && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-xs text-gray-600 leading-relaxed select-none">
                    I have read and accept the Advisor Terms & Conditions, including that BrokerSaab is <strong>not liable for fraud or misconduct</strong>, disputes are under <strong>Indian courts</strong>, and all my submitted documents are <strong>genuine and accurate</strong>.
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={() => { if (tcAccepted) { setError(''); setStep('phone_otp'); } }}
              disabled={!tcAccepted}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: tcAccepted ? 'linear-gradient(135deg, #D4AF37, #B48C22)' : '#e5e7eb',
                color: tcAccepted ? '#0B1F3A' : '#9ca3af',
                cursor: tcAccepted ? 'pointer' : 'not-allowed',
              }}>
              {tcAccepted ? <><CheckCircle2 size={16} /> I Accept — Start Registration</> : <>Accept Terms to Continue <ArrowRight size={16} /></>}
            </button>
          </div>
        )}

        {/* ── Step: Phone OTP ── */}
        {step === 'phone_otp' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Verify Your Mobile Number</h2>
              <p className="text-sm text-gray-500">We'll send a 6-digit OTP to confirm your number.</p>
            </div>

            {/* Phone entry */}
            {(otpSubStep === 'phone' || otpSubStep === 'sent') && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mobile Number</label>
                <div className={inputWrap}>
                  <span className="px-3 py-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 font-medium">+91</span>
                  <input type="tel" maxLength={10} placeholder="10-digit number"
                    value={formData.phoneNumber}
                    disabled={otpSubStep === 'sent'}
                    onChange={e => update('phoneNumber', e.target.value.replace(/\D/g, ''))}
                    className={inputBase} />
                </div>
              </div>
            )}

            {/* Send OTP button */}
            {otpSubStep === 'phone' && (
              <button
                disabled={formData.phoneNumber.length !== 10 || otpLoading}
                onClick={async () => {
                  if (formData.phoneNumber.length !== 10) return;
                  setOtpLoading(true); setError('');
                  try {
                    const r = await fetch(`${API}/auth/otp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneNumber: `+91${formData.phoneNumber}` }) });
                    const d = await r.json();
                    if (!r.ok) { setError(d.message || 'Failed to send OTP'); return; }
                    if (d.devOtp) setDevOtp(d.devOtp);
                    setOtpSubStep('sent');
                    setOtpCooldown(30);
                    const t = setInterval(() => setOtpCooldown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
                  } catch { setError('Network error. Please try again.'); }
                  finally { setOtpLoading(false); }
                }}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: formData.phoneNumber.length === 10 ? 'linear-gradient(135deg,#D4AF37,#B48C22)' : '#e5e7eb', color: formData.phoneNumber.length === 10 ? '#0B1F3A' : '#9ca3af', cursor: formData.phoneNumber.length === 10 ? 'pointer' : 'not-allowed' }}>
                {otpLoading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Sending…</span> : 'Send OTP'}
              </button>
            )}

            {/* OTP input + verify */}
            {otpSubStep === 'sent' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-600">Enter 6-digit OTP</label>
                {devOtp && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                    <AlertCircle size={14} className="shrink-0" /> Dev OTP: <strong>{devOtp}</strong>
                  </div>
                )}
                <div className={inputWrap}>
                  <Phone size={16} className={inputIcon} />
                  <input type="text" maxLength={6} placeholder="e.g. 123456" value={otpValue}
                    onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className={inputBase} autoFocus />
                </div>
                <button
                  disabled={otpValue.length !== 6 || otpLoading}
                  onClick={async () => {
                    setOtpLoading(true); setError('');
                    try {
                      const r = await fetch(`${API}/auth/otp/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneNumber: `+91${formData.phoneNumber}`, otp: otpValue }) });
                      const d = await r.json();
                      if (!r.ok) { setError(d.message || 'Invalid OTP'); return; }
                      update('otpVerified', true);
                      if (d.tempToken) update('tempPhoneToken', d.tempToken);
                      setOtpSubStep('verified');
                    } catch { setError('Network error. Please try again.'); }
                    finally { setOtpLoading(false); }
                  }}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ background: otpValue.length === 6 ? 'linear-gradient(135deg,#D4AF37,#B48C22)' : '#e5e7eb', color: otpValue.length === 6 ? '#0B1F3A' : '#9ca3af' }}>
                  {otpLoading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Verifying…</span> : 'Verify OTP'}
                </button>
                {otpCooldown === 0 ? (
                  <button onClick={() => setOtpSubStep('phone')} className="w-full text-xs text-gold-600 hover:text-gold-800 underline py-1">Resend OTP</button>
                ) : (
                  <p className="text-center text-xs text-gray-400">Resend in {otpCooldown}s</p>
                )}
              </div>
            )}

            {/* Verified state */}
            {otpSubStep === 'verified' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 size={22} className="text-green-500 shrink-0" />
                <div>
                  <p className="font-bold text-green-700 text-sm">+91 {formData.phoneNumber} Verified!</p>
                  <p className="text-green-600 text-xs">Your mobile number is confirmed.</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">Back</button>
              <button onClick={goNext} disabled={!formData.otpVerified} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-40">
                Next: Advisor Type <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Advisor Type ── */}
        {step === 'advisor_type' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Choose Your Advisor Type</h2>
              <p className="text-sm text-gray-500">This determines your verification requirements and platform visibility.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Regular */}
              <button
                onClick={() => { update('advisorType', 'REGULAR'); setError(''); }}
                className="text-left p-5 rounded-2xl border-2 transition-all"
                style={{ borderColor: formData.advisorType === 'REGULAR' ? '#D4AF37' : '#e5e7eb', background: formData.advisorType === 'REGULAR' ? 'linear-gradient(135deg,#fffbf0,#fff9e6)' : '#fafafa', boxShadow: formData.advisorType === 'REGULAR' ? '0 0 0 3px rgba(212,175,55,0.15)' : 'none' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-gray-800 text-base">Regular Advisor</span>
                  {formData.advisorType === 'REGULAR' && <CheckCircle2 size={20} className="text-gold-500" />}
                </div>
                <p className="text-xs text-gray-500 font-semibold mb-3">Free to join</p>
                <ul className="space-y-1.5">
                  {['Basic profile listing','Client bookings & fees','Standard search position','Aadhaar + photo KYC','Standard verification badge'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600"><Check size={13} className="text-emerald-500 shrink-0" />{f}</li>
                  ))}
                </ul>
              </button>

              {/* Authorized */}
              <button
                onClick={() => { update('advisorType', 'AUTHORIZED'); setError(''); }}
                className="text-left p-5 rounded-2xl border-2 transition-all relative"
                style={{ borderColor: formData.advisorType === 'AUTHORIZED' ? '#D4AF37' : '#e5e7eb', background: formData.advisorType === 'AUTHORIZED' ? 'linear-gradient(135deg,#0B1F3A,#1a3a5c)' : '#0B1F3A', boxShadow: formData.advisorType === 'AUTHORIZED' ? '0 0 0 3px rgba(212,175,55,0.25)' : 'none' }}>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black text-navy-800" style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)' }}>
                  90% OFF
                </div>
                <div className="flex items-center justify-between mb-3 pr-14">
                  <span className="font-black text-white text-base">Authorized Advisor</span>
                  {formData.advisorType === 'AUTHORIZED' && <CheckCircle2 size={20} className="text-gold-400" />}
                </div>
                <div className="mb-3">
                  <span className="text-xs text-white/50 line-through">₹19,999/year</span>
                  <span className="text-lg font-black text-gold-400 ml-2">₹1,999</span>
                  <span className="text-xs text-white/60">/year</span>
                </div>
                <ul className="space-y-1.5">
                  {['All Regular Advisor benefits','Gold "Authorized" badge on profile','Priority placement in search results','License verification (mandatory)','GST number support (optional)','Preferred by clients — builds trust'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/80"><Check size={13} className="text-gold-400 shrink-0" />{f}</li>
                  ))}
                </ul>
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">Back</button>
              <button onClick={goNext} disabled={!formData.advisorType} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-40">
                Next: Account <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Account ── */}
        {step === 'account' && (
          <div className="p-6 sm:p-8 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create Your Account</h2>
              <p className="text-sm text-gray-500">These credentials will be used to log in to your advisor dashboard.</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mobile Number</label>
              <div className={inputWrap}>
                <span className="px-3 py-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 font-medium">+91</span>
                <input type="tel" maxLength={10} placeholder="10-digit number" value={formData.phoneNumber}
                  disabled
                  onChange={e => update('phoneNumber', e.target.value.replace(/\D/g, ''))}
                  className={inputBase} />
                <Phone size={16} className="mr-3 text-slate-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <div className={inputWrap}>
                <Mail size={16} className={inputIcon} />
                <input type="email" placeholder="you@example.com" value={formData.email}
                  onChange={e => update('email', e.target.value)} className={inputBase} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
              <div className={inputWrap}>
                <Lock size={16} className={inputIcon} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={formData.password}
                  onChange={e => update('password', e.target.value)} className={inputBase} />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="pr-3 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
              <div className={inputWrap}>
                <Lock size={16} className={inputIcon} />
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password" value={formData.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)} className={inputBase} />
                <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="pr-3 text-slate-400 hover:text-slate-600">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                Back
              </button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                Next: Profile <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Profile ── */}
        {step === 'profile' && (
          <div className="p-6 sm:p-8 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Professional Profile</h2>
              <p className="text-sm text-gray-500">Tell clients about your expertise and experience.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                <div className={inputWrap}>
                  <User size={16} className={inputIcon} />
                  <input type="text" placeholder="As on your license" value={formData.fullName}
                    onChange={e => update('fullName', e.target.value)} className={inputBase} />
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Business / Firm Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className={inputWrap}>
                  <Briefcase size={16} className={inputIcon} />
                  <input type="text" placeholder="e.g. Sen & Associates" value={formData.businessName}
                    onChange={e => update('businessName', e.target.value)} className={inputBase} />
                </div>
              </div>

              {/* License */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">License Number <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className={inputWrap}>
                  <FileCheck size={16} className={inputIcon} />
                  <input type="text" placeholder="e.g. BAR/MH/12345" value={formData.licenseNumber}
                    onChange={e => update('licenseNumber', e.target.value)} className={inputBase} />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Years of Experience *</label>
                <div className={inputWrap}>
                  <Award size={16} className={inputIcon} />
                  <input type="number" min="0" step="1" placeholder="e.g. 8" value={formData.experienceYears}
                    onChange={e => update('experienceYears', e.target.value)} className={inputBase} />
                </div>
              </div>

              {/* State + City structured location */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">State *</label>
                  <div className={inputWrap}>
                    <MapPin size={16} className={inputIcon} />
                    <select
                      value={formData.state}
                      onChange={e => {
                        const s = e.target.value;
                        update('state', s);
                        update('location', formData.city ? `${formData.city}, ${s}` : s);
                      }}
                      className={`${inputBase} cursor-pointer`}
                    >
                      <option value="">Select your state…</option>
                      {INDIA_STATES_SORTED.map(st => (
                        <option key={st.id} value={st.name}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">City / Area *</label>
                  <div className={inputWrap}>
                    <MapPin size={16} className={inputIcon} />
                    <input
                      type="text"
                      placeholder={formData.state
                        ? `e.g. ${(INDIA_STATES_SORTED.find(s => s.name === formData.state)?.cities[0]) ?? 'Your city'}`
                        : 'Select state first…'}
                      value={formData.city}
                      onChange={e => {
                        const city = e.target.value;
                        update('city', city);
                        update('location', formData.state ? `${city}, ${formData.state}` : city);
                      }}
                      className={inputBase}
                    />
                  </div>
                </div>
              </div>

              {/* Fee */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Consultation Fee (₹) <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className={inputWrap}>
                  <span className="px-3 py-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 font-bold">₹</span>
                  <input type="number" min="0" placeholder="e.g. 1500" value={formData.consultationFee}
                    onChange={e => update('consultationFee', e.target.value)} className={inputBase} />
                </div>
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Languages Spoken *</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.languages.map(lang => (
                  <span key={lang} className="flex items-center gap-1 bg-navy-800/10 text-navy-800 text-xs font-medium px-3 py-1 rounded-full">
                    {lang}
                    <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-500 ml-0.5">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className={inputWrap}>
                <input ref={langInputRef} type="text" placeholder="Type language + Enter (e.g. Hindi, English)" value={langInput}
                  onChange={e => setLangInput(e.target.value)} onKeyDown={handleLangKey} className={inputBase} />
                <button type="button" onClick={addLanguage} className="pr-3 text-gold-500 hover:text-gold-600">
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a language</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Professional Bio *</label>
              <textarea rows={4} placeholder="Describe your expertise, approach, and what clients can expect when working with you. (minimum 50 characters)"
                value={formData.bio} onChange={e => update('bio', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 resize-none transition-all" />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-400">Minimum 50 characters</p>
                <p className={`text-xs font-medium ${formData.bio.trim().length < 50 ? 'text-red-400' : 'text-emerald-600'}`}>
                  {formData.bio.trim().length} / 500
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                Back
              </button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                Next: Services <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: KYC Upload ── */}
        {step === 'kyc' && (
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">KYC Document Upload</h2>
              <p className="text-sm text-gray-500">
                Aadhaar and photo are required for all advisors.
                {formData.advisorType === 'AUTHORIZED' && ' License copy is additionally required for Authorized Advisors.'}
              </p>
            </div>

            {/* Aadhaar consent notice */}
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Aadhaar Data Security Notice (UIDAI / Aadhaar Act 2016):</strong> Your Aadhaar number is stored only as an irreversible one-way cryptographic hash — it cannot be recovered or read by anyone, including BrokerSaab staff. Only the last 4 digits are stored in readable form for identity confirmation. Your data is processed exclusively for KYC verification in compliance with Government of India regulations.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={formData.aadhaarConsentGiven}
                  onChange={e => update('aadhaarConsentGiven', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-amber-500" />
                <span className="text-xs text-amber-700 font-medium">I consent to Aadhaar data processing as described above</span>
              </label>
            </div>

            {/* Aadhaar card upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600">Aadhaar Card <span className="text-red-500">*</span></label>
              <div className={inputWrap}>
                <FileCheck size={16} className={inputIcon} />
                <input type="text" maxLength={14} placeholder="12-digit Aadhaar number"
                  value={formData.aadhaarNumber}
                  onChange={e => update('aadhaarNumber', e.target.value.replace(/\D/g, ''))}
                  className={inputBase} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-gold-400 transition-all bg-gray-50">
                <FileText size={16} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 flex-1">{formData.aadhaarFile ? formData.aadhaarFile.name : 'Upload Aadhaar card (JPG, PNG or PDF, max 5 MB)'}</span>
                {formData.aadhaarFile && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                <input type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) update('aadhaarFile', e.target.files[0]); }} />
              </label>
            </div>

            {/* Passport photo upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600">Passport-size Photo <span className="text-red-500">*</span></label>
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-gold-400 transition-all bg-gray-50">
                <User size={16} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 flex-1">{formData.passportPhotoFile ? formData.passportPhotoFile.name : 'Upload your photo (JPG or PNG, max 5 MB)'}</span>
                {formData.passportPhotoFile && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) update('passportPhotoFile', e.target.files[0]); }} />
              </label>
            </div>

            {/* License — only for AUTHORIZED */}
            {formData.advisorType === 'AUTHORIZED' && (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">License Number <span className="text-red-500">*</span></label>
                  <div className={inputWrap}>
                    <Award size={16} className={inputIcon} />
                    <input type="text" placeholder="e.g. REG/MH/2024/12345" value={formData.licenseNumber}
                      onChange={e => update('licenseNumber', e.target.value)}
                      className={inputBase} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">License Copy <span className="text-red-500">*</span></label>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-gold-400 transition-all bg-gray-50">
                    <FileCheck size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-500 flex-1">{formData.licenseFile ? formData.licenseFile.name : 'Upload license document (JPG, PNG or PDF, max 5 MB)'}</span>
                    {formData.licenseFile && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                    <input type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) update('licenseFile', e.target.files[0]); }} />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">GST Number <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className={inputWrap}>
                    <Percent size={16} className={inputIcon} />
                    <input type="text" placeholder="e.g. 27AAPFU0939F1ZV" value={formData.gstNumber}
                      onChange={e => update('gstNumber', e.target.value.toUpperCase())}
                      className={inputBase} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">GST Certificate <span className="text-gray-400 font-normal">(optional)</span></label>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-gold-400 transition-all bg-gray-50">
                    <FileText size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-500 flex-1">{formData.gstCertFile ? formData.gstCertFile.name : 'Upload GST certificate (JPG, PNG or PDF, max 5 MB) — optional'}</span>
                    {formData.gstCertFile && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                    <input type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) update('gstCertFile', e.target.files[0]); }} />
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">Back</button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                Next: Services <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Services ── */}
        {step === 'services' && (
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-gold-500" />
                <h2 className="text-lg font-bold text-gray-900">Select Your Service Areas</h2>
              </div>
              <p className="text-sm text-gray-500">Choose your domains, then pick specific specialisations within each. Click a module tile to expand its sub-services.</p>
            </div>

            {/* ── Module Tiles Grid ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {ADVISOR_CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon;
                const selected = formData.selectedSlugs.includes(cat.slug);
                const isExpanded = expandedModule === cat.slug;
                const colorSet = MODULE_COLORS[idx % MODULE_COLORS.length];
                const modData = MODULES_DATA.find(m => m.id === cat.slug);
                const selectedSubCount = modData ? modData.subModules.filter(s => formData.selectedSubSlugs.includes(s.id)).length : 0;

                return (
                  <button key={cat.slug} type="button"
                    onClick={() => {
                      if (!selected) {
                        update('selectedSlugs', [...formData.selectedSlugs, cat.slug]);
                        setExpandedModule(cat.slug);
                      } else {
                        setExpandedModule(isExpanded ? null : cat.slug);
                      }
                    }}
                    className={`relative text-left p-3.5 rounded-2xl border-2 transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5 ${
                      selected
                        ? isExpanded
                          ? `border-transparent ring-2 shadow-md`
                          : 'border-gold-500 ring-2 ring-gold-500/20 bg-gold-500/5'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    style={selected && isExpanded ? {
                      borderColor: colorSet.accent,
                      boxShadow: `0 0 0 2px ${colorSet.accent}30`,
                      background: `${colorSet.accent}08`
                    } : {}}
                  >
                    {/* Selected badge */}
                    {selected && (
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {selectedSubCount > 0 && (
                          <span className="text-[9px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center"
                            style={{ background: colorSet.accent }}>
                            {selectedSubCount}
                          </span>
                        )}
                        <CheckCircle2 size={14} className="text-gold-500" />
                      </div>
                    )}

                    {/* Icon with gradient */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-110 ${
                      selected ? colorSet.iconBg : cat.color
                    }`}>
                      <Icon size={16} className={selected ? 'text-white' : cat.iconColor} />
                    </div>

                    <p className="text-xs font-bold text-gray-800 leading-tight pr-5">{cat.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{cat.desc}</p>

                    {/* Expand indicator */}
                    {selected && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold" style={{ color: colorSet.accent }}>
                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        <span>{isExpanded ? 'Selecting specialisations' : 'Click to pick sub-services'}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Expanded Sub-Module Panel ── */}
            {expandedModule && formData.selectedSlugs.includes(expandedModule) && (() => {
              const cat = ADVISOR_CATEGORIES.find(c => c.slug === expandedModule);
              const modData = MODULES_DATA.find(m => m.id === expandedModule);
              if (!cat || !modData) return null;

              const catIdx = ADVISOR_CATEGORIES.findIndex(c => c.slug === expandedModule);
              const colorSet = MODULE_COLORS[catIdx % MODULE_COLORS.length];
              const Icon = cat.icon;
              const allSubIds = modData.subModules.map(s => s.id);
              const selectedSubIds = formData.selectedSubSlugs.filter(id => allSubIds.includes(id));
              const allSelected = selectedSubIds.length === allSubIds.length;

              return (
                <div ref={subModulesRef} className="mb-6 rounded-2xl overflow-hidden border-2 animate-in slide-in-from-top-2 duration-300"
                  style={{ borderColor: `${colorSet.accent}40` }}>

                  {/* Header */}
                  <div className="px-5 py-4 flex items-center justify-between"
                    style={{ background: `linear-gradient(135deg, ${colorSet.accent}15, ${colorSet.accent}05)` }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colorSet.iconBg} flex items-center justify-center shadow-lg`}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{cat.name}</h3>
                        <p className="text-[11px] text-gray-500">
                          {selectedSubIds.length} of {allSubIds.length} specialisations selected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={() => {
                          if (allSelected) {
                            update('selectedSubSlugs', formData.selectedSubSlugs.filter(id => !allSubIds.includes(id)));
                          } else {
                            const newSubs = [...formData.selectedSubSlugs, ...allSubIds.filter(id => !formData.selectedSubSlugs.includes(id))];
                            update('selectedSubSlugs', newSubs);
                          }
                        }}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm"
                        style={{
                          color: colorSet.accent,
                          borderColor: `${colorSet.accent}40`,
                          background: allSelected ? `${colorSet.accent}10` : 'white'
                        }}>
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                      <button type="button" onClick={() => setExpandedModule(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Sub-module grid */}
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white">
                    {modData.subModules.map((sub) => {
                      const isSubSelected = formData.selectedSubSlugs.includes(sub.id);
                      const SubIcon = getSubModuleIcon(expandedModule, sub.nameEn);

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => update('selectedSubSlugs', isSubSelected
                            ? formData.selectedSubSlugs.filter(s => s !== sub.id)
                            : [...formData.selectedSubSlugs, sub.id]
                          )}
                          className="relative text-left p-3.5 rounded-2xl border-2 transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5 w-full flex flex-col justify-between"
                          style={{
                            borderColor: isSubSelected ? colorSet.accent : `${colorSet.accent}20`,
                            background: isSubSelected ? `${colorSet.accent}12` : `${colorSet.accent}03`,
                            boxShadow: isSubSelected ? `0 4px 12px ${colorSet.accent}18` : `none`
                          }}
                        >
                          <div className="flex items-start gap-2.5 w-full">
                            {/* Dynamic Symbol/Icon Badge */}
                            <div className="flex items-center justify-center shrink-0 mt-0.5">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm p-1.5"
                                style={{
                                  background: isSubSelected ? colorSet.accent : 'white',
                                  border: `1.5px solid ${colorSet.accent}30`
                                }}>
                                <SubIcon size={12} style={{ color: isSubSelected ? 'white' : colorSet.accent }} />
                              </div>
                            </div>

                            {/* Clear Typography and Contrast */}
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11.5px] font-bold leading-tight transition-colors duration-200 ${
                                isSubSelected ? 'text-slate-900' : 'text-slate-800'
                              }`}>
                                {sub.nameEn}
                              </p>
                              <p className={`text-[10px] font-semibold mt-1 leading-snug transition-colors duration-200 ${
                                isSubSelected ? 'text-slate-700' : 'text-slate-600'
                              }`}>
                                {sub.nameHi}
                              </p>
                            </div>
                          </div>

                          {/* Selection indicator badge */}
                          {isSubSelected && (
                            <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm text-white scale-110 duration-200"
                              style={{ background: colorSet.accent }}>
                              <Check size={8} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer with done action */}
                  <div className="px-5 py-3 flex items-center justify-between border-t"
                    style={{ borderColor: `${colorSet.accent}15`, background: `${colorSet.accent}05` }}>
                    <span className="text-[11px] font-medium text-gray-500">
                      {selectedSubIds.length > 0
                        ? <span style={{ color: colorSet.accent }}>{selectedSubIds.length} specialisation{selectedSubIds.length > 1 ? 's' : ''} chosen</span>
                        : 'Pick at least one specialisation'
                      }
                    </span>
                    <button type="button"
                      onClick={() => setExpandedModule(null)}
                      className="text-xs font-bold px-4 py-1.5 rounded-lg text-white transition-all hover:shadow-md"
                      style={{ background: colorSet.accent }}>
                      Done ✓
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Remove module action ── */}
            {formData.selectedSlugs.length > 0 && !expandedModule && (
              <div className="mb-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Selected Domains</h4>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {formData.selectedSlugs.length} domain{formData.selectedSlugs.length > 1 ? 's' : ''} · {formData.selectedSubSlugs.length} specialisation{formData.selectedSubSlugs.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.selectedSlugs.map(slug => {
                    const catIdx = ADVISOR_CATEGORIES.findIndex(c => c.slug === slug);
                    const cat = ADVISOR_CATEGORIES[catIdx];
                    if (!cat) return null;
                    const colorSet = MODULE_COLORS[catIdx % MODULE_COLORS.length];
                    const modData = MODULES_DATA.find(m => m.id === slug);
                    const subCount = modData ? modData.subModules.filter(s => formData.selectedSubSlugs.includes(s.id)).length : 0;
                    const Icon = cat.icon;

                    return (
                      <div key={slug} className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all hover:shadow-sm"
                        style={{ borderColor: `${colorSet.accent}30`, background: `${colorSet.accent}08`, color: colorSet.accent }}>
                        <div className={`w-5 h-5 rounded-md ${colorSet.iconBg} flex items-center justify-center`}>
                          <Icon size={10} className="text-white" />
                        </div>
                        <span className="text-gray-800 text-[11px] font-semibold">{cat.name}</span>
                        {subCount > 0 && (
                          <span className="text-[9px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center"
                            style={{ background: colorSet.accent }}>
                            {subCount}
                          </span>
                        )}
                        <button type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            update('selectedSlugs', formData.selectedSlugs.filter(s => s !== slug));
                            if (modData) {
                              const subIds = modData.subModules.map(s => s.id);
                              update('selectedSubSlugs', formData.selectedSubSlugs.filter(s => !subIds.includes(s)));
                            }
                          }}
                          className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors">
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Summary Stats ── */}
            {formData.selectedSlugs.length > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="text-emerald-700">
                    {formData.selectedSlugs.length} domain{formData.selectedSlugs.length > 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className={formData.selectedSubSlugs.length > 0 ? 'text-indigo-600' : 'text-red-500'}>
                    {formData.selectedSubSlugs.length > 0
                      ? `${formData.selectedSubSlugs.length} specialisation${formData.selectedSubSlugs.length > 1 ? 's' : ''} selected`
                      : 'No specialisations yet — expand a module above to pick'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                Back
              </button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                Next: Availability <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Availability ── */}
        {step === 'availability' && (
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">Set Your Availability</h2>
              <p className="text-sm text-gray-500">Toggle the days you are available and set your time slots. You can update this anytime.</p>
            </div>

            {/* Day chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {DAYS.map((day, i) => {
                const active = activeDays.includes(i);
                return (
                  <button key={day} type="button" onClick={() => toggleDay(i)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                      active ? 'bg-navy-800 text-white border-navy-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Slot editor per day */}
            {activeDays.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Toggle days above to add time slots</p>
              </div>
            )}

            <div className="space-y-4 mb-4">
              {activeDays.map(day => {
                const daySlots = formData.slots.filter(s => s.dayOfWeek === day);
                return (
                  <div key={day} className="bg-gray-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">{DAYS[day]}</span>
                      <button type="button" onClick={() => addSlot(day)} className="flex items-center gap-1 text-xs font-semibold text-gold-600 hover:text-gold-700">
                        <Plus size={13} /> Add slot
                      </button>
                    </div>
                    <div className="space-y-2">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="flex items-center gap-2">
                          <input type="time" value={slot.startTime}
                            onChange={e => updateSlot(slot.id, 'startTime', e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-gold-500 w-32" />
                          <span className="text-gray-400 font-medium">→</span>
                          <input type="time" value={slot.endTime}
                            onChange={e => updateSlot(slot.id, 'endTime', e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-gold-500 w-32" />
                          <button type="button" onClick={() => removeSlot(slot.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                Back
              </button>
              <button onClick={() => { setError(''); setStep('review'); }} className="py-3 px-5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                Skip for Now
              </button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                Review <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Review ── */}
        {step === 'review' && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Review Your Application</h2>
                <p className="text-sm text-gray-500">Please verify all details before submitting.</p>
              </div>
              {formData.advisorType && (
                <span className="shrink-0 px-3 py-1 rounded-full text-xs font-black"
                  style={{ background: formData.advisorType === 'AUTHORIZED' ? 'linear-gradient(135deg,#D4AF37,#B48C22)' : '#e0f2fe', color: formData.advisorType === 'AUTHORIZED' ? '#071527' : '#0369a1' }}>
                  {formData.advisorType === 'AUTHORIZED' ? '★ Authorized' : 'Regular'}
                </span>
              )}
            </div>

            {/* ── Account & Profile ── */}
            <div className="rounded-2xl border border-blue-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-600" style={{ background: 'linear-gradient(90deg,#1e3a5f,#2d5a8e)' }}>
                <User size={13} className="text-blue-200" />
                <span className="text-xs font-black uppercase tracking-wider text-blue-100">Account & Profile</span>
              </div>
              <div className="p-4 bg-blue-50/40 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {[
                  ['Phone', `+91 ${formData.phoneNumber}`],
                  ['Email', formData.email],
                  ['Full Name', formData.fullName],
                  formData.businessName ? ['Firm / Business', formData.businessName] : null,
                  ['Experience', `${formData.experienceYears} years`],
                  ['Location', formData.location || `${formData.city}, ${formData.state}`],
                  formData.consultationFee ? ['Consultation Fee', `₹${formData.consultationFee} / session`] : null,
                  formData.licenseNumber ? ['License No.', formData.licenseNumber] : null,
                  formData.gstNumber ? ['GST No.', formData.gstNumber] : null,
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label as string} className="flex flex-col">
                    <span className="text-[10px] font-semibold text-blue-600/70 uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-semibold text-gray-800 truncate">{value as string}</span>
                  </div>
                ))}
                {formData.languages.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-semibold text-blue-600/70 uppercase tracking-wider">Languages</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {formData.languages.map(l => (
                        <span key={l} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.bio && (
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-semibold text-blue-600/70 uppercase tracking-wider">Bio</span>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-3 leading-relaxed">{formData.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── KYC Documents ── */}
            {(formData.aadhaarFile || formData.passportPhotoFile || formData.licenseFile || formData.gstCertFile) && (
              <div className="rounded-2xl border border-amber-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'linear-gradient(90deg,#78350f,#b45309)' }}>
                  <ShieldCheck size={13} className="text-amber-200" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-100">KYC Documents Uploaded</span>
                </div>
                <div className="p-4 bg-amber-50/40 flex flex-wrap gap-2">
                  {[
                    formData.aadhaarFile ? { label: 'Aadhaar Card', file: formData.aadhaarFile, color: '#b45309' } : null,
                    formData.passportPhotoFile ? { label: 'Passport Photo', file: formData.passportPhotoFile, color: '#065f46' } : null,
                    formData.licenseFile ? { label: 'License Copy', file: formData.licenseFile, color: '#1d4ed8' } : null,
                    formData.gstCertFile ? { label: 'GST Certificate', file: formData.gstCertFile, color: '#7c3aed' } : null,
                  ].filter(Boolean).map(({ label, file, color }: any) => (
                    <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 bg-white"
                      style={{ borderColor: `${color}40` }}>
                      <CheckCircle2 size={14} style={{ color }} className="shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color }}>{label}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Services ── */}
            {formData.selectedSlugs.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'linear-gradient(90deg,#064e3b,#065f46)' }}>
                  <Briefcase size={13} className="text-emerald-200" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                    Service Categories ({formData.selectedSlugs.length})
                  </span>
                </div>
                <div className="p-4 bg-emerald-50/30">
                  <div className="flex flex-wrap gap-2">
                    {ADVISOR_CATEGORIES.filter(c => formData.selectedSlugs.includes(c.slug)).map((c) => {
                      const catIdx = ADVISOR_CATEGORIES.findIndex(ac => ac.slug === c.slug);
                      const colorSet = MODULE_COLORS[catIdx % MODULE_COLORS.length];
                      const Icon = c.icon;
                      return (
                        <div key={c.slug}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 bg-white shadow-sm"
                          style={{ borderColor: colorSet.accent, boxShadow: `0 0 0 1px ${colorSet.accent}20` }}>
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${colorSet.accent}18` }}>
                            <Icon size={13} style={{ color: colorSet.accent }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: colorSet.accent }}>{c.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Specialisations ── */}
            {formData.selectedSubSlugs.length > 0 && (
              <div className="rounded-2xl border border-violet-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'linear-gradient(90deg,#3b0764,#5b21b6)' }}>
                  <Award size={13} className="text-violet-200" />
                  <span className="text-xs font-black uppercase tracking-wider text-violet-100">
                    Specialisations ({formData.selectedSubSlugs.length})
                  </span>
                </div>
                <div className="p-4 bg-violet-50/30">
                  {/* Group by parent category */}
                  {(() => {
                    const grouped: Record<number, { parentName: string; accent: string; subs: string[] }> = {};
                    formData.selectedSubSlugs.forEach(subId => {
                      for (let mi = 0; mi < MODULES_DATA.length; mi++) {
                        const s = MODULES_DATA[mi].subModules.find(x => x.id === subId);
                        if (s) {
                          if (!grouped[mi]) grouped[mi] = { parentName: ADVISOR_CATEGORIES[mi]?.name || '', accent: MODULE_COLORS[mi % MODULE_COLORS.length].accent, subs: [] };
                          grouped[mi].subs.push(s.nameEn);
                          break;
                        }
                      }
                    });
                    return Object.entries(grouped).map(([idx, grp]) => (
                      <div key={idx} className="mb-3 last:mb-0">
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1.5 flex items-center gap-1"
                          style={{ color: grp.accent }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: grp.accent }} />
                          {grp.parentName}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pl-3">
                          {grp.subs.map(name => (
                            <span key={name}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 bg-white"
                              style={{ borderColor: `${grp.accent}50`, color: grp.accent, boxShadow: `inset 0 0 0 1px ${grp.accent}12` }}>
                              <Check size={10} style={{ color: grp.accent }} className="shrink-0" />
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* ── Availability ── */}
            {formData.slots.length > 0 && (
              <div className="rounded-2xl border border-sky-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'linear-gradient(90deg,#0c4a6e,#0369a1)' }}>
                  <Clock size={13} className="text-sky-200" />
                  <span className="text-xs font-black uppercase tracking-wider text-sky-100">Weekly Availability</span>
                </div>
                <div className="p-4 bg-sky-50/30">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DAYS.map((day, i) => {
                      const daySlots = formData.slots.filter(s => s.dayOfWeek === i);
                      if (daySlots.length === 0) return null;
                      return (
                        <div key={day} className="bg-white border-2 border-sky-200 rounded-xl px-3 py-2">
                          <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-1">{day}</p>
                          {daySlots.map(s => (
                            <p key={s.id} className="text-xs font-semibold text-gray-700">{s.startTime} – {s.endTime}</p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Confirm checkbox ── */}
            <label className="flex items-start gap-3 cursor-pointer rounded-2xl p-4 border-2 border-navy-200 bg-gradient-to-br from-navy-50 to-blue-50"
              style={{ borderColor: confirmed ? '#0B1F3A' : '#e5e7eb', background: confirmed ? 'linear-gradient(135deg,#eff6ff,#f0f9ff)' : '#f9fafb' }}>
              <div className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                style={{ borderColor: confirmed ? '#0B1F3A' : '#d1d5db', background: confirmed ? '#0B1F3A' : 'white' }}
                onClick={() => setConfirmed(p => !p)}>
                {confirmed && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm text-gray-700 select-none leading-relaxed">
                I confirm that all the above information is <strong className="text-gray-900">accurate and authentic</strong>. I agree to BrokerSaab&apos;s Advisor Terms and understand that providing false information may lead to immediate account suspension.
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                Back
              </button>
              {isAuthorized ? (
                <button onClick={() => { const err = validate('review', formData, confirmed); if (err) { setError(err); return; } setError(''); setStep('payment'); }}
                  disabled={!confirmed}
                  className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <CreditCard size={16} /> Proceed to Payment <ArrowRight size={14} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!confirmed || loading}
                  className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><ShieldCheck size={16} /> Submit for Verification</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step: Payment (AUTHORIZED only) ── */}
        {step === 'payment' && (
          <div className="p-6 sm:p-8 space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('review')} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all border border-gray-200">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Complete Payment to Submit</h2>
                <p className="text-sm text-gray-500">Your application will be submitted only after payment is confirmed.</p>
              </div>
            </div>

            {/* Money-back guarantee banner */}
            <div className="flex items-start gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-800">100% Money-Back Guarantee</p>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  Your money is completely safe. If your profile is rejected by our review team, <strong>100% of your payment will be refunded</strong> to your original payment method within 3–5 business days — no questions asked.
                </p>
              </div>
            </div>

            {/* Invoice Preview */}
            <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
              {/* Invoice header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a3a5c)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-navy-800 font-black text-xs" style={{ color: '#0B1F3A' }}>BS</span>
                    </div>
                    <span className="text-white font-black text-base tracking-tight">BrokerSaab</span>
                  </div>
                  <p className="text-white/50 text-[10px]">BrokerSaab Technology Pvt. Ltd.</p>
                  <p className="text-white/40 text-[10px]">GSTIN: 27AABCB1234A1Z5 · SAC: 9983</p>
                </div>
                <div className="text-right">
                  <p className="text-gold-400 font-black text-sm">PROFORMA INVOICE</p>
                  <p className="text-white/60 text-[10px] mt-0.5">INV-BS-{Date.now().toString().slice(-8)}</p>
                  <p className="text-white/60 text-[10px]">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Bill to */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Bill To</p>
                <p className="text-sm font-bold text-gray-800">{formData.fullName || 'Advisor Name'}</p>
                <p className="text-xs text-gray-500">{formData.email}</p>
                <p className="text-xs text-gray-500">+91 {formData.phoneNumber} · {formData.state}</p>
                {formData.gstNumber && <p className="text-xs text-gray-500">GSTIN: {formData.gstNumber}</p>}
              </div>

              {/* Line item */}
              <div className="px-5 py-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-200 pb-2">
                      <th className="text-left py-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Description</th>
                      <th className="text-right py-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3">
                        <p className="font-semibold text-gray-800">Authorized Advisor Subscription — Annual Plan (1 Year)</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">SAC 9983 · Platform access & authorized badge · Valid for 12 months</p>
                      </td>
                      <td className="py-3 text-right text-gray-800 font-semibold align-top">₹{ORIGINAL_PRICE.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Calculation breakdown */}
                <div className="mt-4 space-y-1.5 border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Original Price (MRP)</span>
                    <span>₹{ORIGINAL_PRICE.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>Promotional Discount (90.005%)</span>
                    <span>− ₹{DISCOUNT_AMT.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-dashed border-gray-300 pt-2 mt-2">
                    <span>Taxable Amount (Base)</span>
                    <span>₹{BASE_PRICE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>CGST @ 9%</span>
                    <span>₹{CGST_AMT.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>SGST @ 9%</span>
                    <span>₹{SGST_AMT.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-gray-900 border-t-2 border-gray-800 pt-3 mt-2">
                    <span>Total Payable (Incl. GST)</span>
                    <span style={{ color: '#0B1F3A' }}>₹{TOTAL_PAYABLE.toFixed(2)}</span>
                  </div>
                </div>

                <p className="mt-3 text-[10px] text-gray-400 text-center">
                  Amounts in Indian Rupees (INR). GST charged as per Indian taxation laws.
                </p>
              </div>
            </div>

            {/* Payment button */}
            {!paymentDone ? (
              <button
                disabled={paymentLoading}
                onClick={async () => {
                  setPaymentLoading(true); setError('');
                  try {
                    const token = localStorage.getItem('accessToken') || uploadedToken;
                    const orderRes = await fetch(`${API}/subscriptions/create-order`, {
                      method: 'POST', headers: { Authorization: `Bearer ${token}` }
                    });
                    const orderData = await orderRes.json();
                    if (!orderRes.ok) { setError(orderData.message || 'Could not initiate payment'); return; }

                    await new Promise<void>((resolve, reject) => {
                      const script = document.createElement('script');
                      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                      script.onload = () => resolve();
                      script.onerror = () => reject(new Error('Payment gateway unavailable'));
                      document.body.appendChild(script);
                    });

                    const rzp = new (window as any).Razorpay({
                      key: orderData.keyId,
                      amount: orderData.amount,
                      currency: 'INR',
                      name: 'BrokerSaab',
                      description: 'Authorized Advisor Subscription — 1 Year',
                      order_id: orderData.orderId,
                      theme: { color: '#D4AF37' },
                      prefill: { name: formData.fullName, email: formData.email, contact: `+91${formData.phoneNumber}` },
                      notes: { purpose: 'AUTHORIZED_ADVISOR_SUBSCRIPTION', advisorName: formData.fullName },
                      handler: async (response: any) => {
                        try {
                          const verifyRes = await fetch(`${API}/subscriptions/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                              razorpayOrderId: orderData.orderId,
                              razorpayPaymentId: response.razorpay_payment_id,
                              razorpaySignature: response.razorpay_signature,
                            }),
                          });
                          const vd = await verifyRes.json();
                          if (vd.success) {
                            setPaymentDone(true);
                            setInvoiceData({
                              invoiceNo: `BS-SUB-${Date.now().toString().slice(-8)}`,
                              paymentId: response.razorpay_payment_id,
                              orderId: orderData.orderId,
                              paidAt: new Date(),
                            });
                            // Auto-submit profile after payment
                            await handleSubmit();
                          } else {
                            setError('Payment verification failed. Please contact support with your Payment ID: ' + response.razorpay_payment_id);
                          }
                        } catch { setError('Payment verification error. Please contact support.'); }
                      },
                      modal: { ondismiss: () => setPaymentLoading(false) },
                    });
                    rzp.open();
                  } catch (e: any) { setError(e.message || 'Payment failed. Please try again.'); }
                  finally { setPaymentLoading(false); }
                }}
                className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#071527', boxShadow: '0 8px 24px rgba(212,175,55,0.35)', cursor: paymentLoading ? 'wait' : 'pointer' }}>
                {paymentLoading
                  ? <><Loader2 size={18} className="animate-spin" /> Processing Payment…</>
                  : <><CreditCard size={18} /> Pay ₹{TOTAL_PAYABLE.toFixed(2)} — Secure Checkout <ShieldCheck size={16} /></>}
              </button>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl">
                <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="font-black text-emerald-800">Payment Successful! Profile submitted.</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Payment ID: {invoiceData?.paymentId}</p>
                </div>
              </div>
            )}

            <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck size={12} /> Secured by Razorpay · UPI, Cards, Net Banking accepted · 100% refund if rejected
            </p>

            {/* Test mode bypass — remove before go-live */}
            {!paymentDone && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={async () => {
                  setPaymentLoading(true); setError('');
                  try {
                    const token = localStorage.getItem('accessToken') || uploadedToken;
                    const res = await fetch(`${API}/subscriptions/test-payment`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    if (data.success) {
                      setPaymentDone(true);
                      setInvoiceData({
                        invoiceNo: `BS-TEST-${Date.now().toString().slice(-8)}`,
                        paymentId: 'TEST_' + Date.now(),
                        orderId: 'TEST_ORDER_' + Date.now(),
                        paidAt: new Date(),
                      });
                      await handleSubmit();
                    } else {
                      setError(data.message || 'Test payment failed');
                    }
                  } catch { setError('Test payment error. Is the backend running?'); }
                  finally { setPaymentLoading(false); }
                }}
                className="w-full py-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 bg-amber-50 text-xs font-semibold hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
              >
                🧪 Test Mode — Skip Payment (Dev/Testing Only)
              </button>
            )}
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === 'success' && (
          <div className="p-6 sm:p-10 text-center">
            <div className="w-24 h-24 rounded-full bg-gold-500/10 border-2 border-gold-500/30 flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={48} className="text-gold-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Submitted!</h2>
            <p className="text-gray-500 text-sm mb-8">Our team will review your credentials and get back to you within 24–48 hours.</p>

            <div className="text-left space-y-4 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">What Happens Next</h3>
              {[
                { icon: Search, title: 'Profile Review (24–48h)', desc: 'Our team verifies your license number and credentials.' },
                { icon: ShieldCheck, title: 'Email Confirmation', desc: 'You receive a notification once your profile is approved.' },
                { icon: CheckCircle2, title: 'Go Live', desc: 'Your profile appears on BrokerSaab and clients can book you.' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Print / Download Application ── */}
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">Save Your Application</p>
              <div className="flex gap-3">
                <button
                  onClick={printApplication}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-navy-200 text-sm font-semibold text-navy-700 hover:bg-navy-50 transition-all"
                  style={{ borderColor: '#0B1F3A', color: '#0B1F3A' }}>
                  <Printer size={15} /> Print Application
                </button>
                <button
                  onClick={printApplication}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a3a5c)', color: '#D4AF37' }}>
                  <Download size={15} /> Download PDF
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">Opens print dialog — choose "Save as PDF" to download</p>
            </div>

            {/* Invoice download for AUTHORIZED advisors who paid */}
            {isAuthorized && invoiceData && (
              <div className="rounded-2xl border-2 border-gold-300 p-4" style={{ background: 'linear-gradient(135deg,#fffbf0,#fef9e7)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={16} className="text-gold-600 shrink-0" />
                  <span className="font-black text-gray-800 text-sm">Payment Confirmed · Authorized Badge Pending Approval</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">Invoice No: <strong>{invoiceData.invoiceNo}</strong> · Payment ID: <span className="font-mono text-[10px]">{invoiceData.paymentId}</span></p>
                <button
                  onClick={downloadInvoice}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a3a5c)', color: '#D4AF37' }}>
                  <Download size={15} /> Download GST Invoice (PDF)
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="btn-gold flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold">
                <Home size={15} /> Explore BrokerSaab
              </Link>
              <Link href="/auth/admin" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-all">
                <User size={15} /> Advisor Login
              </Link>
            </div>
          </div>
        )}

        {/* Card Footer */}
        {step !== 'success' && step !== 'welcome' && (
          <div className="px-6 pb-5 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/admin" className="text-gold-600 font-semibold hover:underline">Sign in here</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
