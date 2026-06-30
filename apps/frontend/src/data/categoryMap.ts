const CATEGORY_SLUG_MAP: Record<string, string> = {
  m1:  'Birth, Death & Marriage',
  m2:  'Identity Cards & Documents',
  m3:  'Income, Caste & Residence',
  m4:  'Property & Land Papers',
  m5:  'Tax / GST Filing',
  m6:  'Business Registration',
  m7:  'Brand & IP Protection',
  m8:  'Bank, Loan & Credit',
  m9:  'Insurance (Bima)',
  m10: 'Vehicle & RTO Work',
  m11: 'Legal & Court Help',
  m12: 'Job, PF & Labour',
  m13: 'School & College Papers',
  m14: 'Pension & Govt Schemes',
  m15: 'Savings & Investment',
  m16: 'Passport, Visa & Foreign',
  m17: 'Electricity, Water & Gas',
  m18: 'Farmer & Agriculture',
  m19: 'Online Form & Doc Help',
  m20: 'Central Govt Schemes',
  m21: 'Study Abroad Consulting',
  m22: 'Domestic College Admission',
  m23: 'Job Placement & Recruitment',
  m24: 'Visa & PR Immigration',
  m25: 'Others / Custom Service',
  m26: 'Tour & Travel',
  m27: 'Local Medical Representative',
  m28: 'Local Distributors',
};

export function getCategoryName(slug?: string | null): string {
  if (!slug) return 'General';
  return CATEGORY_SLUG_MAP[slug.toLowerCase()] || slug;
}
