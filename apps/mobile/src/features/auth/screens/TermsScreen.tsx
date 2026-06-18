import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Colors, Spacing, Radius } from '../../../shared/theme';
import { TermsModal } from '../../../shared/components/TermsModal';

type Props = NativeStackScreenProps<AuthStackParamList, 'Terms'>;

export const TermsScreen: React.FC<Props> = ({ navigation }) => {
  const [accepted, setAccepted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

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
              <Image
                source={require('../../../../assets/logo-icon.png')}
                style={styles.navLogoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoTextBroker}>Broker</Text>
            <Text style={styles.logoTextSaab}>Saab</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>BEFORE YOU CONTINUE</Text>
            <Text style={styles.stepTitle}>One Quick Step</Text>
            <Text style={styles.stepSubtitle}>
              Please accept our Terms & Conditions to get started
            </Text>
          </View>

          {/* Acceptance card */}
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAccepted((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                {accepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text
                  style={styles.link}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setModalVisible(true);
                  }}
                >
                  Terms & Conditions
                </Text>
                {' '}&{' '}
                <Text
                  style={styles.link}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setModalVisible(true);
                  }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.readLink}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.readLinkText}>Read Terms & Conditions →</Text>
            </TouchableOpacity>
          </View>

          {/* Continue button */}
          {accepted ? (
            <LinearGradient
              colors={['#FFE082', '#D4AF37', '#B48C22']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <TouchableOpacity
                style={styles.btnInner}
                onPress={() => navigation.navigate('PhoneOtp')}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Continue to Register →</Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <View style={styles.btnDisabled}>
              <Text style={styles.btnDisabledText}>Continue to Register →</Text>
            </View>
          )}
        </View>

        {/* Terms Modal */}
        <TermsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAgree={() => {
            setAccepted(true);
            setModalVisible(false);
          }}
        />
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

  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },

  stepHeader: { gap: Spacing.xs },
  stepBadge: {
    fontSize: 11, fontWeight: '700', color: Colors.gold[400],
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  stepTitle: { fontSize: 28, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },
  stepSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: {
    borderColor: Colors.emerald[500],
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  checkmark: { fontSize: 13, color: Colors.emerald[400], fontWeight: '900' },
  checkboxLabel: {
    flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22,
  },
  link: {
    color: Colors.gold[400],
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  readLink: { alignSelf: 'flex-start' },
  readLinkText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },

  btnGradient: { borderRadius: Radius.lg, overflow: 'hidden' },
  btnInner: { paddingVertical: Spacing.md + 4, alignItems: 'center' },
  btnText: { color: Colors.navy[900], fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  btnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
  },
  btnDisabledText: { color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: '700' },
});
