import React from 'react';
import { View, Text, ViewStyle, StyleSheet } from 'react-native';
import { Palette, Radius } from '../theme';

type BadgeColor = 'gold' | 'indigo' | 'emerald' | 'red' | 'slate' | 'amber';

export interface BadgeProps {
  text: string;
  color?: BadgeColor;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  dot?: boolean;
}

const colorMap: Record<BadgeColor, { bg: string; text: string; dot: string }> = {
  gold: { bg: 'rgba(212, 175, 55, 0.12)', text: '#D4AF37', dot: '#D4AF37' },
  indigo: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', dot: '#6366f1' },
  emerald: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', dot: '#10b981' },
  red: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', dot: '#ef4444' },
  slate: { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8', dot: '#64748b' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', dot: '#f59e0b' },
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  color = 'gold',
  size = 'sm',
  style,
  dot = false,
}) => {
  const c = colorMap[color];
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: c.bg },
        size === 'md' && styles.sizeMd,
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: c.dot }]} />}
      <Text style={[styles.text, { color: c.text }, size === 'md' && styles.textMd]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  sizeMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textMd: {
    fontSize: 12,
    textTransform: 'none',
  },
});
