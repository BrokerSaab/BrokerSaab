import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { quoteRepository } from '../../../shared/api';
import { SkeletonLoader, EmptyState } from '../../../shared/components';

type Props = NativeStackScreenProps<BookingsStackParamList, 'QuoteView'>;

export const QuoteViewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { quoteId } = route.params;
  const qc = useQueryClient();
  const viewedRef = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => quoteRepository.getById(quoteId),
  });

  const quote = data?.data;

  // Mark viewed on first open
  useEffect(() => {
    if (!quote || viewedRef.current) return;
    if (quote.status !== 'QUOTED') return;
    viewedRef.current = true;
    quoteRepository.markViewed(quoteId).then(() => qc.invalidateQueries({ queryKey: ['myQuotes'] })).catch(() => {});
  }, [quote, quoteId, qc]);

  const { mutate: decline, isPending: declining } = useMutation({
    mutationFn: () => quoteRepository.cancelQuote(quoteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myQuotes'] });
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'Could not decline the quote.'),
  });

  if (isLoading) return <SkeletonLoader lines={5} />;
  if (!quote) return <EmptyState title="Quote not found" />;

  const total = parseFloat(quote.totalAmount ?? '0');
  const canAct = ['QUOTED', 'VIEWED'].includes(quote.status);
  const sortedItems = [...quote.lineItems].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.heading}>Fee Quote</Text>
        <Text style={s.sub}>from {quote.advisor.fullName}</Text>

        {quote.categorySlug && (
          <View style={s.chip}><Text style={s.chipText}>{quote.categorySlug.toUpperCase()}</Text></View>
        )}

        {/* Fee breakdown table */}
        {sortedItems.length > 0 && (
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.th, s.flex1]}>Description</Text>
              <Text style={s.th}>Amount</Text>
            </View>
            {sortedItems.map((item, i) => (
              <View key={item.id} style={[s.tableRow, i < sortedItems.length - 1 && s.rowBorder]}>
                <Text style={[s.td, s.flex1]}>{item.description}</Text>
                <Text style={s.td}>₹{parseFloat(item.amount).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalAmount}>₹{total.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        {/* Advisor note */}
        {quote.advisorNote && (
          <View style={s.note}>
            <Text style={s.noteLabel}>Note from Advisor</Text>
            <Text style={s.noteText}>{quote.advisorNote}</Text>
          </View>
        )}

        {/* Validity */}
        {quote.validUntil && (
          <Text style={s.validity}>
            Valid until {new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        {canAct && (
          <View style={s.ctaRow}>
            <TouchableOpacity style={s.declineBtn} onPress={() => {
              Alert.alert('Decline Quote', 'Are you sure you want to decline?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Decline', style: 'destructive', onPress: () => decline() },
              ]);
            }} disabled={declining}>
              {declining ? <ActivityIndicator color="#DC2626" /> : <Text style={s.declineBtnText}>Decline</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.bookBtn} onPress={() => {
              navigation.navigate('BookingsList');
            }}>
              <Text style={s.bookBtnText}>Go to Booking</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  scroll: { padding: Spacing.lg },
  heading: { ...Typography.h2, color: Palette.text },
  sub: { ...Typography.body2, color: Palette.textSecondary, marginBottom: Spacing.lg },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Palette.primary + '20', borderWidth: 1, borderColor: Palette.primary + '60', marginBottom: Spacing.md },
  chipText: { fontSize: 11, fontWeight: '700', color: Palette.primary },
  table: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.lg },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 10, backgroundColor: Palette.surface },
  th: { fontSize: 10, fontWeight: '700', color: Palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Palette.border },
  td: { ...Typography.body2, color: Palette.text },
  flex1: { flex: 1, marginRight: Spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: Palette.surface, borderTopWidth: 1, borderTopColor: Palette.border },
  totalLabel: { ...Typography.body1, color: Palette.text, fontWeight: '900' },
  totalAmount: { fontSize: 20, fontWeight: '900', color: '#D4AF37' },
  note: { backgroundColor: '#EFF6FF', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  noteLabel: { fontSize: 10, fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase', marginBottom: 4 },
  noteText: { ...Typography.body2, color: '#1E40AF' },
  validity: { ...Typography.caption, color: Palette.textSecondary, marginBottom: Spacing.xl, textAlign: 'center' },
  ctaRow: { flexDirection: 'row', gap: 12 },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: '#DC2626', borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  declineBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  bookBtn: { flex: 2, backgroundColor: '#D4AF37', borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  bookBtnText: { color: '#0B1F3A', fontWeight: '900', fontSize: 14 },
});
