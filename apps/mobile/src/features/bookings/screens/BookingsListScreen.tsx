import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Colors, Palette, Spacing, Radius, Shadow } from '../../../shared/theme';
import { bookingRepository } from '../../../shared/api';
import { EmptyState, StatusBadge, SkeletonLoader, Avatar } from '../../../shared/components';
import { formatDate, formatTime } from '../../../shared/utils/format';
import { useAuthStore } from '../../../shared/store';

type Props = NativeStackScreenProps<BookingsStackParamList, 'BookingsList'>;

const BOOKING_TABS = ['All', 'Pending', 'Accepted', 'Completed', 'Cancelled'];
const SECTION_TABS = ['Bookings', 'Quotes', 'Tickets'];

export const BookingsListScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const [sectionTab, setSectionTab] = useState('Bookings');
  const [bookingStatus, setBookingStatus] = useState('All');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['bookings', bookingStatus],
    queryFn: () =>
      bookingRepository.list(bookingStatus === 'All' ? undefined : bookingStatus.toUpperCase()),
    enabled: sectionTab === 'Bookings',
  });

  const bookings = data?.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Greeting header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>Namaste, {firstName} 👋</Text>
          <Text style={styles.headerSub}>Track your consultations & cases</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
          <Avatar uri={user?.avatarUrl} fallbackName={user?.fullName} size={36} showBorder />
        </View>
      </View>

      {/* Section switcher */}
      <View style={styles.sectionBar}>
        {SECTION_TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.sectionTab, sectionTab === t && styles.sectionTabActive]}
            onPress={() => setSectionTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTabText, sectionTab === t && styles.sectionTabTextActive]}>
              {t === 'Bookings' ? '📅 ' : t === 'Quotes' ? '📋 ' : '🎫 '}
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Bookings panel ── */}
      {sectionTab === 'Bookings' && (
        <>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusTabRow}
          >
            {BOOKING_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.statusTab, bookingStatus === tab && styles.statusTabActive]}
                onPress={() => setBookingStatus(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.statusTabText, bookingStatus === tab && styles.statusTabTextActive]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoading ? (
            <SkeletonLoader lines={4} />
          ) : (
            <FlatList
              data={bookings}
              keyExtractor={(b) => b.id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor={Colors.navy[800]}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  title="No Bookings"
                  subtitle="Your booked consultations will appear here"
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.bookingCard}
                  onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.bookingCardTop}>
                    <View style={styles.bookingIdWrap}>
                      <Text style={styles.bookingNum}>{item.bookingNumber}</Text>
                      <Text style={styles.bookingDate}>
                        {formatDate(item.scheduledDate)} · {formatTime(item.startTime)}
                      </Text>
                    </View>
                    <StatusBadge status={item.status} />
                  </View>
                  <View style={styles.bookingCardBottom}>
                    <Text style={styles.bookingFee}>₹{item.totalFee}</Text>
                    <Text style={styles.viewDetail}>View Details →</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* ── Quotes panel ── */}
      {sectionTab === 'Quotes' && (
        <View style={styles.panelCta}>
          <View style={styles.panelCtaIcon}>
            <Text style={{ fontSize: 36 }}>📋</Text>
          </View>
          <Text style={styles.panelCtaTitle}>Fee Quotes</Text>
          <Text style={styles.panelCtaDesc}>
            View fee quotes sent by advisors or request a custom quote from any advisor.
          </Text>
          <TouchableOpacity
            style={styles.panelBtn}
            onPress={() => navigation.navigate('MyQuotes')}
            activeOpacity={0.85}
          >
            <Text style={styles.panelBtnText}>View My Quotes →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Tickets panel ── */}
      {sectionTab === 'Tickets' && (
        <View style={styles.panelCta}>
          <View style={styles.panelCtaIcon}>
            <Text style={{ fontSize: 36 }}>🎫</Text>
          </View>
          <Text style={styles.panelCtaTitle}>Work Tickets</Text>
          <Text style={styles.panelCtaDesc}>
            Track the status of ongoing work, document submissions, and advisor updates in real time.
          </Text>
          <TouchableOpacity
            style={[styles.panelBtn, styles.panelBtnPurple]}
            onPress={() => navigation.navigate('MyTickets')}
            activeOpacity={0.85}
          >
            <Text style={[styles.panelBtnText, { color: Colors.white }]}>View My Tickets →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },

  header: {
    backgroundColor: Colors.navy[800],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg,
  },
  headerLeft: { flex: 1, gap: 3 },
  headerGreeting: { fontSize: 20, fontWeight: '900', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '400' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bellBtn: { padding: 4 },
  bellIcon: { fontSize: 22 },

  // Section switcher
  sectionBar: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.slate[200],
  },
  sectionTab: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  sectionTabActive: { borderBottomColor: Colors.navy[800] },
  sectionTabText: { fontSize: 12, fontWeight: '600', color: Colors.slate[400] },
  sectionTabTextActive: { color: Colors.navy[800], fontWeight: '800' },

  // Booking status tabs
  statusTabRow: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.slate[200],
  },
  statusTab: {
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 5,
    borderRadius: Radius.full, backgroundColor: Colors.slate[100],
  },
  statusTabActive: { backgroundColor: Colors.navy[800] },
  statusTabText: { fontSize: 11, fontWeight: '600', color: Colors.slate[500] },
  statusTabTextActive: { color: Colors.white, fontWeight: '700' },

  list: {
    padding: Spacing.md, gap: Spacing.md,
    backgroundColor: Palette.background, flexGrow: 1,
  },

  // Booking card
  bookingCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.slate[200],
    padding: Spacing.md, gap: Spacing.sm, ...Shadow.sm,
  },
  bookingCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookingIdWrap: { flex: 1, gap: 2 },
  bookingNum: { fontSize: 13, fontWeight: '800', color: Colors.navy[800] },
  bookingDate: { fontSize: 11, color: Colors.slate[400] },
  bookingCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingFee: { fontSize: 15, fontWeight: '800', color: Colors.gold[700] },
  viewDetail: { fontSize: 11, color: Colors.indigo[600], fontWeight: '600' },

  // Panel CTA (Quotes + Tickets)
  panelCta: {
    flex: 1, backgroundColor: Palette.background,
    padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
  },
  panelCtaIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.slate[200],
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  panelCtaTitle: { fontSize: 22, fontWeight: '900', color: Colors.navy[800] },
  panelCtaDesc: {
    fontSize: 13, color: Colors.slate[500], lineHeight: 20,
    textAlign: 'center', maxWidth: 280,
  },
  panelBtn: {
    backgroundColor: Colors.gold[500], borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm,
  },
  panelBtnPurple: { backgroundColor: Colors.indigo[600] },
  panelBtnText: { fontSize: 14, fontWeight: '800', color: Colors.navy[900] },
});
