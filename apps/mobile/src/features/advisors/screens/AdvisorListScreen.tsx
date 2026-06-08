import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { AdvisorsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { advisorRepository } from '../../../shared/api';
import { EmptyState, SkeletonLoader, Avatar, StarRating, Badge, Button } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/format';
import type { AdvisorSummary } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<AdvisorsStackParamList, 'AdvisorList'>;

const INDIAN_STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

interface Filters {
  state: string;
  minFee: string;
  maxFee: string;
  minExp: string;
  minRating: string;
  dealerOnly: boolean;
}

const DEFAULT_FILTERS: Filters = {
  state: '',
  minFee: '',
  maxFee: '',
  minExp: '',
  minRating: '',
  dealerOnly: false,
};

export const AdvisorListScreen: React.FC<Props> = ({ navigation, route }) => {
  const category = (route.params as any)?.category as string | undefined;

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['advisors', category, search, filters],
    queryFn: () =>
      advisorRepository.search({
        q: search || undefined,
        categories: category || undefined,
        state: filters.state || undefined,
        minFee: filters.minFee ? Number(filters.minFee) : undefined,
        maxFee: filters.maxFee ? Number(filters.maxFee) : undefined,
        minExp: filters.minExp ? Number(filters.minExp) : undefined,
        minRating: filters.minRating ? Number(filters.minRating) : undefined,
        dealerOnly: filters.dealerOnly || undefined,
        limit: 30,
      }),
    staleTime: 3 * 60 * 1000,
  });

  const advisors = data?.data ?? [];

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    k !== 'dealerOnly' ? !!v : v === true,
  ).length;

  const applyFilters = () => {
    setFilters(draftFilters);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setFilterOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search + Filter row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search advisors…"
            placeholderTextColor={Palette.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => { setDraftFilters(filters); setFilterOpen(true); }}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Results count */}
      {!isLoading && (
        <Text style={styles.resultCount}>
          {advisors.length} advisor{advisors.length !== 1 ? 's' : ''} found
        </Text>
      )}

      {isLoading ? (
        <>
          <AdvisorCardSkeleton />
          <AdvisorCardSkeleton />
          <AdvisorCardSkeleton />
        </>
      ) : (
        <FlatList
          data={advisors}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Palette.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No advisors found"
              subtitle="Try adjusting your search or filters"
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          }
          renderItem={({ item }) => (
            <AdvisorCard
              advisor={item}
              onPress={() => navigation.navigate('AdvisorProfile', { advisorId: item.id })}
            />
          )}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={filterOpen} animationType="slide" transparent onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearAll}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              {/* State */}
              <Text style={styles.filterLabel}>STATE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {INDIAN_STATES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, draftFilters.state === s && styles.chipActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, state: f.state === s ? '' : s }))}
                  >
                    <Text style={[styles.chipText, draftFilters.state === s && styles.chipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Fee range */}
              <Text style={styles.filterLabel}>FEE RANGE (₹)</Text>
              <View style={styles.rangeRow}>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Min"
                  placeholderTextColor={Palette.textMuted}
                  keyboardType="numeric"
                  value={draftFilters.minFee}
                  onChangeText={(v) => setDraftFilters((f) => ({ ...f, minFee: v }))}
                />
                <Text style={styles.rangeDash}>–</Text>
                <TextInput
                  style={styles.rangeInput}
                  placeholder="Max"
                  placeholderTextColor={Palette.textMuted}
                  keyboardType="numeric"
                  value={draftFilters.maxFee}
                  onChangeText={(v) => setDraftFilters((f) => ({ ...f, maxFee: v }))}
                />
              </View>

              {/* Experience */}
              <Text style={styles.filterLabel}>MIN. EXPERIENCE (YEARS)</Text>
              <View style={styles.chipRow}>
                {['2', '5', '10', '15'].map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.chip, draftFilters.minExp === y && styles.chipActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, minExp: f.minExp === y ? '' : y }))}
                  >
                    <Text style={[styles.chipText, draftFilters.minExp === y && styles.chipTextActive]}>
                      {y}+ yrs
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating */}
              <Text style={styles.filterLabel}>MIN. RATING</Text>
              <View style={styles.chipRow}>
                {['3', '4', '4.5'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, draftFilters.minRating === r && styles.chipActive]}
                    onPress={() => setDraftFilters((f) => ({ ...f, minRating: f.minRating === r ? '' : r }))}
                  >
                    <Text style={[styles.chipText, draftFilters.minRating === r && styles.chipTextActive]}>
                      ★ {r}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Authorized dealer */}
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchLabel}>Authorized Dealers Only</Text>
                  <Text style={styles.switchSub}>Show only government-authorized advisors</Text>
                </View>
                <Switch
                  value={draftFilters.dealerOnly}
                  onValueChange={(v) => setDraftFilters((f) => ({ ...f, dealerOnly: v }))}
                  trackColor={{ false: Palette.border, true: Palette.primaryLight }}
                  thumbColor={draftFilters.dealerOnly ? Palette.primary : Palette.textSecondary}
                />
              </View>
            </ScrollView>

            <View style={styles.sheetActions}>
              <Button label="Cancel" onPress={() => setFilterOpen(false)} variant="ghost" style={styles.sheetBtn} />
              <Button label="Apply Filters" onPress={applyFilters} variant="primary" style={styles.sheetBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const AdvisorCard: React.FC<{ advisor: AdvisorSummary; onPress: () => void }> = ({ advisor, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.cardTop}>
      <Avatar uri={advisor.avatarUrl} fallbackName={advisor.fullName} size={56} showBorder />
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{advisor.fullName}</Text>
          {advisor.isAuthorizedDealer && <Badge text="Auth" color="gold" />}
        </View>
        {advisor.businessName ? (
          <Text style={styles.cardBiz} numberOfLines={1}>{advisor.businessName}</Text>
        ) : null}
        <Text style={styles.cardLocation} numberOfLines={1}>📍 {advisor.location}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardFee}>{formatCurrency(advisor.consultationFee)}</Text>
        <Text style={styles.cardFeeLabel}>per session</Text>
      </View>
    </View>

    <View style={styles.cardBottom}>
      <View style={styles.cardMeta}>
        <Text style={styles.cardExp}>{advisor.experienceYears}y exp</Text>
        {advisor.averageRating ? (
          <StarRating score={advisor.averageRating} count={advisor.ratingsCount} size={12} />
        ) : null}
      </View>
      {advisor.categories.length > 0 ? (
        <View style={styles.catRow}>
          {advisor.categories.slice(0, 2).map((c) => (
            <Badge key={c.id} text={c.name} color="indigo" />
          ))}
          {advisor.categories.length > 2 ? (
            <Badge text={`+${advisor.categories.length - 2}`} color="slate" />
          ) : null}
        </View>
      ) : null}
    </View>
  </TouchableOpacity>
);

