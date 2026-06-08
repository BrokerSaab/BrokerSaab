import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminAdvisorsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { adminRepository } from '../../../shared/api';
import { Avatar, StatusBadge, Button } from '../../../shared/components';
import { useUiStore } from '../../../shared/store';

type Props = NativeStackScreenProps<AdminAdvisorsStackParamList, 'AdminAdvisorDetail'>;

export const AdminAdvisorDetailScreen: React.FC<Props> = ({ route }) => {
  const { advisorId } = route.params;
  const { showToast } = useUiStore();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-advisor', advisorId],
    queryFn: () => adminRepository.getAdvisorDetail(advisorId),
  });

  const { mutate: verify, isPending: verifying } = useMutation({
    mutationFn: (action: 'approve' | 'reject') =>
      adminRepository.verifyAdvisor(advisorId, action),
    onSuccess: (_, action) => {
      showToast('success', `Advisor ${action === 'approve' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['admin-advisor', advisorId] });
      qc.invalidateQueries({ queryKey: ['admin-advisors'] });
    },
    onError: () => showToast('error', 'Action failed'),
  });

  const advisor = data?.data;

  if (isLoading || !advisor) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}><ActivityIndicator color={Palette.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Avatar uri={advisor.avatarUrl} fallbackName={advisor.fullName} size={72} showBorder />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{advisor.fullName}</Text>
            <Text style={styles.email}>{advisor.email}</Text>
            <StatusBadge status={advisor.verificationStatus} size="md" />
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="Location" value={advisor.location} />
          <InfoRow label="Experience" value={`${advisor.experienceYears} years`} />
          <InfoRow label="Type" value={advisor.advisorType} />
          {advisor.licenseNumber ? <InfoRow label="License" value={advisor.licenseNumber} /> : null}
        </View>

        <View style={styles.actions}>
          <Button
            label="Approve"
            onPress={() => verify('approve')}
            variant="primary"
            loading={verifying}
            style={styles.actionBtn}
          />
          <Button
            label="Reject"
            onPress={() => verify('reject')}
            variant="danger"
            loading={verifying}
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  headerInfo: { flex: 1, gap: Spacing.xs },
  name: { ...Typography.subheading },
  email: { ...Typography.caption },
  infoCard: {
    backgroundColor: Palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { ...Typography.caption },
  infoValue: { ...Typography.body, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
});
