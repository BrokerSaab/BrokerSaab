import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { useAuthStore } from '../../../shared/store';
import { useUiStore } from '../../../shared/store/uiStore';
import { contactRepository } from '../../../shared/api';
import { useRazorpayPayment } from '../../../shared/hooks/useRazorpayPayment';
import { Avatar, Button, Badge, EmptyState, SkeletonLoader } from '../../../shared/components';
import type { ContactUnlock } from '@brokersaab/shared-types';

export const ContactsUnlockedScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useUiStore();
  const qc = useQueryClient();
  const { pay } = useRazorpayPayment();
  const [packModalOpen, setPackModalOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-unlocks'],
    queryFn: contactRepository.getMyUnlocks,
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: buyPack, isPending } = useMutation({
    mutationFn: contactRepository.createOrder,
    onSuccess: async (res) => {
      if (!res.data) return;
      const { orderId, amount, keyId } = res.data;
      try {
        const result = await pay(orderId, amount, {
          name: user?.fullName ?? undefined,
          email: user?.email ?? undefined,
          contact: user?.phoneNumber ?? undefined,
        });
        await contactRepository.verifyPayment(result);
        qc.invalidateQueries({ queryKey: ['my-unlocks'] });
        setPackModalOpen(false);
        showToast('success', 'Contact pack activated! You can now unlock advisor contacts.');
      } catch {
        showToast('error', 'Payment was cancelled or failed.');
      }
    },
    onError: () => showToast('error', 'Failed to initiate payment. Please try again.'),
  });

  const unlocks: ContactUnlock[] = (data?.data ?? []) as ContactUnlock[];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Credits banner */}
      <View style={styles.creditBanner}>
        <View>
          <Text style={styles.creditLabel}>CONTACTS UNLOCKED</Text>
          <Text style={styles.creditCount}>{unlocks.length}</Text>
        </View>
        <Button
          label="Buy Pack"
          onPress={() => setPackModalOpen(true)}
          variant="primary"
          size="sm"
        />
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.md }}>
          <SkeletonLoader lines={4} />
        </View>
      ) : (
        <FlatList
          data={unlocks}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Palette.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No contacts unlocked"
              subtitle="Unlock advisor contact details to reach them directly. First unlock is FREE."
              actionLabel="Browse Advisors"
              onAction={() => {}}
            />
          }
          renderItem={({ item }) => (
            <UnlockCard unlock={item} />
          )}
        />
      )}

      {/* Buy Pack Modal */}
      <Modal visible={packModalOpen} animationType="slide" transparent onRequestClose={() => setPackModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Contact Pack</Text>

            <View style={styles.packCard}>
              <Text style={styles.packEmoji}>📞</Text>
              <Text style={styles.packName}>5 Contact Unlocks</Text>
              <Text style={styles.packDesc}>
                Unlock direct phone & email of 5 advisors. Valid for 30 days.
              </Text>
              <Text style={styles.packPrice}>₹99</Text>
            </View>

            <View style={styles.benefitList}>
              {[
                '✅ Direct advisor phone number',
                '✅ Direct advisor email address',
                '✅ Skip booking — contact directly',
                '✅ Valid for 30 days',
              ].map((b) => (
                <Text key={b} style={styles.benefit}>{b}</Text>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                onPress={() => setPackModalOpen(false)}
                variant="ghost"
                style={styles.sheetBtn}
              />
              <Button
                label={isPending ? 'Processing…' : 'Buy for ₹99'}
                onPress={() => buyPack()}
                variant="primary"
                loading={isPending}
                disabled={isPending}
                style={styles.sheetBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const UnlockCard: React.FC<{ unlock: ContactUnlock }> = ({ unlock }) => {
  const { advisor, isFree } = unlock;

  return (
    <View style={styles.unlockCard}>
      <View style={styles.unlockTop}>
        <Avatar
          uri={advisor?.avatarUrl}
          fallbackName={advisor?.fullName}
          size={44}
          showBorder
        />
        <View style={styles.unlockInfo}>
          <Text style={styles.unlockName}>{advisor?.fullName ?? 'Advisor'}</Text>
          {advisor?.businessName ? (
            <Text style={styles.unlockBiz}>{advisor.businessName}</Text>
          ) : null}
        </View>
        {isFree ? (
          <Badge text="Free" color="emerald" />
        ) : (
          <Badge text="Pack" color="indigo" />
        )}
      </View>

      {advisor?.phoneNumber ? (
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL(`tel:${advisor.phoneNumber}`)}
        >
          <Text style={styles.contactIcon}>📞</Text>
          <Text style={styles.contactText}>{advisor.phoneNumber}</Text>
          <Text style={styles.callText}>Call</Text>
        </TouchableOpacity>
      ) : null}

      {advisor?.email ? (
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL(`mailto:${advisor.email}`)}
        >
          <Text style={styles.contactIcon}>✉️</Text>
          <Text style={styles.contactText}>{advisor.email}</Text>
          <Text style={styles.callText}>Email</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },

  creditBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: Spacing.md,
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  creditLabel: { ...Typography.label },
  creditCount: { color: Palette.primary, fontSize: 28, fontWeight: '800' },

  list: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },

  unlockCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  unlockTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  unlockInfo: { flex: 1 },
  unlockName: { ...Typography.body, fontWeight: '700' },
  unlockBiz: { ...Typography.caption },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  contactIcon: { fontSize: 14 },
  contactText: { flex: 1, ...Typography.body, color: Palette.primary, fontWeight: '600' },
  callText: {
    color: Palette.accent,
    fontSize: 12,
    fontWeight: '700',
  },

  overlay: { flex: 1, backgroundColor: Palette.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  handle: {
    width: 36, height: 4, backgroundColor: Palette.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.xs,
  },
  sheetTitle: { ...Typography.subheading, textAlign: 'center' },
  packCard: {
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.gold,
  },
  packEmoji: { fontSize: 40 },
  packName: { ...Typography.subheading },
  packDesc: { ...Typography.caption, textAlign: 'center' },
  packPrice: { color: Palette.primary, fontSize: 28, fontWeight: '800' },
  benefitList: { gap: Spacing.xs },
  benefit: { ...Typography.body, color: Palette.textSecondary },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm },
  sheetBtn: { flex: 1 },
});
