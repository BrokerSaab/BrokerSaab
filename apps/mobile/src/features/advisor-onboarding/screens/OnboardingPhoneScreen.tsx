import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { Input, OtpInput, Button } from '../../../shared/components';
import { useUiStore } from '../../../shared/store/uiStore';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { authRepository, advisorRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingPhone'>;

export const OnboardingPhoneScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const { form, updateForm, setAdvisorId, setStep } = useOnboardingStore();

  const [phone, setPhone] = useState(form.phoneNumber);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const { mutate: sendOtp, isPending: sending } = useMutation({
    mutationFn: () => authRepository.sendOtp(phone),
    onSuccess: () => {
      setOtpSent(true);
      startTimer();
      showToast('success', 'OTP sent to your phone!');
    },
    onError: (err: any) => showToast('error', err?.response?.data?.error ?? 'Failed to send OTP'),
  });

  const { mutate: verifyOtp, isPending: verifying } = useMutation({
    mutationFn: () => authRepository.verifyOtp(phone, otp, 'advisor'),
    onSuccess: async (res) => {
      updateForm({ phoneNumber: phone });

      // Check if advisor has existing onboarding session
      if (res.advisor?.id) {
        setAdvisorId(res.advisor.id);
        try {
          const session = await advisorRepository.getOnboardingSession(phone);
          if (session.data?.formSnapshot) {
            updateForm(session.data.formSnapshot as any);
            setStep(session.data.currentStep ?? 3);
            showToast('info', 'Onboarding session resumed!');
          }
        } catch {}
      }

      navigation.navigate('OnboardingAdvisorType');
    },
    onError: (err: any) => showToast('error', err?.response?.data?.error ?? 'Invalid OTP'),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress step={2} title="Verify Phone" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Enter Your Mobile Number</Text>
        <Text style={styles.subtitle}>
          We'll send a one-time password to verify your number
        </Text>

        <Input
          label="Mobile Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
          leftIcon={<Text style={styles.prefix}>+91</Text>}
          editable={!otpSent}
        />

        {!otpSent ? (
          <Button
            label={sending ? 'Sending OTP…' : 'Send OTP'}
            onPress={() => sendOtp()}
            variant="primary"
            loading={sending}
            disabled={phone.length < 10 || sending}
            fullWidth
          />
        ) : (
          <>
            <Text style={styles.otpLabel}>ENTER OTP SENT TO +91 {phone}</Text>
            <OtpInput length={6} onFill={setOtp} />

            <View style={styles.resendRow}>
              {timer > 0 ? (
                <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={() => sendOtp()}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <Button
              label={verifying ? 'Verifying…' : 'Verify & Continue'}
              onPress={() => verifyOtp()}
              variant="primary"
              loading={verifying}
              disabled={otp.length < 6 || verifying}
              fullWidth
            />

            <TouchableOpacity onPress={() => { setOtpSent(false); setOtp(''); }}>
              <Text style={styles.changePhone}>Change phone number</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  title: { ...Typography.heading },
  subtitle: { ...Typography.body, color: Palette.textSecondary, lineHeight: 22 },
  prefix: { color: Palette.text, fontWeight: '700', fontSize: 14 },
  otpLabel: { ...Typography.label },
  resendRow: { alignItems: 'center' },
  timerText: { ...Typography.caption, color: Palette.textMuted },
  resendText: { color: Palette.primary, fontWeight: '700', fontSize: 13 },
  changePhone: { color: Palette.textSecondary, textAlign: 'center', fontSize: 13 },
});
