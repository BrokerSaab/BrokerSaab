import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/data/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f4f6f8',
          100: '#e8ecf1',
          200: '#c5d0de',
          300: '#94a9c3',
          400: '#5d7ba3',
          500: '#3c5a85',
          600: '#2e476c',
          700: '#253957',
          800: '#0B1F3A', // Luxury Primary
          900: '#071527',
        },
        gold: {
          50: '#fdfbeb',
          100: '#faf4cc',
          200: '#f5e799',
          300: '#eed15b',
          400: '#e5bb2d',
          500: '#D4AF37', // Luxury Secondary Gold
          600: '#b48c22',
          700: '#906a1b',
          800: '#75541a',
          950: '#432d0b',
        },
        slate: {
          950: '#0a0f1d',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
