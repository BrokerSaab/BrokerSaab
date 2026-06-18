import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { Colors, Radius } from '../../../shared/theme';
import { Input, Button } from '../../../shared/components';
import { TermsModal } from '../../../shared/components/TermsModal';
import { useUiStore } from '../../../shared/store/uiStore';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { authRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingAccount'>;

const PASSWORD_STRENGTH = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', Palette.error, Palette.warning, Palette.success, Palette.primary];

export const OnboardingAccountScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const { form, updateForm, setAdvisorId } = useOnboardingStore();

  const [email, setEmail] = useState(form.email);
  const [password, setPassword] = useState(form.password);
  const [confirm, setConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  const strength = PASSWORD_STRENGTH(password);
  const mismatch = confirm && password !== confirm;

  const { mutate: createAccount, isPending } = useMutation({
    mutationFn: () =>
      authRepository.signupAdvisor({
        phoneNumber: form.phoneNumber,
        email,
        password,
        advisorType: form.advisorType as string,
      }),
    onSuccess: (res) => {
      updateForm({ email, password });
      if (res.data?.advisorId) setAdvisorId(res.data.advisorId);
      navigation.navigate('OnboardingProfile');
    },
    onError: (err: any) => showToast('error', err?.response?.data?.error ?? 'Failed to create account'),
  });

  const canProceed = email.includes('@') && password.length >= 8 && password === confirm && termsAccepted;

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress step={4} title="Create Account" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Your Account</Text>
        <Text style={styles.subtitle}>
          Set up your login credentials. You'll use these to sign in after onboarding.
        </Text>

        <Input
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
        />

        <View>
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {password.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthTrack}>
                <View
                  style={[
                    styles.strengthBar,
                    { width: `${(strength / 4) * 100}%`, backgroundColor: STRENGTH_COLORS[strength] },
                  ]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength] }]}>
                {STRENGTH_LABELS[strength]}
              </Text>
            </View>
          )}
        </View>

        <Input
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          error={mismatch ? "Passwords don't match" : undefined}
        />

        <View style={styles.rules}>
          {['8+ characters', 'One uppercase letter', 'One number'].map((r) => (
            <Text key={r} style={styles.rule}>• {r}</Text>
          ))}
        </View>

        {/* Terms acceptance */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setTermsAccepted((v) => !v)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsLabel}>
            I agree to the{' '}
            <Text
              style={styles.termsLink}
              onPress={(e) => {
                e.stopPropagation?.();
                setTermsModalVisible(true);
              }}
            >
              Terms & Conditions
            </Text>
            {' '}&{' '}
            <Text
              style={styles.termsLink}
              onPress={(e) => {
                e.stopPropagation?.();
                setTermsModalVisible(true);
              }}
            >
              Privacy Policy
            </Text>
          </Text>
        </TouchableOpacity>

        <Button
          label={isPending ? 'Creating Account…' : 'Create Account & Continue'}
          onPress={() => createAccount()}
          variant="primary"
          loading={isPending}
          disabled={!canProceed || isPending}
          fullWidth
          size="lg"
        />
      </ScrollView>

      <TermsModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
        onAgree={() => {
          setTermsAccepted(true);
          setTermsModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  title: { ...Typography.heading },
  subtitle: { ...Typography.body, color: Palette.textSecondary, lineHeight: 22 },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  strengthTrack: { flex: 1, height: 4, backgroundColor: Palette.card, borderRadius: 2 },
  strengthBar: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 70, textAlign: 'right' },
  rules: { gap: 4 },
  rule: { ...Typography.caption },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: Colors.slate[300],
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2, flexShrink: 0,
  },
  checkboxChecked: {
    borderColor: Colors.emerald[500],
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  checkmark: { fontSize: 12, color: Colors.emerald[500], fontWeight: '900' },
  termsLabel: {
    flex: 1, fontSize: 13, color: Colors.slate[600], lineHeight: 20,
  },
  termsLink: {
    color: Colors.indigo[600],
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
