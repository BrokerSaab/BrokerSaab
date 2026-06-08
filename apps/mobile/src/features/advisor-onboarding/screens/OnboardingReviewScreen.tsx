import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { Button, Badge } from '../../../shared/components';
import { useUiStore } from '../../../shared/store/uiStore';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { advisorRepository } from '../../../shared/api';
import { formatCurrency } from '../../../shared/utils/format';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingReview'>;

interface SectionProps {
  title: string;
  step: keyof typeof STEP_ROUTES;
  children: React.ReactNode;
  onEdit: () => void;
}

const STEP_ROUTES = {
  type: 'OnboardingAdvisorType',
  profile: 'OnboardingProfile',
  kyc: 'OnboardingKYC',
  services: 'OnboardingServices',
  availability: 'OnboardingAvailability',
} as const;

const ReviewSection: React.FC<SectionProps> = ({ title, children, onEdit }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onEdit}>
        <Text style={styles.editLink}>Edit ›</Text>
      </TouchableOpacity>
    </View>
    {children}
  </View>
);

export const OnboardingReviewScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const { form } = useOnboardingStore();

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      advisorRepository.saveOnboardingProgress(9, { submitted: true }),
    onSuccess: () => navigation.navigate('OnboardingSuccess'),
    onError: (err: any) => showToast('error', err?.response?.data?.error ?? 'Submission failed'),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress step={9} title="Review & Submit" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Review Your Application</Text>
        <Text style={styles.subtitle}>
          Make sure everything looks correct before submitting for admin review.
        </Text>

        <ReviewSection title="Advisor Type" step="type" onEdit={() => navigation.navigate('OnboardingAdvisorType')}>
          <Badge text={form.advisorType || 'Not set'} color={form.advisorType === 'AUTHORIZED' ? 'gold' : 'indigo'} />
        </ReviewSection>

        <ReviewSection title="Profile" step="profile" onEdit={() => navigation.navigate('OnboardingProfile')}>
          <InfoRow label="Name" value={form.fullName} />
          {form.businessName ? <InfoRow label="Business" value={form.businessName} /> : null}
          <InfoRow label="Experience" value={`${form.experienceYears} years`} />
          <InfoRow label="Location" value={`${form.city}, ${form.state}`} />
          <InfoRow label="Fee" value={form.consultationFee ? formatCurrency(Number(form.consultationFee)) : 'Not set'} />
          {form.languages.length > 0 ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Languages</Text>
              <View style={styles.chips}>
                {form.languages.map((l) => <Badge key={l} text={l} color="indigo" />)}
              </View>
            </View>
          ) : null}
          {form.bio ? (
            <View style={styles.bioWrap}>
              <Text style={styles.rowLabel}>Bio</Text>
              <Text style={styles.bioText}>{form.bio}</Text>
            </View>
          ) : null}
        </ReviewSection>

        <ReviewSection title="KYC Documents" step="kyc" onEdit={() => navigation.navigate('OnboardingKYC')}>
          <InfoRow label="Aadhaar No." value={form.aadhaarNumber ? `XXXX XXXX ${form.aadhaarNumber.slice(-4)}` : 'Not set'} />
          <DocStatus label="Aadhaar Card" uploaded={!!form.aadhaarUrl} />
          <DocStatus label="Passport Photo" uploaded={!!form.passportPhotoUrl} />
          {form.advisorType === 'AUTHORIZED' ? (
            <DocStatus label="License Copy" uploaded={!!form.licenseUrl} />
          ) : null}
          {form.gstUrl ? <DocStatus label="GST Certificate" uploaded /> : null}
        </ReviewSection>

        <ReviewSection title="Services" step="services" onEdit={() => navigation.navigate('OnboardingServices')}>
          <Text style={styles.categoryCount}>
            {form.selectedCategories.length} categor{form.selectedCategories.length !== 1 ? 'ies' : 'y'} selected
          </Text>
        </ReviewSection>

        <ReviewSection title="Availability" step="availability" onEdit={() => navigation.navigate('OnboardingAvailability')}>
          <Text style={styles.categoryCount}>
            {form.availability.length} time slot{form.availability.length !== 1 ? 's' : ''} configured
          </Text>
        </ReviewSection>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            By submitting, you confirm all information is accurate and agree to BrokerSaab's advisor terms of service.
            Our team will review your application within 2-3 business days.
          </Text>
        </View>

        <Button
          label={isPending ? 'Submitting…' : 'Submit Application'}
          onPress={() => submit()}
          variant="primary"
          loading={isPending}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || '—'}</Text>
  </View>
);

const DocStatus: React.FC<{ label: string; uploaded: boolean }> = ({ label, uploaded }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Badge text={uploaded ? 'Uploaded' : 'Missing'} color={uploaded ? 'emerald' : 'red'} />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { ...Typography.heading },
  subtitle: { ...Typography.body, color: Palette.textSecondary, lineHeight: 22 },

  section: {
    backgroundColor: Palette.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Palette.border,
    padding: Spacing.md, gap: Spacing.sm,
    ...Shadow.sm,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...Typography.label },
  editLink: { color: Palette.primary, fontSize: 13, fontWeight: '600' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  rowLabel: { ...Typography.caption, flex: 1 },
  rowValue: { ...Typography.body, fontWeight: '600', flex: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'flex-end', flex: 1 },
  bioWrap: { gap: 4 },
  bioText: { ...Typography.caption, color: Palette.textSecondary, lineHeight: 18 },
  categoryCount: { ...Typography.body, color: Palette.primary, fontWeight: '700' },

  disclaimer: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
  },
  disclaimerText: { ...Typography.caption, lineHeight: 18, color: Palette.textMuted },
});
