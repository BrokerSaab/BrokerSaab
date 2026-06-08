import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Typography } from '../../../shared/theme';

interface Props {
  step: number;
  title: string;
  totalSteps?: number;
}

export const OnboardingPlaceholder: React.FC<Props> = ({ step, title, totalSteps = 10 }) => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: `${(step / totalSteps) * 100}%` }]} />
      </View>
      <Text style={styles.step}>STEP {step} OF {totalSteps}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.coming}>Coming in Phase 4 — Advisor Onboarding</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  progress: { height: 4, backgroundColor: Palette.card, borderRadius: 2 },
  progressBar: { height: 4, backgroundColor: Palette.primary, borderRadius: 2 },
  step: { ...Typography.label },
  title: { ...Typography.heading },
  coming: { ...Typography.caption },
});
