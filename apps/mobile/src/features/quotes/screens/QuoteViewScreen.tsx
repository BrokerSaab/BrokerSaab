import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { quoteRepository, ticketRepository } from '../../../shared/api';
import { SkeletonLoader, EmptyState } from '../../../shared/components';

type Props = NativeStackScreenProps<BookingsStackParamList, 'QuoteView'>;

type Gateway = 'WALLET' | 'RAZORPAY' | 'STRIPE';

const GATEWAYS: { id: Gateway; label: string; icon: string; desc: string }[] = [
  { id: 'WALLET', label: 'BrokerSaab Wallet', icon: '💰', desc: 'Instant · No charges' },
  { id: 'RAZORPAY', label: 'Razorpay', icon: '💳', desc: 'UPI / Card / NetBanking' },
  { id: 'STRIPE', label: 'Stripe', icon: '🌐', desc: 'International cards' },
];

export const QuoteViewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { quoteId } = route.params;
  const qc = useQueryClient();
  const viewedRef = useRef(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [gateway, setGateway] = useState<Gateway>('WALLET');

  const { data, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => quoteRepository.getById(quoteId),
  });

  const quote = data?.data;

  useEffect(() => {
    if (!quote || viewedRef.current) return;
    if (quote.status !== 'QUOTED') return;
    viewedRef.current = true;
    quoteRepository.markViewed(quoteId)
      .then(() => qc.invalidateQueries({ queryKey: ['myQuotes'] }))
      .catch(() => {});
  }, [quote, quoteId, qc]);

  const { mutate: decline, isPending: declining } = useMutation({
    mutationFn: () => quoteRepository.cancelQuote(quoteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myQuotes'] });
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'Could not decline the quote.'),
  });

  const { mutate: pay, isPending: paying } = useMutation({
    mutationFn: () => ticketRepository.quoteCheckout(quoteId, gateway),
    onSuccess: (res) => {
      setPayModalVisible(false);
      qc.invalidateQueries({ queryKey: ['myQuotes'] });
      qc.invalidateQueries({ queryKey: ['myTickets'] });
      const ticketId = res.data?.ticket?.id;
      const ticketNumber = res.data?.ticket?.ticketNumber;
      Alert.alert(
        'Payment Successful!',
        `Work ticket ${ticketNumber} created. Your payment is held safely in escrow until the work is complete.`,
        [
          { text: 'View Ticket', onPress: () => ticketId && navigation.navigate('TicketDetail', { ticketId }) },
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]
      );
    },
    onError: (e: any) => {
      setPayModalVisible(false);
      Alert.alert('Payment Failed', e?.response?.data?.message ?? 'Could not process payment. Please try again.');
    },
  });

  if (isLoading) return <SkeletonLoader lines={5} />;
  if (!quote) return <EmptyState title="Quote not found" />;

  const total = parseFloat(quote.totalAmount ?? '0');
  const canAct = ['QUOTED', 'VIEWED'].includes(quote.status);
  const isAccepted = quote.status === 'ACCEPTED';
  const sortedItems = [...quote.lineItems].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.heading}>Fee Quote</Text>
        <Text style={s.sub}>from {quote.advisor.fullName}</Text>

        {/* Status badge */}
        <View style={[s.statusBadge, isAccepted && s.statusAccepted]}>
          <Text style={[s.statusText, isAccepted && s.statusTextAccepted]}>
            {isAccepted ? '✓ Accepted — Work Ticket Created' : quote.status}
          </Text>
        </View>

        {quote.categorySlug && (
          <View style={s.chip}>
            <Text style={s.chipText}>{quote.categorySlug.toUpperCase()}</Text>
          </View>
        )}

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

        {quote.advisorNote && (
          <View style={s.note}>
            <Text style={s.noteLabel}>Note from Advisor</Text>
            <Text style={s.noteText}>{quote.advisorNote}</Text>
          </View>
        )}

        {/* Escrow info */}
        {canAct && (
          <View style={s.escrowBanner}>
            <Text style={s.escrowTitle}>🔒 Escrow Protected</Text>
            <Text style={s.escrowText}>
              Your payment is held securely by BrokerSaab. Money is released to the advisor only after you confirm
              each stage of work and close the ticket. Non-refundable once work begins.
            </Text>
          </View>
        )}

        {quote.validUntil && (
          <Text style={s.validity}>
            Valid until {new Date(quote.validUntil).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
        )}

        {canAct && (
          <View style={s.ctaRow}>
            <TouchableOpacity
              style={s.declineBtn}
              onPress={() => Alert.alert('Decline Quote', 'Are you sure you want to decline?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Decline', style: 'destructive', onPress: () => decline() },
              ])}
              disabled={declining}
            >
              {declining
                ? <ActivityIndicator color="#DC2626" />
                : <Text style={s.declineBtnText}>Decline</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.payBtn} onPress={() => setPayModalVisible(true)}>
              <Text style={s.payBtnText}>Accept & Pay</Text>
              <Text style={s.payBtnSub}>₹{total.toLocaleString('en-IN')} · Escrow</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAccepted && (
          <TouchableOpacity
            style={s.viewTicketBtn}
            onPress={() => navigation.navigate('MyTickets')}
          >
            <Text style={s.viewTicketText}>View My Work Tickets →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Payment gateway modal */}
      <Modal visible={payModalVisible} transparent animationType="slide" onRequestClose={() => setPayModalVisible(false)}>
        <Pressable style={s.overlay} onPress={() => !paying && setPayModalVisible(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Choose Payment Method</Text>
          <Text style={s.sheetSub}>₹{total.toLocaleString('en-IN')} will be held in escrow</Text>

          {GATEWAYS.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[s.gatewayRow, gateway === g.id && s.gatewaySelected]}
              onPress={() => setGateway(g.id)}
            >
              <Text style={s.gatewayIcon}>{g.icon}</Text>
              <View style={s.flex1}>
                <Text style={s.gatewayLabel}>{g.label}</Text>
                <Text style={s.gatewayDesc}>{g.desc}</Text>
              </View>
              <View style={[s.radio, gateway === g.id && s.radioFilled]} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[s.confirmPayBtn, paying && { opacity: 0.6 }]}
            onPress={() => pay()}
            disabled={paying}
          >
            {paying
              ? <ActivityIndicator color="#0B1F3A" />
              : <Text style={s.confirmPayText}>Confirm & Pay ₹{total.toLocaleString('en-IN')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPayModalVisible(false)} disabled={paying}>
            <Text style={s.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Palette.background },
  scroll:          { padding: Spacing.lg, paddingBottom: 40 },
  heading:         { ...Typography.heading, color: Palette.text },
  sub:             { ...Typography.bodySmall, color: Palette.textSecondary, marginBottom: Spacing.md },
  statusBadge:     { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: '#E5E7EB', marginBottom: Spacing.md },
  statusAccepted:  { backgroundColor: '#D1FAE5' },
  statusText:      { fontSize: 10, fontWeight: '700', color: Palette.textSecondary, textTransform: 'uppercase' },
  statusTextAccepted: { color: '#059669' },
  chip:            { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Palette.primary + '20', borderWidth: 1, borderColor: Palette.primary + '60', marginBottom: Spacing.md },
  chipText:        { fontSize: 11, fontWeight: '700', color: Palette.primary },
  table:           { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.md, overflow: 'hidden', marginBottom: Spacing.lg },
  tableHeader:     { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 10, backgroundColor: Palette.surface },
  th:              { fontSize: 10, fontWeight: '700', color: Palette.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  rowBorder:       { borderBottomWidth: 1, borderBottomColor: Palette.border },
  td:              { ...Typography.bodySmall, color: Palette.text },
  flex1:           { flex: 1, marginRight: Spacing.sm },
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: Palette.surface, borderTopWidth: 1, borderTopColor: Palette.border },
  totalLabel:      { ...Typography.body, color: Palette.text, fontWeight: '900' },
  totalAmount:     { fontSize: 20, fontWeight: '900', color: '#D4AF37' },
  note:            { backgroundColor: '#EFF6FF', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  noteLabel:       { fontSize: 10, fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase', marginBottom: 4 },
  noteText:        { ...Typography.bodySmall, color: '#1E40AF' },
  escrowBanner:    { backgroundColor: '#FFF8E6', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: '#D4AF37' },
  escrowTitle:     { fontSize: 12, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  escrowText:      { fontSize: 12, color: '#78350F', lineHeight: 18 },
  validity:        { ...Typography.caption, color: Palette.textSecondary, marginBottom: Spacing.xl, textAlign: 'center' },
  ctaRow:          { flexDirection: 'row', gap: 12, marginBottom: Spacing.md },
  declineBtn:      { flex: 1, borderWidth: 1, borderColor: '#DC2626', borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center' },
  declineBtnText:  { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  payBtn:          { flex: 2, backgroundColor: '#D4AF37', borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  payBtnText:      { color: '#0B1F3A', fontWeight: '900', fontSize: 15 },
  payBtnSub:       { color: '#0B1F3A', fontSize: 10, fontWeight: '600', opacity: 0.7, marginTop: 2 },
  viewTicketBtn:   { alignItems: 'center', paddingVertical: 14 },
  viewTicketText:  { color: Palette.primary, fontWeight: '700', fontSize: 14 },
  // Modal
  overlay:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Palette.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 },
  sheetHandle:     { width: 40, height: 4, backgroundColor: Palette.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle:      { ...Typography.subheading, color: Palette.text, textAlign: 'center' },
  sheetSub:        { ...Typography.caption, color: Palette.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  gatewayRow:      { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderColor: Palette.border, marginBottom: Spacing.sm, backgroundColor: Palette.background },
  gatewaySelected: { borderColor: Palette.primary, backgroundColor: Palette.primary + '10' },
  gatewayIcon:     { fontSize: 24, marginRight: Spacing.md },
  gatewayLabel:    { ...Typography.body, color: Palette.text, fontWeight: '700' },
  gatewayDesc:     { ...Typography.caption, color: Palette.textSecondary },
  radio:           { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Palette.border, marginLeft: Spacing.sm },
  radioFilled:     { borderColor: Palette.primary, backgroundColor: Palette.primary },
  confirmPayBtn:   { backgroundColor: '#D4AF37', borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm },
  confirmPayText:  { color: '#0B1F3A', fontWeight: '900', fontSize: 15 },
  cancelLink:      { textAlign: 'center', color: Palette.textSecondary, paddingVertical: 8 },
});
