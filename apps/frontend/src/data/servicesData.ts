import React from 'react';
import {
  FileHeart, UserCheck, Award, Home, Percent, Briefcase, Lightbulb, Landmark,
  ShieldCheck, Car, Scale, Users, GraduationCap, HeartHandshake, TrendingUp,
  Globe, Zap, Sprout, Laptop,
  Flag, Plane, School, ClipboardList, FileCheck, Sparkles
} from 'lucide-react';

export interface SubModule {
  id: string;
  nameEn: string;
  nameHi: string;
  keywords: string[];
  route: string;
  crossRef?: string;
}

export interface Module {
  id: string;
  titleEn: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  iconName: string;
  subModules: SubModule[];
}

export interface ModuleColor {
  gradient: string;
  bg: string;
  bgDark: string;
  text: string;
  border: string;
  borderDark: string;
  iconBg: string;
  accent: string;
}

export const ICON_MAP: Record<string, React.ComponentType<any>> = {
  FileHeart, UserCheck, Award, Home, Percent, Briefcase, Lightbulb, Landmark,
  ShieldCheck, Car, Scale, Users, GraduationCap, HeartHandshake, TrendingUp,
  Globe, Zap, Sprout, Laptop,
  Flag, Plane, School, ClipboardList, FileCheck, Sparkles
};

