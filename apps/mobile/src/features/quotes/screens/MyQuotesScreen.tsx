import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { quoteRepository, FeeQuote } from '../../../shared/api';
import { EmptyState, SkeletonLoader } from '../../../shared/components';

type Props = NativeStackScreenProps<BookingsStackParamList, 'MyQuotes'>;

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: '#D97706',
  QUOTED: '#4F46E5',
  VIEWED: '#2563EB',
  ACCEPTED: '#059669',
  CANCELLED: '#DC2626',
  EXPIRED: '#6B7280',
};

export const MyQuotesScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['myQuotes'],
    queryFn: quoteRepository.list,
  });

  const quotes: FeeQuote[] = data?.data ?? [];
  const newQuotes = quotes.filter(q => q.status === 'QUOTED' && !q.viewedAt);

  return (
    <SafeAreaView style={s.safe}>
      {newQuotes.length > 0 && (
        <TouchableOpacity style={s.pulseBanner} onPress={() => navigation.navigate('QuoteView', { quoteId: newQuotes[0].id })}>
          <Text style={s.pulseText}>{newQuotes.length} New Fee Quote{newQuotes.length > 1 ? 's' : ''} Ready — Tap to View</Text>
        </TouchableOpacity>
      )}
      {isLoading ? (
        <SkeletonLoader lines={3} />
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(q) => q.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Palette.primary} />}
          ListEmptyComponent={
            <EmptyState
              title="No Fee Quotes"
              subtitle="Ask an advisor for a fee breakdown before booking"
            />
          }
          renderItem={({ item }) => {
            const isNew = item.status === 'QUOTED' && !item.viewedAt;
            return (
              <TouchableOpacity
                style={[s.card, isNew && s.cardNew]}
                onPress={() => {
                  if (item.totalAmount) {
                    navigation.navigate('QuoteView', { quoteId: item.id });
                  }
                }}
              >
                <View style={s.cardRow}>
                  <View style={s.flex1}>
                    <Text style={s.advisorName}>{item.advisor.fullName}</Text>
                    <Text style={s.meta}>
                      {item.categorySlug ? item.categorySlug.toUpperCase() : 'General'} · {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] + '20', borderColor: STATUS_COLOR[item.status] + '60' }]}>
                    <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
                  </View>
                </View>
                {item.totalAmount && (
                  <Text style={s.amount}>₹{parseFloat(item.totalAmount).toLocaleString('en-IN')}</Text>
                )}
                {isNew && <View style={s.dot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  pulseBanner: { backgroundColor: Palette.primary, paddingVertical: 12, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  pulseText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  list: { padding: Spacing.md },
  card: { backgroundColor: Palette.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Palette.border },
  cardNew: { borderColor: Palette.primary, backgroundColor: Palette.primary + '0A' },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  flex1: { flex: 1, marginRight: Spacing.sm },
  advisorName: { ...Typography.body, color: Palette.text, fontWeight: '700' },
  meta: { ...Typography.caption, color: Palette.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  amount: { ...Typography.subheading, color: '#D4AF37', marginTop: Spacing.xs, fontWeight: '900' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Palette.primary, position: 'absolute', top: 12, right: 12 },
});
