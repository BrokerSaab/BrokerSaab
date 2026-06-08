import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { Button } from '../../../shared/components';
import { useAuthStore } from '../../../shared/store';
import { Avatar } from '../../../shared/components';

export const AdvisorAccountScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Avatar uri={user?.avatarUrl} fallbackName={user?.fullName} size={64} showBorder />
          <Text style={styles.name}>{user?.fullName ?? 'Advisor'}</Text>
          <Text style={styles.role}>ADVISOR</Text>
        </View>
        <Button label="Sign Out" onPress={() => logout()} variant="outline" fullWidth />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { flex: 1, padding: Spacing.lg, gap: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.xl },
  name: { ...Typography.subheading },
  role: { ...Typography.label },
});