const AdvisorCardSkeleton: React.FC = () => (
  <View style={[styles.card, { opacity: 0.4 }]}>
    <View style={styles.cardTop}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: Palette.card }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ height: 14, backgroundColor: Palette.card, borderRadius: 4, width: '70%' }} />
        <View style={{ height: 11, backgroundColor: Palette.card, borderRadius: 4, width: '50%' }} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },

  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: Palette.text, fontSize: 14, paddingVertical: Spacing.sm },
  clearText: { color: Palette.textMuted, fontSize: 14, paddingHorizontal: 4 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  filterIcon: { fontSize: 18 },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Palette.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: Palette.card, fontSize: 9, fontWeight: '800' },

  resultCount: { ...Typography.caption, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs },

  list: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  card: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  cardName: { ...Typography.body, fontWeight: '700', flex: 1 },
  cardBiz: { ...Typography.caption, color: Palette.textSecondary },
  cardLocation: { ...Typography.caption },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  cardFee: { color: Palette.primary, fontSize: 15, fontWeight: '800' },
  cardFeeLabel: { ...Typography.caption, fontSize: 9 },
  cardBottom: { gap: Spacing.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardExp: { ...Typography.caption, color: Palette.textSecondary },
  catRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Palette.overlay,
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Palette.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  sheetTitle: { ...Typography.subheading },
  clearAll: { color: Palette.primary, fontSize: 13, fontWeight: '600' },
  sheetContent: { padding: Spacing.lg, gap: Spacing.lg },
  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  sheetBtn: { flex: 1 },

  filterLabel: { ...Typography.label },
  chipRow: { flexDirection: 'row', gap: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.card,
  },
  chipActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  chipText: { fontSize: 12, color: Palette.textSecondary },
  chipTextActive: { color: Palette.primary, fontWeight: '700' },

  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rangeInput: {
    flex: 1,
    backgroundColor: Palette.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    color: Palette.text,
    fontSize: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rangeDash: { color: Palette.textSecondary },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  switchLabel: { ...Typography.body, fontWeight: '600' },
  switchSub: { ...Typography.caption },
});
