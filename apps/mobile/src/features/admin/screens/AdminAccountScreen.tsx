import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { Avatar, Button } from '../../../shared/components';
import { useAuthStore } from '../../../shared/store';

export const AdminAccountScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Avatar fallbackName={user?.fullName} size={72} showBorder />
          <Text style={styles.name}>{user?.fullName ?? 'Admin'}</Text>
          <Text style={styles.role}>{user?.role}</Text>
          <Text style={styles.email}>{user?.email}</Text>
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
  email: { ...Typography.caption },
});
