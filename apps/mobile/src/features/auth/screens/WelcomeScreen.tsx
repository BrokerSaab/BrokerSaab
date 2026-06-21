import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Colors, Spacing, Radius } from '../../../shared/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const SERVICES = [
  { id: 's1', icon: '🎓', label: 'Study Abroad' },
  { id: 's2', icon: '🏛️', label: 'Domestic Admission' },
  { id: 's3', icon: '💼', label: 'Job Placement' },
  { id: 's4', icon: '✈️', label: 'Visa & PR' },
];

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => (
  <LinearGradient
    colors={['#1C2B6B', '#1E3A8A', '#2563EB', '#1E3A8A', '#0B1F3A']}
    start={{ x: 0.3, y: 0 }}
    end={{ x: 0.7, y: 1 }}
    style={styles.gradient}
  >
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Skip */}
      <View style={styles.topRow}>
        <View />
        <TouchableOpacity onPress={() => navigation.navigate('Terms')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Logo section */}
      <View style={styles.logoSection}>
        {/* Compass circle */}
        <View style={styles.compassWrap}>
          <Text style={styles.compassIcon}>🧭</Text>
        </View>
        <Text style={styles.brandName}>BrokerSaab</Text>
        <Text style={styles.tagline}>Aapka Vishwaspaatra Salahkar</Text>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Service cards 2x2 */}
      <View style={styles.serviceGrid}>
        {SERVICES.map((s) => (
          <TouchableOpacity key={s.id} style={styles.serviceCard} activeOpacity={0.8}>
            <Text style={styles.serviceIcon}>{s.icon}</Text>
            <Text style={styles.serviceLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Get Started button */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={['#FFE082', '#D4AF37', '#B48C22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btnGradient}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Terms')}
            style={styles.btnInner}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Get Started</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  </LinearGradient>
);

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: Spacing.lg },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  skipText: { fontSize: 15, color: Colors.white, fontWeight: '500' },

  logoSection: { alignItems: 'center', marginTop: Spacing.xxl, gap: 12 },
  compassWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  compassIcon: { fontSize: 42 },
  brandName: {
    fontSize: 38, fontWeight: '900', color: Colors.gold[400], letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16, color: 'rgba(255,255,255,0.75)', fontWeight: '400', letterSpacing: 0.2,
  },

  serviceGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.sm, marginBottom: Spacing.xl,
  },
  serviceCard: {
    width: '47.5%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
  serviceIcon: { fontSize: 30 },
  serviceLabel: {
    fontSize: 14, color: Colors.white, fontWeight: '500', textAlign: 'center',
  },

  ctaSection: { marginBottom: Spacing.md },
  btnGradient: { borderRadius: Radius.xl, overflow: 'hidden' },
  btnInner: { paddingVertical: 18, alignItems: 'center' },
  btnText: { fontSize: 18, fontWeight: '800', color: Colors.navy[900], letterSpacing: 0.3 },
});
