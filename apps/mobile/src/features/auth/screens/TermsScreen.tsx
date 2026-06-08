import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Colors, Spacing, Radius } from '../../../shared/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Terms'>;

const TC_CLAUSES = [
  {
    color: '#ef4444',
    title: 'No Liability for Fraud or Misconduct',
    body: 'BrokerSaab is a third-party technology marketplace. We are NOT responsible for any fraudulent activity, misrepresentation, or financial harm caused by any advisor listed on this platform. Users engage professionals entirely at their own risk.',
  },
  {
    color: '#f59e0b',
    title: 'Disputes — Indian Judiciary',
    body: 'All disputes arising from use of BrokerSaab shall be subject exclusively to the jurisdiction of the competent courts of India. BrokerSaab is not a party to disputes between users and advisors.',
  },
  {
    color: '#10b981',
    title: 'Escrow Payment Protection',
    body: 'Payments are held in escrow until consultation completion. BrokerSaab does NOT guarantee the quality, accuracy, or outcome of any professional advice or service.',
  },
  {
    color: '#3b82f6',
    title: 'User Responsibilities',
    body: "You are responsible for independently verifying any professional's credentials before acting on their advice. BrokerSaab's internal verification is not a government certification.",
  },
  {
    color: '#8b5cf6',
    title: 'Platform Role',
    body: 'BrokerSaab is a neutral intermediary only. No fiduciary duty or professional liability is created with BrokerSaab by using this platform.',
  },
];

export const TermsScreen: React.FC<Props> = ({ navigation }) => {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleInnerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 20) {
      setHasScrolled(true);
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
            <Text style={styles.logoTextBroker}>Broker</Text>
            <Text style={styles.logoTextSaab}>Saab</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.outerScroll}
          contentContainerStyle={styles.outerScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>BEFORE YOU CONTINUE</Text>
            <Text style={styles.stepTitle}>Terms & Conditions</Text>
            <Text style={styles.stepSubtitle}>Please read all terms carefully before proceeding</Text>
          </View>

          {/* Inner scrollable clause area */}
          <View style={styles.clauseContainer}>
            <ScrollView
              style={styles.clauseScroll}
              onScroll={handleInnerScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled
            >
              {/* Warning box */}
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️  By using BrokerSaab, you agree to the following terms. Read each clause carefully.
                </Text>
              </View>

              {TC_CLAUSES.map((clause) => (
                <View
                  key={clause.title}
                  style={[styles.clauseCard, { borderLeftColor: clause.color }]}
                >
                  <Text style={[styles.clauseTitle, { color: clause.color }]}>
                    {clause.title.toUpperCase()}
                  </Text>
                  <Text style={styles.clauseBody}>{clause.body}</Text>
                </View>
              ))}

              {/* Governing law box */}
              <View style={styles.govBox}>
                <Text style={styles.govText}>
                  ⚖️  Governing Law: All matters are subject to the laws of India and the jurisdiction of Indian courts.
                </Text>
              </View>

              <View style={{ height: Spacing.lg }} />
            </ScrollView>
          </View>

          {/* Accept section */}
          <View style={styles.acceptSection}>
            {!hasScrolled && (
              <Text style={styles.scrollHint}>↓ Scroll to read all terms</Text>
            )}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => hasScrolled && setAccepted((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                {accepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the Terms & Conditions
              </Text>
            </TouchableOpacity>

            {accepted ? (
              <LinearGradient
                colors={['#FFE082', '#D4AF37', '#B48C22']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptBtnGradient}
              >
                <TouchableOpacity
                  style={styles.acceptBtnInner}
                  onPress={() => navigation.navigate('PhoneOtp')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptBtnText}>I Accept — Continue →</Text>
                </TouchableOpacity>
              </LinearGradient>
            ) : (
              <View style={styles.acceptBtnDisabled}>
                <Text style={styles.acceptBtnDisabledText}>I Accept — Continue →</Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoTextBroker: { fontSize: 18, fontWeight: '800', color: Colors.white },
  logoTextSaab: { fontSize: 18, fontWeight: '800', color: Colors.gold[500] },

  outerScroll: { flex: 1 },
  outerScrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  stepHeader: { marginBottom: Spacing.lg, gap: Spacing.xs },
  stepBadge: {
    fontSize: 11, fontWeight: '700', color: Colors.gold[400],
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  stepTitle: { fontSize: 26, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },
  stepSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },

  clauseContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  clauseScroll: { maxHeight: 320, padding: Spacing.md },

  warningBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  warningText: { fontSize: 12, color: 'rgba(252,165,165,0.9)', lineHeight: 18 },

  clauseCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 4,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  clauseTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  clauseBody: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },

  govBox: {
    backgroundColor: 'rgba(79,70,229,0.1)',
    borderWidth: 1, borderColor: 'rgba(79,70,229,0.3)',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  govText: { fontSize: 12, color: 'rgba(196,181,253,0.9)', lineHeight: 18 },

  acceptSection: { gap: Spacing.md },

  scrollHint: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.35)', letterSpacing: 0.3,
  },

  checkboxRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxChecked: {
    borderColor: Colors.emerald[500],
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  checkmark: { fontSize: 13, color: Colors.emerald[400], fontWeight: '900' },
  checkboxLabel: {
    flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20,
  },

  acceptBtnGradient: { borderRadius: Radius.lg, overflow: 'hidden' },
  acceptBtnInner: {
    paddingVertical: Spacing.md + 2, alignItems: 'center',
  },
  acceptBtnText: {
    color: Colors.navy[900], fontSize: 16, fontWeight: '900', letterSpacing: 0.5,
  },
  acceptBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  acceptBtnDisabledText: {
    color: 'rgba(255,255,255,0.25)', fontSize: 16, fontWeight: '700',
  },
});
