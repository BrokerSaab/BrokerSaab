import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { bookingRepository } from '../../../shared/api';
import { StatusBadge, Button } from '../../../shared/components';
import { formatDate, formatTime, formatCurrency } from '../../../shared/utils/format';
import { BookingStatus } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<BookingsStackParamList, 'BookingDetail'>;

export const BookingDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { data, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingRepository.getById(bookingId),
  });

  const booking = data?.data;

  if (isLoading || !booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}><ActivityIndicator color={Palette.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.row}>
          <Text style={styles.bookingNum}>{booking.bookingNumber}</Text>
          <StatusBadge status={booking.status} />
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="Date" value={formatDate(booking.scheduledDate)} />
          <InfoRow label="Time" value={`${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`} />
          <InfoRow label="Mode" value={booking.mode} />
          <InfoRow label="Fee" value={formatCurrency(booking.totalFee)} highlight />
        </View>

        {booking.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            <Text style={styles.notes}>{booking.notes}</Text>
          </View>
        ) : null}

        {booking.chatRoom && booking.status === BookingStatus.ACCEPTED ? (
          <Button
            label="Open Chat"
            onPress={() => navigation.navigate('Chat', { bookingId, otherName: undefined })}
            variant="outline"
            fullWidth
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && styles.infoHighlight]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingNum: { ...Typography.subheading },
  infoCard: {
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { ...Typography.caption },
  infoValue: { ...Typography.body, fontWeight: '500' },
  infoHighlight: { color: Palette.primary, fontWeight: '700' },
  section: { gap: Spacing.xs },
  sectionTitle: { ...Typography.label },
  notes: { ...Typography.body, lineHeight: 20 },
});
