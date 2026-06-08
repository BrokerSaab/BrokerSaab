import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { AdvisorDashboardStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { quoteRepository, FeeQuote } from '../../../shared/api';
import { EmptyState, SkeletonLoader } from '../../../shared/components';

type Props = NativeStackScreenProps<AdvisorDashboardStackParamList, 'QuoteRequests'>;

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: '#D97706',
  QUOTED:    '#4F46E5',
  VIEWED:    '#2563EB',
  ACCEPTED:  '#059669',
  CANCELLED: '#DC2626',
};

export const QuoteRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['advisorQuotes'],
    queryFn: quoteRepository.list,
  });

  const requests: FeeQuote[] = data?.data ?? [];

  return (
    <SafeAreaView style={s.safe}>
      {isLoading ? (
        <SkeletonLoader lines={3} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(q) => q.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Palette.primary} />}
          ListEmptyComponent={
            <EmptyState
              title="No Quote Requests"
              subtitle="Clients can ask you for a fee breakdown from your profile"
            />
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.row}>
                <View style={s.flex1}>
                  <Text style={s.name}>{item.client.fullName}</Text>
                  <Text style={s.meta}>
                    {item.categorySlug ? item.categorySlug.toUpperCase() : 'General'}{' '}
                    · {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                  {item.clientMessage ? (
                    <Text style={s.msg} numberOfLines={2}>{item.clientMessage}</Text>
                  ) : null}
                </View>
                <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '20', borderColor: STATUS_COLOR[item.status] + '60' }]}>
                  <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
                </View>
              </View>
              {item.status === 'REQUESTED' && (
                <TouchableOpacity style={s.respondBtn}
                  onPress={() => navigation.navigate('SubmitQuote', { quoteId: item.id, clientName: item.client.fullName })}>
                  <Text style={s.respondBtnText}>Respond with Quote</Text>
                </TouchableOpacity>
              )}
              {(item.status === 'QUOTED' || item.status === 'VIEWED') && (
                <View style={s.editRow}>
                  {item.status === 'VIEWED' && (
                    <View style={s.seenBadge}>
                      <Text style={s.seenText}>👁 Seen by client</Text>
                    </View>
                  )}
                  <TouchableOpacity style={s.editBtn}
                    onPress={() => navigation.navigate('SubmitQuote', {
                      quoteId: item.id,
                      clientName: item.client.fullName,
                      isEdit: true,
                      existingLineItems: item.lineItems.map(li => ({ description: li.description, amount: li.amount })),
                      existingNote: item.advisorNote,
                    })}>
                    <Text style={s.editBtnText}>Edit Quote</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  list: { padding: Spacing.md },
  card: { backgroundColor: Palette.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Palette.border },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  flex1: { flex: 1, marginRight: Spacing.sm },
  name: { ...Typography.body, color: Palette.text, fontWeight: '700' },
  meta: { ...Typography.caption, color: Palette.textSecondary, marginTop: 2 },
  msg: { ...Typography.caption, color: Palette.textSecondary, marginTop: 4, fontStyle: 'italic' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  respondBtn:  { marginTop: Spacing.sm, backgroundColor: Palette.primary, borderRadius: Radius.sm, paddingVertical: 10, alignItems: 'center' },
  respondBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  editRow:     { marginTop: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seenBadge:   { flexDirection: 'row', alignItems: 'center' },
  seenText:    { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  editBtn:     { borderWidth: 1, borderColor: '#7C3AED', borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  editBtnText: { color: '#7C3AED', fontWeight: '800', fontSize: 12 },
});