export const MODULE_COLORS: ModuleColor[] = [
  { gradient: 'from-rose-500 to-pink-600',       bg: 'bg-rose-50',     bgDark: 'bg-rose-950/30',    text: 'text-rose-600',    border: 'border-rose-200',    borderDark: 'border-rose-800/40',    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',       accent: '#F43F5E' },
  { gradient: 'from-teal-500 to-cyan-600',        bg: 'bg-teal-50',     bgDark: 'bg-teal-950/30',    text: 'text-teal-600',    border: 'border-teal-200',    borderDark: 'border-teal-800/40',    iconBg: 'bg-gradient-to-br from-teal-500 to-cyan-600',       accent: '#14B8A6' },
  { gradient: 'from-violet-500 to-purple-600',    bg: 'bg-violet-50',   bgDark: 'bg-violet-950/30',  text: 'text-violet-600',  border: 'border-violet-200',  borderDark: 'border-violet-800/40',  iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',   accent: '#8B5CF6' },
  { gradient: 'from-amber-500 to-orange-600',     bg: 'bg-amber-50',    bgDark: 'bg-amber-950/30',   text: 'text-amber-600',   border: 'border-amber-200',   borderDark: 'border-amber-800/40',   iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',    accent: '#F59E0B' },
  { gradient: 'from-emerald-500 to-green-600',    bg: 'bg-emerald-50',  bgDark: 'bg-emerald-950/30', text: 'text-emerald-600', border: 'border-emerald-200', borderDark: 'border-emerald-800/40', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',   accent: '#10B981' },
  { gradient: 'from-blue-500 to-indigo-600',      bg: 'bg-blue-50',     bgDark: 'bg-blue-950/30',    text: 'text-blue-600',    border: 'border-blue-200',    borderDark: 'border-blue-800/40',    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',     accent: '#3B82F6' },
  { gradient: 'from-yellow-500 to-amber-600',     bg: 'bg-yellow-50',   bgDark: 'bg-yellow-950/30',  text: 'text-yellow-600',  border: 'border-yellow-200',  borderDark: 'border-yellow-800/40',  iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-600',    accent: '#EAB308' },
  { gradient: 'from-sky-500 to-blue-600',         bg: 'bg-sky-50',      bgDark: 'bg-sky-950/30',     text: 'text-sky-600',     border: 'border-sky-200',     borderDark: 'border-sky-800/40',     iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',        accent: '#0EA5E9' },
  { gradient: 'from-indigo-500 to-violet-600',    bg: 'bg-indigo-50',   bgDark: 'bg-indigo-950/30',  text: 'text-indigo-600',  border: 'border-indigo-200',  borderDark: 'border-indigo-800/40',  iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-600',   accent: '#6366F1' },
  { gradient: 'from-orange-500 to-red-600',       bg: 'bg-orange-50',   bgDark: 'bg-orange-950/30',  text: 'text-orange-600',  border: 'border-orange-200',  borderDark: 'border-orange-800/40',  iconBg: 'bg-gradient-to-br from-orange-500 to-red-600',      accent: '#F97316' },
  { gradient: 'from-slate-500 to-gray-700',       bg: 'bg-slate-50',    bgDark: 'bg-slate-800/40',   text: 'text-slate-600',   border: 'border-slate-300',   borderDark: 'border-slate-700/50',   iconBg: 'bg-gradient-to-br from-slate-500 to-gray-700',      accent: '#64748B' },
  { gradient: 'from-cyan-500 to-teal-600',        bg: 'bg-cyan-50',     bgDark: 'bg-cyan-950/30',    text: 'text-cyan-600',    border: 'border-cyan-200',    borderDark: 'border-cyan-800/40',    iconBg: 'bg-gradient-to-br from-cyan-500 to-teal-600',       accent: '#06B6D4' },
  { gradient: 'from-pink-500 to-rose-600',        bg: 'bg-pink-50',     bgDark: 'bg-pink-950/30',    text: 'text-pink-600',    border: 'border-pink-200',    borderDark: 'border-pink-800/40',    iconBg: 'bg-gradient-to-br from-pink-500 to-rose-600',       accent: '#EC4899' },
  { gradient: 'from-fuchsia-500 to-purple-600',   bg: 'bg-fuchsia-50',  bgDark: 'bg-fuchsia-950/30', text: 'text-fuchsia-600', border: 'border-fuchsia-200', borderDark: 'border-fuchsia-800/40', iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',  accent: '#D946EF' },
  { gradient: 'from-lime-500 to-green-600',       bg: 'bg-lime-50',     bgDark: 'bg-lime-950/30',    text: 'text-lime-600',    border: 'border-lime-200',    borderDark: 'border-lime-800/40',    iconBg: 'bg-gradient-to-br from-lime-500 to-green-600',      accent: '#84CC16' },
  { gradient: 'from-blue-600 to-sky-500',         bg: 'bg-blue-50',     bgDark: 'bg-blue-950/30',    text: 'text-blue-600',    border: 'border-blue-200',    borderDark: 'border-blue-800/40',    iconBg: 'bg-gradient-to-br from-blue-600 to-sky-500',        accent: '#2563EB' },
  { gradient: 'from-yellow-400 to-orange-500',    bg: 'bg-yellow-50',   bgDark: 'bg-yellow-950/30',  text: 'text-yellow-600',  border: 'border-yellow-200',  borderDark: 'border-yellow-800/40',  iconBg: 'bg-gradient-to-br from-yellow-400 to-orange-500',   accent: '#FBBF24' },
  { gradient: 'from-green-500 to-emerald-600',    bg: 'bg-green-50',    bgDark: 'bg-green-950/30',   text: 'text-green-600',   border: 'border-green-200',   borderDark: 'border-green-800/40',   iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',   accent: '#22C55E' },
  { gradient: 'from-purple-500 to-indigo-600',    bg: 'bg-purple-50',   bgDark: 'bg-purple-950/30',  text: 'text-purple-600',  border: 'border-purple-200',  borderDark: 'border-purple-800/40',  iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',   accent: '#A855F7' },
  { gradient: 'from-orange-400 to-amber-500',     bg: 'bg-orange-50',   bgDark: 'bg-orange-950/30',  text: 'text-orange-600',  border: 'border-orange-200',  borderDark: 'border-orange-800/40',  iconBg: 'bg-gradient-to-br from-orange-400 to-amber-500',    accent: '#FB923C' },
  { gradient: 'from-sky-400 to-cyan-500',         bg: 'bg-sky-50',      bgDark: 'bg-sky-950/30',     text: 'text-sky-600',     border: 'border-sky-200',     borderDark: 'border-sky-800/40',     iconBg: 'bg-gradient-to-br from-sky-400 to-cyan-500',        accent: '#38BDF8' },
  { gradient: 'from-indigo-400 to-violet-500',    bg: 'bg-indigo-50',   bgDark: 'bg-indigo-950/30',  text: 'text-indigo-500',  border: 'border-indigo-200',  borderDark: 'border-indigo-800/40',  iconBg: 'bg-gradient-to-br from-indigo-400 to-violet-500',   accent: '#818CF8' },
  { gradient: 'from-green-400 to-teal-500',       bg: 'bg-green-50',    bgDark: 'bg-green-950/30',   text: 'text-green-600',   border: 'border-green-200',   borderDark: 'border-green-800/40',   iconBg: 'bg-gradient-to-br from-green-400 to-teal-500',      accent: '#4ADE80' },
  { gradient: 'from-red-500 to-rose-600',         bg: 'bg-red-50',      bgDark: 'bg-red-950/30',     text: 'text-red-600',     border: 'border-red-200',     borderDark: 'border-red-800/40',     iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',        accent: '#EF4444' },
  { gradient: 'from-indigo-500 to-purple-600',    bg: 'bg-indigo-50',   bgDark: 'bg-indigo-950/30',  text: 'text-indigo-600',  border: 'border-indigo-200',  borderDark: 'border-indigo-800/40',  iconBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',   accent: '#6366F1' },
];

export const MODULES_DATA: Module[] = [
  {
    id: "m1",
    titleEn: "Birth, Death & Marriage Papers",
    titleHi: "जन्म, मृत्यु और विवाह प्रमाण पत्र",
    description: "Official civil registrations and personal certificates required for identity verification.",
    descriptionHi: "पहचान सत्यापन के लिए आवश्यक नागरिक पंजीकरण और व्यक्तिगत प्रमाण पत्र।",
    iconName: "FileHeart",
    subModules: [
      { id: "s1-1", nameEn: "Birth Certificate", nameHi: "जन्म प्रमाण पत्र", keywords: ["birth certificate", "janam praman patra", "jeevan", "child birth proof", "hospital birth record"], route: "/advisors?category=documentation-expert" },
      { id: "s1-2", nameEn: "Death Certificate", nameHi: "मृत्यु प्रमाण पत्र", keywords: ["death certificate", "mrityu praman patra", "death proof"], route: "/advisors?category=documentation-expert" },
      { id: "s1-3", nameEn: "Marriage Registration", nameHi: "विवाह पंजीकरण", keywords: ["marriage certificate", "vivah praman patra", "court marriage", "Hindu Marriage Act", "Special Marriage Act", "register marriage", "shaadi certificate"], route: "/advisors?category=legal-advisor" },
      { id: "s1-4", nameEn: "Divorce Documentation", nameHi: "तलाक के दस्तावेज़", keywords: ["divorce", "talaq", "mutual divorce", "divorce decree", "separation"], route: "/advisors?category=legal-advisor" },
      { id: "s1-5", nameEn: "Name Change & Gazette", nameHi: "नाम परिवर्तन और गजट", keywords: ["name change", "gazette", "naam parivartan", "surname change", "newspaper publication for name change"], route: "/advisors?category=documentation-expert" },
      { id: "s1-6", nameEn: "Date of Birth Correction", nameHi: "जन्म तिथि सुधार", keywords: ["DOB correction", "age correction", "birth date change"], route: "/advisors?category=documentation-expert" },
      { id: "s1-7", nameEn: "General Affidavits", nameHi: "सामान्य शपथ पत्र", keywords: ["affidavit", "halafnama", "sworn statement", "declaration"], route: "/advisors?category=documentation-expert" }
    ]
  },
  {
    id: "m2",
    titleEn: "Identity Cards & Documents",
    titleHi: "पहचान पत्र (Aadhaar, PAN, Voter आदि)",
    description: "National citizenship identity cards, correction services, and foreign citizen paperwork.",
    descriptionHi: "राष्ट्रीय नागरिकता पहचान पत्र, सुधार सेवाएं और विदेशी नागरिक कागजी कार्रवाई।",
    iconName: "UserCheck",
    subModules: [
      { id: "s2-1", nameEn: "Aadhaar Card Update", nameHi: "आधार कार्ड अपडेट", keywords: ["aadhaar", "aadhar", "UIDAI", "aadhaar update", "address change aadhaar", "mobile link aadhaar", "biometric update"], route: "/advisors?category=documentation-expert" },
      { id: "s2-2", nameEn: "PAN Card Services", nameHi: "पैन कार्ड सेवाएं", keywords: ["PAN card", "PAN correction", "PAN Aadhaar link", "e-PAN", "duplicate PAN"], route: "/advisors?category=tax-consultant" },
      { id: "s2-3", nameEn: "Voter ID / EPIC", nameHi: "Voter आईडी / EPIC", keywords: ["voter ID", "EPIC", "election card", "matdata", "voter list", "NVSP", "form 6"], route: "/advisors?category=documentation-expert" },
      { id: "s2-4", nameEn: "Ration Card Support", nameHi: "राशन कार्ड सहायता", keywords: ["ration card", "APL", "BPL", "AAY", "food card", "PDS", "ration card transfer"], route: "/advisors?category=documentation-expert" },
      { id: "s2-5", nameEn: "Passport Services", nameHi: "पासपोर्ट सेवाएं", keywords: ["passport", "passport seva", "tatkal passport", "passport renewal", "PSK", "police verification passport"], route: "/advisors?category=documentation-expert" },
      { id: "s2-6", nameEn: "OCI / PIO Card", nameHi: "OCI / PIO कार्ड", keywords: ["OCI", "overseas citizen", "PIO card", "NRI card"], route: "/advisors?category=legal-advisor" },
      { id: "s2-7", nameEn: "Citizenship / CAA Papers", nameHi: "नागरिकता / CAA दस्तावेज़", keywords: ["citizenship", "naturalization", "CAA", "citizenship certificate"], route: "/advisors?category=legal-advisor" },
      { id: "s2-8", nameEn: "Senior Citizen Card", nameHi: "वरिष्ठ नागरिक कार्ड", keywords: ["senior citizen card", "old age ID"], route: "/advisors?category=documentation-expert" },
      { id: "s2-9", nameEn: "Disability ID (UDID)", nameHi: "दिव्यांग आईडी (UDID)", keywords: ["UDID", "disability certificate", "divyang card", "handicapped certificate"], route: "/advisors?category=documentation-expert" }
    ]
  },
  {
    id: "m3",
    titleEn: "Income, Caste & Residence",
    titleHi: "आय, जाति और निवास प्रमाण पत्र",
    description: "Revenue department status certificates, financial solvency, and legal heir documentation.",
    descriptionHi: "राजस्व विभाग के स्थिति प्रमाण पत्र, वित्तीय सॉल्वेंसी और कानूनी उत्तराधिकारी दस्तावेज़।",
    iconName: "Award",
    subModules: [
      { id: "s3-1", nameEn: "Residence / Domicile", nameHi: "निवास / डोमिसाइल", keywords: ["residence certificate", "domicile", "mool nivas", "nivas praman patra", "address proof certificate"], route: "/advisors?category=documentation-expert" },
      { id: "s3-2", nameEn: "Income Certificate", nameHi: "आय प्रमाण पत्र", keywords: ["income certificate", "aay praman patra", "salary certificate", "income proof"], route: "/advisors?category=documentation-expert" },
      { id: "s3-3", nameEn: "Caste Certificate (SC/ST/OBC)", nameHi: "जाति प्रमाण पत्र (SC/ST/OBC)", keywords: ["caste certificate", "jaati praman patra", "SC ST certificate", "OBC certificate"], route: "/advisors?category=documentation-expert" },
      { id: "s3-4", nameEn: "EWS Certificate", nameHi: "EWS प्रमाण पत्र", keywords: ["EWS", "economically weaker section", "10% reservation certificate"], route: "/advisors?category=documentation-expert" },
      { id: "s3-5", nameEn: "Non-Creamy Layer (OBC-NCL)", nameHi: "ओबीसी नॉन-क्रीमी लेयर", keywords: ["non creamy layer", "NCL", "OBC creamy layer"], route: "/advisors?category=documentation-expert" },
      { id: "s3-6", nameEn: "Nationality Certificate", nameHi: "राष्ट्रीयता प्रमाण पत्र", keywords: ["nationality certificate", "citizen proof"], route: "/advisors?category=documentation-expert" },
      { id: "s3-7", nameEn: "Solvency Certificate", nameHi: "सॉल्वेंसी प्रमाण पत्र", keywords: ["solvency certificate", "financial solvency proof"], route: "/advisors?category=financial-advisor" },
      { id: "s3-8", nameEn: "Agriculturist Certificate", nameHi: "कृषक प्रमाण पत्र", keywords: ["farmer certificate", "kisan certificate", "agriculturist proof"], route: "/advisors?category=documentation-expert" },
      { id: "s3-9", nameEn: "Legal Heir Certificate", nameHi: "कानूनी वारिस प्रमाण पत्र", keywords: ["legal heir certificate", "varis praman patra", "surviving member", "heirship"], route: "/advisors?category=legal-advisor" },
      { id: "s3-10", nameEn: "Dependent Certificate", nameHi: "आश्रित / परिवार सदस्य पत्र", keywords: ["dependent certificate", "family member certificate"], route: "/advisors?category=documentation-expert" }
    ]
  },
  {
    id: "m4",
    titleEn: "Property & Land Papers",
    titleHi: "जमीन और संपत्ति के कागज़ (रजिस्ट्री)",
    description: "Property registrations, deeds drafting, land records extracts, mutation, and due diligence checks.",
    descriptionHi: "संपत्ति पंजीकरण, विलेख प्रारूपण, भूमि रिकॉर्ड उद्धरण, नाम नामांतरण और शीर्षक जांच।",
    iconName: "Home",
    subModules: [
      { id: "s4-1", nameEn: "Sale Deed & Registry", nameHi: "बिक्री विलेख और रजिस्ट्री", keywords: ["sale deed", "registry", "bainama", "property registration", "sub registrar", "conveyance"], route: "/advisors?category=property-registration" },
      { id: "s4-2", nameEn: "Gift Deed", nameHi: "उपहार विलेख / दान पत्र", keywords: ["gift deed", "daan patra", "transfer by gift"], route: "/advisors?category=property-registration" },
      { id: "s4-3", nameEn: "Will / Testament Drafting", nameHi: "वसीयतनामा प्रारूपण", keywords: ["will", "vasiyat", "testament", "will registration"], route: "/advisors?category=documentation-expert", crossRef: "Module 15 (Savings)" },
      { id: "s4-4", nameEn: "Lease Deed & Rent Agreement", nameHi: "लीज़ डीड और किरायानामा", keywords: ["lease deed", "rent agreement", "kirayanama", "rental agreement", "11 month agreement", "leave and licence"], route: "/advisors?category=property-broker" },
      { id: "s4-5", nameEn: "Partition Deed", nameHi: "बटवारानामा विलेख", keywords: ["partition deed", "batwara", "property division", "family partition"], route: "/advisors?category=property-registration" },
      { id: "s4-6", nameEn: "Mortgage Deed Registration", nameHi: "बंधक विलेख पंजीकरण", keywords: ["mortgage deed", "rehan", "property mortgage"], route: "/advisors?category=property-registration" },
      { id: "s4-7", nameEn: "Power of Attorney (Property)", nameHi: "संपत्ति मुख्तारनामा (POA)", keywords: ["power of attorney", "POA", "mukhtarnama", "GPA", "SPA"], route: "/advisors?category=documentation-expert" },
      { id: "s4-8", nameEn: "Relinquishment Deed", nameHi: "हक त्याग विलेख (Relinquishment)", keywords: ["relinquishment deed", "haq tyag", "release deed"], route: "/advisors?category=property-registration" },
      { id: "s4-9", nameEn: "Land Mutation (Dakhil Kharij)", nameHi: "दाखिल खारिज (नामंतरण)", keywords: ["mutation", "dakhil kharij", "namantaran", "intkal", "property name change"], route: "/advisors?category=property-registration" },
      { id: "s4-10", nameEn: "Land Records (Khasra Khatauni)", nameHi: "भूमि रिकॉर्ड (खसरा खतौनी)", keywords: ["khasra", "khatauni", "jamabandi", "7/12 extract", "satbara", "RTC", "fard", "land record", "bhulekh"], route: "/advisors?category=real-estate-advisory" },
      { id: "s4-11", nameEn: "Encumbrance Certificate (EC)", nameHi: "भार मुक्त प्रमाण पत्र (EC)", keywords: ["encumbrance certificate", "EC", "property loan check", "title clearance"], route: "/advisors?category=real-estate-advisory" },
      { id: "s4-12", nameEn: "Property / House Tax Filing", nameHi: "हाउस / संपत्ति टैक्स फाइलिंग", keywords: ["property tax", "house tax", "municipal tax", "holding tax"], route: "/advisors?category=real-estate-advisory", crossRef: "Module 17 (Connections)" },
      { id: "s4-13", nameEn: "Building Plan Approval Map", nameHi: "भवन योजना स्वीकृत नक्शा", keywords: ["building plan", "naksha pass", "map approval", "construction permission"], route: "/advisors?category=real-estate-advisory" },
      { id: "s4-14", nameEn: "RERA Registration Support", nameHi: "RERA पंजीकरण सहायता", keywords: ["RERA", "real estate registration", "builder registration"], route: "/advisors?category=real-estate-advisory" },
      { id: "s4-15", nameEn: "Property Valuation & Rates", nameHi: "संपत्ति सरकारी मूल्यांकन दर", keywords: ["property valuation", "circle rate", "market value", "ready reckoner"], route: "/advisors?category=property-broker" },
      { id: "s4-16", nameEn: "Title Search / Due Diligence", nameHi: "शीर्षक जांच और कानूनी राय", keywords: ["title search", "property verification", "legal opinion property", "chain of title"], route: "/advisors?category=real-estate-advisory" },
      { id: "s4-17", nameEn: "Stamp Duty & E-Stamping", nameHi: "स्टाम्प शुल्क और ई-स्टांपिंग", keywords: ["stamp duty", "e-stamp", "franking", "registration charges"], route: "/advisors?category=property-registration" }
    ]
  },
  {
    id: "m5",
    titleEn: "Tax Filing",
    titleHi: "टैक्स / GST फाइलिंग",
    description: "GST registration, business return filings, professional tax, and ITR planning.",
    descriptionHi: "जीएसटी पंजीकरण, व्यावसायिक रिटर्न फाइलिंग, व्यावसायिक कर और आईटीआर योजना।",
    iconName: "Percent",
    subModules: [
      { id: "s5-1", nameEn: "Income Tax Return (ITR)", nameHi: "आयकर रिटर्न (ITR)", keywords: ["ITR", "income tax return", "ITR filing", "tax filing", "e-filing"], route: "/advisors?category=tax-consultant" },
      { id: "s5-2", nameEn: "GST Registration", nameHi: "GST पंजीकरण", keywords: ["GST registration", "GSTIN", "new GST number"], route: "/advisors?category=tax-consultant" },
      { id: "s5-3", nameEn: "GST Returns (GSTR 1/3B)", nameHi: "GST रिटर्न फाइलिंग", keywords: ["GST return", "GSTR-1", "GSTR-3B", "GST filing"], route: "/advisors?category=tax-consultant" },
      { id: "s5-4", nameEn: "TDS / TCS Return Filings", nameHi: "TDS / TCS रिटर्न फाइलिंग", keywords: ["TDS", "TCS", "TDS return", "form 16", "form 26AS", "TAN"], route: "/advisors?category=tax-consultant" },
      { id: "s5-5", nameEn: "Professional Tax (PT) Filing", nameHi: "व्यावसायिक कर (PT) फाइलिंग", keywords: ["professional tax", "PT registration", "PT return"], route: "/advisors?category=tax-consultant" },
      { id: "s5-6", nameEn: "Tax Planning & Savings Advisor", nameHi: "कर योजना और बचत सलाह", keywords: ["tax saving", "tax planning", "80C", "tax advisor"], route: "/advisors?category=tax-consultant" },
      { id: "s5-7", nameEn: "Tax Notice / Scrutiny Case", nameHi: "टैक्स नोटिस / स्क्रूटनी समाधान", keywords: ["income tax notice", "scrutiny", "assessment", "defective return"], route: "/advisors?category=tax-consultant" },
      { id: "s5-8", nameEn: "Form 16 / Salary TDS Guide", nameHi: "फॉर्म 16 / वेतन टीडीएस गाइड", keywords: ["form 16", "salary TDS certificate"], route: "/advisors?category=tax-consultant" }
    ]
  },
  {
    id: "m6",
    titleEn: "Business Registration & Licences",
    titleHi: "व्यापार रजिस्ट्रेशन और लाइसेंस",
    description: "Start proprietorships, companies, NGOs, obtain FSSAI licenses, and handle ROC filings.",
    descriptionHi: "एकल स्वामित्व, कंपनियां, गैर-सरकारी संगठन शुरू करें, FSSAI लाइसेंस प्राप्त करें और ROC फाइलिंग संभालें।",
    iconName: "Briefcase",
    subModules: [
      { id: "s6-1", nameEn: "Sole Proprietorship Set", nameHi: "एकल स्वामित्व व्यापार स्थापना", keywords: ["proprietorship", "sole proprietor", "individual business"], route: "/advisors?category=corporate-law" },
      { id: "s6-2", nameEn: "Partnership Firm Register", nameHi: "साझेदारी फर्म पंजीकरण", keywords: ["partnership firm", "partnership deed", "firm registration"], route: "/advisors?category=corporate-law" },
      { id: "s6-3", nameEn: "LLP Incorporation", nameHi: "LLP कंपनी निगमन", keywords: ["LLP", "limited liability partnership"], route: "/advisors?category=corporate-law" },
      { id: "s6-4", nameEn: "Private Limited Company", nameHi: "प्राइवेट लिमिटेड कंपनी", keywords: ["pvt ltd", "private limited", "company registration", "incorporation"], route: "/advisors?category=corporate-law" },
      { id: "s6-5", nameEn: "One Person Company (OPC)", nameHi: "वन पर्सन कंपनी (OPC)", keywords: ["OPC", "one person company"], route: "/advisors?category=corporate-law" },
      { id: "s6-6", nameEn: "NGO / Trust / Society Setup", nameHi: "NGO / ट्रस्ट / सोसाइटी पंजीकरण", keywords: ["NGO", "trust registration", "society registration", "section 8", "12A", "80G", "FCRA"], route: "/advisors?category=corporate-law" },
      { id: "s6-7", nameEn: "MSME / Udyam Registration", nameHi: "उद्यम / MSME पंजीकरण", keywords: ["MSME", "udyam", "udyog aadhaar", "small business registration"], route: "/advisors?category=corporate-law" },
      { id: "s6-8", nameEn: "Shop Act / Gumasta License", nameHi: "गुमास्ता / दुकान स्थापना लाइसेंस", keywords: ["shop act", "gumasta", "shop establishment", "S&E licence"], route: "/advisors?category=corporate-law" },
      { id: "s6-9", nameEn: "Trade License / Vyapaar", nameHi: "व्यापार (ट्रेड) लाइसेंस", keywords: ["trade licence", "business licence"], route: "/advisors?category=corporate-law" },
      { id: "s6-10", nameEn: "FSSAI (Food Business Lic)", nameHi: "खाद्य (FSSAI) लाइसेंस", keywords: ["FSSAI", "food licence", "food registration"], route: "/advisors?category=corporate-law" },
      { id: "s6-11", nameEn: "Import Export Code (IEC)", nameHi: "आयात निर्यात कोड (IEC)", keywords: ["IEC", "import export code", "DGFT"], route: "/advisors?category=corporate-law" },
      { id: "s6-12", nameEn: "Startup India DIPP App", nameHi: "स्टार्टअप इंडिया पंजीकरण", keywords: ["startup india", "DPIIT recognition"], route: "/advisors?category=corporate-law" },
      { id: "s6-13", nameEn: "Digital Signature (DSC)", nameHi: "डिजिटल सिग्नेचर (DSC)", keywords: ["DSC", "digital signature certificate"], route: "/advisors?category=corporate-law" },
      { id: "s6-14", nameEn: "ROC Filing & Compliances", nameHi: "कंपनी आरओसी अनुपालन", keywords: ["ROC filing", "annual return", "MCA", "AOC-4", "MGT-7", "company compliance"], route: "/advisors?category=corporate-law" },
      { id: "s6-15", nameEn: "Company Strike Off Closure", nameHi: "कंपनी बंदी (Strike Off)", keywords: ["company closure", "strike off", "winding up", "dissolution"], route: "/advisors?category=corporate-law" }
    ]
  },
  {
    id: "m7",
    titleEn: "Brand & Idea Protection",
    titleHi: "ब्रांड और आविष्कार सुरक्षा",
    description: "Securing intellectual assets via trademark registrations, designs, patents, and copyright filings.",
    descriptionHi: "ट्रेडमार्क पंजीकरण, डिज़ाइन, पेटेंट और कॉपीराइट फाइलिंग के माध्यम से बौद्धिक संपदा को सुरक्षित करना।",
    iconName: "Lightbulb",
    subModules: [
      { id: "s7-1", nameEn: "Trademark Registration", nameHi: "ट्रेडमार्क (TM) पंजीकरण", keywords: ["trademark", "TM", "brand registration", "logo registration"], route: "/advisors?category=corporate-law" },
      { id: "s7-2", nameEn: "Copyright Application", nameHi: "कॉपीराइट संरक्षण", keywords: ["copyright", "content protection", "artwork copyright"], route: "/advisors?category=corporate-law" },
      { id: "s7-3", nameEn: "Patent Search & Filing", nameHi: "पेटेंट सर्च और फाइलिंग", keywords: ["patent", "invention registration"], route: "/advisors?category=corporate-law" },
      { id: "s7-4", nameEn: "Industrial Design Registry", nameHi: "औद्योगिक डिज़ाइन पंजीकरण", keywords: ["design registration", "product design IP"], route: "/advisors?category=corporate-law" },
      { id: "s7-5", nameEn: "Geographical Indication (GI)", nameHi: "भौगोलिक संकेत (GI टैग)", keywords: ["GI tag", "geographical indication"], route: "/advisors?category=corporate-law" }
    ]
  },
  {
    id: "m8",
    titleEn: "Bank, Loan & Credit Card",
    titleHi: "बैंक, लोन और क्रेडिट कार्ड",
    description: "Structured home loans, commercial capital, CIBIL reports, and DSA loan consulting.",
    descriptionHi: "गृह ऋण, वाणिज्यिक पूंजी, सिबिल रिपोर्ट और डीएसए ऋण परामर्श।",
    iconName: "Landmark",
    subModules: [
      { id: "s8-1", nameEn: "Home / Housing Loan", nameHi: "गृह (होम) ऋण", keywords: ["home loan", "housing loan", "ghar loan"], route: "/advisors?category=loan-consultant" },
      { id: "s8-2", nameEn: "Personal Instant Loan", nameHi: "व्यक्तिगत तत्काल ऋण", keywords: ["personal loan", "instant loan"], route: "/advisors?category=loan-consultant" },
      { id: "s8-3", nameEn: "Business & MSME Capital", nameHi: "व्यापार / MSME ऋण", keywords: ["business loan", "working capital", "CGTMSE"], route: "/advisors?category=loan-consultant" },
      { id: "s8-4", nameEn: "Vehicle / Auto Finance", nameHi: "वाहन (कार/बाइक) ऋण", keywords: ["car loan", "bike loan", "auto loan", "vehicle finance"], route: "/advisors?category=loan-consultant" },
      { id: "s8-5", nameEn: "Education Loan Assistance", nameHi: "शिक्षा ऋण सहायता", keywords: ["education loan", "study loan", "vidya loan"], route: "/advisors?category=loan-consultant", crossRef: "Module 13 (Education)" },
      { id: "s8-6", nameEn: "Gold Loan Processing", nameHi: "गोल्ड (स्वर्ण) ऋण", keywords: ["gold loan", "sona loan"], route: "/advisors?category=loan-consultant" },
      { id: "s8-7", nameEn: "Loan Against Property (LAP)", nameHi: "संपत्ति पर ऋण (LAP)", keywords: ["LAP", "property loan", "mortgage loan"], route: "/advisors?category=loan-consultant" },
      { id: "s8-8", nameEn: "Mudra Govt Schemes Loan", nameHi: "सरकारी मुद्रा योजना लोन", keywords: ["mudra", "PMMY", "shishu kishore tarun"], route: "/advisors?category=loan-consultant" },
      { id: "s8-9", nameEn: "Credit Card Application", nameHi: "क्रेडिट कार्ड आवेदन", keywords: ["credit card", "CC apply", "card agent"], route: "/advisors?category=loan-consultant" },
      { id: "s8-10", nameEn: "Credit Score & CIBIL Check", nameHi: "क्रेडिट स्कोर / CIBIL जांच", keywords: ["CIBIL", "credit score", "credit report"], route: "/advisors?category=financial-advisor" },
      { id: "s8-11", nameEn: "Bank Account Opening Support", nameHi: "बैंक खाता खोलना सहायता", keywords: ["bank account", "savings account", "current account", "zero balance"], route: "/advisors?category=financial-advisor" },
      { id: "s8-12", nameEn: "DSA Agent Consultancy", nameHi: "डीएसए लोन एजेंट परामर्श", keywords: ["DSA", "loan agent", "loan consultant", "loan dealer"], route: "/advisors?category=loan-consultant" }
    ]
  },
  {
    id: "m9",
    titleEn: "Insurance (Bima)",
    titleHi: "बीमा (Bima)",
    description: "Term plans, health policies, mediclaim, crop bima, and claim support consultation.",
    descriptionHi: "टर्म प्लान, स्वास्थ्य नीतियां, मेडिक्लेम, फसल बीमा और दावा सहायता परामर्श।",
    iconName: "ShieldCheck",
    subModules: [
      { id: "s9-1", nameEn: "Life Insurance Planning", nameHi: "जीवन बीमा योजनाएं", keywords: ["life insurance", "LIC", "jeevan bima"], route: "/advisors?category=financial-advisor" },
      { id: "s9-2", nameEn: "Term Insurance Plans", nameHi: "टर्म इंश्योरेंस योजनाएं", keywords: ["term plan", "term insurance"], route: "/advisors?category=financial-advisor" },
      { id: "s9-3", nameEn: "Health / Mediclaim Policy", nameHi: "स्वास्थ्य बीमा / मेडिक्लेम", keywords: ["health insurance", "mediclaim", "medical insurance", "swasthya bima"], route: "/advisors?category=financial-advisor" },
      { id: "s9-4", nameEn: "Motor & Car Insurance", nameHi: "वाहन और कार इंश्योरेंस", keywords: ["car insurance", "bike insurance", "vehicle insurance", "motor policy"], route: "/advisors?category=insurance-claims", crossRef: "Module 10 (RTO)" },
      { id: "s9-5", nameEn: "Crop / Fasal Bima (PMFBY)", nameHi: "प्रधानमंत्री फसल बीमा योजना", keywords: ["crop insurance", "PMFBY", "fasal bima"], route: "/advisors?category=insurance-claims", crossRef: "Module 18 (Farmer)" },
      { id: "s9-6", nameEn: "Property / House / Fire Ins", nameHi: "संपत्ति / अग्नि बीमा", keywords: ["property insurance", "fire insurance", "home insurance"], route: "/advisors?category=insurance-claims" },
      { id: "s9-7", nameEn: "International Travel Policy", nameHi: "अंतरराष्ट्रीय यात्रा बीमा", keywords: ["travel insurance", "trip insurance"], route: "/advisors?category=insurance-claims" },
      { id: "s9-8", nameEn: "Insurance Claim Assistance", nameHi: "बीमा दावा निपटान सहायता", keywords: ["insurance claim", "claim settlement", "claim help"], route: "/advisors?category=insurance-claims" },
      { id: "s9-9", nameEn: "Agent & POSP Onboarding", nameHi: "बीमा एजेंट ऑनबोर्डिंग", keywords: ["insurance agent", "bima agent", "POSP", "advisor"], route: "/advisors?category=financial-advisor" }
    ]
  },
  {
    id: "m10",
    titleEn: "Vehicle & Driving (RTO Work)",
    titleHi: "गाड़ी और ड्राइविंग (RTO)",
    description: "Driving license renewal, inter-state vehicle transfer, duplicate RC, permits, and pollution certificates.",
    descriptionHi: "ड्राइविंग लाइसेंस नवीनीकरण, अंतर-राज्यीय वाहन हस्तांतरण, डुप्लिकेट आरसी, परमिट और प्रदूषण प्रमाण पत्र।",
    iconName: "Car",
    subModules: [
      { id: "s10-1", nameEn: "Learner's Licence (LL)", nameHi: "लर्निंग लाइसेंस आवेदन", keywords: ["learner licence", "LL", "learning license"], route: "/advisors?category=documentation-expert" },
      { id: "s10-2", nameEn: "Permanent DL & Renewal", nameHi: "ड्राइविंग लाइसेंस (DL) नवीनीकरण", keywords: ["driving licence", "DL", "permanent licence", "license renewal"], route: "/advisors?category=documentation-expert" },
      { id: "s10-3", nameEn: "International Driving Perm", nameHi: "अंतरराष्ट्रीय driving परमिट", keywords: ["IDP", "international driving licence"], route: "/advisors?category=documentation-expert" },
      { id: "s10-4", nameEn: "Vehicle Registration (RC)", nameHi: "नया वाहन पंजीकरण (RC)", keywords: ["RC", "vehicle registration", "new vehicle registration"], route: "/advisors?category=documentation-expert" },
      { id: "s10-5", nameEn: "RC Ownership Transfer", nameHi: "वाहन आरसी ट्रांसफर (नाम परिवर्तन)", keywords: ["RC transfer", "ownership transfer", "name transfer vehicle"], route: "/advisors?category=documentation-expert" },
      { id: "s10-6", nameEn: "Duplicate RC / DL Reissue", nameHi: "खोई आरसी / लाइसेंस पुनर्जारी", keywords: ["duplicate RC", "duplicate licence", "lost RC"], route: "/advisors?category=documentation-expert" },
      { id: "s10-7", nameEn: "Hypothecation Termination", nameHi: "आरसी बैंक लोन हटाना (HP)", keywords: ["hypothecation", "HP termination", "loan removal RC", "NOC vehicle"], route: "/advisors?category=documentation-expert" },
      { id: "s10-8", nameEn: "Inter-State Vehicle NOC", nameHi: "अंतर-राज्यीय वाहन एनओसी (NOC)", keywords: ["vehicle NOC", "transfer NOC", "inter-state NOC"], route: "/advisors?category=documentation-expert" },
      { id: "s10-9", nameEn: "Fitness Certificate (FC)", nameHi: "वाहन फिटनेस प्रमाण पत्र (FC)", keywords: ["fitness certificate", "vehicle fitness", "FC"], route: "/advisors?category=documentation-expert" },
      { id: "s10-10", nameEn: "Pollution Certificate (PUC)", nameHi: "प्रदूषण नियंत्रण पत्र (PUC)", keywords: ["PUC", "pollution certificate", "emission test"], route: "/advisors?category=documentation-expert" },
      { id: "s10-11", nameEn: "Road Tax Payment", nameHi: "रोड टैक्स भुगतान", keywords: ["road tax", "vehicle tax"], route: "/advisors?category=documentation-expert" },
      { id: "s10-12", nameEn: "Commercial Vehicle Permit", nameHi: "कमर्शियल वाहन परमिट", keywords: ["permit", "commercial permit", "national permit", "taxi permit"], route: "/advisors?category=documentation-expert" },
      { id: "s10-13", nameEn: "HSRP Number Plate Booking", nameHi: "हाई सिक्योरिटी नंबर प्लेट बुकिंग", keywords: ["HSRP", "number plate", "high security plate"], route: "/advisors?category=documentation-expert" },
      { id: "s10-14", nameEn: "Vehicle Motor Policy Check", nameHi: "वाहन बीमा पालिसी चेक", keywords: ["vehicle insurance", "motor policy"], route: "/advisors?category=insurance-claims", crossRef: "Module 9 (Insurance)" }
    ]
  },
  {
    id: "m11",
    titleEn: "Legal & Court Help",
    titleHi: "कानूनी और कोर्ट सहायता",
    description: "Notary attestations, legal notices, civil/criminal court litigation, cheque bounce cases, and bail counsel.",
    descriptionHi: "नोटरी सत्यापन, कानूनी नोटिस, दीवानी/याचिका न्यायालय मुकदमे, चेक बाउंस के मामले और जमानत वकील।",
    iconName: "Scale",
    subModules: [
      { id: "s11-1", nameEn: "Notary Services & Stamp", nameHi: "नोटरी सत्यापन और स्टांप", keywords: ["notary", "notarized", "attestation"], route: "/advisors?category=legal-advisor" },
      { id: "s11-2", nameEn: "Affidavits Drafting", nameHi: "शपथ पत्र प्रारूपण (Affidavit)", keywords: ["affidavit", "halafnama"], route: "/advisors?category=documentation-expert", crossRef: "Module 1 (Civil)" },
      { id: "s11-3", nameEn: "Power of Attorney (POA)", nameHi: "मुख्तारनामा (POA) ड्राफ्ट", keywords: ["power of attorney", "POA", "mukhtarnama"], route: "/advisors?category=documentation-expert", crossRef: "Module 4 (Property)" },
      { id: "s11-4", nameEn: "Legal Notice Dispatch", nameHi: "कानूनी नोटिस प्रेषण", keywords: ["legal notice", "notice draft"], route: "/advisors?category=legal-advisor" },
      { id: "s11-5", nameEn: "Agreement & MOU Drafting", nameHi: "अनुबंध और सहमति पत्र ड्राफ्ट", keywords: ["agreement", "contract", "MOU", "drafting"], route: "/advisors?category=documentation-expert" },
      { id: "s11-6", nameEn: "Civil Dispute Suit Cases", nameHi: "दीवानी और संपत्ति मुकदमे", keywords: ["civil case", "civil suit", "property dispute"], route: "/advisors?category=legal-advisor" },
      { id: "s11-7", nameEn: "Criminal Defence Lawyers", nameHi: "आपराधिक रक्षा वकील", keywords: ["criminal case", "defence lawyer", "IPC", "BNS"], route: "/advisors?category=criminal-defence" },
      { id: "s11-8", nameEn: "Family & Divorce Court Help", nameHi: "पारिवारिक और तलाक न्यायालय मदद", keywords: ["divorce", "custody", "maintenance", "alimony", "domestic violence", "498A"], route: "/advisors?category=family-law" },
      { id: "s11-9", nameEn: "Cheque Bounce (Sec 138)", nameHi: "चेक बाउंस मामला (धारा 138)", keywords: ["cheque bounce", "dishour", "138 case"], route: "/advisors?category=legal-advisor" },
      { id: "s11-10", nameEn: "Consumer Court Forums", nameHi: "उपभोक्ता न्यायालय फोरम शिकायत", keywords: ["consumer court", "consumer forum", "refund complaint"], route: "/advisors?category=legal-advisor" },
      { id: "s11-11", nameEn: "Cybercrime Complaints Cell", nameHi: "साइबर अपराध सेल शिकायत", keywords: ["cybercrime", "online fraud", "cyber cell", "1930"], route: "/advisors?category=legal-advisor" },
      { id: "s11-12", nameEn: "Police Complaint e-FIR", nameHi: "पुलिस शिकायत / ई-FIR", keywords: ["FIR", "police complaint", "e-FIR"], route: "/advisors?category=legal-advisor" },
      { id: "s11-13", nameEn: "Bail & Anticipatory Bail", nameHi: "जमानत और अग्रिम जमानत", keywords: ["bail", "anticipatory bail", "regular bail"], route: "/advisors?category=criminal-defence" },
      { id: "s11-14", nameEn: "Succession Cert & Probate", nameHi: "उत्तराधिकार प्रमाण पत्र और प्रोबेट", keywords: ["probate", "succession certificate", "will execution"], route: "/advisors?category=legal-advisor" },
      { id: "s11-15", nameEn: "Arbitration & Mediation", nameHi: "मध्यस्थता और सुलह (ADR)", keywords: ["arbitration", "mediation", "ADR", "lok adalat"], route: "/advisors?category=legal-advisor" }
    ]
  },
  {
    id: "m12",
    titleEn: "Job, PF & Labour",
    titleHi: "नौकरी, PF और श्रमिक",
    description: "Employee provident fund withdrawals, ESI registrations, and labor licensing applications.",
    descriptionHi: "कर्मचारी भविष्य निधि निकासी, ईएसआई पंजीकरण और श्रम लाइसेंस आवेदन।",
    iconName: "Users",
    subModules: [
      { id: "s12-1", nameEn: "EPF / PF Withdrawal UAN", nameHi: "PF निकासी और UAN सेवाएं", keywords: ["EPF", "PF", "provident fund", "PF withdrawal", "PF transfer", "UAN"], route: "/advisors?category=documentation-expert" },
      { id: "s12-2", nameEn: "ESI Registration & Claims", nameHi: "ESI स्वास्थ्य कार्ड और दावे", keywords: ["ESI", "ESIC", "employee insurance"], route: "/advisors?category=financial-advisor" },
      { id: "s12-3", nameEn: "Gratuity Trust Claims", nameHi: "ग्रेच्युटी दावा सहायता", keywords: ["gratuity", "gratuity claim"], route: "/advisors?category=financial-advisor" },
      { id: "s12-4", nameEn: "Pension Withdrawal (EPS)", nameHi: "कर्मचारी पेंशन निकासी (EPS)", keywords: ["EPS", "pension", "employee pension"], route: "/advisors?category=financial-advisor" },
      { id: "s12-5", nameEn: "Labour Card & e-Shram", nameHi: "लेबर (श्रमिक) कार्ड और ई-श्रम", keywords: ["labour card", "e-shram", "shramik card", "BOCW"], route: "/advisors?category=documentation-expert" },
      { id: "s12-6", nameEn: "Contractor Labour License", nameHi: "ठेकेदार श्रम लाइसेंस", keywords: ["labour licence", "contract labour"], route: "/advisors?category=corporate-law" },
      { id: "s12-7", nameEn: "Employment Agreement Draft", nameHi: "नियुक्ति पत्र / रोजगार अनुबंध", keywords: ["appointment letter", "offer letter", "employment agreement"], route: "/advisors?category=documentation-expert" }
    ]
  },
  {
    id: "m13",
    titleEn: "School & College Papers",
    titleHi: "स्कूल और कॉलेज के कागज़",
    description: "Academic migration certificates, school transfer records, degree attestation, and WES verification.",
    descriptionHi: "शैक्षणिक प्रवासन प्रमाण पत्र, स्कूल स्थानांतरण रिकॉर्ड, डिग्री सत्यापन और डब्ल्यूईएस सत्यापन।",
    iconName: "GraduationCap",
    subModules: [
      { id: "s13-1", nameEn: "Migration Certificate Board", nameHi: "प्रवासन प्रमाण पत्र (Migration)", keywords: ["migration certificate", "college migration"], route: "/advisors?category=documentation-expert" },
      { id: "s13-2", nameEn: "Transfer Certificate (TC)", nameHi: "स्थानांतरण प्रमाण पत्र (TC)", keywords: ["TC", "transfer certificate", "school leaving"], route: "/advisors?category=documentation-expert" },
      { id: "s13-3", nameEn: "Bonafide Student Cert", nameHi: "बोनाफाइड छात्र प्रमाण पत्र", keywords: ["bonafide", "student certificate"], route: "/advisors?category=documentation-expert" },
      { id: "s13-4", nameEn: "Degree / Marksheet Verification", nameHi: "डिग्री और मार्कशीट सत्यापन (WES)", keywords: ["marksheet verification", "degree attestation", "WES"], route: "/advisors?category=documentation-expert" },
      { id: "s13-5", nameEn: "Scholarship Form Apply", nameHi: "राष्ट्रीय छात्रवृत्ति पोर्टल आवेदन", keywords: ["scholarship", "NSP", "scholarship form"], route: "/advisors?category=documentation-expert" },
      { id: "s13-6", nameEn: "Education Loan Support", nameHi: "शिक्षा ऋण सहायता (Vidya)", keywords: ["education loan", "study loan"], route: "/advisors?category=loan-consultant", crossRef: "Module 8 (Banking)" }
    ]
  },
  {
    id: "m14",
    titleEn: "Pension & Govt Schemes",
    titleHi: "पेंशन और सरकारी योजना",
    description: "Ayushman Bharat card setup, state welfare pensions, PM-KISAN, and direct benefit transfer filing.",
    descriptionHi: "आयुष्मान भारत कार्ड सेटअप, राज्य कल्याण पेंशन, पीएम-किसान और प्रत्यक्ष लाभ हस्तांतरण फाइलिंग।",
    iconName: "HeartHandshake",
    subModules: [
      { id: "s14-1", nameEn: "Old Age Pension Plan", nameHi: "वृद्धावस्था पेंशन योजना", keywords: ["old age pension", "vridha pension"], route: "/advisors?category=financial-advisor" },
      { id: "s14-2", nameEn: "Widow / Single Mother Pension", nameHi: "विधवा / बेसहारा महिला पेंशन", keywords: ["widow pension", "vidhwa pension"], route: "/advisors?category=financial-advisor" },
      { id: "s14-3", nameEn: "Disability / Divyang Pension", nameHi: "दिव्यांग (विकलांग) पेंशन योजना", keywords: ["disability pension", "divyang pension"], route: "/advisors?category=financial-advisor" },
      { id: "s14-4", nameEn: "Ayushman Bharat PMJAY", nameHi: "आयुष्मान भारत स्वास्थ्य कार्ड", keywords: ["ayushman", "PMJAY", "golden card", "health card scheme"], route: "/advisors?category=documentation-expert" },
      { id: "s14-5", nameEn: "PM-KISAN Samman Nidhi", nameHi: "PM-किसान सम्मान निधि (6000)", keywords: ["PM kisan", "kisan samman", "6000 scheme"], route: "/advisors?category=documentation-expert", crossRef: "Module 18 (Farmer)" },
      { id: "s14-6", nameEn: "State Subsidy Scheme Form", nameHi: "सरकारी कल्याण योजना आवेदन", keywords: ["yojana", "sarkari yojana", "scheme apply", "subsidy"], route: "/advisors?category=documentation-expert" }
    ]
  },
  {
    id: "m15",
    titleEn: "Savings & Investment",
    titleHi: "बचत और निवेश",
    description: "Mutual funds setup, Demat share accounts, national pension scheme, and estate will planning.",
    descriptionHi: "म्युचुअल फंड सेटअप, डिमैट शेयर खाते, राष्ट्रीय पेंशन योजना और संपदा वसीयत योजना।",
    iconName: "TrendingUp",
    subModules: [
      { id: "s15-1", nameEn: "Mutual Funds (SIP / Lumpsum)", nameHi: "म्युचुअल फंड (SIP निवेश)", keywords: ["mutual fund", "SIP", "MF investment"], route: "/advisors?category=financial-advisor" },
      { id: "s15-2", nameEn: "Demat & Trading Account", nameHi: "डिमैट और स्टॉक ट्रेडिंग खाता", keywords: ["demat", "trading account", "share account", "stock market"], route: "/advisors?category=financial-advisor" },
      { id: "s15-3", nameEn: "Postal Schemes (PPF/NSC/KVP)", nameHi: "डाकघर बचत (PPF/NSC/KVP)", keywords: ["PPF", "NSC", "KVP", "post office scheme", "sukanya samriddhi"], route: "/advisors?category=financial-advisor" },
      { id: "s15-4", nameEn: "NPS Retirement Account", nameHi: "राष्ट्रीय पेंशन योजना (NPS)", keywords: ["NPS", "national pension scheme", "retirement"], route: "/advisors?category=financial-advisor" },
      { id: "s15-5", nameEn: "Estate & Legacy Planning", nameHi: "वसीयत और विरासत योजना", keywords: ["estate planning", "will", "succession planning"], route: "/advisors?category=documentation-expert", crossRef: "Module 4 (Property)" },
      { id: "s15-6", nameEn: "Financial Wealth Advisory", nameHi: "वित्तीय धन प्रबंधन योजना", keywords: ["financial advisor", "investment planning", "wealth"], route: "/advisors?category=financial-advisor" }
    ]
  },
  {
    id: "m16",
    titleEn: "Passport, Visa & Foreign",
    titleHi: "पासपोर्ट, वीज़ा और विदेश कागज़",
    description: "Tourist/work visa consultation, MEA document apostille, translation, and police clearance.",
    descriptionHi: "पर्यटक/कार्य वीज़ा परामर्श, MEA दस्तावेज़ अपोस्टील, अनुवाद और पुलिस क्लीयरेंस।",
    iconName: "Globe",
    subModules: [
      { id: "s16-1", nameEn: "Passport Application Seva", nameHi: "पासपोर्ट आवेदन सेवा", keywords: ["passport", "passport seva"], route: "/advisors?category=documentation-expert", crossRef: "Module 2 (Identity)" },
      { id: "s16-2", nameEn: "Visa Document Assistance", nameHi: "वीज़ा दस्तावेज़ परामर्श सहायता", keywords: ["visa", "tourist visa", "work visa", "student visa"], route: "/advisors?category=documentation-expert" },
      { id: "s16-3", nameEn: "Apostille MEA Attestation", nameHi: "दस्तावेज़ अपोस्टील / MEA सत्यापन", keywords: ["apostille", "attestation", "MEA attestation", "embassy attestation"], route: "/advisors?category=documentation-expert" },
      { id: "s16-4", nameEn: "Police Clearance Certificate", nameHi: "पुलिस क्लीयरेंस (PCC) प्रमाणपत्र", keywords: ["PCC", "police clearance", "character certificate"], route: "/advisors?category=documentation-expert" },
      { id: "s16-5", nameEn: "Certified Translation", nameHi: "प्रमाणित दस्तावेज़ अनुवाद", keywords: ["translation", "certified translation"], route: "/advisors?category=documentation-expert" }
    ]
  },
  {
    id: "m17",
    titleEn: "Electricity, Water & Gas",
    titleHi: "बिजली, पानी और गैस कनेक्शन",
    description: "Utility meters connection setup, ownership name change filings, and municipal tax billing.",
    descriptionHi: "उपयोगिता मीटर कनेक्शन सेटअप, स्वामित्व नाम परिवर्तन फाइलिंग और नगर पालिका कर बिलिंग।",
    iconName: "Zap",
    subModules: [
      { id: "s17-1", nameEn: "Electricity Meter Connection", nameHi: "बिजली मीटर नया कनेक्शन / नाम चेंज", keywords: ["electricity connection", "bijli", "new meter", "name change electricity"], route: "/advisors?category=property-registration" },
      { id: "s17-2", nameEn: "Water connection request", nameHi: "नगर पालिका पानी कनेक्शन", keywords: ["water connection", "nal connection"], route: "/advisors?category=property-registration" },
      { id: "s17-3", nameEn: "Gas Connection (LPG/PNG)", nameHi: "गैस कनेक्शन (LPG/PNG सिलेंडर)", keywords: ["gas connection", "LPG", "new cylinder connection", "PNG"], route: "/advisors?category=property-registration" },
      { id: "s17-4", nameEn: "Property holding tax check", nameHi: "संपत्ति कर निर्धारण / हाउस टैक्स", keywords: ["house tax", "property tax"], route: "/advisors?category=real-estate-advisory", crossRef: "Module 4 (Property)" },
      { id: "s17-5", nameEn: "Commercial Trade Licence", nameHi: "व्यापार व्यापार लाइसेंस", keywords: ["trade licence"], route: "/advisors?category=corporate-law", crossRef: "Module 6 (Business)" }
    ]
  },
  {
    id: "m18",
    titleEn: "Farmer & Agriculture",
    titleHi: "किसान और खेती सेवाएं",
    description: "Kisan credit card processing, PMFBY crop insurance plans, and digital land registries.",
    descriptionHi: "किसान क्रेडिट कार्ड प्रसंस्करण, पीएमएफबीवाई फसल बीमा योजनाएं और डिजिटल भूमि रजिस्ट्रियां।",
    iconName: "Sprout",
    subModules: [
      { id: "s18-1", nameEn: "Kisan Credit Card (KCC)", nameHi: "किसान क्रेडिट कार्ड (KCC लोन)", keywords: ["KCC", "kisan credit card", "farmer loan"], route: "/advisors?category=loan-consultant" },
      { id: "s18-2", nameEn: "Soil Health Card Test", nameHi: "मृदा स्वास्थ्य कार्ड रिपोर्ट", keywords: ["soil health card", "soil test"], route: "/advisors?category=documentation-expert" },
      { id: "s18-3", nameEn: "PMFBY Crop Bima Scheme", nameHi: "प्रधानमंत्री फसल बीमा (PMFBY)", keywords: ["fasal bima", "PMFBY"], route: "/advisors?category=insurance-claims", crossRef: "Module 9 (Insurance)" },
      { id: "s18-4", nameEn: "Farmer Registration Portal", nameHi: "किसान सरकारी पंजीकरण", keywords: ["farmer registration", "kisan registration", "agristack"], route: "/advisors?category=documentation-expert" },
      { id: "s18-5", nameEn: "Agricultural Land Record fard", nameHi: "कृषि भूमि रिकॉर्ड (खसरा खतौनी)", keywords: ["khasra khatauni", "7/12", "jamabandi"], route: "/advisors?category=real-estate-advisory", crossRef: "Module 4 (Property)" }
    ]
  },
  {
    id: "m19",
    titleEn: "Online Form & Document Help",
    titleHi: "ऑनलाइन फॉर्म और कागज़ सहायता",
    description: "DigiLocker integrations, CSC center applications, scanning, photocopy, and online form submissions.",
    descriptionHi: "डिजिलॉकर एकीकरण, सीएससी केंद्र आवेदन, स्कैनिंग, फोटोकॉपी और ऑनलाइन फॉर्म जमा करना।",
    iconName: "Laptop",
    subModules: [
      { id: "s19-1", nameEn: "DigiLocker Set Setup", nameHi: "डिजिलॉकर दस्तावेज़ लिंक", keywords: ["digilocker", "digital documents"], route: "/advisors?category=documentation-expert" },
      { id: "s19-2", nameEn: "CSC Center Services", nameHi: "जन सेवा केंद्र (CSC) आवेदन", keywords: ["CSC", "jan seva kendra", "e-mitra", "e-district"], route: "/advisors?category=documentation-expert" },
      { id: "s19-3", nameEn: "Online Form Submissions", nameHi: "सरकारी ऑनलाइन फॉर्म भरना", keywords: ["form filling", "online application", "sarkari form"], route: "/advisors?category=documentation-expert" },
      { id: "s19-4", nameEn: "Scanning & Document Copy", nameHi: "दस्तावेज़ स्कैनिंग और फोटोकॉपी", keywords: ["scan", "printout", "photocopy", "lamination"], route: "/advisors?category=documentation-expert" }
    ]
  },
  {
    id: "m20",
    titleEn: "Central Government Schemes",
    titleHi: "केंद्र सरकार की योजनाएं",
    description: "Expert guidance for PM-KISAN, Ayushman Bharat, Mudra Loan, PMAY, PMEGP and other Central Govt welfare programmes.",
    descriptionHi: "PM-KISAN, आयुष्मान भारत, मुद्रा लोन, PMAY, PMEGP जैसी केंद्र सरकार की योजनाओं के लिए विशेषज्ञ मार्गदर्शन।",
    iconName: "Flag",
    subModules: [
      { id: "s20-1", nameEn: "PM-KISAN (Farm Income Support)",   nameHi: "पीएम किसान सम्मान निधि",              keywords: ["PM KISAN", "pm kisan", "farmer income", "kisan samman", "₹6000 farmer"], route: "/advisors?category=m20" },
      { id: "s20-2", nameEn: "PMFBY (Crop Insurance)",           nameHi: "प्रधानमंत्री फसल बीमा योजना",         keywords: ["PMFBY", "crop insurance", "fasal bima", "farm insurance"], route: "/advisors?category=m20" },
      { id: "s20-3", nameEn: "Ayushman Bharat (PM-JAY)",         nameHi: "आयुष्मान भारत – पीएम जन आरोग्य",     keywords: ["ayushman bharat", "PM-JAY", "health card", "5 lakh health cover", "golden card"], route: "/advisors?category=m20" },
      { id: "s20-4", nameEn: "Atal Pension Yojana (APY)",        nameHi: "अटल पेंशन योजना",                    keywords: ["atal pension", "APY", "pension scheme", "retirement savings"], route: "/advisors?category=m20" },
      { id: "s20-5", nameEn: "PM Mudra Yojana (PMMY)",           nameHi: "प्रधानमंत्री मुद्रा योजना",           keywords: ["mudra loan", "PMMY", "shishu loan", "kishore loan", "tarun loan", "small business loan"], route: "/advisors?category=m20" },
      { id: "s20-6", nameEn: "PMEGP (Employment Generation)",    nameHi: "प्रधानमंत्री रोजगार सृजन कार्यक्रम", keywords: ["PMEGP", "employment generation", "self employment", "subsidy loan"], route: "/advisors?category=m20" },
      { id: "s20-7", nameEn: "PM Awas Yojana (PMAY)",            nameHi: "प्रधानमंत्री आवास योजना",             keywords: ["PMAY", "awas yojana", "housing scheme", "pucca house", "EWS housing"], route: "/advisors?category=m20" },
      { id: "s20-8", nameEn: "PM Ujjwala Yojana (PMUY)",         nameHi: "प्रधानमंत्री उज्ज्वला योजना",        keywords: ["ujjwala", "free LPG", "cooking gas BPL", "PMUY"], route: "/advisors?category=m20" },
    ]
  },
  {
    id: "m21",
    titleEn: "Study Abroad Consulting",
    titleHi: "विदेश में पढ़ाई — Study Abroad",
    description: "End-to-end guidance for foreign university admissions: IELTS prep, SOP, shortlisting, visa and pre-departure.",
    descriptionHi: "विदेशी विश्वविद्यालय में दाखिले के लिए IELTS, SOP, university shortlisting, visa और pre-departure guidance।",
    iconName: "Plane",
    subModules: []
  },
  {
    id: "m22",
    titleEn: "Domestic College Admission",
    titleHi: "भारत में कॉलेज दाखिला — Domestic Admission",
    description: "Complete support for Indian college admissions: NEET/JEE/CAT counseling, seat allotment and enrollment.",
    descriptionHi: "भारतीय college में दाखिले के लिए NEET/JEE/CAT counseling, seat allotment और enrollment में पूरी मदद।",
    iconName: "School",
    subModules: []
  },
  {
    id: "m23",
    titleEn: "Job Placement & Recruitment",
    titleHi: "नौकरी और रोजगार — Job Placement",
    description: "Corporate job placement: resume building, interview preparation, offer negotiation and post-joining support.",
    descriptionHi: "Corporate नौकरी के लिए resume, interview prep, offer negotiation और post-joining support।",
    iconName: "ClipboardList",
    subModules: []
  },
  {
    id: "m24",
    titleEn: "Visa & PR Immigration",
    titleHi: "वीज़ा और PR — Immigration",
    description: "Expert visa, work permit and PR guidance for Canada, Australia, UK, USA and other countries.",
    descriptionHi: "Canada, Australia, UK, USA जैसे देशों के लिए visa, work permit और PR की विशेषज्ञ मार्गदर्शन।",
    iconName: "FileCheck",
    subModules: []
  },
  {
    id: "m25",
    titleEn: "Others / Custom Service",
    titleHi: "अन्य / कस्टम सेवा",
    description: "Any specialization not listed above — describe your unique expertise and connect with the right clients.",
    descriptionHi: "ऊपर सूचीबद्ध नहीं की गई कोई भी विशेषज्ञता — अपनी अनूठी सेवा का वर्णन करें।",
    iconName: "Sparkles",
    subModules: []
  }
];
