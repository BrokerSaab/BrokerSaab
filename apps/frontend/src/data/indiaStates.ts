export interface IndiaState {
  id: string;
  name: string;
  abbr: string;
  capital: string;
  cities: string[];
  region: 'north' | 'south' | 'east' | 'west' | 'central' | 'northeast' | 'ut';
  row: number;
  col: number;
  colSpan?: number;
  rowSpan?: number;
}

export const REGION_COLORS: Record<IndiaState['region'], { bg: string; border: string; text: string; selectedBg: string }> = {
  north:     { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  text: '#93c5fd', selectedBg: '#3b82f6' },
  south:     { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  text: '#6ee7b7', selectedBg: '#10b981' },
  east:      { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.3)',  text: '#c4b5fd', selectedBg: '#8b5cf6' },
  west:      { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  text: '#fcd34d', selectedBg: '#f59e0b' },
  central:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   text: '#fca5a5', selectedBg: '#ef4444' },
  northeast: { bg: 'rgba(20,184,166,0.1)',  border: 'rgba(20,184,166,0.3)',  text: '#5eead4', selectedBg: '#14b8a6' },
  ut:        { bg: 'rgba(212,175,55,0.1)',  border: 'rgba(212,175,55,0.3)',  text: '#fde68a', selectedBg: '#D4AF37' },
};

