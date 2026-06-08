import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { Button } from '../../../shared/components';
import { useUiStore } from '../../../shared/store/uiStore';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { advisorRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingAvailability'>;

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const DEFAULT_HOURS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

interface SlotEntry { dayOfWeek: string; startTime: string; endTime: string }

export const OnboardingAvailabilityScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const { form, updateForm } = useOnboardingStore();
  const [slots, setSlots] = useState<SlotEntry[]>(form.availability.length ? form.availability : []);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const daySlots = (day: string) => slots.filter((s) => s.dayOfWeek === day);

  const addSlot = () => {
    if (!addingDay) return;
    if (startTime >= endTime) {
      showToast('error', 'End time must be after start time');
      return;
    }
    setSlots((prev) => [...prev, { dayOfWeek: addingDay, startTime, endTime }]);
    setAddingDay(null);
  };

  const removeSlot = (day: string, idx: number) => {
    const daySlotsArr = daySlots(day);
    const slotToRemove = daySlotsArr[idx];
    setSlots((prev) => prev.filter((s) => s !== slotToRemove));
  };

  const { mutate: saveProgress, isPending } = useMutation({
    mutationFn: () =>
      advisorRepository.saveOnboardingProgress(8, { availability: slots }),
    onSuccess: () => {
      updateForm({ availability: slots });
      navigation.navigate('OnboardingReview');
    },
    onError: (err: any) => showToast('error', err?.response?.data?.error ?? 'Failed to save availability'),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress step={8} title="Availability" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Set Your Weekly Availability</Text>
        <Text style={styles.subtitle}>
          Clients can only book consultations during your available slots.
        </Text>

        <View style={styles.grid}>
          {DAYS.map((day) => {
            const ds = daySlots(day);
            return (
              <View key={day} style={styles.dayRow}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => { setAddingDay(day); setStartTime('09:00'); setEndTime('10:00'); }}
                  >
                    <Text style={styles.addBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>
                {ds.length === 0 ? (
                  <Text style={styles.noSlot}>Not available</Text>
                ) : (
                  <View style={styles.slotList}>
                    {ds.map((slot, i) => (
                      <View key={i} style={styles.slotChip}>
                        <Text style={styles.slotText}>{slot.startTime} – {slot.endTime}</Text>
                        <TouchableOpacity onPress={() => removeSlot(day, i)}>
                          <Text style={styles.slotRemove}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Button
          label={isPending ? 'Saving…' : 'Continue'}
          onPress={() => saveProgress()}
          variant="primary"
          loading={isPending}
          disabled={slots.length === 0 || isPending}
          fullWidth
          size="lg"
        />
      </ScrollView>

      {/* Add slot modal */}
      <Modal visible={!!addingDay} animationType="slide" transparent onRequestClose={() => setAddingDay(null)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              Add Slot for {addingDay ? DAY_LABELS[addingDay] : ''}
            </Text>

            <Text style={styles.timeLabel}>START TIME</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRow}>
              {DEFAULT_HOURS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, startTime === t && styles.timeChipActive]}
                  onPress={() => setStartTime(t)}
                >
                  <Text style={[styles.timeText, startTime === t && styles.timeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.timeLabel}>END TIME</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRow}>
              {DEFAULT_HOURS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, endTime === t && styles.timeChipActive]}
                  onPress={() => setEndTime(t)}
                >
                  <Text style={[styles.timeText, endTime === t && styles.timeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sheetActions}>
              <Button label="Cancel" onPress={() => setAddingDay(null)} variant="ghost" style={styles.sheetBtn} />
              <Button label="Add Slot" onPress={addSlot} variant="primary" style={styles.sheetBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { ...Typography.heading },
  subtitle: { ...Typography.body, color: Palette.textSecondary, lineHeight: 22 },

  grid: {
    backgroundColor: Palette.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Palette.border, overflow: 'hidden',
  },
  dayRow: { borderBottomWidth: 1, borderBottomColor: Palette.border, padding: Spacing.md, gap: Spacing.xs },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { ...Typography.label },
  addBtn: {
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.sm,
  },
  addBtnText: { color: Palette.primary, fontSize: 11, fontWeight: '700' },
  noSlot: { ...Typography.caption, color: Palette.textMuted, fontStyle: 'italic' },
  slotList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  slotChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  slotText: { fontSize: 11, color: Palette.primary, fontWeight: '600' },
  slotRemove: { color: Palette.textMuted, fontSize: 11 },

  overlay: { flex: 1, backgroundColor: Palette.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md,
  },
  handle: {
    width: 36, height: 4, backgroundColor: Palette.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs,
  },
  sheetTitle: { ...Typography.subheading, textAlign: 'center' },
  timeLabel: { ...Typography.label },
  timeRow: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  timeChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Palette.card, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Palette.border, marginRight: Spacing.xs,
  },
  timeChipActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  timeText: { ...Typography.caption, fontWeight: '600' },
  timeTextActive: { color: Palette.primary },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm },
  sheetBtn: { flex: 1 },
});
