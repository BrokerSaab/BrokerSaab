import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { useUiStore } from '../../../shared/store/uiStore';
import { useAuthStore } from '../../../shared/store';
import { walletRepository } from '../../../shared/api';
import { useRazorpayPayment } from '../../../shared/hooks/useRazorpayPayment';
import { Button, Badge, EmptyState, SkeletonLoader } from '../../../shared/components';
import { formatCurrency, formatRelative } from '../../../shared/utils/format';
import type { WalletTransaction } from '@brokersaab/shared-types';

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export const WalletScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useUiStore();
  const qc = useQueryClient();
  const { pay } = useRazorpayPayment();

  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['wallet'],
    queryFn: walletRepository.getBalance,
    staleTime: 2 * 60 * 1000,
  });

  const { mutate: initTopup, isPending } = useMutation({
    mutationFn: () => walletRepository.addFunds(Number(amount)),
    onSuccess: async (res) => {
      if (!res.data) return;
      const { orderId, amount: amtPaise, keyId } = res.data;
      try {
        const result = await pay(orderId, amtPaise, {
          name: user?.fullName ?? undefined,
          email: user?.email ?? undefined,
          contact: user?.phoneNumber ?? undefined,
        });
        await walletRepository.verifyTopup(result);
        qc.invalidateQueries({ queryKey: ['wallet'] });
        setAddFundsOpen(false);
        setAmount('');
        showToast('success', 'Wallet topped up successfully!');
      } catch {
        showToast('error', 'Payment was cancelled or failed.');
      }
    },
    onError: () => showToast('error', 'Failed to initiate payment. Please try again.'),
  });

  const wallet = data?.data;
  const transactions = wallet?.transactions ?? [];

  const txTypeColor = (type: string) => {
    if (type === 'CREDIT') return 'emerald';
    if (type === 'DEBIT') return 'red';
    return 'slate';
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Balance card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        {isLoading ? (
          <View style={styles.balanceSkeleton} />
        ) : (
          <Text style={styles.balanceAmount}>
            {formatCurrency(wallet?.balance ?? 0)}
          </Text>
        )}
        <Button
          label="+ Add Funds"
          onPress={() => setAddFundsOpen(true)}
          variant="primary"
          size="sm"
          style={styles.addBtn}
        />
      </View>

      {/* Transactions */}
      {isLoading ? (
        <View style={{ padding: Spacing.md }}>
          <SkeletonLoader lines={5} />
        </View>
      ) : (
        <FlatList
          data={transactions as WalletTransaction[]}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Palette.primary} />
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>TRANSACTION HISTORY</Text>
          }
          ListEmptyComponent={
            <EmptyState
              title="No transactions yet"
              subtitle="Add funds or book a consultation to see transactions here"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txIcon}>
                <Text style={styles.txEmoji}>
                  {item.type === 'CREDIT' ? '⬆️' : '⬇️'}
                </Text>
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>
                  {item.gatewayMessage ?? (item.type === 'CREDIT' ? 'Wallet Topup' : 'Payment')}
                </Text>
                <Text style={styles.txDate}>{formatRelative(item.createdAt)}</Text>
              </View>
              <View style={styles.txRight}>
                <Text
                  style={[
                    styles.txAmount,
                    { color: item.type === 'CREDIT' ? Palette.success : Palette.error },
                  ]}
                >
                  {item.type === 'CREDIT' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
                <Badge text={item.status} color={txTypeColor(item.type) as any} />
              </View>
            </View>
          )}
        />
      )}

      {/* Add Funds Modal */}
      <Modal visible={addFundsOpen} animationType="slide" transparent onRequestClose={() => setAddFundsOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Add Funds</Text>

            <Text style={styles.label}>QUICK SELECT</Text>
            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.quickChip, amount === String(q) && styles.quickChipActive]}
                  onPress={() => setAmount(String(q))}
                >
                  <Text style={[styles.quickText, amount === String(q) && styles.quickTextActive]}>
                    ₹{q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>OR ENTER AMOUNT</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="₹ 0"
              placeholderTextColor={Palette.textMuted}
            />

            {amount && Number(amount) >= 10 ? (
              <View style={styles.summary}>
                <Text style={styles.summaryLabel}>You will add</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(Number(amount))}</Text>
              </View>
            ) : null}

            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                onPress={() => { setAddFundsOpen(false); setAmount(''); }}
                variant="ghost"
                style={styles.sheetBtn}
              />
              <Button
                label={isPending ? 'Processing…' : 'Pay with Razorpay'}
                onPress={() => initTopup()}
                variant="primary"
                loading={isPending}
                disabled={!amount || Number(amount) < 10 || isPending}
                style={styles.sheetBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },

  balanceCard: {
    margin: Spacing.md,
    backgroundColor: Palette.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.gold,
  },
  balanceLabel: { ...Typography.label },
  balanceSkeleton: {
    width: 140, height: 36, borderRadius: Radius.md,
    backgroundColor: Palette.surface, opacity: 0.5,
  },
  balanceAmount: {
    color: Palette.primary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  addBtn: { marginTop: Spacing.xs },

  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  listHeader: { ...Typography.label, marginBottom: Spacing.sm },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
  },
  txIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Palette.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  txEmoji: { fontSize: 16 },
  txInfo: { flex: 1, gap: 2 },
  txDesc: { ...Typography.body, fontWeight: '600' },
  txDate: { ...Typography.caption },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontWeight: '800', fontSize: 14 },

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
  label: { ...Typography.label },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  quickChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Palette.border,
    backgroundColor: Palette.card,
  },
  quickChipActive: { borderColor: Palette.primary, backgroundColor: Palette.primaryLight },
  quickText: { fontSize: 13, color: Palette.textSecondary, fontWeight: '600' },
  quickTextActive: { color: Palette.primary },
  amountInput: {
    backgroundColor: Palette.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    color: Palette.text, fontSize: 20, fontWeight: '700',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    textAlign: 'center',
  },
  summary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Palette.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Palette.border,
    padding: Spacing.md,
  },
  summaryLabel: { ...Typography.body, color: Palette.textSecondary },
  summaryAmount: { color: Palette.primary, fontWeight: '800', fontSize: 18 },
  sheetActions: { flexDirection: 'row', gap: Spacing.sm },
  sheetBtn: { flex: 1 },
});
