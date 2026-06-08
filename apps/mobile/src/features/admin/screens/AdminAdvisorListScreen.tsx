import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { AdminAdvisorsStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { adminRepository } from '../../../shared/api';
import { Avatar, StatusBadge, SkeletonLoader, EmptyState } from '../../../shared/components';

type Props = NativeStackScreenProps<AdminAdvisorsStackParamList, 'AdminAdvisorList'>;

const STATUS_TABS = ['ALL', 'PENDING', 'UNDER_REVIEW', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'REJECTED'];

export const AdminAdvisorListScreen: React.FC<Props> = ({ navigation }) => {
  const [status, setStatus] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-advisors', status],
    queryFn: () => adminRepository.getAdvisors({ status: status === 'ALL' ? undefined : status }),
  });

  const advisors = data?.data ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.tabs}>
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setStatus(tab)}
            style={[styles.tab, status === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, status === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <SkeletonLoader lines={4} />
      ) : (
        <FlatList
          data={advisors}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No advisors found" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('AdminAdvisorDetail', { advisorId: item.id })}
            >
              <Avatar uri={item.avatarUrl} fallbackName={item.fullName} size={44} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.fullName}</Text>
                <Text style={styles.rowSub}>{item.location}</Text>
              </View>
              <StatusBadge status={item.verificationStatus} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  tabs: { flexDirection: 'row', padding: Spacing.sm, gap: Spacing.xs },
  tab: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 6 },
  tabActive: { backgroundColor: Palette.primaryLight },
  tabText: { ...Typography.caption, fontSize: 11 },
  tabTextActive: { color: Palette.primary, fontWeight: '700' },
  list: { padding: Spacing.md, gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.card,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  rowInfo: { flex: 1 },
  rowName: { ...Typography.body, fontWeight: '600' },
  rowSub: { ...Typography.caption },
});
