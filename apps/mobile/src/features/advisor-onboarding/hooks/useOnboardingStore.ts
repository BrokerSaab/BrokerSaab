import { create } from 'zustand';
import { AdvisorType } from '@brokersaab/shared-types';

export interface OnboardingFormData {
  // Step 2 — Phone
  phoneNumber: string;
  // Step 3 — Advisor type
  advisorType: AdvisorType | '';
  // Step 4 — Account
  email: string;
  password: string;
  // Step 5 — Profile
  fullName: string;
  businessName: string;
  experienceYears: string;
  city: string;
  state: string;
  bio: string;
  consultationFee: string;
  languages: string[];
  licenseNumber: string;
  // Step 6 — KYC
  aadhaarNumber: string;
  aadhaarUrl: string;
  passportPhotoUrl: string;
  licenseUrl: string;
  gstUrl: string;
  // Step 7 — Services
  selectedCategories: string[];
  // Step 8 — Availability
  availability: Array<{ dayOfWeek: string; startTime: string; endTime: string }>;
}

const DEFAULT_FORM: OnboardingFormData = {
  phoneNumber: '',
  advisorType: '',
  email: '',
  password: '',
  fullName: '',
  businessName: '',
  experienceYears: '',
  city: '',
  state: '',
  bio: '',
  consultationFee: '',
  languages: [],
  licenseNumber: '',
  aadhaarNumber: '',
  aadhaarUrl: '',
  passportPhotoUrl: '',
  licenseUrl: '',
  gstUrl: '',
  selectedCategories: [],
  availability: [],
};

interface OnboardingStore {
  form: OnboardingFormData;
  advisorId: string | null;
  currentStep: number;
  updateForm: (partial: Partial<OnboardingFormData>) => void;
  setAdvisorId: (id: string) => void;
  setStep: (step: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  form: DEFAULT_FORM,
  advisorId: null,
  currentStep: 1,
  updateForm: (partial) => set((s) => ({ form: { ...s.form, ...partial } })),
  setAdvisorId: (id) => set({ advisorId: id }),
  setStep: (step) => set({ currentStep: step }),
  reset: () => set({ form: DEFAULT_FORM, advisorId: null, currentStep: 1 }),
}));
