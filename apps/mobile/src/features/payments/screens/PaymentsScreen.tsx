import React, { useState } from 'react';
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
import { PaymentsStackParamList } from '../../../shared/navigation/types';
import { Colors, Palette, Spacing, Radius, Shadow } from '../../../shared/theme';
import { bookingRepository } from '../../../shared/api';
import { ticketRepository } from '../../../shared/api/repositories/ticketRepository';
import { formatDate } from '../../../shared/utils/format';
import type { Booking } from '@brokersaab/shared-types';
import type { ServiceTicket } from '../../../shared/api/repositories/ticketRepository';

type Props = NativeStackScreenProps<PaymentsStackParamList, 'PaymentsScreen'>;

type PaymentMethod = 'upi' | 'card' | 'netbanking';

const PAYMENT_METHODS = [
  { id: 'upi'        as PaymentMethod, icon: '📱', label: 'UPI',               sub: 'GPay, PhonePe, Paytm' },
  { id: 'card'       as PaymentMethod, icon: '💳', label: 'Credit/Debit Card',  sub: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking' as PaymentMethod, icon: '🏛️', label: 'Net Banking',        sub: 'All major Indian banks' },
];

const TICKET_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  OPEN:              { color: Colors.indigo[600],  bg: 'rgba(79,70,229,0.1)' },
  IN_PROGRESS:       { color: Colors.gold[600],    bg: 'rgba(212,175,55,0.12)' },
  AWAITING_CONFIRM:  { color: Colors.amber[500],   bg: 'rgba(251,191,36,0.12)' },
  PAYOUT_RELEASED:   { color: Colors.emerald[600], bg: 'rgba(16,185,129,0.1)' },
  CLOSED:            { color: Colors.emerald[600], bg: 'rgba(16,185,129,0.1)' },
  DISPUTED:          { color: Colors.red[500],     bg: 'rgba(239,68,68,0.1)' },
};

const BOOKING_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  COMPLETED: { color: Colors.emerald[600], bg: 'rgba(16,185,129,0.1)' },
  ACCEPTED:  { color: Colors.indigo[600],  bg: 'rgba(79,70,229,0.1)' },
  PENDING:   { color: Colors.gold[600],    bg: 'rgba(212,175,55,0.12)' },
  CANCELLED: { color: Colors.red[500],     bg: 'rgba(239,68,68,0.1)' },
};

