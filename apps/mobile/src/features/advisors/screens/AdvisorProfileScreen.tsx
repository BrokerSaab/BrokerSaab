import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdvisorsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { useUiStore } from '../../../shared/store/uiStore';
import { advisorRepository, bookingRepository } from '../../../shared/api';
import {
  Avatar,
  StarRating,
  Badge,
  Button,
  SkeletonLoader,
  SkeletonLine,
  EmptyState,
} from '../../../shared/components';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { ConsultationMode } from '@brokersaab/shared-types';
import type { AvailabilitySlot } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<AdvisorsStackParamList, 'AdvisorProfile'>;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://brokersaab-backend.onrender.com';
function resolveUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

type Tab = 'about' | 'services' | 'availability' | 'reviews';

const TABS: { key: Tab; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'availability', label: 'Availability' },
  { key: 'reviews', label: 'Reviews' },
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const AdvisorProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { advisorId } = route.params;
  const [activeTab, setActiveTab] = useState<Tab>('about');
  const [bookingOpen, setBookingOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['advisor', advisorId],
    queryFn: () => advisorRepository.getById(advisorId),
    staleTime: 5 * 60 * 1000,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['advisor-reviews', advisorId],
    queryFn: () => advisorRepository.getReviews(advisorId),
    enabled: activeTab === 'reviews',
    staleTime: 5 * 60 * 1000,
  });

  const advisor = data?.data;

  if (isLoading) return <ProfileSkeleton />;
  if (!advisor) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="Advisor not found" subtitle="This profile may have been removed" />
      </SafeAreaView>
    );
  }

  const slotsByDay: Record<string, AvailabilitySlot[]> = {};
  (advisor.availability ?? []).forEach((slot: AvailabilitySlot) => {
    const day = slot.dayOfWeek;
    if (!slotsByDay[day]) slotsByDay[day] = [];
    slotsByDay[day].push(slot);
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Cover banner */}
        {resolveUrl(advisor.coverImageUrl) ? (
          <Image
            source={{ uri: resolveUrl(advisor.coverImageUrl) }}
            style={styles.coverBanner}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverBannerFallback} />
        )}

        {/* Hero */}
        <View style={[styles.hero, resolveUrl(advisor.coverImageUrl) ? styles.heroWithCover : null]}>
          <View style={styles.heroAvatarWrap}>
            <Avatar uri={resolveUrl(advisor.avatarUrl)} fallbackName={advisor.fullName} size={80} showBorder />
            {advisor.isAuthorizedDealer && (
              <View style={styles.dealerBadge}>
                <Text style={styles.dealerText}>✓ Auth</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroName}>{advisor.fullName}</Text>
          {advisor.businessName ? (
            <Text style={styles.heroBiz}>{advisor.businessName}</Text>
          ) : null}
          <Text style={styles.heroLocation}>📍 {advisor.location}</Text>

          <View style={styles.statsRow}>
            <StatPill label="Exp" value={`${advisor.experienceYears}y`} />
            <StatPill label="Rating" value={advisor.averageRating ? `★ ${advisor.averageRating.toFixed(1)}` : 'N/A'} />
            <StatPill label="Reviews" value={String(advisor.ratingsCount ?? 0)} />
            <StatPill label="Fee" value={formatCurrency(advisor.consultationFee)} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* About tab */}
        {activeTab === 'about' && (
          <View style={styles.section}>
            {advisor.bio ? (
              <>
                <Text style={styles.sectionLabel}>BIO</Text>
                <Text style={styles.bioText}>{advisor.bio}</Text>
              </>
            ) : null}

            {advisor.languages?.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>LANGUAGES</Text>
                <View style={styles.chipRow}>
                  {advisor.languages.map((l: string) => (
                    <Badge key={l} text={l} color="indigo" />
                  ))}
                </View>
              </>
            ) : null}

            {advisor.licenseNumber ? (
              <>
                <Text style={styles.sectionLabel}>LICENSE NO.</Text>
                <Text style={styles.infoText}>{advisor.licenseNumber}</Text>
              </>
            ) : null}

            {!advisor.bio && !advisor.languages?.length && !advisor.licenseNumber ? (
              <EmptyState title="No details" subtitle="This advisor hasn't filled in their profile yet" />
            ) : null}
          </View>
        )}

        {/* Services tab */}
        {activeTab === 'services' && (
          <View style={styles.section}>
            {advisor.categories?.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>CATEGORIES</Text>
                <View style={styles.chipRow}>
                  {advisor.categories.map((c: { id: string; name: string }) => (
                    <Badge key={c.id} text={c.name} color="indigo" />
                  ))}
                </View>
              </>
            ) : null}

            {advisor.specializations?.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>SPECIALIZATIONS</Text>
                {advisor.specializations.map((s: { id: string; title: string; description?: string }) => (
                  <View key={s.id} style={styles.specItem}>
                    <Text style={styles.specTitle}>{s.title}</Text>
                    {s.description ? (
                      <Text style={styles.specDesc}>{s.description}</Text>
                    ) : null}
                  </View>
                ))}
              </>
            ) : null}

            {!advisor.categories?.length && !advisor.specializations?.length ? (
              <EmptyState title="No services listed" subtitle="This advisor hasn't listed their services yet" />
            ) : null}
          </View>
        )}

        {/* Availability tab */}
        {activeTab === 'availability' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>WEEKLY SCHEDULE</Text>
            {DAY_ORDER.map((day) => {
              const slots = slotsByDay[day];
              if (!slots?.length) return null;
              return (
                <View key={day} style={styles.dayRow}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                  <View style={styles.slotRow}>
                    {slots.map((slot) => (
                      <View key={slot.id} style={styles.slotChip}>
                        <Text style={styles.slotText}>
                          {slot.startTime} – {slot.endTime}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
            {Object.keys(slotsByDay).length === 0 ? (
              <EmptyState title="No availability set" subtitle="This advisor hasn't configured their schedule yet" />
            ) : null}
          </View>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <View style={styles.section}>
            {!reviewsData?.data?.length ? (
              <EmptyState title="No reviews yet" subtitle="Be the first to leave a review after your consultation" />
            ) : (
              (reviewsData.data as any[]).map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <Avatar fallbackName={r.clientName} size={32} />
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewName}>{r.clientName}</Text>
                      <Text style={styles.reviewDate}>{formatDate(r.createdAt)}</Text>
                    </View>
                    <StarRating score={r.rating} size={12} />
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.stickyBar}>
        <View style={styles.stickyFee}>
          <Text style={styles.stickyFeeLabel}>per session</Text>
          <Text style={styles.stickyFeeAmount}>{formatCurrency(advisor.consultationFee)}</Text>
        </View>
        <TouchableOpacity
          style={styles.quoteBtn}
          onPress={() => (navigation as any).navigate('MyCasesTab', {
            screen: 'QuoteRequest',
            params: { advisorId: advisor.id, advisorName: advisor.fullName },
          })}
        >
          <Text style={styles.quoteBtnText}>Fee Quote</Text>
        </TouchableOpacity>
        <Button
          label="Book"
          onPress={() => setBookingOpen(true)}
          variant="primary"
          style={styles.bookBtn}
        />
      </View>

      {bookingOpen && (
        <BookConsultationSheet
          advisorId={advisor.id}
          advisorName={advisor.fullName}
          fee={advisor.consultationFee}
          availability={advisor.availability ?? []}
          onClose={() => setBookingOpen(false)}
          onSuccess={(bookingId) => {
            setBookingOpen(false);
            (navigation as any).navigate('MyCasesTab', {
              screen: 'BookingDetail',
              params: { bookingId },
            });
          }}
        />
      )}
    </SafeAreaView>
  );
};

// ─── BookConsultationSheet ────────────────────────────────────────────────────

interface BookSheetProps {
  advisorId: string;
  advisorName: string;
  fee: number;
  availability: AvailabilitySlot[];
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

const MODES = [
  { key: ConsultationMode.VIDEO, label: '📹 Video' },
  { key: ConsultationMode.PHONE, label: '📞 Phone' },
  { key: ConsultationMode.CHAT, label: '💬 Chat' },
  { key: ConsultationMode.PHYSICAL, label: '🤝 In-Person' },
];

const BookConsultationSheet: React.FC<BookSheetProps> = ({
  advisorId, advisorName, fee, availability, onClose, onSuccess,
}) => {
  const { showToast } = useUiStore();
  const qc = useQueryClient();

  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>(ConsultationMode.VIDEO);
  const [notes, setNotes] = useState('');

  const { mutate: createBooking, isPending } = useMutation({
    mutationFn: () =>
      bookingRepository.create({
        advisorId,
        slotId: selectedSlot!.id,
        mode: selectedMode,
        notes: notes || undefined,
        paymentMethod: 'WALLET',
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      onSuccess(res.data?.id ?? '');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.error ?? 'Booking failed. Please try again.');
    },
  });

  const handleConfirm = () => {
    if (!selectedSlot) {
      showToast('error', 'Please select an available time slot');
      return;
    }
    createBooking();
  };

  const allSlots = availability.filter((s) => (s as any).isAvailable !== false);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={sheet.overlay}>
        <View style={sheet.container}>
          <View style={sheet.handle} />
          <View style={sheet.header}>
            <Text style={sheet.title}>Book Consultation</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={sheet.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={sheet.content} showsVerticalScrollIndicator={false}>
            <Text style={sheet.advisorName}>{advisorName}</Text>

            <Text style={sheet.label}>CONSULTATION MODE</Text>
            <View style={sheet.modeRow}>
              {MODES.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[sheet.modeChip, selectedMode === m.key && sheet.modeChipActive]}
                  onPress={() => setSelectedMode(m.key)}
                >
                  <Text style={[sheet.modeText, selectedMode === m.key && sheet.modeTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={sheet.label}>SELECT TIME SLOT</Text>
            {allSlots.length === 0 ? (
              <Text style={sheet.noSlots}>No available slots. Check back later.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={sheet.slotScroll}
              >
                {allSlots.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[sheet.slotChip, selectedSlot?.id === s.id && sheet.slotChipActive]}
                    onPress={() => setSelectedSlot(s)}
                  >
                    <Text style={[sheet.slotDay, selectedSlot?.id === s.id && sheet.slotDayActive]}>
                      {DAY_LABELS[s.dayOfWeek]}
                    </Text>
                    <Text style={[sheet.slotTime, selectedSlot?.id === s.id && sheet.slotTimeActive]}>
                      {s.startTime}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={sheet.label}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={sheet.notesInput}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="Describe your query briefly…"
              placeholderTextColor={Palette.textMuted}
              textAlignVertical="top"
            />

            <View style={sheet.feeSummary}>
              <Text style={sheet.feeLabel}>Consultation Fee</Text>
              <Text style={sheet.feeValue}>{formatCurrency(fee)}</Text>
            </View>

            <View style={sheet.feeSummary}>
              <Text style={sheet.feeLabel}>Payment Method</Text>
              <Badge text="Wallet Balance" color="gold" />
            </View>
          </ScrollView>

          <View style={sheet.footer}>
            <Button
              label={isPending ? 'Booking…' : 'Confirm & Pay'}
              onPress={handleConfirm}
              variant="primary"
              loading={isPending}
              disabled={!selectedSlot || isPending}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statPill}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ProfileSkeleton: React.FC = () => (
  <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={[styles.container, { alignItems: 'center', padding: Spacing.lg, gap: Spacing.md }]}>
      <SkeletonLine width={80} height={80} style={{ borderRadius: 40 }} />
      <SkeletonLine width={160} height={20} />
      <SkeletonLine width={120} height={14} />
    </ScrollView>
  </SafeAreaView>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { paddingBottom: Spacing.xxl },

  coverBanner: { width: '100%', height: 180 },
  coverBannerFallback: { width: '100%', height: 8, backgroundColor: Palette.primaryLight },

  hero: { alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
  heroWithCover: { marginTop: -24 },
  heroAvatarWrap: { position: 'relative' },
  dealerBadge: {
    position: 'absolute', bottom: -4, right: -8,
    backgroundColor: Palette.primary,
    borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  dealerText: { color: Palette.background, fontSize: 9, fontWeight: '800' },
  heroName: { ...Typography.subheading, fontSize: 20, textAlign: 'center' },
  heroBiz: { ...Typography.caption, color: Palette.textSecondary, textAlign: 'center' },
  heroLocation: { ...Typography.caption, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  statPill: {
    backgroundColor: Palette.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    alignItems: 'center', gap: 2,
  },
  statValue: { color: Palette.primary, fontWeight: '800', fontSize: 13 },
  statLabel: { ...Typography.caption, fontSize: 9 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: Palette.border,
    marginHorizontal: Spacing.md,
  },
  tab: {
    flex: 1, paddingVertical: Spacing.sm, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Palette.primary },
  tabText: { ...Typography.caption, fontWeight: '600' },
  tabTextActive: { color: Palette.primary },

  section: { padding: Spacing.lg, gap: Spacing.md },
  sectionLabel: { ...Typography.label },
  bioText: { ...Typography.body, lineHeight: 22, color: Palette.textSecondary },
  infoText: { ...Typography.body },
  chipRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },

  specItem: {
    backgroundColor: Palette.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    padding: Spacing.md, gap: 4,
  },
  specTitle: { ...Typography.body, fontWeight: '700' },
  specDesc: { ...Typography.caption },

  dayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dayLabel: { ...Typography.label, width: 32 },
  slotRow: { flex: 1, flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  slotChip: {
    backgroundColor: Palette.card, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Palette.border,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  slotText: { ...Typography.caption, fontSize: 11 },

  reviewCard: {
    backgroundColor: Palette.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Palette.border,
    padding: Spacing.md, gap: Spacing.sm,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewMeta: { flex: 1 },
  reviewName: { ...Typography.body, fontWeight: '600' },
  reviewDate: { ...Typography.caption },
  reviewComment: { ...Typography.body, color: Palette.textSecondary },

  stickyBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, paddingBottom: Spacing.lg,
    backgroundColor: Palette.surface,
    borderTopWidth: 1, borderTopColor: Palette.border,
    ...Shadow.gold,
  },
  stickyFee: { gap: 2 },
  stickyFeeLabel: { ...Typography.caption, fontSize: 10 },
  stickyFeeAmount: { color: Palette.primary, fontSize: 18, fontWeight: '800' },
  bookBtn: { flex: 1 },
  quoteBtn: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: Palette.primary, backgroundColor: Palette.primary + '15', alignItems: 'center', justifyContent: 'center' },
  quoteBtnText: { color: Palette.primary, fontWeight: '800', fontSize: 12 },
});

const sheet = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Palette.overlay, justifyContent: 'flex-end' },
  container: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: Palette.border,
    borderRadius: 2, alignSelf: 'center', marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  title: { ...Typography.subheading },
  closeBtn: { color: Palette.textMuted, fontSize: 18, padding: 4 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  advisorName: { ...Typography.body, fontWeight: '700', color: Palette.textSecondary },
  label: { ...Typography.label },
  modeRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  modeChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Palette.border,
    backgroundColor: Palette.card,
  },
  modeChipActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  modeText: { fontSize: 12, color: Palette.textSecondary },
  modeTextActive: { color: Palette.primary, fontWeight: '700' },
  noSlots: { ...Typography.caption, color: Palette.textMuted, textAlign: 'center' },
  slotScroll: { gap: Spacing.sm },
  slotChip: {
    alignItems: 'center', padding: Spacing.sm,
    backgroundColor: Palette.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border, minWidth: 64,
  },
  slotChipActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  slotDay: { ...Typography.caption, fontSize: 10, fontWeight: '700' },
  slotDayActive: { color: Palette.primary },
  slotTime: { ...Typography.caption, fontSize: 12 },
  slotTimeActive: { color: Palette.primary, fontWeight: '700' },
  notesInput: {
    color: Palette.text, fontSize: 14, lineHeight: 21,
    backgroundColor: Palette.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    padding: Spacing.md, minHeight: 80,
  },
  feeSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: Spacing.sm,
  },
  feeLabel: { ...Typography.body, color: Palette.textSecondary },
  feeValue: { color: Palette.primary, fontWeight: '800', fontSize: 16 },
  footer: {
    padding: Spacing.md, paddingBottom: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Palette.border,
  },
});
