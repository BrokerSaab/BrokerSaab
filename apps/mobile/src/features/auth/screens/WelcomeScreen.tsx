import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Colors, Spacing, Radius, Shadow } from '../../../shared/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => (
  <LinearGradient
    colors={['#0B1F3A', '#1a1040', '#0B1F3A']}
    start={{ x: 0.3, y: 0 }}
    end={{ x: 0.7, y: 1 }}
    style={styles.gradient}
  >
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Ambient glow blobs */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoIconWrap}>
          <Image
            source={require('../../../assets/logo-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.logoRow}>
          <Text style={styles.logoTextBroker}>Broker</Text>
          <Text style={styles.logoTextSaab}>Saab</Text>
        </View>
        <Text style={styles.logoTagline}>India's Trusted Advisory Marketplace</Text>
      </View>

      {/* Hero */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>🏆 India's #1 Advisory Platform</Text>
        </View>
        <Text style={styles.heroTitle}>Find Verified{'\n'}Advisors Near You</Text>
        <Text style={styles.heroSubtitle}>
          Connect with SEBI-verified experts for financial, legal, property and government services.
        </Text>
      </View>

      {/* Trust strip */}
      <View style={styles.trustStrip}>
        {[
          { icon: '🛡️', label: 'SEBI Verified' },
          { icon: '🔒', label: 'Escrow Safe' },
          { icon: '⭐', label: '4.8 Rated' },
          { icon: '👥', label: '10K+ Users' },
        ].map((item) => (
          <View key={item.label} style={styles.trustItem}>
            <Text style={styles.trustIcon}>{item.icon}</Text>
            <Text style={styles.trustLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* CTA buttons */}
      <View style={styles.ctaSection}>
        <LinearGradient
          colors={['#FFE082', '#D4AF37', '#B48C22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryBtnGradient}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('Terms')}
            style={styles.primaryBtnInner}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </TouchableOpacity>
        </LinearGradient>

        <TouchableOpacity
          onPress={() => navigation.navigate('Terms')}
          style={styles.outlineBtn}
          activeOpacity={0.85}
        >
          <Text style={styles.outlineBtnText}>Login to Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('AdminLogin')}
          style={styles.ghostBtn}
          activeOpacity={0.75}
        >
          <Text style={styles.ghostBtnText}>Admin Portal →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </LinearGradient>
);

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent', justifyContent: 'space-between', paddingHorizontal: Spacing.lg },

  glowTopRight: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(212,175,55,0.07)',
  },
  glowBottomLeft: {
    position: 'absolute', bottom: -80, left: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(79,70,229,0.07)',
  },

  // Logo
  logoSection: { paddingTop: Spacing.lg, alignItems: 'center', gap: 6 },
  logoIconWrap: {
    width: 88, height: 88, borderRadius: 22, overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(212,175,55,0.5)',
    shadowColor: Colors.gold[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  logoImage: { width: 88, height: 88 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoTextBroker: { fontSize: 22, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },
  logoTextSaab: { fontSize: 22, fontWeight: '900', color: Colors.gold[500], letterSpacing: -0.3 },
  logoTagline: { fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },

  // Hero
  heroSection: { gap: Spacing.md },
  heroBadge: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: Radius.full, alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: 5,
  },
  heroBadgeText: { fontSize: 12, color: Colors.gold[400], fontWeight: '700', letterSpacing: 0.3 },
  heroTitle: {
    fontSize: 34, fontWeight: '900', color: Colors.white,
    lineHeight: 40, letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 21,
  },

  // Trust strip
  trustStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustIcon: { fontSize: 18 },
  trustLabel: {
    fontSize: 9, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', letterSpacing: 0.3,
  },

  // CTAs
  ctaSection: { paddingBottom: Spacing.lg, gap: Spacing.md },

  primaryBtnGradient: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.gold },
  primaryBtnInner: { paddingVertical: Spacing.md + 2, alignItems: 'center' },
  primaryBtnText: {
    color: Colors.navy[900], fontSize: 16, fontWeight: '900', letterSpacing: 0.5,
  },

  outlineBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  outlineBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  ghostBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  ghostBtnText: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '500' },
});
