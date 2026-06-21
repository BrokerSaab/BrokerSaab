export const Colors = {
  navy: {
    50: '#f4f6f8',
    100: '#e8edf2',
    200: '#c5d0dc',
    400: '#6b8aaa',
    600: '#2a4d70',
    700: '#163655',
    800: '#0B1F3A',
    900: '#071527',
    950: '#050E1B',
  },
  gold: {
    300: '#f0d878',
    400: '#e8c84a',
    500: '#D4AF37',
    600: '#b48c22',
    700: '#8a6914',
  },
  indigo: {
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
  },
  emerald: {
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
  },
  red: {
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
  },
  amber: {
    400: '#fbbf24',
    500: '#f59e0b',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Semantic aliases — light theme matching the website
export const Palette = {
  // Backgrounds
  background: '#F8FAFC',    // near-white page bg
  surface: '#FFFFFF',       // card surfaces
  card: '#FFFFFF',          // cards/panels
  navBg: Colors.navy[800],  // top navbar / headers = dark navy

  // Borders
  border: '#E2E8F0',
  borderStrong: 'rgba(212, 175, 55, 0.4)',

  // Brand
  primary: Colors.gold[500],       // #D4AF37
  primaryLight: 'rgba(212, 175, 55, 0.12)',
  navy: Colors.navy[800],          // #0B1F3A — logo, headings, dark accents
  accent: Colors.indigo[600],      // #4F46E5
  accentLight: 'rgba(79, 70, 229, 0.10)',

  // Text
  text: Colors.navy[800],          // primary dark text on light bg
  textSecondary: Colors.slate[500],
  textMuted: Colors.slate[400],
  textInverse: Colors.white,       // white text on dark bg

  // Semantic
  success: Colors.emerald[500],
  error: Colors.red[500],
  warning: Colors.amber[500],

  // Inputs (light mode)
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputBorderFocus: Colors.gold[500],

  // Overlay
  overlay: 'rgba(11, 31, 58, 0.75)',
} as const;

export type PaletteKey = keyof typeof Palette;
