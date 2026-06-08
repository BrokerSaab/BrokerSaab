import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { Input, Button, Badge } from '../../../shared/components';
import { useUiStore } from '../../../shared/store/uiStore';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { advisorRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingProfile'>;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

const COMMON_LANGUAGES = [
  'Hindi', 'English', 'Bengali', 'Telugu', 'Marathi', 'Tamil',
  'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu', 'Odia',
];

export const OnboardingProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const { form, updateForm } = useOnboardingStore();

  const [fullName, setFullName] = useState(form.fullName);
  const [businessName, setBusinessName] = useState(form.businessName);
  const [experienceYears, setExperienceYears] = useState(form.experienceYears);
  const [city, setCity] = useState(form.city);
  const [state, setState] = useState(form.state);
  const [bio, setBio] = useState(form.bio);
  const [fee, setFee] = useState(form.consultationFee);
  const [languages, setLanguages] = useState<string[]>(form.languages.length ? form.languages : []);
  const [showStateList, setShowStateList] = useState(false);

  const toggleLang = (l: string) =>
    setLanguages((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);

  const { mutate: saveProgress, isPending } = useMutation({
    mutationFn: () =>
      advisorRepository.saveOnboardingProgress(5, {
        fullName, businessName, experienceYears, city, state,
        bio, consultationFee: fee, languages,
      }),
    onSuccess: () => {
      updateForm({ fullName, businessName, experienceYears, city, state, bio, consultationFee: fee, languages });
      navigation.navigate('OnboardingKYC');
    },
    onError: (err: any) => showToast('error', err?.response?.data?.error ?? 'Failed to save profile'),
  });

  const canProceed = fullName.length > 1 && city.length > 1 && state && fee && languages.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress step={5} title="Your Profile" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Build Your Profile</Text>
        <Text style={styles.subtitle}>
          This is what clients will see. Make it clear and professional.
        </Text>

        <Input label="Full Name *" value={fullName} onChangeText={setFullName} placeholder="As per your ID" />
        <Input label="Business / Firm Name" value={businessName} onChangeText={setBusinessName} placeholder="Optional" />
        <Input
          label="Years of Experience *"
          value={experienceYears}
          onChangeText={setExperienceYears}
          keyboardType="numeric"
          placeholder="e.g. 5"
        />

        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}>
            <Input label="City *" value={city} onChangeText={setCity} placeholder="Your city" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>STATE *</Text>
            <TouchableOpacity
              style={styles.statePicker}
              onPress={() => setShowStateList(!showStateList)}
            >
              <Text style={state ? styles.stateSelected : styles.statePlaceholder}>
                {state || 'Select state'}
              </Text>
            </TouchableOpacity>
            {showStateList && (
              <ScrollView style={styles.stateDropdown} nestedScrollEnabled>
                {INDIAN_STATES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.stateOption}
                    onPress={() => { setState(s); setShowStateList(false); }}
                  >
                    <Text style={[styles.stateOptionText, state === s && styles.stateOptionActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <View>
          <Text style={styles.inputLabel}>BIO</Text>
          <View style={styles.bioBox}>
            <Input
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              placeholder="Describe your expertise, what clients can expect, and why they should choose you…"
            />
          </View>
        </View>

        <Input
          label="Consultation Fee (₹) *"
          value={fee}
          onChangeText={setFee}
          keyboardType="numeric"
          placeholder="e.g. 500"
          leftIcon={<Text style={styles.rupee}>₹</Text>}
        />

        <View>
          <Text style={styles.inputLabel}>LANGUAGES YOU SPEAK *</Text>
          <View style={styles.langGrid}>
            {COMMON_LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l}
                style={[styles.langChip, languages.includes(l) && styles.langChipActive]}
                onPress={() => toggleLang(l)}
              >
                <Text style={[styles.langText, languages.includes(l) && styles.langTextActive]}>
                  {l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          label={isPending ? 'Saving…' : 'Continue'}
          onPress={() => saveProgress()}
          variant="primary"
          loading={isPending}
          disabled={!canProceed || isPending}
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
  rowInputs: { flexDirection: 'row', gap: Spacing.md },
  inputLabel: { ...Typography.label, marginBottom: Spacing.xs },
  statePicker: {
    backgroundColor: Palette.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  stateSelected: { color: Palette.text, fontSize: 14 },
  statePlaceholder: { color: Palette.textMuted, fontSize: 14 },
  stateDropdown: {
    maxHeight: 180,
    backgroundColor: Palette.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    marginTop: 2,
  },
  stateOption: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  stateOptionText: { ...Typography.body, color: Palette.textSecondary },
  stateOptionActive: { color: Palette.primary, fontWeight: '700' },
  bioBox: { marginTop: -Spacing.xs },
  rupee: { color: Palette.text, fontWeight: '700' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  langChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.card,
  },
  langChipActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  langText: { fontSize: 12, color: Palette.textSecondary },
  langTextActive: { color: Palette.primary, fontWeight: '700' },
});
