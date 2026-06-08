import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Colors, Spacing, Radius } from '../../../shared/theme';
import { useAuthStore, useUiStore } from '../../../shared/store';
import { authRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterComplete'>;

export const RegisterCompleteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { phoneNumber, tempToken } = route.params;
  const { login } = useAuthStore();
  const { showToast } = useUiStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      showToast('error', 'Please enter your full name');
      return;
    }
    setLoading(true);
    try {
      const res = await authRepository.registerClient(tempToken, fullName.trim(), email.trim() || undefined);
      if (res.tokens?.accessToken && res.tokens?.refreshToken && res.user) {
        await login({ accessToken: res.tokens.accessToken, refreshToken: res.tokens.refreshToken }, res.user);
        navigation.navigate('SetPassword');
      }
    } catch (e: any) {
      showToast('error', e?.response?.data?.message ?? 'Registration failed');
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

        <View style={styles.glowTopRight} pointerEvents="none" />
        <View style={styles.glowBottomLeft} pointerEvents="none" />

        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
            <View style={styles.stepHeader}>
              <Text style={styles.stepBadge}>FINAL STEP</Text>
              <Text style={styles.stepTitle}>Complete Registration</Text>
              <Text style={styles.stepSubtitle}>Creating your client account for {phoneNumber}</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ravi Ranjan"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  selectionColor={Colors.gold[500]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL (OPTIONAL)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. ravi@example.com"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  selectionColor={Colors.gold[500]}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  🎯 Browse advisors, book consultations, and manage all your advisory services in one place.
                </Text>
              </View>

              <LinearGradient
                colors={['#FFE082', '#D4AF37', '#B48C22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.primaryBtnGradient, loading && styles.btnDisabled]}
              >
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={loading}
                  style={styles.primaryBtnInner}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {loading ? 'Creating Account…' : 'Create My Account →'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            <Text style={styles.secureNote}>🔒 Your data is secure · BrokerSaab</Text>
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
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md, color: Colors.white, fontSize: 15,
    paddingHorizontal: Spacing.md, minHeight: 52,
  },

  infoBox: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  infoText: { fontSize: 13, color: 'rgba(147,197,253,0.9)', lineHeight: 19 },

  primaryBtnGradient: { borderRadius: Radius.lg, overflow: 'hidden' },
  primaryBtnInner: { paddingVertical: Spacing.md, alignItems: 'center' },
  primaryBtnText: { color: Colors.navy[900], fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  btnDisabled: { opacity: 0.45 },

  secureNote: {
    textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)',
    marginTop: Spacing.xl, letterSpacing: 0.3,
  },
});
