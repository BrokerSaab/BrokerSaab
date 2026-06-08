import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { HomeStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { useAuthStore } from '../../../shared/store';
import { advisorRepository } from '../../../shared/api';
import { Avatar, StarRating, Badge } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/format';
import type { AdvisorSummary } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

const MODULES = [
  { id: 'm1',  slug: 'm1',  name: 'Birth, Death\n& Marriage',    icon: '📜' },
  { id: 'm2',  slug: 'm2',  name: 'Identity Cards\n& Docs',       icon: '🪪' },
  { id: 'm3',  slug: 'm3',  name: 'Income, Caste\n& Residence',   icon: '📋' },
  { id: 'm4',  slug: 'm4',  name: 'Property &\nLand Papers',      icon: '🏠' },
  { id: 'm5',  slug: 'm5',  name: 'Tax / GST\nFiling',            icon: '🧾' },
  { id: 'm6',  slug: 'm6',  name: 'Business\nRegistration',       icon: '🏢' },
  { id: 'm7',  slug: 'm7',  name: 'Brand & IP\nProtection',       icon: '™️'  },
  { id: 'm8',  slug: 'm8',  name: 'Bank, Loan\n& Credit',         icon: '🏦' },
  { id: 'm9',  slug: 'm9',  name: 'Insurance\n(Bima)',             icon: '🛡️' },
  { id: 'm10', slug: 'm10', name: 'Vehicle &\nRTO Work',           icon: '🚗' },
  { id: 'm11', slug: 'm11', name: 'Legal &\nCourt Help',           icon: '⚖️' },
  { id: 'm12', slug: 'm12', name: 'Job, PF &\nLabour',             icon: '👷' },
  { id: 'm13', slug: 'm13', name: 'School &\nCollege Papers',      icon: '🎓' },
  { id: 'm14', slug: 'm14', name: 'Pension &\nGovt Schemes',       icon: '👴' },
  { id: 'm15', slug: 'm15', name: 'Savings &\nInvestment',         icon: '💰' },
  { id: 'm16', slug: 'm16', name: 'Passport, Visa\n& Foreign',     icon: '✈️' },
  { id: 'm17', slug: 'm17', name: 'Electricity,\nWater & Gas',     icon: '⚡' },
  { id: 'm18', slug: 'm18', name: 'Farmer &\nAgriculture',         icon: '🌾' },
  { id: 'm19', slug: 'm19', name: 'Online Form\n& Doc Help',       icon: '💻' },
  { id: 'm20', slug: 'm20', name: 'Central Govt\nSchemes',         icon: '🏛️' },
  { id: 'm21', slug: 'm21', name: 'Study Abroad\nConsulting',      icon: '🌍' },
  { id: 'm22', slug: 'm22', name: 'College\nAdmission',            icon: '📚' },
  { id: 'm23', slug: 'm23', name: 'Job Placement\n& Recruit',      icon: '💼' },
  { id: 'm24', slug: 'm24', name: 'Visa & PR\nImmigration',        icon: '🛂' },
  { id: 'm25', slug: 'm25', name: 'Others /\nCustom',              icon: '✨' },
  { id: 'm26', slug: 'm26', name: 'Tour &\nTravel',                icon: '🗺️' },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [searchText, setSearchText] = useState('');

  const { data: topAdvisors, isLoading } = useQuery({
    queryKey: ['top-advisors', user?.state],
    queryFn: () => advisorRepository.search({ state: user?.state ?? undefined, limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const advisors = topAdvisors?.data ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] ?? 'there'} 👋</Text>
            <Text style={styles.subtitle}>Find a trusted advisor near you</Text>
          </View>
          <Avatar uri={user?.avatarUrl} fallbackName={user?.fullName} size={40} showBorder />
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ServiceDetail', { moduleId: 'search', moduleName: 'Search Advisors' })}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search advisors, services…</Text>
        </TouchableOpacity>

        {/* Location chip */}
        {user?.state ? (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>{user.state}</Text>
          </View>
        ) : null}

        {/* Services Grid */}
        <Text style={styles.sectionTitle}>SERVICES</Text>
        <View style={styles.grid}>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={styles.tile}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('ServiceDetail', {
                  moduleId: mod.slug,
                  moduleName: mod.name.replace('\n', ' '),
                })
              }
            >
              <Text style={styles.tileIcon}>{mod.icon}</Text>
              <Text style={styles.tileName}>{mod.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top Advisors */}
        <Text style={styles.sectionTitle}>
          TOP ADVISORS{user?.state ? ` IN ${user.state.toUpperCase()}` : ''}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={Palette.primary} style={styles.loader} />
        ) : advisors.length === 0 ? (
          <Text style={styles.empty}>No advisors found in your state yet.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.advisorRow}
          >
            {(advisors as AdvisorSummary[]).map((adv) => (
              <AdvisorMiniCard
                key={adv.id}
                advisor={adv}
                onPress={() => {}}
              />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const AdvisorMiniCard: React.FC<{ advisor: AdvisorSummary; onPress: () => void }> = ({
  advisor,
  onPress,
}) => (
  <TouchableOpacity style={styles.advCard} onPress={onPress} activeOpacity={0.8}>
    <Avatar uri={advisor.avatarUrl} fallbackName={advisor.fullName} size={52} showBorder />
    <Text style={styles.advName} numberOfLines={1}>{advisor.fullName}</Text>
    {advisor.averageRating ? (
      <StarRating score={advisor.averageRating} size={11} />
    ) : null}
    <Text style={styles.advFee}>{formatCurrency(advisor.consultationFee)}</Text>
    {advisor.isAuthorizedDealer ? (
      <Badge text="Authorized" color="gold" size="sm" />
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { gap: 2 },
  greeting: { ...Typography.subheading, fontSize: 18 },
  subtitle: { ...Typography.caption },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { ...Typography.body, color: Palette.textMuted, flex: 1 },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationIcon: { fontSize: 12 },
  locationText: { ...Typography.caption, color: Palette.primary, fontWeight: '600' },

  sectionTitle: { ...Typography.label },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    width: '22%',
    aspectRatio: 0.9,
    backgroundColor: Palette.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
    gap: 3,
  },
  tileIcon: { fontSize: 22 },
  tileName: {
    fontSize: 9,
    fontWeight: '600',
    color: Palette.text,
    textAlign: 'center',
    lineHeight: 13,
  },

  loader: { marginTop: Spacing.md },
  empty: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.md },

  advisorRow: { gap: Spacing.md, paddingRight: Spacing.md },
  advCard: {
    width: 120,
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  advName: { ...Typography.bodySmall, fontWeight: '600', textAlign: 'center', width: '100%' },
  advFee: { color: Palette.primary, fontSize: 11, fontWeight: '700' },
});