export const PaymentsScreen: React.FC<Props> = () => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings-payments'],
    queryFn: () => bookingRepository.list(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets-payments'],
    queryFn: () => ticketRepository.list(),
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = bookingsLoading || ticketsLoading;
  const bookings: Booking[] = bookingsData?.data ?? [];
  const tickets: ServiceTicket[] = ticketsData?.data ?? [];

  const completedFee = bookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (Number(b.totalFee) || 0), 0);

  const ticketTotal = tickets
    .reduce((sum, t) => sum + (parseFloat(t.totalAmount) || 0), 0);

  const ticketPaid = tickets
    .filter((t) => t.status === 'PAYOUT_RELEASED' || t.status === 'CLOSED')
    .reduce((sum, t) => sum + (parseFloat(t.totalAmount) || 0), 0);

  const totalPaid   = completedFee + ticketPaid;
  const totalAmount = completedFee + ticketTotal;
  const balanceDue  = Math.max(0, ticketTotal - ticketPaid);

  const formatAmount = (n: number) =>
    '₹' + n.toLocaleString('en-IN');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Gold gradient header */}
      <LinearGradient
        colors={['#D4AF37', '#B48C22', '#D4AF37']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Payments</Text>
        <Text style={styles.headerHindi}>भुगतान</Text>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={Colors.navy[800]} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Fee Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fee Summary</Text>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>TOTAL FEE</Text>
              <Text style={styles.feeValueLarge}>{formatAmount(totalAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>PAID</Text>
              <Text style={[styles.feeValue, { color: Colors.emerald[600] }]}>{formatAmount(totalPaid)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>BALANCE DUE</Text>
              <Text style={[styles.feeValue, { color: Colors.navy[800] }]}>{formatAmount(balanceDue)}</Text>
            </View>

            {balanceDue > 0 && (
              <LinearGradient
                colors={['#FFE082', '#D4AF37', '#B48C22']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.payBtnGradient}
              >
                <TouchableOpacity style={styles.payBtnInner} activeOpacity={0.85}>
                  <Text style={styles.payBtnIcon}>💳</Text>
                  <Text style={styles.payBtnText}>Pay Now</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}
          </View>

          {/* Payment Method */}
          {balanceDue > 0 && (
            <>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              <View style={styles.card}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.methodRow, paymentMethod === m.id && styles.methodRowActive]}
                    onPress={() => setPaymentMethod(m.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.methodIcon}>{m.icon}</Text>
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodLabel}>{m.label}</Text>
                      <Text style={styles.methodSub}>{m.sub}</Text>
                    </View>
                    <View style={[styles.radio, paymentMethod === m.id && styles.radioActive]}>
                      {paymentMethod === m.id && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Active Tickets / Fee Breakdown */}
          {tickets.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Fee Breakdown (Work Tickets)</Text>
              <View style={styles.breakdownList}>
                {tickets.map((ticket) => {
                  const cfg = TICKET_STATUS_COLOR[ticket.status] ?? TICKET_STATUS_COLOR.OPEN;
                  const confirmedStages = ticket.stages.filter((s) => s.status === 'CONFIRMED').length;
                  return (
                    <View key={ticket.id} style={styles.breakdownCard}>
                      <View style={styles.breakdownTop}>
                        <Text style={styles.breakdownTitle} numberOfLines={2}>
                          {ticket.advisor.fullName} · #{ticket.ticketNumber}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.statusText, { color: cfg.color }]}>{ticket.status.replace('_', ' ')}</Text>
                        </View>
                      </View>
                      <Text style={styles.breakdownNote}>
                        {confirmedStages}/{ticket.stages.length} stages confirmed · Escrow protected
                      </Text>
                      <Text style={[styles.breakdownAmount, { color: cfg.color }]}>
                        ₹{parseFloat(ticket.totalAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Transaction History (Bookings) */}
          {bookings.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <View style={styles.card}>
                {bookings.slice(0, 5).map((booking, idx) => {
                  const cfg = BOOKING_STATUS_COLOR[booking.status] ?? BOOKING_STATUS_COLOR.PENDING;
                  return (
                    <View key={booking.id}>
                      <View style={styles.txnRow}>
                        <View style={styles.txnIconWrap}>
                          <Text style={styles.txnIcon}>📋</Text>
                        </View>
                        <View style={styles.txnInfo}>
                          <Text style={styles.txnTitle}>#{booking.bookingNumber}</Text>
                          <Text style={styles.txnMeta}>{formatDate(booking.scheduledDate)}</Text>
                        </View>
                        <View style={styles.txnRight}>
                          <Text style={styles.txnAmount}>₹{Number(booking.totalFee).toLocaleString('en-IN')}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                            <Text style={[styles.statusText, { color: cfg.color }]}>{booking.status}</Text>
                          </View>
                        </View>
                      </View>
                      {idx < Math.min(bookings.length, 5) - 1 && <View style={styles.divider} />}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {bookings.length === 0 && tickets.length === 0 && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>No payments yet</Text>
              <Text style={styles.emptySub}>Your transaction history will appear here once you book a consultation or start a work ticket.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gold[500] },
  body: { flex: 1, backgroundColor: Palette.background },
  container: { paddingBottom: Spacing.xxl },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.background },

  header: { paddingTop: Spacing.sm, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.lg, gap: 4 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.navy[900] },
  headerHindi: { fontSize: 14, color: Colors.navy[800], fontWeight: '500' },

  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    padding: Spacing.lg, gap: Spacing.md, ...Shadow.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.navy[800] },

  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 11, fontWeight: '700', color: Colors.slate[500], letterSpacing: 0.8, textTransform: 'uppercase' },
  feeValueLarge: { fontSize: 26, fontWeight: '900', color: Colors.navy[800] },
  feeValue: { fontSize: 22, fontWeight: '800' },
  divider: { height: 1, backgroundColor: Colors.slate[100] },

  payBtnGradient: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  payBtnInner: { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnIcon: { fontSize: 18 },
  payBtnText: { fontSize: 16, fontWeight: '800', color: Colors.navy[900] },

  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: Colors.navy[800],
    paddingHorizontal: Spacing.lg, marginBottom: -Spacing.sm, marginTop: Spacing.sm,
  },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.slate[200], paddingHorizontal: Spacing.md,
  },
  methodRowActive: { borderColor: Colors.navy[800] },
  methodIcon: { fontSize: 20 },
  methodInfo: { flex: 1, gap: 2 },
  methodLabel: { fontSize: 14, fontWeight: '700', color: Colors.navy[800] },
  methodSub: { fontSize: 11, color: Colors.slate[500] },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.slate[300],
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.navy[800] },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.navy[800] },

  breakdownList: { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.sm },
  breakdownCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, gap: 6,
    borderWidth: 1, borderColor: Colors.slate[200], ...Shadow.sm,
  },
  breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  breakdownTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.navy[800], lineHeight: 18 },
  breakdownNote: { fontSize: 11, color: Colors.slate[500] },
  breakdownAmount: { fontSize: 18, fontWeight: '800' },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, flexShrink: 0 },
  statusText: { fontSize: 11, fontWeight: '700' },

  txnRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  txnIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.slate[100], alignItems: 'center', justifyContent: 'center',
  },
  txnIcon: { fontSize: 18 },
  txnInfo: { flex: 1, gap: 3 },
  txnTitle: { fontSize: 13, fontWeight: '700', color: Colors.navy[800] },
  txnMeta: { fontSize: 11, color: Colors.slate[500] },
  txnRight: { alignItems: 'flex-end', gap: 4 },
  txnAmount: { fontSize: 14, fontWeight: '800', color: Colors.navy[800] },

  emptyWrap: { alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '800', color: Colors.navy[800] },
  emptySub: { fontSize: 13, color: Colors.slate[500], textAlign: 'center', lineHeight: 20 },
});