export const INDIA_STATES: IndiaState[] = [
  // ── Row 1: Far North ──
  { id: 'JK',  name: 'Jammu & Kashmir',  abbr: 'J&K',  capital: 'Srinagar',    cities: ['Srinagar', 'Jammu', 'Anantnag'],            region: 'ut',        row: 1, col: 1, colSpan: 2 },
  { id: 'LA',  name: 'Ladakh',           abbr: 'LA',   capital: 'Leh',          cities: ['Leh', 'Kargil'],                             region: 'ut',        row: 1, col: 3, colSpan: 2 },
  { id: 'HP',  name: 'Himachal Pradesh', abbr: 'HP',   capital: 'Shimla',       cities: ['Shimla', 'Manali', 'Dharamshala', 'Solan'],  region: 'north',     row: 1, col: 5 },
  { id: 'UK',  name: 'Uttarakhand',      abbr: 'UK',   capital: 'Dehradun',     cities: ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital'], region: 'north', row: 1, col: 6 },
  { id: 'SK',  name: 'Sikkim',           abbr: 'SK',   capital: 'Gangtok',      cities: ['Gangtok', 'Namchi'],                         region: 'northeast', row: 1, col: 10 },
  { id: 'AR',  name: 'Arunachal Pradesh',abbr: 'AR',   capital: 'Itanagar',     cities: ['Itanagar', 'Naharlagun'],                    region: 'northeast', row: 1, col: 11 },
  { id: 'NL',  name: 'Nagaland',         abbr: 'NL',   capital: 'Kohima',       cities: ['Kohima', 'Dimapur'],                         region: 'northeast', row: 1, col: 12 },

  // ── Row 2: North ──
  { id: 'PB',  name: 'Punjab',           abbr: 'PB',   capital: 'Chandigarh',   cities: ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'], region: 'north', row: 2, col: 1 },
  { id: 'CH',  name: 'Chandigarh',       abbr: 'CH',   capital: 'Chandigarh',   cities: ['Chandigarh'],                                region: 'ut',        row: 2, col: 2 },
  { id: 'HR',  name: 'Haryana',          abbr: 'HR',   capital: 'Chandigarh',   cities: ['Gurugram', 'Faridabad', 'Hisar', 'Rohtak'],  region: 'north',     row: 2, col: 3 },
  { id: 'DL',  name: 'Delhi',            abbr: 'DL',   capital: 'New Delhi',    cities: ['New Delhi', 'Dwarka', 'Rohini', 'Noida'],   region: 'ut',        row: 2, col: 4 },
  { id: 'UP',  name: 'Uttar Pradesh',    abbr: 'UP',   capital: 'Lucknow',      cities: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida'], region: 'north', row: 2, col: 5, colSpan: 2 },
  { id: 'BR',  name: 'Bihar',            abbr: 'BR',   capital: 'Patna',        cities: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'], region: 'east',    row: 2, col: 7 },
  { id: 'WB',  name: 'West Bengal',      abbr: 'WB',   capital: 'Kolkata',      cities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'], region: 'east',    row: 2, col: 8 },
  { id: 'AS',  name: 'Assam',            abbr: 'AS',   capital: 'Dispur',       cities: ['Guwahati', 'Silchar', 'Dibrugarh'],          region: 'northeast', row: 2, col: 9, colSpan: 2 },
  { id: 'MN',  name: 'Manipur',          abbr: 'MN',   capital: 'Imphal',       cities: ['Imphal', 'Thoubal'],                         region: 'northeast', row: 2, col: 11 },
  { id: 'MZ',  name: 'Mizoram',          abbr: 'MZ',   capital: 'Aizawl',       cities: ['Aizawl', 'Lunglei'],                         region: 'northeast', row: 2, col: 12 },

  // ── Row 3: Central North ──
  { id: 'RJ',  name: 'Rajasthan',        abbr: 'RJ',   capital: 'Jaipur',       cities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Ajmer', 'Kota'], region: 'west', row: 3, col: 1, colSpan: 2 },
  { id: 'MP',  name: 'Madhya Pradesh',   abbr: 'MP',   capital: 'Bhopal',       cities: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],  region: 'central',   row: 3, col: 4, colSpan: 2 },
  { id: 'JH',  name: 'Jharkhand',        abbr: 'JH',   capital: 'Ranchi',       cities: ['Ranchi', 'Jamshedpur', 'Dhanbad'],           region: 'east',      row: 3, col: 7 },
  { id: 'OD',  name: 'Odisha',           abbr: 'OD',   capital: 'Bhubaneswar',  cities: ['Bhubaneswar', 'Cuttack', 'Rourkela'],        region: 'east',      row: 3, col: 8 },
  { id: 'TR',  name: 'Tripura',          abbr: 'TR',   capital: 'Agartala',     cities: ['Agartala', 'Dharmanagar'],                   region: 'northeast', row: 3, col: 9 },
  { id: 'ML',  name: 'Meghalaya',        abbr: 'ML',   capital: 'Shillong',     cities: ['Shillong', 'Tura'],                          region: 'northeast', row: 3, col: 10 },

  // ── Row 4: West & Central ──
  { id: 'GJ',  name: 'Gujarat',          abbr: 'GJ',   capital: 'Gandhinagar',  cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'], region: 'west',      row: 4, col: 1, colSpan: 2 },
  { id: 'MH',  name: 'Maharashtra',      abbr: 'MH',   capital: 'Mumbai',       cities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'], region: 'west', row: 4, col: 3, colSpan: 2 },
  { id: 'CG',  name: 'Chhattisgarh',     abbr: 'CG',   capital: 'Raipur',       cities: ['Raipur', 'Bhilai', 'Bilaspur'],              region: 'central',   row: 4, col: 5, colSpan: 2 },
  { id: 'TG',  name: 'Telangana',        abbr: 'TG',   capital: 'Hyderabad',    cities: ['Hyderabad', 'Warangal', 'Nizamabad'],        region: 'south',     row: 4, col: 7 },
  { id: 'AP',  name: 'Andhra Pradesh',   abbr: 'AP',   capital: 'Amaravati',    cities: ['Visakhapatnam', 'Vijayawada', 'Guntur'],     region: 'south',     row: 4, col: 8 },

  // ── Row 5: South ──
  { id: 'GA',  name: 'Goa',              abbr: 'GA',   capital: 'Panaji',       cities: ['Panaji', 'Margao', 'Vasco da Gama'],         region: 'west',      row: 5, col: 3 },
  { id: 'KA',  name: 'Karnataka',        abbr: 'KA',   capital: 'Bengaluru',    cities: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru'], region: 'south',     row: 5, col: 4, colSpan: 2 },
  { id: 'TN',  name: 'Tamil Nadu',       abbr: 'TN',   capital: 'Chennai',      cities: ['Chennai', 'Coimbatore', 'Madurai', 'Salem'], region: 'south',     row: 5, col: 7 },
  { id: 'PY',  name: 'Puducherry',       abbr: 'PY',   capital: 'Puducherry',   cities: ['Puducherry', 'Karaikal'],                    region: 'ut',        row: 5, col: 8 },

  // ── Row 6: Far South ──
  { id: 'KL',  name: 'Kerala',           abbr: 'KL',   capital: 'Thiruvananthapuram', cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'], region: 'south', row: 6, col: 4, colSpan: 2 },
  { id: 'AN',  name: 'Andaman & Nicobar',abbr: 'A&N',  capital: 'Port Blair',   cities: ['Port Blair'],                                region: 'ut',        row: 6, col: 9 },
  { id: 'LD',  name: 'Lakshadweep',      abbr: 'LD',   capital: 'Kavaratti',    cities: ['Kavaratti'],                                 region: 'ut',        row: 6, col: 3 },

  // ── UTs (small) ──
  { id: 'DN',  name: 'D&NH and D&D',     abbr: 'DN',   capital: 'Daman',        cities: ['Daman', 'Silvassa'],                         region: 'ut',        row: 5, col: 2 },
];

export const INDIA_STATES_SORTED = [...INDIA_STATES].sort((a, b) => a.name.localeCompare(b.name));
