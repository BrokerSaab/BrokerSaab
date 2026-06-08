import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { HomeStackParamList } from '../../../shared/navigation/types';
import { Colors, Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { useAuthStore } from '../../../shared/store';
import { advisorRepository } from '../../../shared/api';
import { Avatar, StarRating, BrokerSaabLogo } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/format';
import type { AdvisorSummary } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

// Color palette per service tile — matches website's colorful card scheme
const TILE_COLORS = [
  { bg: '#FFF1F2', icon: '#F43F5E', border: '#FECDD3' },  // rose
  { bg: '#F0FDFA', icon: '#14B8A6', border: '#99F6E4' },  // teal
  { bg: '#F5F3FF', icon: '#8B5CF6', border: '#DDD6FE' },  // violet
  { bg: '#FFFBEB', icon: '#F59E0B', border: '#FDE68A' },  // amber
  { bg: '#ECFDF5', icon: '#10B981', border: '#A7F3D0' },  // emerald
  { bg: '#EFF6FF', icon: '#3B82F6', border: '#BFDBFE' },  // blue
  { bg: '#FEFCE8', icon: '#EAB308', border: '#FEF08A' },  // yellow
  { bg: '#F0F9FF', icon: '#0EA5E9', border: '#BAE6FD' },  // sky
  { bg: '#EEF2FF', icon: '#6366F1', border: '#C7D2FE' },  // indigo
  { bg: '#FFF7ED', icon: '#F97316', border: '#FED7AA' },  // orange
  { bg: '#F8FAFC', icon: '#64748B', border: '#E2E8F0' },  // slate
  { bg: '#ECFEFF', icon: '#06B6D4', border: '#A5F3FC' },  // cyan
  { bg: '#FDF4FF', icon: '#EC4899', border: '#F5D0FE' },  // pink
  { bg: '#F0FDF4', icon: '#22C55E', border: '#BBF7D0' },  // green
  { bg: '#FFFBEB', icon: '#D4AF37', border: '#FDE68A' },  // gold
  { bg: '#EFF6FF', icon: '#60A5FA', border: '#BFDBFE' },  // light-blue
];

const MODULES = [
  { id: 'm1',  name: 'Birth, Death\n& Marriage',   icon: '📜' },
  { id: 'm2',  name: 'Identity Cards\n& Docs',      icon: '🪪' },
  { id: 'm3',  name: 'Income, Caste\n& Residence',  icon: '📋' },
  { id: 'm4',  name: 'Property &\nLand Papers',     icon: '🏠' },
  { id: 'm5',  name: 'Tax / GST\nFiling',           icon: '🧾' },
  { id: 'm6',  name: 'Business\nRegistration',      icon: '🏢' },
  { id: 'm7',  name: 'Brand & IP\nProtection',      icon: '™️' },
  { id: 'm8',  name: 'Bank, Loan\n& Credit',        icon: '🏦' },
  { id: 'm9',  name: 'Insurance\n(Bima)',            icon: '🛡️' },
  { id: 'm10', name: 'Vehicle &\nRTO Work',          icon: '🚗' },
  { id: 'm11', name: 'Legal &\nCourt Help',          icon: '⚖️' },
  { id: 'm12', name: 'Job, PF &\nLabour',            icon: '👷' },
  { id: 'm13', name: 'School &\nCollege Papers',     icon: '🎓' },
  { id: 'm14', name: 'Pension &\nGovt Schemes',      icon: '👴' },
  { id: 'm15', name: 'Savings &\nInvestment',        icon: '💰' },
  { id: 'm16', name: 'Passport, Visa\n& Foreign',    icon: '✈️' },
  { id: 'm17', name: 'Electricity,\nWater & Gas',    icon: '⚡' },
  { id: 'm18', name: 'Farmer &\nAgriculture',        icon: '🌾' },
  { id: 'm19', name: 'Online Form\n& Doc Help',      icon: '💻' },
  { id: 'm20', name: 'Central Govt\nSchemes',        icon: '🏛️' },
  { id: 'm21', name: 'Study Abroad\nConsulting',     icon: '🌍' },
  { id: 'm22', name: 'College\nAdmission',           icon: '📚' },
  { id: 'm23', name: 'Job Placement\n& Recruit',     icon: '💼' },
  { id: 'm24', name: 'Visa & PR\nImmigration',       icon: '🛂' },
  { id: 'm25', name: 'Others /\nCustom',             icon: '✨' },
  { id: 'm26', name: 'Tour &\nTravel',               icon: '🗺️' },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();

  const { data: topAdvisors, isLoading } = useQuery({
    queryKey: ['top-advisors', user?.state],
    queryFn: () => advisorRepository.search({ state: user?.state ?? undefined, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const advisors = topAdvisors?.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* ── Navbar ── */}
      <View style={styles.navbar}>
        <BrokerSaabLogo size="md" variant="light" showTagline />
        <Avatar uri={user?.avatarUrl} fallbackName={user?.fullName} size={36} showBorder />
      </View>

      {/* ── Light body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <LinearGradient
          colors={['#0B1F3A', '#1a1040']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>India's #1 Advisory Platform</Text>
          </View>
          <Text style={styles.heroTitle}>
            Hello, {user?.fullName?.split(' ')[0] ?? 'there'} 👋
          </Text>
          <Text style={styles.heroSub}>Find verified advisors near you</Text>
          <View style={styles.heroStats}>
            {([['10K+', 'Users'], ['SEBI', 'Verified'], ['4.8★', 'Rated']] as [string, string][]).map(([val, lbl]) => (
              <View key={lbl} style={styles.heroStatItem}>
                <Text style={styles.heroStatVal}>{val}</Text>
                <Text style={styles.heroStatLbl}>{lbl}</Text>
              </View>
            ))}
          </View>
          {user?.state ? (
            <View style={styles.locationPill}>
              <Text style={styles.locationText}>📍 {user.state}</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Search bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ServiceDetail', { moduleId: 'search', moduleName: 'Search Advisors' })}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search advisors, services…</Text>
          <View style={styles.searchBadge}>
            <Text style={styles.searchBadgeText}>Search</Text>
          </View>
        </TouchableOpacity>

        {/* Services section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OUR SERVICES</Text>
          <Text style={styles.sectionDesc}>Professional Service Categories</Text>
          <Text style={styles.sectionSubDesc}>Select a service to find verified professionals near you.</Text>
        </View>

        {/* Colorful service grid — 2 columns like website cards */}
        <View style={styles.grid}>
          {MODULES.map((mod, idx) => {
            const color = TILE_COLORS[idx % TILE_COLORS.length];
            return (
              <TouchableOpacity
                key={mod.id}
                style={[styles.tile, { backgroundColor: color.bg, borderColor: color.border }]}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate('ServiceDetail', {
                    moduleId: mod.id,
                    moduleName: mod.name.replace('\n', ' '),
                  })
                }
              >
                <View style={[styles.tileIconBg, { backgroundColor: color.icon }]}>
                  <Text style={styles.tileIcon}>{mod.icon}</Text>
                </View>
                <Text style={[styles.tileName, { color: Colors.navy[800] }]}>
                  {mod.name}
                </Text>
                <Text style={[styles.tileExplore, { color: color.icon }]}>Explore →</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Top Advisors */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.sm }]}>
          <Text style={styles.sectionTitle}>
            TOP ADVISORS{user?.state ? ` · ${user.state.toUpperCase()}` : ''}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.navy[800]} style={styles.loader} />
        ) : advisors.length === 0 ? (
          <Text style={styles.empty}>No advisors found in your area yet.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.advisorRow}
          >
            {(advisors as AdvisorSummary[]).map((adv) => (
              <AdvisorMiniCard key={adv.id} advisor={adv} />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const AdvisorMiniCard: React.FC<{ advisor: AdvisorSummary }> = ({ advisor }) => (
  <View style={styles.advCard}>
    <Avatar uri={advisor.avatarUrl} fallbackName={advisor.fullName} size={50} showBorder />
    <Text style={styles.advName} numberOfLines={1}>{advisor.fullName}</Text>
    {advisor.averageRating ? <StarRating score={advisor.averageRating} size={11} /> : null}
    <Text style={styles.advFee}>{formatCurrency(advisor.consultationFee)}</Text>
    {advisor.isAuthorizedDealer ? (
      <View style={styles.advBadge}>
        <Text style={styles.advBadgeText}>✓ Authorized</Text>
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  body: { flex: 1, backgroundColor: Palette.background },
  container: { paddingBottom: Spacing.xxl },

  // Navbar
  navbar: {
    backgroundColor: Colors.navy[800],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  // Hero card
  hero: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    borderRadius: Radius.xl, padding: Spacing.lg, overflow: 'hidden',
    ...Shadow.md,
  },
  heroGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  heroBadge: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    borderRadius: Radius.full, alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm, paddingVertical: 3, marginBottom: Spacing.sm,
  },
  heroBadgeText: { fontSize: 10, color: Colors.gold[400], fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  heroStats: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.md },
  heroStatItem: { alignItems: 'center', gap: 1 },
  heroStatVal: { fontSize: 14, fontWeight: '800', color: Colors.gold[400] },
  heroStatLbl: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 0.5 },
  locationPill: {
    backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, marginTop: Spacing.sm, alignSelf: 'flex-start',
  },
  locationText: { fontSize: 11, color: Colors.gold[400], fontWeight: '600' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.slate[200],
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm, marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    ...Shadow.sm,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { flex: 1, fontSize: 14, color: Colors.slate[400] },
  searchBadge: {
    backgroundColor: Colors.navy[800], borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  searchBadgeText: { fontSize: 11, color: Colors.white, fontWeight: '600' },

  // Section header
  sectionHeader: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md, gap: 3,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: Colors.gold[600],
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  sectionDesc: { fontSize: 22, fontWeight: '900', color: Colors.navy[800], letterSpacing: -0.3 },
  sectionSubDesc: { fontSize: 13, color: Colors.slate[500], lineHeight: 19 },

  // Service grid — 2 columns
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg, gap: Spacing.sm,
  },
  tile: {
    width: '47.5%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tileIconBg: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  tileIcon: { fontSize: 22 },
  tileName: {
    fontSize: 13, fontWeight: '700', lineHeight: 18,
  },
  tileExplore: { fontSize: 11, fontWeight: '600' },

  // Advisors
  loader: { marginTop: Spacing.md, marginHorizontal: Spacing.lg },
  empty: {
    fontSize: 13, color: Colors.slate[400], textAlign: 'center',
    marginTop: Spacing.md, marginHorizontal: Spacing.lg,
  },
  advisorRow: { gap: Spacing.md, paddingHorizontal: Spacing.lg, paddingRight: Spacing.lg },
  advCard: {
    width: 130, backgroundColor: Colors.white,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.slate[200],
    padding: Spacing.md, alignItems: 'center', gap: 4,
    ...Shadow.sm,
  },
  advName: { fontSize: 12, fontWeight: '700', color: Colors.navy[800], textAlign: 'center', width: '100%' },
  advFee: { color: Colors.gold[600], fontSize: 12, fontWeight: '700' },
  advBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  advBadgeText: { fontSize: 9, color: Colors.emerald[600], fontWeight: '700' },
});
