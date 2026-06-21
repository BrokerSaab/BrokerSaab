'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  UserPlus, CheckCircle2, Star, ArrowRight, AlertCircle, Loader2,
  Phone, Mail, Lock, Eye, EyeOff, User, Briefcase, FileCheck, Award,
  MapPin, Coins, FileText, Trash2, Plus, ShieldCheck, Check,
  Home, Shield, Scale, Percent, Landmark, CreditCard, Search, X,
  FileHeart, UserCheck, Lightbulb, Car, Users, GraduationCap,
  HeartHandshake, TrendingUp, Globe, Zap, Sprout, Laptop,
  Flag, Plane, School, ClipboardList,
  ChevronDown, ChevronRight, Sparkles, ArrowLeft, Printer, Download, Clock,
  Stethoscope, Package, CreditCard as IdCard
} from 'lucide-react';

import { MODULES_DATA, MODULE_COLORS, ICON_MAP } from '@/data/servicesData';
import { INDIA_STATES_SORTED } from '@/data/indiaStates';

const API = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  circle: string;
  subdivision: string;
  consultationFee: string;
  languages: string[];
  bio: string;
  selectedSlugs: string[];
  selectedSubSlugs: string[];
  customSpecializations: Record<string, string>;
  slots: Slot[];
  // New fields
  advisorType: 'REGULAR' | 'AUTHORIZED' | '';
  otpVerified: boolean;
  tempPhoneToken: string;
  identityProofType: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VOTER_ID' | 'PASSPORT' | '';
  identityNumber: string;
  identityFile: File | null;
  aadhaarNumber: string;
  aadhaarConsentGiven: boolean;
  aadhaarFile: File | null;
  passportPhotoFile: File | null;
  licenseFile: File | null;
  gstNumber: string;
  gstCertFile: File | null;
}

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STEP_ORDER: Step[] = ['welcome', 'phone_otp', 'advisor_type', 'account', 'profile', 'kyc', 'services', 'availability', 'review', 'payment', 'success'];

// GST constants (display-only â€” backend computes the actual charge)
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
  { name: 'Online Form & Doc Help',        slug: 'm19', icon: Laptop,        color: 'bg-purple-100', iconColor: 'text-purple-600', desc: 'Electronic form submissions, scans & document help' },
  { name: 'Central Government Schemes',    slug: 'm20', icon: Flag,          color: 'bg-orange-100', iconColor: 'text-orange-600', desc: 'PM-KISAN, Ayushman, Mudra Loan, PMAY & other central welfare schemes' },
  { name: 'Study Abroad Consulting',       slug: 'm21', icon: Plane,         color: 'bg-sky-100',    iconColor: 'text-sky-600',    desc: 'Foreign university admissions, SOP/LOR, student visa & pre-departure' },
  { name: 'Domestic College Admission',    slug: 'm22', icon: School,        color: 'bg-indigo-100', iconColor: 'text-indigo-600', desc: 'NEET/JEE/CAT counseling, seat allotment & college enrollment help' },
  { name: 'Job Placement & Recruitment',   slug: 'm23', icon: ClipboardList, color: 'bg-teal-100',   iconColor: 'text-teal-600',   desc: 'Resume building, interview prep, offer negotiation & post-placement' },
  { name: 'Visa & PR Immigration',         slug: 'm24', icon: FileCheck,     color: 'bg-red-100',    iconColor: 'text-red-600',    desc: 'Canada/UK/Australia PR, work permits, EOI, ITA & landing support' },
  { name: 'Tour & Travel',                 slug: 'm26', icon: MapPin,        color: 'bg-orange-100', iconColor: 'text-orange-600', desc: 'Bus, train & flight bookings, hotel stays, tour packages, cab services & travel insurance' },
  { name: 'Local Medical Representative',  slug: 'm27', icon: Stethoscope,  color: 'bg-teal-100',   iconColor: 'text-teal-600',   desc: 'Doctor visits, sample distribution, product detailing & pharma marketing' },
  { name: 'Local Distributors',            slug: 'm28', icon: Package,      color: 'bg-violet-100', iconColor: 'text-violet-600', desc: 'FMCG, pharma & agri-input wholesale distribution & last-mile delivery' },
  { name: 'Others / Custom Service',       slug: 'm25', icon: Sparkles,      color: 'bg-indigo-100', iconColor: 'text-indigo-600', desc: 'Any unique expertise not listed above â€” describe your own specialisation' },
];

const INITIAL_FORM: FormData = {
  phoneNumber: '', email: '', password: '', confirmPassword: '',
  fullName: '', businessName: '', licenseNumber: '', experienceYears: '',
  location: '', state: '', city: '', circle: '', subdivision: '', consultationFee: '', languages: [], bio: '',
  selectedSlugs: [], selectedSubSlugs: [], customSpecializations: {}, slots: [],
  advisorType: '', otpVerified: false, tempPhoneToken: '',
  identityProofType: '', identityNumber: '', identityFile: null,
  aadhaarNumber: '', aadhaarConsentGiven: false,
  aadhaarFile: null, passportPhotoFile: null, licenseFile: null,
  gstNumber: '', gstCertFile: null,
};

// â”€â”€ Email validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALLOWED_TLD1 = ['com','in','org','net','edu','gov','info','biz','io','me','co','ai','uk','us','au','ca','nz','sg','ae','de','fr','jp','tv'];
const ALLOWED_TLD2 = ['co.in','net.in','org.in','edu.in','gov.in','nic.in','ac.in','firm.in','gen.in','co.uk','com.au','co.nz','ac.uk','com.sg'];

function validateEmailStr(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return 'Email address is required.';
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._%+\-]*@[a-zA-Z0-9][a-zA-Z0-9.\-]*\.[a-zA-Z]{2,}$/.test(trimmed))
    return 'Enter a valid email (e.g. name@example.com or name@firm.co.in).';
  const domain = trimmed.split('@')[1];
  const parts = domain.split('.');
  if (parts.length >= 3) {
    const tld2 = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (ALLOWED_TLD2.includes(tld2)) return null;
  }
  const tld1 = parts[parts.length - 1];
  if (ALLOWED_TLD1.includes(tld1)) return null;
  return `Email domain not accepted. Use addresses ending in .com, .in, .co.in, .org, .net, .net.in, .edu, .gov.in, etc.`;
}

