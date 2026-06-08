import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { ticketRepository, ServiceTicket } from '../../../shared/api';
import { EmptyState, SkeletonLoader } from '../../../shared/components';

// This screen can be used for both CLIENT (BookingsStack) and ADVISOR (AdvisorStack)
// Navigation param is generic — pass it from parent stack
type Props = { navigation: any };

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN:             { label: 'Open',              color: '#3B82F6' },
  IN_PROGRESS:      { label: 'In Progress',       color: '#D97706' },
  AWAITING_CONFIRM: { label: 'Confirm Needed',    color: '#7C3AED' },
  DISPUTED:         { label: 'Disputed',          color: '#DC2626' },
  CLOSED:           { label: 'Closed',            color: '#6B7280' },
  PAYOUT_RELEASED:  { label: 'Completed & Paid',  color: '#059669' },
};

export const MyTicketsScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myTickets'],
    queryFn:  ticketRepository.list,
  });

  const tickets: ServiceTicket[] = data?.data ?? [];
  const activeTickets = tickets.filter(t => t.status === 'AWAITING_CONFIRM');

  return (
    <SafeAreaView style={s.safe}>
      {activeTickets.length > 0 && (
        <TouchableOpacity
          style={s.banner}
          onPress={() => navigation.navigate('TicketDetail', { ticketId: activeTickets[0].id })}>
          <Text style={s.bannerText}>
            ⏳ {activeTickets.length} stage{activeTickets.length > 1 ? 's' : ''} need{activeTickets.length === 1 ? 's' : ''} your confirmation
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <SkeletonLoader lines={4} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={t => t.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Palette.primary} />}
          ListEmptyComponent={
            <EmptyState
              title="No Work Tickets"
              subtitle="Tickets are created when you pay for a quoted service"
            />
          }
          renderItem={({ item }) => {
            const info       = STATUS_MAP[item.status] ?? { label: item.status, color: '#6B7280' };
            const needsAction = item.status === 'AWAITING_CONFIRM';
            const confirmed  = item.stages.filter(s => s.status === 'CONFIRMED').length;
            return (
              <TouchableOpacity
                style={[s.card, needsAction && s.cardAlert]}
                onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
              >
                <View style={s.row}>
                  <View style={s.flex1}>
                    <Text style={s.num}>{item.ticketNumber}</Text>
                    <Text style={s.name}>
                      {item.advisor?.fullName ?? item.client?.fullName}
                    </Text>
                    <Text style={s.meta}>
                      ₹{Number(item.totalAmount).toLocaleString('en-IN')}
                      {item.stages.length > 0 && ` · ${confirmed}/${item.stages.length} stages`}
                      {item.quote.categorySlug && ` · ${item.quote.categorySlug.toUpperCase()}`}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: info.color + '20', borderColor: info.color + '50' }]}>
                    <Text style={[s.badgeTxt, { color: info.color }]}>{info.label}</Text>
                  </View>
                </View>
                {needsAction && (
                  <View style={s.alertBar}>
                    <Text style={s.alertTxt}>Tap to confirm stage completion →</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Palette.background },
  banner:    { backgroundColor: '#7C3AED', paddingVertical: 12, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  bannerText:{ color: '#fff', fontWeight: '800', fontSize: 13 },
  list:      { padding: Spacing.md },
  card:      { backgroundColor: Palette.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Palette.border },
  cardAlert: { borderColor: '#7C3AED', backgroundColor: '#7C3AED0A' },
  row:       { flexDirection: 'row', alignItems: 'flex-start' },
  flex1:     { flex: 1, marginRight: Spacing.sm },
  num:       { ...Typography.caption, color: Palette.textSecondary, fontFamily: 'monospace' },
  name:      { ...Typography.body, color: Palette.text, fontWeight: '700', marginTop: 2 },
  meta:      { ...Typography.caption, color: Palette.textSecondary, marginTop: 2 },
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, borderWidth: 1, alignSelf: 'flex-start' },
  badgeTxt:  { fontSize: 9, fontWeight: '700' },
  alertBar:  { marginTop: Spacing.sm, backgroundColor: '#7C3AED20', borderRadius: Radius.sm, paddingVertical: 6, paddingHorizontal: 10 },
  alertTxt:  { color: '#7C3AED', fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
