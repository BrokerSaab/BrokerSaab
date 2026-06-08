import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { Button, Input, OtpInput } from '../../../shared/components';
import { useAuthStore } from '../../../shared/store';
import { authRepository } from '../../../shared/api';
import { useUiStore } from '../../../shared/store';
import { Role } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneOtp'>;

export const PhoneOtpScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuthStore();
  const { showToast } = useUiStore();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      showToast('error', 'Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await authRepository.sendOtp(`+91${cleaned}`);
      setOtpSent(true);
      setResendTimer(30);
    } catch (e: any) {
      showToast('error', e?.response?.data?.message ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    try {
      const cleaned = phone.replace(/\D/g, '');
      const res = await authRepository.verifyOtp(`+91${cleaned}`, otp);

      if (res.isNewUser) {
        navigation.navigate('RegisterComplete', {
          phoneNumber: `+91${cleaned}`,
          isNewUser: true,
        });
      } else if (res.accessToken && res.refreshToken && res.user) {
        await login({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
        if (res.advisor && res.advisor.onboardingStep < 8) {
          // Navigate to onboarding handled by RootNavigator
        }
      }
    } catch (e: any) {
      showToast('error', e?.response?.data?.message ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {otpSent ? 'Enter OTP' : 'Enter Mobile Number'}
          </Text>
          <Text style={styles.subtitle}>
            {otpSent
              ? `We sent a 6-digit OTP to +91 ${phone}`
              : 'We\'ll send a one-time password to verify your identity'}
          </Text>

          {!otpSent ? (
            <>
              <Input
                label="MOBILE NUMBER"
                placeholder="e.g. 98765 43210"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
                leftIcon={<Text style={styles.prefix}>+91</Text>}
              />
              <Button
                label="Send OTP"
                onPress={handleSendOtp}
                loading={loading}
                fullWidth
                size="lg"
              />
            </>
          ) : (
            <>
              <OtpInput length={6} onFill={setOtp} onChangeText={setOtp} />
              <Button
                label="Verify & Continue"
                onPress={handleVerify}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.verifyBtn}
                disabled={otp.length < 6}
              />
              <TouchableOpacity
                disabled={resendTimer > 0}
                onPress={handleSendOtp}
                style={styles.resend}
              >
                <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.change}>
                <Text style={styles.changeText}>Change Number</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1 },
  container: { padding: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.xl },
  back: { marginBottom: Spacing.lg },
  backText: { color: Palette.textSecondary, fontSize: 14 },
  title: { ...Typography.heading },
  subtitle: { ...Typography.caption, lineHeight: 20, marginBottom: Spacing.md },
  prefix: { color: Palette.textSecondary, fontSize: 14, fontWeight: '500' },
  verifyBtn: { marginTop: Spacing.lg },
  resend: { alignItems: 'center', paddingVertical: Spacing.sm },
  resendText: { color: Palette.primary, fontSize: 13, fontWeight: '500' },
  resendDisabled: { color: Palette.textMuted },
  change: { alignItems: 'center' },
  changeText: { color: Palette.textSecondary, fontSize: 12 },
});
