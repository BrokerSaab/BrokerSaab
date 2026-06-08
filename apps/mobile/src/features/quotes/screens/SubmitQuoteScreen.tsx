import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdvisorDashboardStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { quoteRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AdvisorDashboardStackParamList, 'SubmitQuote'>;

interface LineRow { description: string; amount: string }

export const SubmitQuoteScreen: React.FC<Props> = ({ route, navigation }) => {
  const { quoteId, clientName } = route.params;
  const qc = useQueryClient();

  const [rows,         setRows]         = useState<LineRow[]>([{ description: '', amount: '' }]);
  const [advisorNote,  setAdvisorNote]  = useState('');
  const [validityHours, setValidityHours] = useState(48);

  const addRow  = () => setRows(p => [...p, { description: '', amount: '' }]);
  const delRow  = (i: number) => setRows(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p);
  const setDesc = (i: number, v: string) => setRows(p => p.map((r, idx) => idx === i ? { ...r, description: v } : r));
  const setAmt  = (i: number, v: string) => setRows(p => p.map((r, idx) => idx === i ? { ...r, amount: v }       : r));

  const total = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      for (const r of rows) {
        if (!r.description.trim()) throw new Error('All rows must have a description.');
        const n = parseFloat(r.amount);
        if (isNaN(n) || n <= 0)   throw new Error('All amounts must be positive numbers.');
      }
      return quoteRepository.submitQuote(quoteId, {
        lineItems: rows.map(r => ({ description: r.description.trim(), amount: parseFloat(r.amount) })),
        advisorNote: advisorNote.trim() || undefined,
        validityHours,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        qc.invalidateQueries({ queryKey: ['advisorQuotes'] });
        Alert.alert('Sent!', `Quote of ₹${total.toLocaleString('en-IN')} sent to ${clientName}.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', data.message ?? 'Failed to submit quote');
      }
    },
    onError: (err: Error) => Alert.alert('Validation Error', err.message),
  });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Compose Quote</Text>
        <Text style={s.sub}>for {clientName}</Text>

        <Text style={s.label}>Line Items</Text>
        {rows.map((row, i) => (
          <View key={i} style={s.rowContainer}>
            <TextInput
              style={[s.input, s.flex1]}
              placeholder="Description"
              placeholderTextColor={Palette.textSecondary}
              value={row.description}
              onChangeText={v => setDesc(i, v)}
            />
            <TextInput
              style={[s.input, s.amtInput]}
              placeholder="Amount"
              placeholderTextColor={Palette.textSecondary}
              value={row.amount}
              onChangeText={v => setAmt(i, v)}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => delRow(i)} style={s.delBtn}>
              <Text style={s.delBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={s.addRow}>
          <TouchableOpacity onPress={addRow} style={s.addBtn}>
            <Text style={s.addBtnText}>+ Add Item</Text>
          </TouchableOpacity>
          {total > 0 && <Text style={s.total}>Total: ₹{total.toLocaleString('en-IN')}</Text>}
        </View>

        <Text style={[s.label, { marginTop: Spacing.lg }]}>Note for Client (optional)</Text>
        <TextInput
          style={s.textarea}
          placeholder="Payment terms, disclaimers, next steps…"
          placeholderTextColor={Palette.textSecondary}
          value={advisorNote}
          onChangeText={setAdvisorNote}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        <Text style={[s.label, { marginTop: Spacing.lg }]}>Valid For</Text>
        <View style={s.validityRow}>
          {[24, 48, 72, 168].map(h => (
            <TouchableOpacity key={h} onPress={() => setValidityHours(h)}
              style={[s.validityBtn, validityHours === h && s.validityBtnActive]}>
              <Text style={[s.validityText, validityHours === h && s.validityTextActive]}>
                {h < 48 ? `${h}h` : `${h / 24}d`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[s.btn, isPending && s.btnDisabled]} onPress={() => mutate()} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color="#0B1F3A" />
            : <Text style={s.btnText}>Send Quote to Client</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  scroll: { padding: Spacing.lg },
  heading: { ...Typography.h2, color: Palette.text },
  sub: { ...Typography.body2, color: Palette.textSecondary, marginBottom: Spacing.xl },
  label: { ...Typography.caption, color: Palette.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowContainer: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  flex1: { flex: 1 },
  input: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 10, color: Palette.text, backgroundColor: Palette.surface, ...Typography.body2 },
  amtInput: { width: 90 },
  delBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  delBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Palette.primary, backgroundColor: Palette.primary + '15' },
  addBtnText: { color: Palette.primary, fontWeight: '700', fontSize: 13 },
  total: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  textarea: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.md, padding: Spacing.md, color: Palette.text, backgroundColor: Palette.surface, height: 80, textAlignVertical: 'top', ...Typography.body2, marginBottom: Spacing.sm },
  validityRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl },
  validityBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface, alignItems: 'center' },
  validityBtnActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  validityText: { fontSize: 13, fontWeight: '700', color: Palette.textSecondary },
  validityTextActive: { color: '#fff' },
  btn: { backgroundColor: '#D4AF37', borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#0B1F3A', fontWeight: '900', fontSize: 15 },
});
