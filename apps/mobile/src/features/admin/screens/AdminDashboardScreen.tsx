import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { adminRepository } from '../../../shared/api';
import { SkeletonLoader } from '../../../shared/components';
import { formatCurrency } from '../../../shared/utils/format';

export const AdminDashboardScreen: React.FC = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminRepository.getDashboard(),
  });

  const stats = data?.data?.stats;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Palette.primary} />}
      >
        <Text style={styles.title}>Dashboard</Text>

        {isLoading ? (
          <SkeletonLoader lines={4} />
        ) : stats ? (
          <View style={styles.grid}>
            <StatCard label="Total Advisors" value={String(stats.totalAdvisors)} />
            <StatCard label="Pending KYC" value={String(stats.pendingAdvisors)} color="#fbbf24" />
            <StatCard label="Approved" value={String(stats.approvedAdvisors)} color="#34d399" />
            <StatCard label="Clients" value={String(stats.totalClients)} />
            <StatCard label="Bookings" value={String(stats.totalBookings)} />
            <StatCard label="Revenue" value={formatCurrency(stats.revenue)} color={Palette.primary} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = '#e2e8f0' }) => (
  <View style={styles.stat}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  title: { ...Typography.heading },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  stat: {
    width: '47%',
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { ...Typography.label, color: Palette.textMuted },
});
