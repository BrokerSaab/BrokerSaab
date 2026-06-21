import React, { useState } from 'react';
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
import { useUiStore } from '../../../shared/store';
import { authRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'SetPassword'>;

const STRENGTH_RULES = [
  { label: '8+ chars', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /\d/.test(p) },
];

export const SetPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const allRulesMet = STRENGTH_RULES.every((r) => r.test(password));
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = allRulesMet && passwordsMatch && !loading;

  const handleSetPassword = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await authRepository.setClientPassword(password);
      showToast('success', 'Password set successfully!');
      navigation.popToTop();
    } catch (e: any) {
      showToast('error', e?.response?.data?.message ?? 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

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
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <View style={styles.navLogoWrap}>
              <Image source={require('../../../../assets/logo-icon.png')} style={styles.navLogoImg} resizeMode="contain" />
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
              <Text style={styles.stepBadge}>OPTIONAL STEP</Text>
              <Text style={styles.stepTitle}>Secure Your Account</Text>
              <Text style={styles.stepSubtitle}>
                Set a password for faster login. You can always use OTP.
              </Text>
            </View>

            {/* Info card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                💡  A password lets you log in without waiting for an OTP every time. You can skip this and set it later from your profile.
              </Text>
            </View>

            {/* Form card */}
            <View style={styles.formCard}>
              {/* New password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <View style={[styles.inputWrapper, passFocused && styles.inputFocused]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Min. 8 characters"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    selectionColor={Colors.gold[500]}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                  />
                  <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={[styles.inputWrapper, confirmFocused && styles.inputFocused]}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Repeat your password"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    secureTextEntry={!showConfirm}
                    value={confirm}
                    onChangeText={setConfirm}
                    autoCapitalize="none"
                    selectionColor={Colors.gold[500]}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                    <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Strength pills */}
              {password.length > 0 && (
                <View style={styles.pillsRow}>
                  {STRENGTH_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <View key={rule.label} style={[styles.pill, met && styles.pillMet]}>
                        <Text style={[styles.pillText, met && styles.pillTextMet]}>
                          {met ? '✓ ' : ''}{rule.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Match indicator */}
              {confirm.length > 0 && (
                <Text style={[styles.matchIndicator, passwordsMatch ? styles.matchOk : styles.matchBad]}>
                  {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </Text>
              )}
            </View>

            {/* Set password button */}
            {canSubmit ? (
              <LinearGradient
                colors={['#4F46E5', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                <TouchableOpacity
                  style={styles.submitBtnInner}
                  onPress={handleSetPassword}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>
                    {loading ? 'Setting Password…' : 'Set Password & Continue →'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <View style={styles.submitBtnDisabled}>
                <Text style={styles.submitBtnDisabledText}>Set Password & Continue →</Text>
              </View>
            )}

            {/* Skip */}
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => navigation.popToTop()}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip — use OTP login</Text>
            </TouchableOpacity>
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

  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xl },

  stepHeader: { marginBottom: Spacing.lg, gap: Spacing.xs },
  stepBadge: {
    fontSize: 11, fontWeight: '700', color: Colors.indigo[400],
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  stepTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },
  stepSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  infoCard: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  infoText: { fontSize: 13, color: 'rgba(147,197,253,0.9)', lineHeight: 19 },

  formCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
    borderRadius: Radius.xl, padding: Spacing.lg,
    gap: Spacing.md, marginBottom: Spacing.lg,
  },

  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md, minHeight: 52,
  },
  inputFocused: { borderColor: Colors.gold[500] },
  textInput: {
    flex: 1, color: Colors.white, fontSize: 15,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  eyeBtn: { paddingHorizontal: Spacing.md },
  eyeText: { fontSize: 16 },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  pillMet: { backgroundColor: 'rgba(16,185,129,0.15)' },
  pillText: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
  pillTextMet: { color: Colors.emerald[400] },

  matchIndicator: { fontSize: 12, fontWeight: '600' },
  matchOk: { color: Colors.emerald[400] },
  matchBad: { color: Colors.red[400] },

  submitBtnGradient: { borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md },
  submitBtnInner: { paddingVertical: Spacing.md + 2, alignItems: 'center' },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  submitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg, paddingVertical: Spacing.md + 2,
    alignItems: 'center', marginBottom: Spacing.md,
  },
  submitBtnDisabledText: { color: 'rgba(255,255,255,0.25)', fontSize: 16, fontWeight: '700' },

  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
});
