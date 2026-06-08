import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { bookingRepository, ticketRepository } from '../../../shared/api';
import { SkeletonLoader, StatusBadge } from '../../../shared/components';
import { useAuthStore } from '../../../shared/store';
import { BookingStatus } from '@brokersaab/shared-types';
import { AdvisorDashboardStackParamList } from '../../../shared/navigation/types';
import type { ServiceTicket } from '../../../shared/api';

type Props = NativeStackScreenProps<AdvisorDashboardStackParamList, 'AdvisorDashboard'>;

const TICKET_STATUS: Record<string, { label: string; color: string }> = {
  OPEN:             { label: 'Open',           color: '#3B82F6' },
  IN_PROGRESS:      { label: 'In Progress',    color: '#D97706' },
  AWAITING_CONFIRM: { label: 'Needs Confirm',  color: '#7C3AED' },
  DISPUTED:         { label: 'Disputed',       color: '#DC2626' },
  CLOSED:           { label: 'Closed',         color: '#6B7280' },
  PAYOUT_RELEASED:  { label: 'Paid Out',       color: '#059669' },
};

export const AdvisorDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings, isRefetching: bookingsRefreshing } = useQuery({
    queryKey: ['advisor-bookings'],
    queryFn: () => bookingRepository.list(),
  });

  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['myTickets'],
    queryFn: ticketRepository.list,
  });

  const { data: clientsData, isLoading: clientsLoading, refetch: refetchClients } = useQuery({
    queryKey: ['connected-clients'],
    queryFn: ticketRepository.getConnectedClients,
  });

  const bookings = bookingsData?.data ?? [];
  const tickets: ServiceTicket[] = ticketsData?.data ?? [];
  const clients: any[] = clientsData?.data ?? [];

  const pending   = bookings.filter((b: any) => b.status === BookingStatus.PENDING).length;
  const accepted  = bookings.filter((b: any) => b.status === BookingStatus.ACCEPTED).length;
  const completed = bookings.filter((b: any) => b.status === BookingStatus.COMPLETED).length;

  const activeTickets   = tickets.filter(t => !['CLOSED', 'PAYOUT_RELEASED'].includes(t.status));
  const needingConfirm  = tickets.filter(t => t.status === 'AWAITING_CONFIRM');

  const handleRefresh = () => {
    refetchBookings();
    refetchTickets();
    refetchClients();
  };

  const isRefreshing = bookingsRefreshing;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.container}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Palette.primary} />}
      >
        <Text style={s.greeting}>
          Welcome back, {user?.fullName?.split(' ')[0] ?? 'Advisor'}
        </Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <StatCard label="Pending"   value={pending}   color={Palette.primary} />
          <StatCard label="Accepted"  value={accepted}  color="#818cf8" />
          <StatCard label="Completed" value={completed} color="#34d399" />
        </View>

        {/* Needs confirm alert */}
        {needingConfirm.length > 0 && (
          <TouchableOpacity
            style={s.alertBanner}
            onPress={() => navigation.navigate('TicketDetail', { ticketId: needingConfirm[0].id })}
          >
            <Text style={s.alertText}>
              ⏳ {needingConfirm.length} ticket{needingConfirm.length > 1 ? 's' : ''} awaiting client stage confirmation
            </Text>
          </TouchableOpacity>
        )}

        {/* Work Tickets Section */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>WORK TICKETS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MyTickets')}>
            <Text style={s.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {ticketsLoading ? (
          <SkeletonLoader lines={2} />
        ) : activeTickets.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No active work tickets</Text>
          </View>
        ) : (
          activeTickets.slice(0, 5).map(ticket => {
            const info = TICKET_STATUS[ticket.status] ?? { label: ticket.status, color: '#6B7280' };
            const confirmed = ticket.stages.filter(st => st.status === 'CONFIRMED').length;
            return (
              <TouchableOpacity
                key={ticket.id}
                style={[s.ticketCard, ticket.status === 'AWAITING_CONFIRM' && s.ticketCardAlert]}
                onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })}
              >
                <View style={s.row}>
                  <View style={s.flex1}>
                    <Text style={s.ticketNum}>{ticket.ticketNumber}</Text>
                    <Text style={s.ticketClient}>{ticket.client.fullName}</Text>
                    <Text style={s.ticketMeta}>
                      ₹{Number(ticket.totalAmount).toLocaleString('en-IN')}
                      {ticket.stages.length > 0 && ` · ${confirmed}/${ticket.stages.length} stages`}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: info.color + '22', borderColor: info.color + '55' }]}>
                    <Text style={[s.badgeText, { color: info.color }]}>{info.label}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Connected Clients Section */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>CONNECTED CLIENTS</Text>
          <Text style={s.sectionSub}>Send quotes to clients who unlocked you</Text>
        </View>

        {clientsLoading ? (
          <SkeletonLoader lines={2} />
        ) : clients.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No clients have unlocked your contact yet</Text>
          </View>
        ) : (
          clients.map((client: any) => (
            <View key={client.id} style={s.clientCard}>
              <View style={s.flex1}>
                <Text style={s.clientName}>{client.fullName}</Text>
                {client.openQuoteStatus && (
                  <View style={s.openQuoteBadge}>
                    <Text style={s.openQuoteText}>Quote: {client.openQuoteStatus}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={[s.sendQuoteBtn, client.openQuoteStatus && s.sendQuoteBtnDisabled]}
                disabled={!!client.openQuoteStatus}
                onPress={() => navigation.navigate('QuoteRequests')}
              >
                <Text style={s.sendQuoteText}>
                  {client.openQuoteStatus ? 'Quote Sent' : 'Send Quote'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Recent Bookings */}
        <Text style={[s.sectionTitle, { marginTop: Spacing.lg }]}>RECENT BOOKINGS</Text>
        {bookingsLoading ? (
          <SkeletonLoader lines={4} />
        ) : bookings.slice(0, 10).map((b: any) => (
          <TouchableOpacity
            key={b.id}
            style={s.bookingCard}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
          >
            <Text style={s.bookingNum}>{b.bookingNumber}</Text>
            <StatusBadge status={b.status} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <View style={s.stat}>
    <Text style={[s.statValue, { color }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Palette.background },
  container:          { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40 },
  greeting:           { ...Typography.heading },
  statsRow:           { flexDirection: 'row', gap: Spacing.sm },
  stat:               { flex: 1, backgroundColor: Palette.card, borderRadius: 12, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Palette.border, gap: 4 },
  statValue:          { fontSize: 28, fontWeight: '800' },
  statLabel:          { ...Typography.label, color: Palette.textMuted },
  alertBanner:        { backgroundColor: '#7C3AED20', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#7C3AED50' },
  alertText:          { color: '#A78BFA', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle:       { ...Typography.label },
  sectionSub:         { ...Typography.caption, color: Palette.textMuted },
  sectionLink:        { fontSize: 12, color: Palette.primary, fontWeight: '700' },
  emptyBox:           { backgroundColor: Palette.card, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Palette.border },
  emptyText:          { ...Typography.caption, color: Palette.textMuted },
  ticketCard:         { backgroundColor: Palette.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Palette.border },
  ticketCardAlert:    { borderColor: '#7C3AED55', backgroundColor: '#7C3AED0A' },
  row:                { flexDirection: 'row', alignItems: 'center' },
  flex1:              { flex: 1, marginRight: Spacing.sm },
  ticketNum:          { fontSize: 10, color: Palette.textMuted, fontFamily: 'monospace' },
  ticketClient:       { ...Typography.body, fontWeight: '700', color: Palette.text, marginTop: 2 },
  ticketMeta:         { ...Typography.caption, color: Palette.textSecondary, marginTop: 2 },
  badge:              { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText:          { fontSize: 9, fontWeight: '700' },
  clientCard:         { backgroundColor: Palette.card, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Palette.border },
  clientName:         { ...Typography.body, fontWeight: '700', color: Palette.text },
  openQuoteBadge:     { marginTop: 3 },
  openQuoteText:      { fontSize: 10, color: Palette.textMuted, fontWeight: '600' },
  sendQuoteBtn:       { backgroundColor: Palette.primary, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  sendQuoteBtnDisabled: { backgroundColor: Palette.card, borderWidth: 1, borderColor: Palette.border },
  sendQuoteText:      { color: '#0B1F3A', fontWeight: '800', fontSize: 12 },
  bookingCard:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Palette.card, borderRadius: 10, padding: Spacing.md, borderWidth: 1, borderColor: Palette.border },
  bookingNum:         { ...Typography.body, fontWeight: '600' },
});
