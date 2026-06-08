import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Palette, Spacing, Typography, Radius } from '../../../shared/theme';
import { Avatar, Button } from '../../../shared/components';
import { useAuthStore } from '../../../shared/store';
import { ProfileStackParamList } from '../../../shared/navigation/types';
import { formatPhone } from '../../../shared/utils/format';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ClientProfile'>;

const MENU_ITEMS: Array<{
  label: string;
  icon: string;
  screen: keyof ProfileStackParamList;
}> = [
  { label: 'My Wallet', icon: '💳', screen: 'Wallet' },
  { label: 'Unlocked Contacts', icon: '📞', screen: 'ContactsUnlocked' },
  { label: 'Support', icon: '🎧', screen: 'Support' },
];

export const ClientProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Avatar uri={user?.avatarUrl} fallbackName={user?.fullName} size={72} showBorder />
          <View style={styles.info}>
            <Text style={styles.name}>{user?.fullName ?? 'Client'}</Text>
            <Text style={styles.phone}>{formatPhone(user?.phoneNumber ?? '')}</Text>
            {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          </View>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map(({ label, icon, screen }) => (
            <TouchableOpacity
              key={screen}
              style={styles.menuItem}
              onPress={() => (navigation as any).navigate(screen)}
            >
              <Text style={styles.menuIcon}>{icon}</Text>
              <Text style={styles.menuLabel}>{label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button label="Sign Out" onPress={() => logout()} variant="outline" fullWidth />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { flex: 1, padding: Spacing.lg, gap: Spacing.xl },
  header: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  info: { flex: 1, gap: Spacing.xs },
  name: { ...Typography.subheading },
  phone: { ...Typography.caption },
  email: { ...Typography.caption },
  menu: {
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, ...Typography.body },
  menuArrow: { color: Palette.textSecondary, fontSize: 20 },
});
