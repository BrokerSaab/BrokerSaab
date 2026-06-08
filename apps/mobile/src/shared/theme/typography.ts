import { TextStyle } from 'react-native';
import { Palette } from './colors';

export const Typography: Record<string, TextStyle> = {
  hero: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Palette.text,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.text,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.text,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    color: Palette.text,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: Palette.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Palette.textSecondary,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Palette.primary,
  },
  labelSecondary: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Palette.textSecondary,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.primary,
  },
  link: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.primary,
  },
};
