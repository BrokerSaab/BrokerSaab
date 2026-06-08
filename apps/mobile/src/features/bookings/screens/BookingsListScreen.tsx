import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { bookingRepository } from '../../../shared/api';
import { EmptyState, StatusBadge, SkeletonLoader } from '../../../shared/components';
import { formatDate, formatTime } from '../../../shared/utils/format';

type Props = NativeStackScreenProps<BookingsStackParamList, 'BookingsList'>;

const TABS = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];

export const BookingsListScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['bookings', activeTab],
    queryFn: () => bookingRepository.list(activeTab === 'ALL' ? undefined : activeTab),
  });

  const bookings = data?.data ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Quick-access shortcuts */}
      <View style={styles.shortcuts}>
        <TouchableOpacity style={styles.shortcutBtn} onPress={() => navigation.navigate('MyQuotes')}>
          <Text style={styles.shortcutText}>📋 Fee Quotes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shortcutBtn, styles.shortcutBtnPurple]} onPress={() => navigation.navigate('MyTickets')}>
          <Text style={[styles.shortcutText, { color: '#A78BFA' }]}>🎫 Work Tickets</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <SkeletonLoader lines={3} />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Palette.primary} />}
          ListEmptyComponent={<EmptyState title="No Bookings" subtitle="Your consultations will appear here" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
            >
              <View style={styles.cardRow}>
                <Text style={styles.bookingNum}>{item.bookingNumber}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={styles.date}>{formatDate(item.scheduledDate)} · {formatTime(item.startTime)}</Text>
              <Text style={styles.fee}>₹{item.totalFee}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  tabActive: { backgroundColor: Palette.primaryLight },
  tabText: { ...Typography.caption, fontSize: 11 },
  tabTextActive: { color: Palette.primary, fontWeight: '700' },
  list: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Palette.card,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
    gap: Spacing.xs,
  },
  shortcuts:       { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, gap: Spacing.sm },
  shortcutBtn:     { flex: 1, backgroundColor: Palette.card, borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Palette.border },
  shortcutBtnPurple: { borderColor: '#7C3AED50', backgroundColor: '#7C3AED15' },
  shortcutText:    { fontSize: 12, fontWeight: '700', color: Palette.primary },
  cardRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingNum: { ...Typography.label },
  date: { ...Typography.caption },
  fee: { ...Typography.body, color: Palette.primary, fontWeight: '700' },
});
