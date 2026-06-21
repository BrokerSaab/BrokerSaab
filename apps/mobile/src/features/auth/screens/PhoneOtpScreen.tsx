import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Colors, Spacing, Radius } from '../../../shared/theme';
import { OtpInput } from '../../../shared/components';
import { useAuthStore } from '../../../shared/store';
import { authRepository } from '../../../shared/api';
import { useUiStore } from '../../../shared/store';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneOtp'>;

export const PhoneOtpScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuthStore();
  const { showToast } = useUiStore();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | undefined>();

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
      const res = await authRepository.sendOtp(`+91${cleaned}`);
      setDevOtp(res.devOtp);
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
      if (res.isNewUser && res.tempToken) {
        navigation.navigate('RegisterComplete', {
          phoneNumber: `+91${cleaned}`,
          tempToken: res.tempToken,
        });
      } else if (res.accessToken && res.refreshToken && res.user) {
        await login({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
      }
    } catch (e: any) {
      showToast('error', e?.response?.data?.message ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Dark blue header */}
      <LinearGradient
        colors={['#1C2B6B', '#1E3A8A', '#2563EB']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']} style={styles.headerInner}>
          <View style={styles.logoRow}>
            <Text style={styles.logoIcon}>🏛️</Text>
            <Text style={styles.logoTextBroker}>Broker</Text>
            <Text style={styles.logoTextSaab}>Saab</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* White card */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.card}>
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>Log in to access your dashboard</Text>

            {/* Phone number */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
              <Text style={styles.fieldLabelHindi}>फोन नंबर</Text>
              <View style={styles.phoneRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, otpSent && styles.inputDisabled]}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={Colors.slate[400]}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                  editable={!otpSent}
                  selectionColor={Colors.indigo[500]}
                />
              </View>
            </View>

            {/* OTP section */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>VERIFICATION CODE (OTP)</Text>
              <Text style={styles.fieldLabelHindi}>सत्यापन कोड</Text>
              <OtpInput
                length={6}
                value={otp}
                onFill={setOtp}
                onChangeText={setOtp}
                darkMode={false}
              />
              {devOtp ? (
                <TouchableOpacity onPress={() => setOtp(devOtp)} style={styles.devOtpRow}>
                  <Text style={styles.devOtpHint}>🧪 Test OTP: {devOtp} (tap to fill)</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                disabled={resendTimer > 0 || !otpSent}
                onPress={handleSendOtp}
                style={styles.resendRow}
              >
                <Text style={[styles.resendText, (!otpSent || resendTimer > 0) && styles.resendDisabled]}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP / पुनः भेजें'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login button */}
            <LinearGradient
              colors={['#FFE082', '#D4AF37', '#B48C22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.loginGradient, loading && { opacity: 0.6 }]}
            >
              <TouchableOpacity
                style={styles.loginInner}
                activeOpacity={0.85}
                disabled={loading}
                onPress={otpSent ? handleVerify : handleSendOtp}
              >
                <Text style={styles.loginText}>
                  {loading ? 'Please wait…' : otpSent ? 'Login →' : 'Send OTP →'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New user? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
              <Text style={styles.registerLink}>Register here</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.registerHindi}>नये उपयोगकर्ता? यहाँ रजिस्टर करें</Text>

          {/* Admin portal */}
          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')} style={styles.adminLink}>
            <Text style={styles.adminText}>Admin Portal →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },
  flex: { flex: 1 },

  header: { paddingBottom: 32 },
  headerInner: { alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 26 },
  logoTextBroker: { fontSize: 24, fontWeight: '800', color: Colors.white },
  logoTextSaab: { fontSize: 24, fontWeight: '800', color: Colors.gold[400] },

  cardScroll: { flex: 1, marginTop: -28 },
  cardContent: { paddingBottom: Spacing.xl },

  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },

  heading: { fontSize: 28, fontWeight: '900', color: Colors.navy[900], letterSpacing: -0.5 },
  subheading: { fontSize: 14, color: Colors.slate[500], marginTop: -Spacing.sm },

  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.navy[800], letterSpacing: 1, textTransform: 'uppercase' },
  fieldLabelHindi: { fontSize: 11, color: Colors.slate[500], marginBottom: 6 },

  phoneRow: { flexDirection: 'row', gap: Spacing.sm },
  prefixBox: {
    backgroundColor: Colors.slate[100],
    borderWidth: 1, borderColor: Colors.slate[200],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    minHeight: 52,
  },
  prefixText: { fontSize: 15, fontWeight: '700', color: Colors.slate[700] },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.slate[200],
    borderRadius: Radius.md,
    color: Colors.navy[800],
    fontSize: 16, fontWeight: '500',
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputDisabled: { backgroundColor: Colors.slate[50], color: Colors.slate[500] },

  devOtpRow: { marginTop: 4 },
  devOtpHint: { fontSize: 12, color: Colors.indigo[500], fontWeight: '600' },

  resendRow: { alignSelf: 'flex-end' },
  resendText: { fontSize: 13, color: Colors.indigo[600], fontWeight: '600' },
  resendDisabled: { color: Colors.slate[400] },

  loginGradient: { borderRadius: Radius.lg, overflow: 'hidden' },
  loginInner: { paddingVertical: 16, alignItems: 'center' },
  loginText: { fontSize: 17, fontWeight: '800', color: Colors.navy[900], letterSpacing: 0.3 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.slate[200] },
  dividerText: { fontSize: 12, color: Colors.slate[400], fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.slate[200],
    borderRadius: Radius.lg,
    paddingVertical: 14,
    backgroundColor: Colors.white,
  },
  googleG: { fontSize: 18, fontWeight: '900', color: '#EA4335' },
  googleText: { fontSize: 15, fontWeight: '600', color: Colors.navy[800] },

  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  registerText: { fontSize: 14, color: Colors.navy[800] },
  registerLink: { fontSize: 14, color: Colors.navy[800], fontWeight: '800' },
  registerHindi: { textAlign: 'center', fontSize: 12, color: Colors.slate[500], marginTop: 2 },

  adminLink: { alignItems: 'center', paddingTop: Spacing.md },
  adminText: { fontSize: 12, color: Colors.slate[400] },
});