// â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function validate(step: Step, data: FormData, confirmed: boolean): string | null {
  if (step === 'phone_otp') {
    if (!data.otpVerified) return 'Please verify your mobile number with OTP first.';
  }
  if (step === 'advisor_type') {
    if (!data.advisorType) return 'Please select your advisor type to continue.';
  }
  if (step === 'account') {
    const emailErr = validateEmailStr(data.email);
    if (emailErr) return emailErr;
    if (data.password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Za-z]/.test(data.password) || !/[0-9]/.test(data.password)) return 'Password must contain both letters and numbers.';
    if (data.password !== data.confirmPassword) return 'Passwords do not match.';
  }
  if (step === 'kyc') {
    if (!data.identityProofType) return 'Please select an identity proof type.';
    if (!data.identityFile) return 'Please upload your identity proof document.';
    const idNum = data.identityNumber.replace(/[\s-]/g, '').toUpperCase();
    if (data.identityProofType === 'AADHAAR') {
      if (!/^[2-9][0-9]{11}$/.test(idNum)) return 'Enter a valid 12-digit Aadhaar number (must not start with 0 or 1).';
      if (!data.aadhaarConsentGiven) return 'You must consent to Aadhaar data processing to continue.';
    } else if (data.identityProofType === 'PAN') {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(idNum)) return 'Enter a valid PAN (e.g. ABCDE1234F â€” 5 letters, 4 digits, 1 letter).';
    } else if (data.identityProofType === 'DRIVING_LICENSE') {
      if (idNum.length < 10 || idNum.length > 16) return 'Enter a valid Driving License number (10â€“16 characters).';
    } else if (data.identityProofType === 'VOTER_ID') {
      if (!/^[A-Z]{3}[0-9]{7}$/.test(idNum)) return 'Enter a valid Voter ID (e.g. ABC1234567 â€” 3 letters + 7 digits).';
    } else if (data.identityProofType === 'PASSPORT') {
      if (!/^[A-Z][0-9]{7}$/.test(idNum)) return 'Enter a valid Passport number (e.g. A1234567 â€” 1 letter + 7 digits).';
    }
    if (!data.passportPhotoFile) return 'Please upload your passport-size photo.';
    if (data.advisorType === 'AUTHORIZED') {
      if (!data.licenseFile) return 'License copy is mandatory for Authorized Advisors.';
      if (!data.licenseNumber.trim()) return 'License number is mandatory for Authorized Advisors.';
    }
  }
  if (step === 'profile') {
    if (!data.fullName.trim()) return 'Full name is required.';
    if (data.fullName.trim().length > 100) return 'Full name must be 100 characters or less.';
    if (data.businessName.length > 150) return 'Business name must be 150 characters or less.';
    const exp = parseInt(data.experienceYears);
    if (isNaN(exp) || exp < 0 || exp > 50) return 'Enter valid years of experience (0â€“50).';
    if (!data.state) return 'Please select your state.';
    if (!data.city.trim()) return 'Please enter your city or area.';
    if (data.consultationFee && (isNaN(parseFloat(data.consultationFee)) || parseFloat(data.consultationFee) < 0)) return 'Enter a valid consultation fee.';
    if (data.languages.length === 0) return 'Add at least one language.';
    if (data.bio.trim().length < 50) return 'Bio must be at least 50 characters.';
    if (data.bio.trim().length > 500) return 'Bio must be 500 characters or less.';
    if (data.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(data.gstNumber.toUpperCase())) return 'Enter a valid 15-digit GSTIN (e.g. 22AAAAA0000A1Z5).';
  }
  if (step === 'services') {
    if (data.selectedSlugs.length === 0) return 'Select at least one service category.';
    const OPEN_SLUGS = ['m21', 'm22', 'm23', 'm24', 'm27', 'm28', 'm25'];
    const hasRegularModules = data.selectedSlugs.some(s => !OPEN_SLUGS.includes(s));
    if (hasRegularModules && data.selectedSubSlugs.length === 0) return 'Select at least one specific sub-service from your chosen modules.';
    for (const slug of data.selectedSlugs.filter(s => OPEN_SLUGS.includes(s))) {
      if (!data.customSpecializations?.[slug]?.trim()) {
        const nm = ADVISOR_CATEGORIES.find(c => c.slug === slug)?.name ?? slug;
        return `Please describe your specialisation for "${nm}".`;
      }
    }
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

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdvisorOnboarding() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('welcome');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tcAccepted, setTcAccepted] = useState(false);
  const [showTcDetail, setShowTcDetail] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [langInput, setLangInput] = useState('');
  const langInputRef = useRef<HTMLInputElement>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const subModulesRef = useRef<HTMLDivElement>(null);

  const update = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear the inline error for this field when user edits it
    if (fieldErrors[field as string]) setFieldErrors(prev => { const n = { ...prev }; delete n[field as string]; return n; });
  };

  const setFE = (field: string, msg: string) => setFieldErrors(prev => ({ ...prev, [field]: msg }));
  const clearFE = (field: string) => setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const blurField = (field: string, value: string) => {
    switch (field) {
      case 'email': { const e = validateEmailStr(value); e ? setFE('email', e) : clearFE('email'); break; }
      case 'password': {
        if (value.length < 8) setFE('password', 'Min. 8 characters required.');
        else if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) setFE('password', 'Must contain letters and numbers.');
        else clearFE('password');
        break;
      }
      case 'confirmPassword': {
        if (value !== formData.password) setFE('confirmPassword', 'Passwords do not match.');
        else clearFE('confirmPassword');
        break;
      }
      case 'fullName': {
        if (!value.trim()) setFE('fullName', 'Full name is required.');
        else if (value.trim().length > 100) setFE('fullName', 'Max 100 characters.');
        else clearFE('fullName');
        break;
      }
      case 'businessName': {
        if (value.length > 150) setFE('businessName', 'Max 150 characters.');
        else clearFE('businessName');
        break;
      }
      case 'bio': {
        if (value.trim().length > 0 && value.trim().length < 50) setFE('bio', 'Write at least 50 characters.');
        else if (value.trim().length > 500) setFE('bio', 'Max 500 characters.');
        else clearFE('bio');
        break;
      }
      case 'gstNumber': {
        if (value && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.toUpperCase()))
          setFE('gstNumber', 'Invalid GSTIN format (e.g. 22AAAAA0000A1Z5).');
        else clearFE('gstNumber');
        break;
      }
      case 'identityNumber': {
        if (!value.trim()) { setFE('identityNumber', 'Enter your identity number.'); break; }
        const v = value.replace(/[\s-]/g, '').toUpperCase();
        const t = formData.identityProofType;
        if (t === 'AADHAAR' && !/^[2-9][0-9]{11}$/.test(v)) setFE('identityNumber', 'Enter valid 12-digit Aadhaar (not starting with 0 or 1).');
        else if (t === 'PAN' && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v)) setFE('identityNumber', 'Invalid PAN format (e.g. ABCDE1234F).');
        else if (t === 'DRIVING_LICENSE' && (v.length < 10 || v.length > 16)) setFE('identityNumber', 'DL number must be 10â€“16 characters.');
        else if (t === 'VOTER_ID' && !/^[A-Z]{3}[0-9]{7}$/.test(v)) setFE('identityNumber', 'Invalid Voter ID (e.g. ABC1234567).');
        else if (t === 'PASSPORT' && !/^[A-Z][0-9]{7}$/.test(v)) setFE('identityNumber', 'Invalid Passport no. (e.g. A1234567).');
        else clearFE('identityNumber');
        break;
      }
    }
  };

  // Scroll to sub-modules smoothly when a module is selected/expanded
  useEffect(() => {
    if (expandedModule) {
      const timer = setTimeout(() => {
        subModulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [expandedModule]);

  const PROGRESS_STEPS = [
    t('onboard.progress.verify'),
    t('onboard.progress.type'),
    t('onboard.progress.account'),
    t('onboard.progress.profile'),
    t('onboard.progress.kyc'),
    t('onboard.progress.services'),
    t('onboard.progress.availability'),
    t('onboard.progress.review'),
  ];

  const handleClose = () => {
    if (window.confirm(t('onboard.cancel'))) {
      router.push('/');
    }
  };

  // â”€â”€ Resume session state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [resumeSession, setResumeSession] = useState<{
    currentStep: number;
    stepLabel: string;
    formSnapshot: any;
  } | null>(null);

  // â”€â”€ OTP sub-state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [otpSubStep, setOtpSubStep] = useState<'phone' | 'sent' | 'verified'>('phone');
  const [otpValue, setOtpValue] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  // â”€â”€ KYC upload state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [kycUploading, setKycUploading] = useState(false);
  const [uploadedAdvisorId, setUploadedAdvisorId] = useState('');
  const [uploadedToken, setUploadedToken] = useState('');

  // â”€â”€ Payment state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{
    invoiceNo: string; paymentId: string; orderId: string; paidAt: Date;
  } | null>(null);

  // â”€â”€ Progress indicator step index â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const progressIndex = (() => {
    const map: Partial<Record<Step, number>> = {
      phone_otp: 1, advisor_type: 2, account: 3, profile: 4, kyc: 5, services: 6, availability: 7, review: 8
    };
    return map[step] ?? 0;
  })();

  // AUTHORIZED advisors must pay before submit; payment step is inserted between review â†’ success
  const isAuthorized = formData.advisorType === 'AUTHORIZED';

  // â”€â”€ Onboarding progress fire-and-forget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        formSnapshot: {
          advisorType: formData.advisorType,
          fullName: formData.fullName,
          email: formData.email,
          state: formData.state,
          city: formData.city,
          circle: formData.circle,
          subdivision: formData.subdivision,
          businessName: formData.businessName,
          location: formData.location,
          experienceYears: formData.experienceYears,
          consultationFee: formData.consultationFee,
          languages: formData.languages,
          bio: formData.bio,
          selectedSlugs: formData.selectedSlugs,
          selectedSubSlugs: formData.selectedSubSlugs,
          customSpecializations: formData.customSpecializations,
          licenseNumber: formData.licenseNumber,
          gstNumber: formData.gstNumber,
        },
      }),
    }).catch(() => {});
  };

  // â”€â”€ Resume check after OTP verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const checkResumeSession = async (phone: string) => {
    try {
      const encoded = encodeURIComponent(`+91${phone}`);
      const r = await fetch(`${API}/advisors/onboarding-progress/${encoded}`);
      const d = await r.json();
      if (d.success && d.session && !d.session.advisorId && d.session.currentStep > 2) {
        setResumeSession({
          currentStep: d.session.currentStep,
          stepLabel: d.session.stepLabel,
          formSnapshot: d.session.formSnapshot || {},
        });
      }
    } catch { /* best-effort â€” ignore network errors */ }
  };

  // â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const goNext = () => {
    const err = validate(step, formData, confirmed);
    if (err) { setError(err); return; }
    setError('');
    setFieldErrors({});
    const idx = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[idx + 1];
    if (next) { setStep(next); trackProgress(next); }
  };

  const goBack = () => {
    setError('');
    setFieldErrors({});
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  // Navigate back to any already-completed step by clicking its badge
  const STEP_BY_INDEX: Partial<Record<number, Step>> = {
    1: 'phone_otp', 2: 'advisor_type', 3: 'account', 4: 'profile',
    5: 'kyc', 6: 'services', 7: 'availability', 8: 'review',
  };
  const goToStep = (num: number) => {
    const target = STEP_BY_INDEX[num];
    if (target && num < progressIndex) {
      setError('');
      setFieldErrors({});
      setStep(target);
    }
  };

  // â”€â”€ Language chip handling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Availability slot helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          circle: formData.circle || undefined,
          subdivision: formData.subdivision || undefined,
          consultationFee: formData.consultationFee ? parseFloat(formData.consultationFee) : undefined,
          languages: formData.languages,
          bio: finalBio,
        }),
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok || !signupData.success) {
        // Show specific field error if Zod returned one
        const fieldErr = signupData.errors?.[0];
        const detail = fieldErr ? ` (${fieldErr.field}: ${fieldErr.message})` : '';
        setError((signupData.message || 'Registration failed. Please try again.') + detail);
        setLoading(false);
        return;
      }

      const accessToken: string = signupData.tokens.accessToken;
      sessionStorage.setItem('accessToken', accessToken);
      sessionStorage.setItem('refreshToken', signupData.tokens.refreshToken);
      sessionStorage.setItem('user', JSON.stringify(signupData.user));
      setUploadedAdvisorId(signupData.user.advisorId || '');
      setUploadedToken(accessToken);

      // 2. Upload KYC documents
      const uploadDoc = async (file: File, docType: string, extra?: Record<string, string>) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('documentType', docType);
        if (extra) Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
        try {
          const r = await fetch(`${API}/advisors/documents`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: fd,
          });
          if (!r.ok) {
            const d = await r.json().catch(() => ({}));
            console.error(`[KYC upload ${docType}] failed:`, d.message);
          }
        } catch (err) {
          console.error(`[KYC upload ${docType}] network error:`, err);
        }
      };

      if (formData.identityFile) {
        const idDocTypeMap: Record<string, string> = {
          AADHAAR: 'AADHAAR_CARD', PAN: 'OTHER', DRIVING_LICENSE: 'LICENSE_COPY', VOTER_ID: 'OTHER', PASSPORT: 'OTHER',
        };
        const idDocType = idDocTypeMap[formData.identityProofType] ?? 'OTHER';
        const idExtra = formData.identityProofType === 'AADHAAR'
          ? { aadhaarNumber: formData.identityNumber.replace(/\D/g, '') }
          : {};
        await uploadDoc(formData.identityFile, idDocType, idExtra);
      }
      if (formData.passportPhotoFile) await uploadDoc(formData.passportPhotoFile, 'PASSPORT_PHOTO');
      if (formData.licenseFile) await uploadDoc(formData.licenseFile, 'LICENSE_COPY');
      if (formData.gstCertFile) await uploadDoc(formData.gstCertFile, 'GST_CERTIFICATE');

      // 3. Set categories â€” fatal: without this advisors won't appear in search
      if (formData.selectedSlugs.length > 0) {
        const catRes = await fetch(`${API}/advisors/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ categorySlugs: formData.selectedSlugs }),
        });
        if (!catRes.ok) {
          const catData = await catRes.json().catch(() => ({}));
          console.error('[onboarding] Category save failed:', catData.message);
          // Non-blocking â€” log but continue so advisor is still registered
        }
      }

      // 2b. Set specialisations (sub-services + custom open-module descriptions)
      const OPEN_SLUGS = ['m21', 'm22', 'm23', 'm24', 'm27', 'm28', 'm25'];
      const regularSpecs = formData.selectedSubSlugs.map(subId => {
        for (const mod of MODULES_DATA) {
          const sub = mod.subModules.find(s => s.id === subId);
          if (sub) return { slug: sub.id, name: sub.nameEn };
        }
        return null;
      }).filter(Boolean) as { slug: string; name: string }[];

      const customSpecs = Object.entries(formData.customSpecializations || {})
        .filter(([slug, text]) => formData.selectedSlugs.includes(slug) && OPEN_SLUGS.includes(slug) && text.trim())
        .map(([slug, text]) => ({ slug, name: text.trim() }));

      const allSpecs = [...regularSpecs, ...customSpecs];
      if (allSpecs.length > 0) {
        try {
          await fetch(`${API}/advisors/specializations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ specializations: allSpecs }),
          });
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

      // AUTHORIZED advisors go to payment step so they can pay before being submitted
      // REGULAR advisors are submitted immediately
      setStep(formData.advisorType === 'AUTHORIZED' ? 'payment' : 'success');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ Print / PDF download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const printApplication = () => {
    const selectedCats = ADVISOR_CATEGORIES.filter(c => formData.selectedSlugs.includes(c.slug));
    const subNames: string[] = formData.selectedSubSlugs.map(subId => {
      for (const mod of MODULES_DATA) {
        const s = mod.subModules.find(x => x.id === subId);
        if (s) return s.nameEn;
      }
      return '';
    }).filter(Boolean);

    const OPEN_SLUGS_PDF = ['m21', 'm22', 'm23', 'm24', 'm27', 'm28', 'm25'];
    const openSpecs: { catName: string; text: string; accent: string }[] = formData.selectedSlugs
      .filter(slug => OPEN_SLUGS_PDF.includes(slug) && formData.customSpecializations?.[slug]?.trim())
      .map(slug => {
        const catIdx = ADVISOR_CATEGORIES.findIndex(a => a.slug === slug);
        return {
          catName: ADVISOR_CATEGORIES[catIdx]?.name ?? slug,
          text: formData.customSpecializations![slug].trim(),
          accent: MODULE_COLORS[catIdx % MODULE_COLORS.length].accent,
        };
      });

    const availLines = DAYS.map((day, i) => {
      const slots = formData.slots.filter(s => s.dayOfWeek === i);
      if (!slots.length) return '';
      return `<tr><td style="padding:6px 12px;font-weight:600;color:#374151;">${day}</td><td style="padding:6px 12px;color:#374151;">${slots.map(s => `${s.startTime} â€“ ${s.endTime}`).join(', ')}</td></tr>`;
    }).filter(Boolean).join('');

    const printDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>BrokerSaab Advisor Application â€” ${formData.fullName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; padding: 32px; max-width: 800px; margin: 0 auto; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #D4AF37; padding-bottom:16px; margin-bottom:24px; }
  .logo { display:flex; align-items:center; gap:10px; font-size:22px; font-weight:900; color:#fff; }
  .logo-img { width:40px; height:40px; object-fit:contain; background:#0B1F3A; border-radius:10px; padding:4px; }
  .logo-text { color:#fff; }
  .logo-text span { color:#D4AF37; }
  .logo-sub { font-size:13px; font-weight:600; color:#6b7280; display:block; margin-top:2px; }
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
<div class="header" style="background:#0B1F3A;padding:16px 20px;border-radius:10px 10px 0 0;margin:-32px -32px 24px;border-bottom:3px solid #D4AF37;">
  <div class="logo">
    <img src="${window.location.origin}/logo-icon.png" alt="BrokerSaab" class="logo-img" />
    <div><span class="logo-text">Broker<span>Saab</span></span><span class="logo-sub">Advisor Application</span></div>
  </div>
  ${formData.advisorType === 'AUTHORIZED' ? '<span class="badge">â˜… Authorized Advisor</span>' : '<span style="font-size:11px;color:#9ca3af;font-weight:600;">Regular Advisor</span>'}
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
    ${formData.consultationFee ? `<div class="field"><label>Consultation Fee</label><span>â‚¹${formData.consultationFee} / session</span></div>` : ''}
    ${formData.licenseNumber ? `<div class="field"><label>License No.</label><span>${formData.licenseNumber}</span></div>` : ''}
    ${formData.gstNumber ? `<div class="field"><label>GST No.</label><span>${formData.gstNumber}</span></div>` : ''}
    ${formData.identityFile ? `<div class="field"><label>Identity Proof</label><span>${({ AADHAAR: 'Aadhaar Card', PAN: 'PAN Card', DRIVING_LICENSE: 'Driving License', VOTER_ID: 'Voter ID', PASSPORT: 'Passport' } as any)[formData.identityProofType] ?? 'Identity Proof'} âœ“</span></div>` : ''}
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

${openSpecs.length > 0 ? `<div class="section">
  <div class="section-header" style="background:linear-gradient(90deg,#1e3a2f,#14532d);color:#bbf7d0;">Open-Module Specialisations (${openSpecs.length})</div>
  <div class="section-body">${openSpecs.map(sp => `
    <div style="margin-bottom:10px;padding:10px 12px;border-radius:8px;border-left:3px solid ${sp.accent};background:${sp.accent}08;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:${sp.accent};margin-bottom:4px;">${sp.catName}</div>
      <div style="font-size:12px;color:#374151;line-height:1.5;">${sp.text}</div>
    </div>`).join('')}
  </div>
</div>` : ''}

${availLines ? `<div class="section">
  <div class="section-header" style="background:linear-gradient(90deg,#0c4a6e,#0369a1);color:#bae6fd;">Weekly Availability</div>
  <div class="section-body"><table class="avail-table">${availLines}</table></div>
</div>` : ''}

<div class="footer">
  <span>BrokerSaab Technology Pvt. Ltd. Â· Trusted Advisory Platform</span>
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

  // â”€â”€ GST Invoice download â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const downloadInvoice = () => {
    if (!invoiceData) return;
    const inv = invoiceData;
    const dateStr = inv.paidAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<title>Tax Invoice â€” BrokerSaab â€” ${inv.invoiceNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;background:#fff;padding:0;}
  .page{max-width:794px;margin:0 auto;padding:36px 40px;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:3px solid #D4AF37;}
  .logo-wrap{display:flex;align-items:center;gap:10px;}
  .logo-box{width:44px;height:44px;background:#0B1F3A;border-radius:10px;overflow:hidden;padding:4px;}
  .logo-box img{width:100%;height:100%;object-fit:contain;}
  .company-name{font-size:22px;font-weight:900;color:#0B1F3A;letter-spacing:-0.5px;}
  .company-name span{color:#D4AF37;}
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
    <div class="logo-box"><img src="${window.location.origin}/logo-icon.png" alt="BrokerSaab" /></div>
    <div>
      <div class="company-name">Broker<span>Saab</span></div>
      <div class="company-sub">BrokerSaab Technology Pvt. Ltd.</div>
      <div class="company-sub">GSTIN: 27AABCB1234A1Z5 &nbsp;|&nbsp; PAN: AABCB1234A</div>
      <div class="company-sub">Mumbai, Maharashtra â€” 400001 &nbsp;|&nbsp; support@brokersaab.com</div>
    </div>
  </div>
  <div class="inv-title">
    <h1>Tax Invoice</h1>
    <p><strong>Invoice No:</strong> ${inv.invoiceNo}</p>
    <p><strong>Date:</strong> ${dateStr}</p>
    <p><strong>Payment ID:</strong> ${inv.paymentId}</p>
    <p><strong>Order ID:</strong> ${inv.orderId}</p>
    <span class="badge">PAID âœ“</span>
  </div>
</div>

<div class="two-col">
  <div class="box">
    <div class="box-label">From (Seller)</div>
    <h3>BrokerSaab Technology Pvt. Ltd.</h3>
    <p>GSTIN: 27AABCB1234A1Z5<br/>SAC Code: 9983<br/>Mumbai, Maharashtra â€” 400001<br/>India</p>
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
      <th>Unit Price (â‚¹)</th>
      <th>Taxable Amt (â‚¹)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <strong>Authorized Advisor Subscription â€” Annual Plan</strong><br/>
        <span style="font-size:10px;color:#6b7280;">Platform access, Authorized badge &amp; priority search listing<br/>Validity: 12 months from activation</span>
      </td>
      <td>9983</td>
      <td>1</td>
      <td>â‚¹${BASE_PRICE.toLocaleString('en-IN')}.00</td>
      <td>â‚¹${BASE_PRICE.toLocaleString('en-IN')}.00</td>
    </tr>
  </tbody>
</table>

<div class="total-section">
  <div class="total-row" style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
    <span>MRP / Original Price</span><span>â‚¹${ORIGINAL_PRICE.toLocaleString('en-IN')}.00</span>
  </div>
  <div class="total-row discount" style="border-bottom:1px solid #e5e7eb;">
    <span>Promotional Discount (90.005% off)</span><span>âˆ’ â‚¹${DISCOUNT_AMT.toLocaleString('en-IN')}.00</span>
  </div>
  <div class="total-row" style="font-weight:700;border-bottom:1px solid #e5e7eb;">
    <span>Taxable Amount (after discount)</span><span>â‚¹${BASE_PRICE.toFixed(2)}</span>
  </div>
  <div class="total-row tax" style="border-bottom:1px solid #e5e7eb;">
    <span>CGST @ 9% (Central GST)</span><span>â‚¹${CGST_AMT.toFixed(2)}</span>
  </div>
  <div class="total-row tax" style="border-bottom:1px solid #e5e7eb;">
    <span>SGST @ 9% (State GST â€” Maharashtra)</span><span>â‚¹${SGST_AMT.toFixed(2)}</span>
  </div>
  <div class="total-row grand">
    <span>TOTAL AMOUNT PAID (Inclusive of GST)</span><span>â‚¹${TOTAL_PAYABLE.toFixed(2)}</span>
  </div>
</div>

<div class="guarantee-box">
  <strong>100% Refund Policy:</strong> If your advisor profile is rejected by the BrokerSaab review team, the full amount of â‚¹${TOTAL_PAYABLE.toFixed(2)} will be refunded to your original payment method within 3â€“5 business days. No deductions.
</div>

<div class="footer">
  <div>
    <p>This is a computer-generated invoice. No signature required.</p>
    <p style="margin-top:4px;">BrokerSaab Technology Pvt. Ltd. Â· CIN: U72900MH2024PTC000000</p>
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

  // â”€â”€ Shared input style â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const inputWrap = 'flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all bg-white';
  const inputWrapErr = 'flex items-center border-2 border-red-400 rounded-xl overflow-hidden focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-400/20 transition-all bg-white';
  const fw = (field: string) => fieldErrors[field] ? inputWrapErr : inputWrap;
  const inputIcon = 'px-3 text-slate-400';
  const inputBase = 'flex-1 px-3 py-2.5 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400';
  const FieldErr = ({ field }: { field: string }) => fieldErrors[field]
    ? <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} className="shrink-0"/>{fieldErrors[field]}</p>
    : null;

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-3" style={{ background: 'linear-gradient(135deg,#0B1F3A 0%,#1a1040 50%,#0B1F3A 100%)' }}>
      {/* Subtle radial glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle,#D4AF37,transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle,#4F46E5,transparent 70%)' }} />
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden flex flex-col relative z-10" style={{ maxHeight: '95dvh', boxShadow: '0 25px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.2)' }}>

        {/* Card Header â€” mirrors auth pages */}
        {step !== 'success' && (
          <div className="px-4 py-3 relative shrink-0" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#D4AF37 30%,#D4AF37 70%,transparent)' }} />
            {/* Horizontal logo */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-white rounded-lg overflow-hidden p-0.5 shrink-0 shadow-sm">
                <img src="/logo-icon.png" alt="BrokerSaab" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-black tracking-tight text-white">
                Broker<span style={{ color: '#D4AF37' }}>Saab</span>
              </span>
            </div>
            <h1 className="text-lg font-black text-white leading-tight">{t('onboard.title')}</h1>
            <p className="text-white/50 text-xs mt-0.5">{t('onboard.sub')}</p>
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1"
              aria-label="Close onboarding"
              title="Cancel Onboarding"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Progress Bar (steps 2â€“6) */}
        {progressIndex > 0 && step !== 'success' && (
          <div className="flex items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
            {PROGRESS_STEPS.map((label, i) => {
              const num = i + 1;
              const done = num < progressIndex;
              const active = num === progressIndex;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => goToStep(num)}
                      disabled={!done}
                      title={done ? `Go back to ${label}` : undefined}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        done ? 'bg-[#0B1F3A] text-white cursor-pointer hover:bg-indigo-700 hover:scale-110 ring-2 ring-offset-1 ring-[#D4AF37]/60' :
                        active ? 'bg-[#D4AF37] text-[#0B1F3A] cursor-default' :
                        'border-2 border-gray-200 text-gray-400 bg-white cursor-default'
                      }`}
                    >
                      {done ? <Check size={11} /> : num}
                    </button>
                    <span className={`text-[9px] mt-0.5 font-medium hidden sm:block ${done ? 'text-[#B48C22] cursor-pointer' : active ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {i < PROGRESS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-[#D4AF37]' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Scrollable step content */}
        <div className="flex-1 overflow-y-auto min-h-0">

        {/* Error Badge */}
        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* â”€â”€ Step: Welcome â”€â”€ */}
        {step === 'welcome' && (
          <div className="p-4 sm:p-5">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <UserPlus size={30} className="text-indigo-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {t('onboard.welcome.heading').split(' ').slice(0,2).join(' ')} <span className="text-indigo-600 font-bold">{t('onboard.welcome.heading').split(' ').slice(2).join(' ')}</span>
              </h1>
              <p className="text-sm text-gray-500">{t('onboard.welcome.sub')}</p>
            </div>

            {/* How It Works */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('onboard.welcome.howTitle')}</h2>
              <div className="space-y-3">
                {[
                  { n: '1', title: t('onboard.welcome.step1Title'), desc: t('onboard.welcome.step1Desc') },
                  { n: '2', title: t('onboard.welcome.step2Title'), desc: t('onboard.welcome.step2Desc') },
                  { n: '3', title: t('onboard.welcome.step3Title'), desc: t('onboard.welcome.step3Desc') },
                  { n: '4', title: t('onboard.welcome.step4Title'), desc: t('onboard.welcome.step4Desc') },
                ].map(item => (
                  <div key={item.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-indigo-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{item.n}</div>
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
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('onboard.welcome.reqTitle')}</h2>
                <ul className="space-y-2">
                  {[
                    t('onboard.welcome.req1'),
                    t('onboard.welcome.req2'),
                    t('onboard.welcome.req3'),
                    t('onboard.welcome.req4'),
                  ].map(req => (
                    <li key={req} className="flex gap-2 items-start text-sm text-gray-700">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div className="bg-indigo-500/5 rounded-2xl p-4 border border-indigo-500/20">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('onboard.welcome.benTitle')}</h2>
                <ul className="space-y-2">
                  {[
                    t('onboard.welcome.ben1'),
                    t('onboard.welcome.ben2'),
                    t('onboard.welcome.ben3'),
                    t('onboard.welcome.ben4'),
                  ].map(b => (
                    <li key={b} className="flex gap-2 items-start text-sm text-gray-700">
                      <Star size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => { setError(''); setStep('phone_otp'); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
              <ArrowRight size={16} /> {t('onboard.welcome.acceptBtn')}
            </button>
          </div>
        )}

        {/* â”€â”€ Step: Phone OTP â”€â”€ */}
        {step === 'phone_otp' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('onboard.otp.title')}</h2>
              <p className="text-sm text-gray-500">{t('onboard.otp.sub')}</p>
            </div>

            {/* Phone entry */}
            {(otpSubStep === 'phone' || otpSubStep === 'sent') && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.otp.phoneLabel')}</label>
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

            {/* T&C checkbox â€” shown only before OTP is sent */}
            {otpSubStep === 'phone' && (
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  aria-label="Accept terms"
                  onClick={() => setTcAccepted(p => !p)}
                  className="mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                  style={{ borderColor: tcAccepted ? '#10b981' : '#d1d5db', background: tcAccepted ? '#10b981' : 'white' }}
                >
                  {tcAccepted && <CheckCircle2 size={10} className="text-white" />}
                </button>
                <span className="text-xs text-gray-500 leading-relaxed select-none">
                  I agree to the{' '}
                  <button type="button"
                    className="text-indigo-600 font-semibold underline underline-offset-2 hover:text-indigo-800 transition-colors"
                    onClick={() => setShowTcDetail(true)}>Terms & Conditions</button>
                  {' '}&{' '}
                  <button type="button"
                    className="text-indigo-600 font-semibold underline underline-offset-2 hover:text-indigo-800 transition-colors"
                    onClick={() => setShowTcDetail(true)}>Privacy Policy</button>
                </span>
              </div>
            )}

            {/* Send OTP button */}
            {otpSubStep === 'phone' && (
              <button
                disabled={formData.phoneNumber.length !== 10 || otpLoading || !tcAccepted}
                onClick={async () => {
                  if (formData.phoneNumber.length !== 10 || !tcAccepted) return;
                  setOtpLoading(true); setError('');
                  try {
                    const r = await fetch(`${API}/auth/otp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phoneNumber: `+91${formData.phoneNumber}` }) });
                    const d = await r.json();
                    if (!r.ok) { setError(d.message || 'Failed to send OTP'); return; }
                    if (d.devOtp) setDevOtp(d.devOtp);
                    setOtpSubStep('sent');
                    setOtpCooldown(30);
                    const timer = setInterval(() => setOtpCooldown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; }), 1000);
                  } catch { setError('Network error. Please try again.'); }
                  finally { setOtpLoading(false); }
                }}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: (formData.phoneNumber.length === 10 && tcAccepted) ? 'linear-gradient(135deg,#D4AF37,#B48C22)' : '#e5e7eb',
                  color: (formData.phoneNumber.length === 10 && tcAccepted) ? '#0B1F3A' : '#9ca3af',
                  cursor: (formData.phoneNumber.length === 10 && tcAccepted) ? 'pointer' : 'not-allowed',
                }}>
                {otpLoading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('onboard.otp.sending')}</span> : t('onboard.otp.sendOtp')}
              </button>
            )}

            {/* OTP input + verify */}
            {otpSubStep === 'sent' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-600">{t('onboard.otp.enterOtp')}</label>
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
                      // Block only if already an advisor
                      if (d.isNewUser === false && d.user?.role === 'ADVISOR') {
                        setError('This mobile number is already registered as an advisor. Please login to your advisor dashboard instead.');
                        return;
                      }
                      // Existing CLIENT accounts are allowed to proceed with advisor registration
                      update('otpVerified', true);
                      if (d.tempToken) update('tempPhoneToken', d.tempToken);
                      setOtpSubStep('verified');
                      checkResumeSession(formData.phoneNumber);
                    } catch { setError('Network error. Please try again.'); }
                    finally { setOtpLoading(false); }
                  }}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ background: otpValue.length === 6 ? 'linear-gradient(135deg,#D4AF37,#B48C22)' : '#e5e7eb', color: otpValue.length === 6 ? '#0B1F3A' : '#9ca3af' }}>
                  {otpLoading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('onboard.otp.verifying')}</span> : t('onboard.otp.verifyOtp')}
                </button>
                {otpCooldown === 0 ? (
                  <button onClick={() => setOtpSubStep('phone')} className="w-full text-xs text-indigo-600 hover:text-indigo-800 underline py-1">{t('onboard.otp.resend')}</button>
                ) : (
                  <p className="text-center text-xs text-gray-400">{t('onboard.otp.resendIn')}{otpCooldown}s</p>
                )}
              </div>
            )}

            {/* Verified state */}
            {otpSubStep === 'verified' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 size={22} className="text-green-500 shrink-0" />
                <div>
                  <p className="font-bold text-green-700 text-sm">+91 {formData.phoneNumber} {t('onboard.otp.verified')}</p>
                  <p className="text-green-600 text-xs">{t('onboard.otp.verifiedSub')}</p>
                </div>
              </div>
            )}

            {/* Resume banner â€” shown when returning advisor has a saved session */}
            {otpSubStep === 'verified' && resumeSession && (
              <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Clock size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-indigo-800">
                    <strong>{t('onboard.otp.welcomeBack')}</strong> {t('onboard.otp.stoppedAt')} <strong>{resumeSession.stepLabel.replace(/_/g, ' ')}</strong> (step {resumeSession.currentStep}/8). {t('onboard.otp.resumeQ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const s = resumeSession.formSnapshot;
                      setFormData(prev => ({
                        ...prev,
                        advisorType: s.advisorType || prev.advisorType,
                        fullName: s.fullName || prev.fullName,
                        email: s.email || prev.email,
                        state: s.state || prev.state,
                        city: s.city || prev.city,
                        circle: s.circle || prev.circle,
                        subdivision: s.subdivision || prev.subdivision,
                        businessName: s.businessName || prev.businessName,
                        location: s.location || prev.location,
                        experienceYears: s.experienceYears || prev.experienceYears,
                        consultationFee: s.consultationFee || prev.consultationFee,
                        languages: s.languages?.length ? s.languages : prev.languages,
                        bio: s.bio || prev.bio,
                        selectedSlugs: s.selectedSlugs?.length ? s.selectedSlugs : prev.selectedSlugs,
                        selectedSubSlugs: s.selectedSubSlugs?.length ? s.selectedSubSlugs : prev.selectedSubSlugs,
                        customSpecializations: s.customSpecializations || prev.customSpecializations,
                        licenseNumber: s.licenseNumber || prev.licenseNumber,
                        gstNumber: s.gstNumber || prev.gstNumber,
                      }));
                      setResumeSession(null);
                      setStep(resumeSession.stepLabel as Step);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}
                  >
                    {t('onboard.otp.continueFrom')} {resumeSession.stepLabel.replace(/_/g, ' ')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeSession(null)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-indigo-700 border-2 border-indigo-300 bg-white hover:bg-indigo-50 transition-all"
                  >
                    {t('onboard.otp.startFresh')}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">{t('onboard.btn.back')}</button>
              <button onClick={goNext} disabled={!formData.otpVerified} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-40">
                {t('onboard.btn.next')} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Step: Advisor Type â”€â”€ */}
        {step === 'advisor_type' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('onboard.type.title')}</h2>
              <p className="text-sm text-gray-500">{t('onboard.type.sub')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Regular */}
              <button
                onClick={() => { update('advisorType', 'REGULAR'); setError(''); }}
                className="text-left p-5 rounded-2xl border-2 transition-all"
                style={{ borderColor: formData.advisorType === 'REGULAR' ? '#D4AF37' : '#e5e7eb', background: formData.advisorType === 'REGULAR' ? 'linear-gradient(135deg,#fffbf0,#fef9e7)' : '#fafafa', boxShadow: formData.advisorType === 'REGULAR' ? '0 0 0 3px rgba(212,175,55,0.15)' : 'none' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-gray-800 text-base">Regular Advisor</span>
                  {formData.advisorType === 'REGULAR' && <CheckCircle2 size={20} className="text-[#D4AF37]" />}
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
                style={{ borderColor: formData.advisorType === 'AUTHORIZED' ? '#D4AF37' : '#e5e7eb', background: formData.advisorType === 'AUTHORIZED' ? 'linear-gradient(135deg,#0B1F3A,#1a1040)' : '#0B1F3A', boxShadow: formData.advisorType === 'AUTHORIZED' ? '0 0 0 3px rgba(212,175,55,0.25)' : 'none' }}>
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-black" style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                  90% OFF
                </div>
                <div className="flex items-center justify-between mb-3 pr-14">
                  <span className="font-black text-white text-base">Authorized Advisor</span>
                  {formData.advisorType === 'AUTHORIZED' && <CheckCircle2 size={20} className="text-[#D4AF37]" />}
                </div>
                <div className="mb-3">
                  <span className="text-xs text-white/50 line-through">â‚¹19,999/year</span>
                  <span className="text-lg font-black text-[#D4AF37] ml-2">â‚¹1,999</span>
                  <span className="text-xs text-white/60">/year</span>
                </div>
                <ul className="space-y-1.5">
                  {['All Regular Advisor benefits','Blue "Authorized" badge on profile','Priority placement in search results','License verification (mandatory)','GST number support (optional)','Preferred by clients â€” builds trust'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/80"><Check size={13} className="text-[#D4AF37] shrink-0" />{f}</li>
                  ))}
                </ul>
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">{t('onboard.btn.back')}</button>
              <button onClick={goNext} disabled={!formData.advisorType} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-40">
                {t('onboard.btn.next')} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Step: Account â”€â”€ */}
        {step === 'account' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('onboard.account.title')}</h2>
              <p className="text-sm text-gray-500">{t('onboard.account.sub')}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.otp.phoneLabel')}</label>
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
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.account.emailLabel')}</label>
              <div className={fw('email')}>
                <Mail size={16} className={inputIcon} />
                <input type="email" placeholder="name@example.com or name@firm.co.in"
                  value={formData.email}
                  onChange={e => update('email', e.target.value)}
                  onBlur={e => blurField('email', e.target.value)}
                  className={inputBase} />
              </div>
              <FieldErr field="email" />
              {!fieldErrors.email && (
                <p className="text-[10px] text-gray-400 mt-1">Accepted: .com · .in · .co.in · .org · .net · .net.in · .edu · .gov.in · .info · .biz</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.account.pwdLabel')}</label>
              <div className={fw('password')}>
                <Lock size={16} className={inputIcon} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters — letters + numbers"
                  value={formData.password}
                  onChange={e => update('password', e.target.value)}
                  onBlur={e => blurField('password', e.target.value)}
                  className={inputBase} />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="pr-3 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldErr field="password" />
              {!fieldErrors.password && formData.password.length > 0 && (
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${formData.password.length >= 8 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>8+ chars</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${/[A-Za-z]/.test(formData.password) ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>letters</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${/[0-9]/.test(formData.password) ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>numbers</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.account.confirmPwdLabel')}</label>
              <div className={fw('confirmPassword')}>
                <Lock size={16} className={inputIcon} />
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  onBlur={e => blurField('confirmPassword', e.target.value)}
                  className={inputBase} />
                <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="pr-3 text-slate-400 hover:text-slate-600">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldErr field="confirmPassword" />
              {!fieldErrors.confirmPassword && formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password && (
                <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={11}/>Passwords match</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                {t('onboard.btn.back')}
              </button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                {t('onboard.btn.next')} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Step: Profile â”€â”€ */}
        {step === 'profile' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('onboard.profile.title')}</h2>
              <p className="text-sm text-gray-500">{t('onboard.profile.sub')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600">{t('onboard.profile.nameLabel')}</label>
                  <span className={`text-[10px] ${formData.fullName.length > 90 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{formData.fullName.length}/100</span>
                </div>
                <div className={fw('fullName')}>
                  <User size={16} className={inputIcon} />
                  <input type="text" maxLength={100} placeholder="As on your license" value={formData.fullName}
                    onChange={e => update('fullName', e.target.value)}
                    onBlur={e => blurField('fullName', e.target.value)}
                    className={inputBase} />
                </div>
                <FieldErr field="fullName" />
              </div>

              {/* Business Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600">{t('onboard.profile.bizNameLabel')} <span className="text-gray-400 font-normal">(optional)</span></label>
                  <span className={`text-[10px] ${formData.businessName.length > 140 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{formData.businessName.length}/150</span>
                </div>
                <div className={fw('businessName')}>
                  <Briefcase size={16} className={inputIcon} />
                  <input type="text" maxLength={150} placeholder="e.g. Sen & Associates" value={formData.businessName}
                    onChange={e => update('businessName', e.target.value)}
                    onBlur={e => blurField('businessName', e.target.value)}
                    className={inputBase} />
                </div>
                <FieldErr field="businessName" />
              </div>

              {/* License */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.licenseLabel')} <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className={inputWrap}>
                  <FileCheck size={16} className={inputIcon} />
                  <input type="text" placeholder="e.g. BAR/MH/12345" value={formData.licenseNumber}
                    onChange={e => update('licenseNumber', e.target.value)} className={inputBase} />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.expLabel')}</label>
                <div className={inputWrap}>
                  <Award size={16} className={inputIcon} />
                  <input type="number" min="0" step="1" placeholder="e.g. 8" value={formData.experienceYears}
                    onChange={e => update('experienceYears', e.target.value)} className={inputBase} />
                </div>
              </div>

              {/* State + City structured location */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.stateLabel')}</label>
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
                      <option value="">Select your stateâ€¦</option>
                      {INDIA_STATES_SORTED.map(st => (
                        <option key={st.id} value={st.name}>{st.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.cityLabel')}</label>
                  <div className={inputWrap}>
                    <MapPin size={16} className={inputIcon} />
                    <input
                      type="text"
                      placeholder={formData.state
                        ? `e.g. ${(INDIA_STATES_SORTED.find(s => s.name === formData.state)?.cities[0]) ?? 'Your city'}`
                        : 'Select state firstâ€¦'}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.feeLabel')} <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className={inputWrap}>
                  <span className="px-3 py-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-600 font-bold">â‚¹</span>
                  <input type="number" min="0" placeholder="e.g. 1500" value={formData.consultationFee}
                    onChange={e => update('consultationFee', e.target.value)} className={inputBase} />
                </div>
              </div>

              {/* Circle */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.circleLabel')} <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className={inputWrap}>
                  <MapPin size={16} className={inputIcon} />
                  <input type="text" placeholder="e.g. Raxaul Circle, Motihari Block"
                    value={formData.circle}
                    onChange={e => update('circle', e.target.value)} className={inputBase} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Clients can find you by searching your circle or block name</p>
              </div>

              {/* Subdivision */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.subdivLabel')} <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className={inputWrap}>
                  <MapPin size={16} className={inputIcon} />
                  <input type="text" placeholder="e.g. East Champaran, Gopalganj"
                    value={formData.subdivision}
                    onChange={e => update('subdivision', e.target.value)} className={inputBase} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Revenue subdivision or district â€” used as a search keyword</p>
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.langLabel')}</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.languages.map(lang => (
                  <span key={lang} className="flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-medium px-3 py-1 rounded-full">
                    {lang}
                    <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-500 ml-0.5">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className={inputWrap}>
                <input ref={langInputRef} type="text" placeholder={t('onboard.profile.langPlaceholder')} value={langInput}
                  onChange={e => setLangInput(e.target.value)} onKeyDown={handleLangKey} className={inputBase} />
                <button type="button" onClick={addLanguage} className="pr-3 text-indigo-500 hover:text-indigo-600">
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add a language</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('onboard.profile.bioLabel')}</label>
              <textarea rows={3} placeholder="Describe your expertise, approach, and what clients can expect when working with you. (minimum 50 characters)"
                value={formData.bio}
                onChange={e => update('bio', e.target.value)}
                onBlur={e => blurField('bio', e.target.value)}
                className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none transition-all ${fieldErrors.bio ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`} />
              <div className="flex justify-between mt-1">
                {fieldErrors.bio
                  ? <p className="text-[11px] text-red-500 flex items-center gap-1"><AlertCircle size={11}/>{fieldErrors.bio}</p>
                  : <p className="text-xs text-gray-400">Min 50 · Max 500 characters</p>
                }
                <p className={`text-xs font-medium ${formData.bio.trim().length < 50 ? 'text-red-400' : formData.bio.trim().length > 450 ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {formData.bio.trim().length} / 500
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                {t('onboard.btn.back')}
              </button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                {t('onboard.btn.next')} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Step: KYC Upload â”€â”€ */}
        {step === 'kyc' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('onboard.kyc.title')}</h2>
              <p className="text-sm text-gray-500">
                {t('onboard.kyc.sub')}
              </p>
            </div>

            {/* Identity Proof Type Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">Identity Proof Type <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([
                  { value: 'AADHAAR',         label: 'Aadhaar Card',     hint: '12-digit number', icon: ShieldCheck },
                  { value: 'PAN',             label: 'PAN Card',         hint: 'e.g. ABCDE1234F', icon: CreditCard },
                  { value: 'DRIVING_LICENSE', label: 'Driving License',  hint: '10â€“16 chars',     icon: Car },
                  { value: 'VOTER_ID',        label: 'Voter ID (EPIC)',  hint: 'e.g. ABC1234567', icon: UserCheck },
                  { value: 'PASSPORT',        label: 'Passport',         hint: 'e.g. A1234567',   icon: Globe },
                ] as const).map(({ value, label, hint, icon: Icon }) => (
                  <button key={value} type="button"
                    onClick={() => { update('identityProofType', value); update('identityNumber', ''); update('identityFile', null); update('aadhaarConsentGiven', false); }}
                    className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${formData.identityProofType === value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={13} className={formData.identityProofType === value ? 'text-indigo-600' : 'text-gray-400'} />
                      <span className={`text-xs font-bold ${formData.identityProofType === value ? 'text-indigo-700' : 'text-gray-700'}`}>{label}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aadhaar consent â€” only when Aadhaar selected */}
            {formData.identityProofType === 'AADHAAR' && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t('onboard.kyc.consentNotice')}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={formData.aadhaarConsentGiven}
                    onChange={e => update('aadhaarConsentGiven', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-amber-500" />
                  <span className="text-xs text-amber-700 font-medium">{t('onboard.kyc.consentCheckbox')}</span>
                </label>
              </div>
            )}

            {/* Identity number + upload â€” shown once type is selected */}
            {formData.identityProofType && (() => {
              const cfg: Record<string, { label: string; placeholder: string; maxLen: number; pattern?: string }> = {
                AADHAAR:         { label: 'Aadhaar Number', placeholder: 'XXXX XXXX XXXX (12 digits)', maxLen: 14 },
                PAN:             { label: 'PAN Number',     placeholder: 'ABCDE1234F',                 maxLen: 10 },
                DRIVING_LICENSE: { label: 'DL Number',      placeholder: 'e.g. MH0420230012345',       maxLen: 18 },
                VOTER_ID:        { label: 'Voter ID (EPIC)',placeholder: 'e.g. ABC1234567',             maxLen: 10 },
                PASSPORT:        { label: 'Passport No.',   placeholder: 'e.g. A1234567',              maxLen: 8  },
              };
              const c = cfg[formData.identityProofType];
              const docLabels: Record<string, string> = {
                AADHAAR: 'Aadhaar Card (front + back, JPG/PDF)', PAN: 'PAN Card (clear scan, JPG/PDF)',
                DRIVING_LICENSE: 'Driving License (front side, JPG/PDF)', VOTER_ID: 'Voter ID Card (JPG/PDF)', PASSPORT: 'Passport bio-data page (JPG/PDF)',
              };
              return (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-600">{c.label} <span className="text-red-500">*</span></label>
                    <div className={fw('identityNumber')}>
                      <IdCard size={16} className={inputIcon} />
                      <input type="text" maxLength={c.maxLen} placeholder={c.placeholder}
                        value={formData.identityNumber}
                        onChange={e => {
                          const v = formData.identityProofType === 'AADHAAR' ? e.target.value.replace(/\D/g, '') : e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                          update('identityNumber', v);
                          if (formData.identityProofType === 'AADHAAR') update('aadhaarNumber', v);
                        }}
                        onBlur={e => blurField('identityNumber', e.target.value)}
                        className={inputBase} />
                    </div>
                    <FieldErr field="identityNumber" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-600">{docLabels[formData.identityProofType]} <span className="text-red-500">*</span></label>
                    <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-indigo-400 transition-all bg-gray-50">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-500 flex-1">{formData.identityFile ? formData.identityFile.name : 'Click to upload document'}</span>
                      {formData.identityFile && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                      <input type="file" accept="image/*,application/pdf" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) { update('identityFile', e.target.files[0]); update('aadhaarFile', e.target.files[0]); }}} />
                    </label>
                  </div>
                </div>
              );
            })()}

            {/* Passport photo upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600">{t('onboard.kyc.photoLabel')}</label>
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-indigo-400 transition-all bg-gray-50">
                <User size={16} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 flex-1">{formData.passportPhotoFile ? formData.passportPhotoFile.name : t('onboard.kyc.uploadPhoto')}</span>
                {formData.passportPhotoFile && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) update('passportPhotoFile', e.target.files[0]); }} />
              </label>
            </div>

            {/* License â€” only for AUTHORIZED */}
            {formData.advisorType === 'AUTHORIZED' && (
              <>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">{t('onboard.kyc.licenseNumLabel')}</label>
                  <div className={inputWrap}>
                    <Award size={16} className={inputIcon} />
                    <input type="text" placeholder="e.g. REG/MH/2024/12345" value={formData.licenseNumber}
                      onChange={e => update('licenseNumber', e.target.value)}
                      className={inputBase} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">{t('onboard.kyc.licenseLabel')}</label>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-indigo-400 transition-all bg-gray-50">
                    <FileCheck size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-500 flex-1">{formData.licenseFile ? formData.licenseFile.name : t('onboard.kyc.uploadLicense')}</span>
                    {formData.licenseFile && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                    <input type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) update('licenseFile', e.target.files[0]); }} />
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600">{t('onboard.kyc.gstNumLabel')}</label>
                  <div className={fw('gstNumber')}>
                    <Percent size={16} className={inputIcon} />
                    <input type="text" maxLength={15} placeholder="e.g. 27AAPFU0939F1ZV" value={formData.gstNumber}
                      onChange={e => update('gstNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      onBlur={e => blurField('gstNumber', e.target.value)}
                      className={inputBase} />
                  </div>
                  {fieldErrors.gstNumber
                    ? <FieldErr field="gstNumber" />
                    : <p className="text-[10px] text-gray-400">15-character GSTIN format: 22AAAAA0000A1Z5</p>
                  }
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">{t('onboard.kyc.gstLabel')}</label>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-indigo-400 transition-all bg-gray-50">
                    <FileText size={16} className="text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-500 flex-1">{formData.gstCertFile ? formData.gstCertFile.name : t('onboard.kyc.uploadGstCert')}</span>
                    {formData.gstCertFile && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                    <input type="file" accept="image/*,application/pdf" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) update('gstCertFile', e.target.files[0]); }} />
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">{t('onboard.btn.back')}</button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                {t('onboard.btn.next')} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Step: Services â”€â”€ */}
        {step === 'services' && (
          <div className="p-4 sm:p-5">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-indigo-500" />
                <h2 className="text-lg font-bold text-gray-900">{t('onboard.services.title')}</h2>
              </div>
              <p className="text-sm text-gray-500">{t('onboard.services.sub')}</p>
            </div>

            {/* â”€â”€ Module Tiles Grid â”€â”€ */}
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
                          : 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5'
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
                        <CheckCircle2 size={14} className="text-indigo-500" />
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

            {/* â”€â”€ Expanded Sub-Module Panel â”€â”€ */}
            {expandedModule && formData.selectedSlugs.includes(expandedModule) && (() => {
              const cat = ADVISOR_CATEGORIES.find(c => c.slug === expandedModule);
              const modData = MODULES_DATA.find(m => m.id === expandedModule);
              if (!cat || !modData) return null;

              const catIdx = ADVISOR_CATEGORIES.findIndex(c => c.slug === expandedModule);
              const colorSet = MODULE_COLORS[catIdx % MODULE_COLORS.length];
              const Icon = cat.icon;
              const isOpenModule = modData.subModules.length === 0;
              const allSubIds = modData.subModules.map(s => s.id);
              const selectedSubIds = formData.selectedSubSlugs.filter(id => allSubIds.includes(id));
              const allSelected = !isOpenModule && selectedSubIds.length === allSubIds.length;

              const customText = formData.customSpecializations?.[expandedModule] ?? '';
              const OPEN_PLACEHOLDERS: Record<string, string> = {
                m21: 'E.g., I guide students for UK, US, Canada admissions â€” IELTS coaching, SOP review, visa documentation.',
                m22: 'E.g., I help NEET/JEE aspirants with counseling rounds, college shortlisting and enrollment.',
                m23: 'E.g., I place IT professionals in MNC jobs â€” resume building, LinkedIn, interview prep and offer negotiation.',
                m24: 'E.g., I specialize in Canada Express Entry, Australia PR, and UK Skilled Worker visa applications.',
                m25: 'E.g., I provide CA services, MCA compliance, FEMA advisory for NRIs and export-import businesses.',
              };

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
                          {isOpenModule ? 'Describe your specific expertise below' : `${selectedSubIds.length} of ${allSubIds.length} specialisations selected`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isOpenModule && (
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
                      )}
                      <button type="button" onClick={() => setExpandedModule(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Open module: free-text textarea */}
                  {isOpenModule && (
                    <div className="p-4 bg-white">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Your specialisation in this area:</p>
                      <textarea
                        rows={3}
                        maxLength={300}
                        value={customText}
                        onChange={e => update('customSpecializations', { ...formData.customSpecializations, [expandedModule]: e.target.value })}
                        placeholder={OPEN_PLACEHOLDERS[expandedModule] ?? 'Describe what you specifically offer in this service areaâ€¦'}
                        className="w-full text-sm text-gray-900 border-2 border-gray-200 focus:border-indigo-400 rounded-xl px-3 py-2.5 resize-none outline-none transition-colors"
                      />
                      <p className="text-[11px] text-gray-400 mt-1 text-right">{customText.length}/300 characters</p>
                    </div>
                  )}

                  {/* Regular module: Sub-module grid */}
                  {!isOpenModule && (
                  <>
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
                      Done âœ“
                    </button>
                  </div>
                  </>
                  )}
                </div>
              );
            })()}

            {/* â”€â”€ Remove module action â”€â”€ */}
            {formData.selectedSlugs.length > 0 && !expandedModule && (
              <div className="mb-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Selected Domains</h4>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {formData.selectedSlugs.length} domain{formData.selectedSlugs.length > 1 ? 's' : ''} Â· {formData.selectedSubSlugs.length} specialisation{formData.selectedSubSlugs.length !== 1 ? 's' : ''}
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

            {/* â”€â”€ Summary Stats â”€â”€ */}
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
                      : 'No specialisations yet â€” expand a module above to pick'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                {t('onboard.btn.back')}
              </button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                {t('onboard.btn.next')} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Step: Availability â”€â”€ */}
        {step === 'availability' && (
          <div className="p-4 sm:p-5">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900">{t('onboard.avail.title')}</h2>
              <p className="text-sm text-gray-500">{t('onboard.avail.sub')}</p>
            </div>

            {/* Quick-select shortcuts */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                {
                  label: activeDays.length === 7 ? 'Deselect All' : 'All 7 Days',
                  action: () => {
                    if (activeDays.length === 7) {
                      update('slots', []);
                    } else {
                      const existing = new Set(activeDays);
                      const newSlots = [...formData.slots];
                      [0,1,2,3,4,5,6].forEach(d => {
                        if (!existing.has(d)) newSlots.push({ id: `${d}-${Date.now()}`, dayOfWeek: d, startTime: '09:00', endTime: '17:00' });
                      });
                      update('slots', newSlots);
                    }
                  },
                  active: activeDays.length === 7,
                  color: 'text-indigo-600 border-indigo-300 bg-indigo-50 hover:bg-indigo-100',
                },
                {
                  label: 'Weekdays',
                  action: () => {
                    const weekdays = [1,2,3,4,5];
                    const existing = new Set(activeDays);
                    const allHave = weekdays.every(d => existing.has(d));
                    if (allHave) {
                      update('slots', formData.slots.filter(s => !weekdays.includes(s.dayOfWeek)));
                    } else {
                      const newSlots = [...formData.slots];
                      weekdays.forEach(d => {
                        if (!existing.has(d)) newSlots.push({ id: `${d}-${Date.now()}`, dayOfWeek: d, startTime: '09:00', endTime: '17:00' });
                      });
                      update('slots', newSlots);
                    }
                  },
                  active: [1,2,3,4,5].every(d => activeDays.includes(d)),
                  color: 'text-emerald-600 border-emerald-300 bg-emerald-50 hover:bg-emerald-100',
                },
                {
                  label: 'Weekends',
                  action: () => {
                    const weekends = [0,6];
                    const existing = new Set(activeDays);
                    const allHave = weekends.every(d => existing.has(d));
                    if (allHave) {
                      update('slots', formData.slots.filter(s => !weekends.includes(s.dayOfWeek)));
                    } else {
                      const newSlots = [...formData.slots];
                      weekends.forEach(d => {
                        if (!existing.has(d)) newSlots.push({ id: `${d}-${Date.now()}`, dayOfWeek: d, startTime: '09:00', endTime: '17:00' });
                      });
                      update('slots', newSlots);
                    }
                  },
                  active: [0,6].every(d => activeDays.includes(d)),
                  color: 'text-amber-600 border-amber-300 bg-amber-50 hover:bg-amber-100',
                },
              ].map(btn => (
                <button key={btn.label} type="button" onClick={btn.action}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${btn.color} ${btn.active ? 'ring-2 ring-offset-1' : ''}`}>
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Day chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {DAYS.map((day, i) => {
                const active = activeDays.includes(i);
                return (
                  <button key={day} type="button" onClick={() => toggleDay(i)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                      active ? 'bg-indigo-700 text-white border-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
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
                      <button type="button" onClick={() => addSlot(day)} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                        <Plus size={13} /> Add slot
                      </button>
                    </div>
                    <div className="space-y-2">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="flex items-center gap-2">
                          <input type="time" value={slot.startTime}
                            onChange={e => updateSlot(slot.id, 'startTime', e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-500 w-32" />
                          <span className="text-gray-400 font-medium">â†’</span>
                          <input type="time" value={slot.endTime}
                            onChange={e => updateSlot(slot.id, 'endTime', e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-indigo-500 w-32" />
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
                {t('onboard.btn.back')}
              </button>
              <button onClick={() => { setError(''); setStep('review'); }} className="py-3 px-5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                {t('onboard.btn.skip')}
              </button>
              <button onClick={goNext} className="btn-gold flex-1 py-3 flex items-center justify-center gap-2">
                {t('onboard.btn.review')} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* â”€â”€ Step: Review â”€â”€ */}
        {step === 'review' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('onboard.review.title')}</h2>
                <p className="text-sm text-gray-500">{t('onboard.review.sub')}</p>
              </div>
              {formData.advisorType && (
                <span className="shrink-0 px-3 py-1 rounded-full text-xs font-black"
                  style={{ background: formData.advisorType === 'AUTHORIZED' ? 'linear-gradient(135deg,#D4AF37,#B48C22)' : '#fffbf0', color: formData.advisorType === 'AUTHORIZED' ? '#0B1F3A' : '#92701a' }}>
                  {formData.advisorType === 'AUTHORIZED' ? 'â˜… Authorized' : 'Regular'}
                </span>
              )}
            </div>

            {/* â”€â”€ Account & Profile â”€â”€ */}
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
                  formData.consultationFee ? ['Consultation Fee', `â‚¹${formData.consultationFee} / session`] : null,
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

            {/* â”€â”€ KYC Documents â”€â”€ */}
            {(formData.identityFile || formData.passportPhotoFile || formData.licenseFile || formData.gstCertFile) && (
              <div className="rounded-2xl border border-amber-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'linear-gradient(90deg,#78350f,#b45309)' }}>
                  <ShieldCheck size={13} className="text-amber-200" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-100">KYC Documents Uploaded</span>
                </div>
                <div className="p-4 bg-amber-50/40 flex flex-wrap gap-2">
                  {[
                    formData.identityFile ? { label: ({ AADHAAR: 'Aadhaar Card', PAN: 'PAN Card', DRIVING_LICENSE: 'Driving License', VOTER_ID: 'Voter ID', PASSPORT: 'Passport' } as any)[formData.identityProofType] ?? 'Identity Proof', file: formData.identityFile, color: '#b45309' } : null,
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

            {/* â”€â”€ Services â”€â”€ */}
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

            {/* â”€â”€ Specialisations (standard sub-services) â”€â”€ */}
            {formData.selectedSubSlugs.length > 0 && (
              <div className="rounded-2xl border border-violet-200 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'linear-gradient(90deg,#3b0764,#5b21b6)' }}>
                  <Award size={13} className="text-violet-200" />
                  <span className="text-xs font-black uppercase tracking-wider text-violet-100">
                    Specialisations ({formData.selectedSubSlugs.length})
                  </span>
                </div>
                <div className="p-4 bg-violet-50/30">
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

            {/* â”€â”€ Open-module custom specialisations â”€â”€ */}
            {(() => {
              const OPEN_SLUGS_REVIEW = ['m21', 'm22', 'm23', 'm24', 'm25'];
              const openEntries = formData.selectedSlugs
                .filter(slug => OPEN_SLUGS_REVIEW.includes(slug) && formData.customSpecializations?.[slug]?.trim());
              if (openEntries.length === 0) return null;
              return (
                <div className="rounded-2xl border border-emerald-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'linear-gradient(90deg,#064e3b,#065f46)' }}>
                    <Award size={13} className="text-emerald-200" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                      Your Specialisation Descriptions ({openEntries.length})
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50/30 space-y-3">
                    {openEntries.map(slug => {
                      const catIdx = ADVISOR_CATEGORIES.findIndex(a => a.slug === slug);
                      const cat = ADVISOR_CATEGORIES[catIdx];
                      const colorSet = MODULE_COLORS[catIdx % MODULE_COLORS.length];
                      const Icon = cat?.icon ?? Award;
                      const text = formData.customSpecializations![slug];
                      return (
                        <div key={slug} className="rounded-xl bg-white border-2 p-3"
                          style={{ borderColor: `${colorSet.accent}40` }}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                              style={{ background: `${colorSet.accent}18` }}>
                              <Icon size={11} style={{ color: colorSet.accent }} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-wider"
                              style={{ color: colorSet.accent }}>{cat?.name}</p>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed pl-7">{text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* â”€â”€ Availability â”€â”€ */}
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
                            <p key={s.id} className="text-xs font-semibold text-gray-700">{s.startTime} â€“ {s.endTime}</p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ Confirm checkbox â”€â”€ */}
            <label className="flex items-start gap-3 cursor-pointer rounded-2xl p-4 border-2"
              style={{ borderColor: confirmed ? '#D4AF37' : '#e5e7eb', background: confirmed ? 'linear-gradient(135deg,#fffbf0,#fef9e7)' : '#f9fafb' }}>
              <div className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
                style={{ borderColor: confirmed ? '#D4AF37' : '#d1d5db', background: confirmed ? '#D4AF37' : 'white' }}
                onClick={() => setConfirmed(p => !p)}>
                {confirmed && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm text-gray-700 select-none leading-relaxed">
                {t('onboard.review.confirmTextFull')}
              </span>
            </label>

            <div className="flex gap-3">
              <button onClick={goBack} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-300 transition-all">
                {t('onboard.btn.back')}
              </button>
              {isAuthorized ? (
                <button onClick={handleSubmit} disabled={!confirmed || loading}
                  className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> {t('onboard.review.creatingAccount')}</> : <><CreditCard size={16} /> {t('onboard.review.proceedPayment')} <ArrowRight size={14} /></>}
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={!confirmed || loading}
                  className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> {t('onboard.review.submitting')}</> : <><ShieldCheck size={16} /> {t('onboard.review.submitVerification')}</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* â”€â”€ Step: Payment (AUTHORIZED only) â”€â”€ */}
        {step === 'payment' && (
          <div className="p-4 sm:p-5 space-y-3">

            {/* Header */}
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('review')} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all border border-gray-200">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('onboard.payment.title')}</h2>
                <p className="text-sm text-gray-500">{t('onboard.payment.sub')}</p>
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
                  Your money is completely safe. If your profile is rejected by our review team, <strong>100% of your payment will be refunded</strong> to your original payment method within 3â€“5 business days â€” no questions asked.
                </p>
              </div>
            </div>

            {/* Invoice Preview */}
            <div className="rounded-2xl border-2 border-gray-200 overflow-hidden">
              {/* Invoice header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center overflow-hidden p-0.5">
                      <img src="/logo-icon.png" alt="BrokerSaab" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-white font-black text-base tracking-tight">Broker<span className="text-[#D4AF37]">Saab</span></span>
                  </div>
                  <p className="text-white/50 text-[10px]">BrokerSaab Technology Pvt. Ltd.</p>
                  <p className="text-white/40 text-[10px]">GSTIN: 27AABCB1234A1Z5 Â· SAC: 9983</p>
                </div>
                <div className="text-right">
                  <p className="text-[#D4AF37] font-black text-sm">PROFORMA INVOICE</p>
                  <p className="text-white/60 text-[10px] mt-0.5">INV-BS-{Date.now().toString().slice(-8)}</p>
                  <p className="text-white/60 text-[10px]">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Bill to */}
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Bill To</p>
                <p className="text-sm font-bold text-gray-800">{formData.fullName || 'Advisor Name'}</p>
                <p className="text-xs text-gray-500">{formData.email}</p>
                <p className="text-xs text-gray-500">+91 {formData.phoneNumber} Â· {formData.state}</p>
                {formData.gstNumber && <p className="text-xs text-gray-500">GSTIN: {formData.gstNumber}</p>}
              </div>

              {/* Line item */}
              <div className="px-5 py-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-200 pb-2">
                      <th className="text-left py-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Description</th>
                      <th className="text-right py-2 text-[10px] font-black uppercase tracking-wider text-gray-500">Amount (â‚¹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3">
                        <p className="font-semibold text-gray-800">Authorized Advisor Subscription â€” Annual Plan (1 Year)</p>
                        <p className="text-gray-500 text-[10px] mt-0.5">SAC 9983 Â· Platform access & authorized badge Â· Valid for 12 months</p>
                      </td>
                      <td className="py-3 text-right text-gray-800 font-semibold align-top">â‚¹{ORIGINAL_PRICE.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Calculation breakdown */}
                <div className="mt-4 space-y-1.5 border-t-2 border-gray-200 pt-4">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Original Price (MRP)</span>
                    <span>â‚¹{ORIGINAL_PRICE.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>Promotional Discount (90.005%)</span>
                    <span>âˆ’ â‚¹{DISCOUNT_AMT.toLocaleString('en-IN')}.00</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-dashed border-gray-300 pt-2 mt-2">
                    <span>Taxable Amount (Base)</span>
                    <span>â‚¹{BASE_PRICE.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>CGST @ 9%</span>
                    <span>â‚¹{CGST_AMT.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>SGST @ 9%</span>
                    <span>â‚¹{SGST_AMT.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-gray-900 border-t-2 border-gray-800 pt-3 mt-2">
                    <span>Total Payable (Incl. GST)</span>
                    <span style={{ color: '#4F46E5' }}>â‚¹{TOTAL_PAYABLE.toFixed(2)}</span>
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
                    const token = uploadedToken || sessionStorage.getItem('accessToken') || '';
                    if (!token) { setError('Session token missing. Please go back and try again.'); return; }
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
                      description: 'Authorized Advisor Subscription â€” 1 Year',
                      order_id: orderData.orderId,
                      theme: { color: '#4F46E5' },
                      prefill: { name: formData.fullName, email: formData.email, contact: `+91${formData.phoneNumber}` },
                      notes: { purpose: 'AUTHORIZED_ADVISOR_SUBSCRIPTION', advisorName: formData.fullName },
                      handler: async (response: any) => {
                        try {
                          const verifyToken = uploadedToken || sessionStorage.getItem('accessToken') || '';
                          const verifyRes = await fetch(`${API}/subscriptions/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${verifyToken}` },
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
                            // Account already created by "Proceed to Payment" â†’ go to success
                            setStep('success');
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
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A', boxShadow: '0 8px 24px rgba(212,175,55,0.35)', cursor: paymentLoading ? 'wait' : 'pointer' }}>
                {paymentLoading
                  ? <><Loader2 size={18} className="animate-spin" /> Processing Paymentâ€¦</>
                  : <><CreditCard size={18} /> Pay â‚¹{TOTAL_PAYABLE.toFixed(2)} â€” Secure Checkout <ShieldCheck size={16} /></>}
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
              <ShieldCheck size={12} /> Secured by Razorpay Â· UPI, Cards, Net Banking accepted Â· 100% refund if rejected
            </p>

            {/* Test mode bypass â€” remove before go-live */}
            {!paymentDone && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  // Test mode: skip backend payment entirely
                  // Advisor type (AUTHORIZED) is already saved on the account created
                  // during "Proceed to Payment" â€” subscription record is only for billing
                  setPaymentDone(true);
                  setInvoiceData({
                    invoiceNo: `BS-TEST-${Date.now().toString().slice(-8)}`,
                    paymentId: 'TEST_' + Date.now(),
                    orderId: 'TEST_ORDER_' + Date.now(),
                    paidAt: new Date(),
                  });
                  setStep('success');
                }}
                className="w-full py-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 bg-amber-50 text-xs font-semibold hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
              >
                ðŸ§ª Test Mode â€” Skip Payment (Dev/Testing Only)
              </button>
            )}
          </div>
        )}

        {/* â”€â”€ Step: Success â”€â”€ */}
        {step === 'success' && (
          <div className="p-6 sm:p-10 text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.35)' }}>
              <ShieldCheck size={48} className="text-[#D4AF37]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('onboard.success.title')}</h2>
            <p className="text-gray-500 text-sm mb-8">{t('onboard.success.sub')}</p>

            <div className="text-left space-y-4 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('onboard.success.whatsNext')}</h3>
              {[
                { icon: Search, title: t('onboard.success.step1Title'), desc: t('onboard.success.step1Desc') },
                { icon: ShieldCheck, title: t('onboard.success.step2Title'), desc: t('onboard.success.step2Desc') },
                { icon: CheckCircle2, title: t('onboard.success.step3Title'), desc: t('onboard.success.step3Desc') },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#0B1F3A,#1a1040)', border: '1px solid rgba(212,175,55,0.3)' }}>
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

            {/* â”€â”€ Print / Download Application â”€â”€ */}
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">{t('onboard.success.saveApp')}</p>
              <div className="flex gap-3">
                <button
                  onClick={printApplication}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all hover:bg-indigo-50"
                  style={{ borderColor: '#4F46E5', color: '#4F46E5' }}>
                  <Printer size={15} /> {t('onboard.success.printApp')}
                </button>
                <button
                  onClick={printApplication}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: 'white' }}>
                  <Download size={15} /> {t('onboard.success.downloadPdf')}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">{t('onboard.success.printHint')}</p>
            </div>

            {/* Invoice download for AUTHORIZED advisors who paid */}
            {isAuthorized && invoiceData && (
              <div className="rounded-2xl border-2 border-indigo-300 p-4" style={{ background: 'linear-gradient(135deg,#eef2ff,#f0f4ff)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={16} className="text-indigo-600 shrink-0" />
                  <span className="font-black text-gray-800 text-sm">Payment Confirmed Â· Authorized Badge Pending Approval</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">Invoice No: <strong>{invoiceData.invoiceNo}</strong> Â· Payment ID: <span className="font-mono text-[10px]">{invoiceData.paymentId}</span></p>
                <button
                  onClick={downloadInvoice}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg,#4F46E5,#3730A3)', color: 'white' }}>
                  <Download size={15} /> Download GST Invoice (PDF)
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="btn-gold flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold">
                <Home size={15} /> {t('onboard.success.exploreServices')}
              </Link>
              <Link href="/auth/admin" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-300 transition-all">
                <User size={15} /> {t('onboard.success.advisorLogin')}
              </Link>
            </div>
          </div>
        )}

        {/* Card Footer */}
        {step !== 'success' && step !== 'welcome' && (
          <div className="px-4 pb-3 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/admin" className="text-indigo-600 font-semibold hover:underline">Sign in here</Link>
            </p>
          </div>
        )}

        </div>{/* end scrollable */}

        {/* â”€â”€ T&C Detail Panel (slides over the card) â”€â”€ */}
        {showTcDetail && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <button onClick={() => setShowTcDetail(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Advisor Terms & Conditions</h3>
                <p className="text-[11px] text-gray-400">BrokerSaab Platform Â· Effective June 2026</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {[
                { color: '#ef4444', title: 'No Platform Liability', body: 'BrokerSaab is not liable for any fraud, misconduct, misrepresentation, negligence, or financial harm caused by you or any other advisor on this platform. Clients engage you entirely at their own risk, and you are solely responsible for the advice and services you provide.' },
                { color: '#f59e0b', title: 'Disputes â€” Indian Judiciary', body: 'All disputes, claims, or legal proceedings arising from your advisory services or from use of BrokerSaab shall be subject exclusively to the jurisdiction of the competent courts of India.' },
                { color: '#3b82f6', title: 'Genuine KYC & Credentials', body: 'All KYC documents, professional credentials, licenses, and qualifications you submit during registration must be authentic, accurate, and up-to-date. Submission of false documents will result in immediate account termination and may lead to legal action.' },
                { color: '#8b5cf6', title: 'Your Responsibility for Advice', body: 'You are solely and entirely responsible for the quality, accuracy, completeness, and legality of all advice and services you provide to clients. BrokerSaab does not review, endorse, or validate the content of any advice given.' },
                { color: '#10b981', title: 'Commission & No Off-Platform Solicitation', body: 'A 15% platform commission is deducted from all completed consultations. You agree not to solicit clients for off-platform transactions or direct payments outside BrokerSaab. Violations will result in permanent account suspension.' },
              ].map((clause, i) => (
                <div key={i} className="rounded-xl border overflow-hidden"
                  style={{ borderColor: `${clause.color}25`, background: `${clause.color}05` }}>
                  <div className="px-4 py-2 border-b flex items-center gap-2"
                    style={{ borderColor: `${clause.color}15`, background: `${clause.color}08` }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: clause.color }} />
                    <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: clause.color }}>{clause.title}</span>
                  </div>
                  <p className="px-4 py-3 text-[12px] text-gray-600 leading-relaxed">{clause.body}</p>
                </div>
              ))}
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">Governing Law:</strong> These terms are governed by the laws of the Republic of India. All disputes are subject exclusively to the jurisdiction of Indian courts.
                </p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => { setTcAccepted(true); setShowTcDetail(false); }}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg,#D4AF37,#B48C22)', color: '#0B1F3A' }}>
                <CheckCircle2 size={15} /> I Agree & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
