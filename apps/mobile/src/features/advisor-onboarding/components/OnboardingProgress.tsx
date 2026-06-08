import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Spacing, Typography } from '../../../shared/theme';

const TOTAL_STEPS = 10;

export const OnboardingProgress: React.FC<{ step: number; title: string }> = ({ step, title }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.stepLabel}>STEP {step} OF {TOTAL_STEPS}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
    <View style={styles.track}>
      <View style={[styles.bar, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
    </View>
    <View style={styles.dots}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i < step && styles.dotFilled, i === step - 1 && styles.dotActive]}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: Spacing.xs, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { ...Typography.label },
  stepTitle: { ...Typography.label, color: Palette.primary },
  track: {
    height: 4,
    backgroundColor: Palette.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: 4,
    backgroundColor: Palette.primary,
    borderRadius: 2,
  },
  dots: { flexDirection: 'row', gap: 3 },
  dot: {
    flex: 1, height: 3, borderRadius: 1.5,
    backgroundColor: Palette.border,
  },
  dotFilled: { backgroundColor: Palette.primaryLight },
  dotActive: { backgroundColor: Palette.primary },
});
