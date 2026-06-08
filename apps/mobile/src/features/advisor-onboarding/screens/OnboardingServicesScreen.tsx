import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { Button } from '../../../shared/components';
import { useUiStore } from '../../../shared/store/uiStore';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { advisorRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingServices'>;

const ALL_MODULES = [
  { id: 'm1', name: 'Birth, Death & Marriage', icon: '📜' },
  { id: 'm2', name: 'Identity Cards & Docs', icon: '🪪' },
  { id: 'm3', name: 'Income, Caste & Residence', icon: '📋' },
  { id: 'm4', name: 'Property & Land Papers', icon: '🏠' },
  { id: 'm5', name: 'Tax / GST Filing', icon: '🧾' },
  { id: 'm6', name: 'Business Registration', icon: '🏢' },
  { id: 'm7', name: 'Brand & IP Protection', icon: '™️' },
  { id: 'm8', name: 'Bank, Loan & Credit', icon: '🏦' },
  { id: 'm9', name: 'Insurance (Bima)', icon: '🛡️' },
  { id: 'm10', name: 'Vehicle & RTO Work', icon: '🚗' },
  { id: 'm11', name: 'Legal & Court Help', icon: '⚖️' },
  { id: 'm12', name: 'Job, PF & Labour', icon: '👷' },
  { id: 'm13', name: 'School & College Papers', icon: '🎓' },
  { id: 'm14', name: 'Pension & Govt Schemes', icon: '👴' },
  { id: 'm15', name: 'Savings & Investment', icon: '💰' },
  { id: 'm16', name: 'Passport, Visa & Foreign', icon: '✈️' },
  { id: 'm17', name: 'Electricity, Water & Gas', icon: '⚡' },
  { id: 'm18', name: 'Farmer & Agriculture', icon: '🌾' },
  { id: 'm19', name: 'Online Form & Doc Help', icon: '💻' },
  { id: 'm20', name: 'Central Govt Schemes', icon: '🏛️' },
  { id: 'm21', name: 'Study Abroad Consulting', icon: '🌍' },
  { id: 'm22', name: 'College Admission', icon: '📚' },
  { id: 'm23', name: 'Job Placement & Recruit', icon: '💼' },
  { id: 'm24', name: 'Visa & PR Immigration', icon: '🛂' },
  { id: 'm25', name: 'Others / Custom', icon: '✨' },
  { id: 'm26', name: 'Tour & Travel', icon: '🗺️' },
];

export const OnboardingServicesScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const { form, updateForm } = useOnboardingStore();
  const [selected, setSelected] = useState<string[]>(form.selectedCategories);

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const { mutate: saveProgress, isPending } = useMutation({
    mutationFn: () =>
      advisorRepository.saveOnboardingProgress(7, { selectedCategories: selected }),
    onSuccess: () => {
      updateForm({ selectedCategories: selected });
      navigation.navigate('OnboardingAvailability');
    },
    onError: (err: any) => showToast('error', err?.response?.data?.error ?? 'Failed to save services'),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress step={7} title="Services & Categories" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>What Services Do You Offer?</Text>
        <Text style={styles.subtitle}>
          Select all categories that apply. You can always update these later.
        </Text>

        <View style={styles.selectedInfo}>
          <Text style={styles.selectedCount}>{selected.length} selected</Text>
          {selected.length > 0 && (
            <TouchableOpacity onPress={() => setSelected([])}>
              <Text style={styles.clearAll}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.grid}>
          {ALL_MODULES.map((mod) => {
            const active = selected.includes(mod.id);
            return (
              <TouchableOpacity
                key={mod.id}
                style={[styles.tile, active && styles.tileActive]}
                onPress={() => toggle(mod.id)}
                activeOpacity={0.8}
              >
                <View style={styles.tileCheck}>
                  {active && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.tileIcon}>{mod.icon}</Text>
                <Text style={[styles.tileName, active && styles.tileNameActive]}>
                  {mod.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          label={isPending ? 'Saving…' : 'Continue'}
          onPress={() => saveProgress()}
          variant="primary"
          loading={isPending}
          disabled={selected.length === 0 || isPending}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { ...Typography.heading },
  subtitle: { ...Typography.body, color: Palette.textSecondary, lineHeight: 22 },
  selectedInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedCount: { ...Typography.label, color: Palette.primary },
  clearAll: { color: Palette.textSecondary, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width: '30%',
    backgroundColor: Palette.card,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Palette.border,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  tileActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  tileCheck: {
    position: 'absolute', top: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Palette.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: Palette.background, fontSize: 9, fontWeight: '800' },
  tileIcon: { fontSize: 22 },
  tileName: { fontSize: 9, fontWeight: '600', color: Palette.textSecondary, textAlign: 'center', lineHeight: 13 },
  tileNameActive: { color: Palette.primary },
});
