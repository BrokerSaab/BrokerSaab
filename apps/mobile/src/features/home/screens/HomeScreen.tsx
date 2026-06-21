import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { HomeStackParamList } from '../../../shared/navigation/types';
import { Colors, Palette, Spacing, Radius, Shadow } from '../../../shared/theme';
import { useAuthStore } from '../../../shared/store';
import { bookingRepository } from '../../../shared/api';
import { Avatar } from '../../../shared/components';
import { formatRelative } from '../../../shared/utils/format';
import type { Booking } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeScreen'>;

// Service categories mapped to advisor category slugs
const SERVICES = [
  { id: 'm21', icon: '🌍', label: 'Study\nAbroad',         color: '#3F51B5', category: 'study-abroad' },
  { id: 'm22', icon: '🏛️', label: 'Domestic\nAdmission',  color: '#546E7A', category: 'domestic-admission' },
  { id: 'm23', icon: '💼', label: 'Job\nPlacement',         color: '#FFFFFF', textColor: Colors.navy[800], category: 'job-placement' },
  { id: 'm24', icon: '✈️', label: 'Visa & PR',              color: '#D4AF37', textColor: Colors.navy[900], category: 'visa-pr' },
  { id: 'm27', icon: '🩺', label: 'Medical\nRep',           color: '#00897B', category: 'medical-rep' },
  { id: 'm28', icon: '📦', label: 'Local\nDistributor',     color: '#5C6BC0', category: 'local-distributor' },
];

const BOOKING_STATUS_ICON: Record<string, string> = {
  PENDING:   '🕐',
  ACCEPTED:  '✅',
  COMPLETED: '🎉',
  CANCELLED: '❌',
  DISPUTED:  '⚠️',
};

function getProfileCompletion(user: any): number {
  if (!user) return 0;
  const fields = [user.fullName, user.email, user.phoneNumber, user.state, user.avatarUrl];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const profileCompletion = getProfileCompletion(user);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings-recent'],
    queryFn: () => bookingRepository.list(),
    staleTime: 2 * 60 * 1000,
  });

  const recentBookings: Booking[] = (bookingsData?.data ?? []).slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navBrand}>
          <Text style={styles.navIcon}>🏛️</Text>
          <Text style={styles.navTextBroker}>Broker</Text>
          <Text style={styles.navTextSaab}>Saab</Text>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
          <Avatar uri={user?.avatarUrl} fallbackName={user?.fullName} size={36} showBorder />
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting card */}
        <LinearGradient
          colors={['#1E3A8A', '#2563EB', '#3F51B5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingCard}
        >
          <Text style={styles.greetingTitle}>Namaste, {firstName} 👋</Text>
          <Text style={styles.greetingSubtitle}>Let's continue your global journey today.</Text>

          {/* Profile completion */}
          <View style={styles.completionRow}>
            <View style={styles.completionRing}>
              <Text style={styles.completionPct}>{profileCompletion}%</Text>
            </View>
            <View style={styles.completionInfo}>
              <Text style={styles.completionLabel}>Profile Complete</Text>
              <TouchableOpacity>
                <Text style={styles.completionCta}>Complete now →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Our Services */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Our Services</Text>
        </View>
        <View style={styles.servicesGrid}>
          {SERVICES.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.serviceCard, { backgroundColor: s.color }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AdvisorList', { category: s.category })}
            >
              <Text style={styles.serviceCardIcon}>{s.icon}</Text>
              <Text style={[styles.serviceCardLabel, { color: s.textColor ?? Colors.white }]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={[styles.sectionRow, { marginTop: Spacing.lg }]}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('MyCasesTab')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.navy[800]} style={{ marginTop: Spacing.md }} />
        ) : recentBookings.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityIcon}>📋</Text>
            <Text style={styles.emptyActivityText}>No recent activity yet.</Text>
            <Text style={styles.emptyActivitySub}>Book a consultation to get started.</Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {recentBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={[styles.activityCard, { borderLeftColor: Colors.gold[500] }]}
                activeOpacity={0.8}
                onPress={() => (navigation as any).navigate('MyCasesTab', {
                  screen: 'BookingDetail',
                  params: { bookingId: booking.id },
                })}
              >
                <View style={styles.activityIconWrap}>
                  <Text style={styles.activityIcon}>
                    {BOOKING_STATUS_ICON[booking.status] ?? '📅'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    Booking #{booking.bookingNumber}
                  </Text>
                  <Text style={styles.activityDesc}>
                    ₹{booking.totalFee} · {booking.mode?.replace('_', ' ')}
                  </Text>
                  <View style={styles.activityFooter}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: booking.status === 'ACCEPTED' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)' },
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: booking.status === 'ACCEPTED' ? Colors.emerald[600] : Colors.indigo[600] },
                      ]}>
                        {booking.status}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>{formatRelative(booking.createdAt)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  body: { flex: 1, backgroundColor: Palette.background },
  container: { paddingBottom: Spacing.xxl },

  navbar: {
    backgroundColor: Colors.navy[800],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navIcon: { fontSize: 22 },
  navTextBroker: { fontSize: 20, fontWeight: '900', color: Colors.white },
  navTextSaab: { fontSize: 20, fontWeight: '900', color: Colors.gold[400] },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bellBtn: { padding: 4 },
  bellIcon: { fontSize: 22 },

  greetingCard: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md, ...Shadow.md,
  },
  greetingTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },
  greetingSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 18 },
  completionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg, padding: Spacing.md,
  },
  completionRing: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 4, borderColor: Colors.gold[400],
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  completionPct: { fontSize: 15, fontWeight: '800', color: Colors.gold[300] },
  completionInfo: { gap: 4 },
  completionLabel: { fontSize: 14, fontWeight: '700', color: Colors.white },
  completionCta: { fontSize: 13, color: Colors.gold[300], fontWeight: '600' },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.navy[800] },
  viewAllText: { fontSize: 13, color: Colors.indigo[600], fontWeight: '600' },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  serviceCard: {
    width: '47.5%', borderRadius: Radius.xl,
    paddingVertical: Spacing.xl, paddingHorizontal: Spacing.md,
    gap: Spacing.sm, ...Shadow.sm,
  },
  serviceCardIcon: { fontSize: 28 },
  serviceCardLabel: { fontSize: 17, fontWeight: '800', lineHeight: 22 },

  emptyActivity: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    gap: Spacing.sm, paddingHorizontal: Spacing.lg,
  },
  emptyActivityIcon: { fontSize: 36 },
  emptyActivityText: { fontSize: 16, fontWeight: '700', color: Colors.navy[800] },
  emptyActivitySub: { fontSize: 13, color: Colors.slate[500], textAlign: 'center' },

  activityList: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  activityCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.slate[200], borderLeftWidth: 3,
    flexDirection: 'row', padding: Spacing.md, gap: Spacing.md, ...Shadow.sm,
  },
  activityIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.slate[100], alignItems: 'center', justifyContent: 'center',
  },
  activityIcon: { fontSize: 18 },
  activityContent: { flex: 1, gap: 4 },
  activityTitle: { fontSize: 14, fontWeight: '700', color: Colors.navy[800] },
  activityDesc: { fontSize: 12, color: Colors.slate[500], lineHeight: 17 },
  activityFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  activityTime: { fontSize: 11, color: Colors.slate[400] },
});
