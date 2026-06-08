import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { Button, Badge } from '../../../shared/components';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { AdvisorType } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingAdvisorType'>;

const TYPES = [
  {
    key: AdvisorType.REGULAR,
    emoji: '👤',
    title: 'Regular Advisor',
    subtitle: 'Provide advisory services based on experience and knowledge',
    features: [
      'Free to join — no subscription fee',
      'Accept bookings from clients',
      'Earn via consultation fees',
      'Build your reputation over time',
    ],
    badge: null,
  },
  {
    key: AdvisorType.AUTHORIZED,
    emoji: '🏛️',
    title: 'Authorized Advisor',
    subtitle: 'Government-recognized professional with verified credentials',
    features: [
      'Prominent "Authorized" badge on profile',
      'Priority placement in search results',
      'Higher client trust and conversion',
      'Annual subscription fee applies',
    ],
    badge: 'Premium',
  },
];

export const OnboardingAdvisorTypeScreen: React.FC<Props> = ({ navigation }) => {
  const { form, updateForm } = useOnboardingStore();
  const [selected, setSelected] = useState<AdvisorType | ''>(form.advisorType);

  const handleNext = () => {
    if (!selected) return;
    updateForm({ advisorType: selected });
    navigation.navigate('OnboardingAccount');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress step={3} title="Advisor Type" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Choose Your Advisor Type</Text>
        <Text style={styles.subtitle}>
          This determines your profile badge and subscription requirements
        </Text>

        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.card, selected === t.key && styles.cardActive]}
            onPress={() => setSelected(t.key)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{t.emoji}</Text>
              <View style={styles.cardTitleWrap}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{t.title}</Text>
                  {t.badge ? <Badge text={t.badge} color="gold" /> : null}
                </View>
                <Text style={styles.cardSubtitle}>{t.subtitle}</Text>
              </View>
              <View style={[styles.radio, selected === t.key && styles.radioActive]}>
                {selected === t.key ? <View style={styles.radioDot} /> : null}
              </View>
            </View>

            <View style={styles.featureList}>
              {t.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={[styles.featureCheck, selected === t.key && styles.featureCheckActive]}>
                    ✓
                  </Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        <Button
          label="Continue"
          onPress={handleNext}
          variant="primary"
          disabled={!selected}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  title: { ...Typography.heading },
  subtitle: { ...Typography.body, color: Palette.textSecondary, lineHeight: 22 },

  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  cardActive: { borderColor: Palette.primary, ...Shadow.gold },
  cardHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  cardEmoji: { fontSize: 32 },
  cardTitleWrap: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  cardTitle: { ...Typography.subheading },
  cardSubtitle: { ...Typography.caption, lineHeight: 18 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Palette.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Palette.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.primary },

  featureList: { gap: Spacing.xs },
  featureRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  featureCheck: { color: Palette.textMuted, fontWeight: '700', fontSize: 13 },
  featureCheckActive: { color: Palette.primary },
  featureText: { ...Typography.body, flex: 1 },
});
