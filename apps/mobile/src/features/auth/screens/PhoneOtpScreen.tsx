import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
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

  const autoFillOtp = (code: string) => setOtp(code);

  return (
    <LinearGradient
      colors={['#0B1F3A', '#1a1040', '#0B1F3A']}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        {/* Glow blobs */}
        <View style={styles.glowTopRight} pointerEvents="none" />
        <View style={styles.glowBottomLeft} pointerEvents="none" />

        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity
            onPress={otpSent ? () => setOtpSent(false) : () => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <View style={styles.navLogoWrap}>
              <Image source={require('../../../assets/logo-icon.png')} style={styles.navLogoImg} resizeMode="contain" />
            </View>
            <Text style={styles.logoTextBroker}>Broker</Text>
            <Text style={styles.logoTextSaab}>Saab</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Step header */}
            <View style={styles.stepHeader}>
              <Text style={styles.stepBadge}>{otpSent ? 'STEP 2 OF 2' : 'STEP 1 OF 2'}</Text>
              <Text style={styles.stepTitle}>{otpSent ? 'Enter OTP' : 'Enter Mobile Number'}</Text>
              <Text style={styles.stepSubtitle}>
                {otpSent
                  ? `Code sent to +91 ${phone}`
                  : 'Enter your mobile number to receive OTP'}
              </Text>
            </View>

            {/* Form card */}
            <View style={styles.formCard}>
              {!otpSent ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                    <View style={styles.phoneRow}>
                      <View style={styles.prefixBox}>
                        <Text style={styles.prefixText}>🇮🇳 +91</Text>
                      </View>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="98765 43210"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        maxLength={10}
                        selectionColor={Colors.gold[500]}
                      />
                    </View>
                  </View>

                  <LinearGradient
                    colors={['#FFE082', '#D4AF37', '#B48C22']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryBtnGradient, loading && styles.btnDisabled]}
                  >
                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={loading}
                      style={styles.primaryBtnInner}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryBtnText}>{loading ? 'Sending…' : 'Send OTP →'}</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </>
              ) : (
                <>
                  {devOtp ? (
                    <TouchableOpacity
                      style={styles.devOtpBox}
                      onPress={() => autoFillOtp(devOtp)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.devOtpLabel}>🧪 Test OTP (tap to auto-fill)</Text>
                      <Text style={styles.devOtpCode}>{devOtp}</Text>
                      <Text style={styles.devOtpHint}>Tap anywhere on this box to auto-fill</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.staticOtpBox}>
                      <Text style={styles.staticOtpLabel}>📌 Static Test OTP</Text>
                      <Text style={styles.staticOtpCode}>1 2 3 4 5 6</Text>
                      <TouchableOpacity onPress={() => autoFillOtp('123456')} style={styles.autoFillBtn}>
                        <Text style={styles.autoFillBtnText}>Tap to Auto-fill</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <OtpInput
                    length={6}
                    value={otp}
                    onFill={setOtp}
                    onChangeText={setOtp}
                    darkMode
                  />

                  <LinearGradient
                    colors={['#FFE082', '#D4AF37', '#B48C22']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryBtnGradient, (loading || otp.length < 6) && styles.btnDisabled]}
                  >
                    <TouchableOpacity
                      onPress={handleVerify}
                      disabled={loading || otp.length < 6}
                      style={styles.primaryBtnInner}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryBtnText}>
                        {loading ? 'Verifying…' : 'Verify & Continue →'}
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>

                  <TouchableOpacity disabled={resendTimer > 0} onPress={handleSendOtp} style={styles.linkBtn}>
                    <Text style={[styles.linkBtnText, resendTimer > 0 && styles.linkDisabled]}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.linkBtn}>
                    <Text style={styles.changeLinkText}>Change Number</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text style={styles.secureNote}>🔒 End-to-end encrypted · BrokerSaab</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },

  glowTopRight: {
    position: 'absolute', top: -80, right: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(212,175,55,0.07)',
  },
  glowBottomLeft: {
    position: 'absolute', bottom: -80, left: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(79,70,229,0.07)',
  },

  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoWrap: { width: 28, height: 28, borderRadius: 7, overflow: 'hidden' },
  navLogoImg: { width: 28, height: 28 },
  logoTextBroker: { fontSize: 18, fontWeight: '800', color: Colors.white },
  logoTextSaab: { fontSize: 18, fontWeight: '800', color: Colors.gold[500] },

  scroll: { padding: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },

  stepHeader: { marginBottom: Spacing.lg, gap: Spacing.xs },
  stepBadge: {
    fontSize: 11, fontWeight: '700', color: Colors.gold[400],
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  stepTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },
  stepSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  formCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
  },

  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm },
  prefixBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    justifyContent: 'center', minHeight: 52,
  },
  prefixText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  phoneInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md, color: Colors.white, fontSize: 18,
    paddingHorizontal: Spacing.md, minHeight: 52, letterSpacing: 2, fontWeight: '600',
  },

  devOtpBox: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 4,
  },
  devOtpLabel: { fontSize: 12, color: Colors.gold[300], fontWeight: '700', letterSpacing: 0.5 },
  devOtpCode: {
    fontSize: 34, fontWeight: '900', color: Colors.gold[300], letterSpacing: 8, marginVertical: 4,
  },
  devOtpHint: { fontSize: 11, color: 'rgba(212,175,55,0.6)' },

  staticOtpBox: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', gap: 6,
  },
  staticOtpLabel: { fontSize: 12, color: Colors.gold[300], fontWeight: '700' },
  staticOtpCode: { fontSize: 32, fontWeight: '900', color: Colors.gold[300], letterSpacing: 8 },
  autoFillBtn: {
    backgroundColor: Colors.gold[500], borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs + 2, marginTop: 4,
  },
  autoFillBtnText: { color: Colors.navy[900], fontSize: 12, fontWeight: '700' },

  primaryBtnGradient: { borderRadius: Radius.lg, overflow: 'hidden' },
  primaryBtnInner: { paddingVertical: Spacing.md, alignItems: 'center' },
  primaryBtnText: { color: Colors.navy[900], fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  btnDisabled: { opacity: 0.45 },

  linkBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  linkBtnText: { color: Colors.gold[400], fontSize: 13, fontWeight: '600' },
  linkDisabled: { color: 'rgba(255,255,255,0.3)' },
  changeLinkText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  secureNote: {
    textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)',
    marginTop: Spacing.xl, letterSpacing: 0.3,
  },
});
