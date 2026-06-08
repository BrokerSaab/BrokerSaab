import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { quoteRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<BookingsStackParamList, 'QuoteRequest'>;

const CATEGORIES = [
  { slug: 'm1', name: 'Birth, Death & Marriage' },
  { slug: 'm2', name: 'Identity Cards' },
  { slug: 'm3', name: 'Income, Caste & Residence' },
  { slug: 'm4', name: 'Property & Land' },
  { slug: 'm5', name: 'Tax / GST Filing' },
  { slug: 'm6', name: 'Business Registration' },
  { slug: 'm10', name: 'Vehicle & RTO' },
  { slug: 'm11', name: 'Legal & Court' },
  { slug: 'm16', name: 'Passport, Visa & Foreign' },
  { slug: 'm25', name: 'Others' },
];

export const QuoteRequestScreen: React.FC<Props> = ({ route, navigation }) => {
  const { advisorId, advisorName } = route.params;
  const qc = useQueryClient();
  const [categorySlug, setCategorySlug] = useState('');
  const [message, setMessage] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () => quoteRepository.requestQuote({
      advisorId,
      ...(categorySlug ? { categorySlug } : {}),
      ...(message.trim() ? { clientMessage: message.trim() } : {}),
    }),
    onSuccess: (data) => {
      if (data.success) {
        qc.invalidateQueries({ queryKey: ['myQuotes'] });
        Alert.alert('Sent!', 'Your fee quote request has been sent. The advisor will respond within 48 hours.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', data.message ?? 'Failed to send request');
      }
    },
    onError: () => Alert.alert('Error', 'Network error. Please try again.'),
  });

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>Request Fee Quote</Text>
        <Text style={s.sub}>from {advisorName}</Text>

        <Text style={s.label}>Service Category (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
          <TouchableOpacity onPress={() => setCategorySlug('')}
            style={[s.chip, !categorySlug && s.chipActive]}>
            <Text style={[s.chipText, !categorySlug && s.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.slug} onPress={() => setCategorySlug(c.slug)}
              style={[s.chip, categorySlug === c.slug && s.chipActive]}>
              <Text style={[s.chipText, categorySlug === c.slug && s.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.label}>Your Message (optional)</Text>
        <TextInput
          style={s.textarea}
          placeholder="Describe what you need help with…"
          placeholderTextColor={Palette.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          maxLength={1000}
        />
        <Text style={s.charCount}>{message.length}/1000</Text>

        <TouchableOpacity style={[s.btn, isPending && s.btnDisabled]} onPress={() => mutate()} disabled={isPending}>
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Send Quote Request</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  scroll: { padding: Spacing.lg },
  heading: { ...Typography.h2, color: Palette.text, marginBottom: 2 },
  sub: { ...Typography.body2, color: Palette.textSecondary, marginBottom: Spacing.xl },
  label: { ...Typography.caption, color: Palette.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { marginBottom: Spacing.lg },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Palette.border, marginRight: 8, backgroundColor: Palette.surface },
  chipActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  chipText: { ...Typography.caption, color: Palette.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  textarea: { borderWidth: 1, borderColor: Palette.border, borderRadius: Radius.md, padding: Spacing.md, color: Palette.text, backgroundColor: Palette.surface, height: 120, textAlignVertical: 'top', ...Typography.body2, marginBottom: 4 },
  charCount: { ...Typography.caption, color: Palette.textSecondary, textAlign: 'right', marginBottom: Spacing.xl },
  btn: { backgroundColor: Palette.primary, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
