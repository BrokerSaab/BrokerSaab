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
  const { quoteId, clientName, isEdit, existingLineItems, existingNote } = route.params;
  const qc = useQueryClient();

  const [rows, setRows] = useState<LineRow[]>(
    existingLineItems && existingLineItems.length > 0
      ? existingLineItems
      : [{ description: '', amount: '' }]
  );
  const [advisorNote,   setAdvisorNote]   = useState(existingNote ?? '');
  const [validityHours, setValidityHours] = useState(72);

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
        const msg = isEdit
          ? `Quote updated and re-sent to ${clientName}.`
          : `Quote of ₹${total.toLocaleString('en-IN')} sent to ${clientName}.`;
        Alert.alert(isEdit ? 'Updated!' : 'Sent!', msg, [
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
        <View style={s.headingRow}>
          <Text style={s.heading}>{isEdit ? 'Edit Quote' : 'Compose Quote'}</Text>
          {isEdit && <View style={s.editBadge}><Text style={s.editBadgeText}>EDITING</Text></View>}
        </View>
        <Text style={s.sub}>for {clientName}</Text>
        {isEdit && (
          <View style={s.editNote}>
            <Text style={s.editNoteText}>
              You can update the quote while the client has not yet paid. They will be notified of the change.
            </Text>
          </View>
        )}

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
            : <Text style={s.btnText}>{isEdit ? 'Update & Resend Quote' : 'Send Quote to Client'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Palette.background },
  scroll:        { padding: Spacing.lg },
  headingRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  heading:       { ...Typography.heading, color: Palette.text },
  editBadge:     { backgroundColor: '#7C3AED20', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: '#7C3AED60' },
  editBadgeText: { fontSize: 9, fontWeight: '800', color: '#7C3AED', letterSpacing: 1 },
  sub:           { ...Typography.bodySmall, color: Palette.textSecondary, marginBottom: Spacing.sm },
  editNote:      { backgroundColor: '#EDE9FE', borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: '#7C3AED' },
  editNoteText:  { fontSize: 12, color: '#4C1D95', lineHeight: 18 },
  label: { ...Typography.caption, color: Palette.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowContainer: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  flex1: { flex: 1 },
  input: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 10, color: Palette.text, backgroundColor: Palette.surface, ...Typography.bodySmall },
  amtInput: { width: 90 },
  delBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  delBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Palette.primary, backgroundColor: Palette.primary + '15' },
  addBtnText: { color: Palette.primary, fontWeight: '700', fontSize: 13 },
  total: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  textarea: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.md, padding: Spacing.md, color: Palette.text, backgroundColor: Palette.surface, height: 80, textAlignVertical: 'top', ...Typography.bodySmall, marginBottom: Spacing.sm },
  validityRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl },
  validityBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, borderWidth: 1, borderColor: Palette.border, backgroundColor: Palette.surface, alignItems: 'center' },
  validityBtnActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  validityText: { fontSize: 13, fontWeight: '700', color: Palette.textSecondary },
  validityTextActive: { color: '#fff' },
  btn: { backgroundColor: '#D4AF37', borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#0B1F3A', fontWeight: '900', fontSize: 15 },
});
