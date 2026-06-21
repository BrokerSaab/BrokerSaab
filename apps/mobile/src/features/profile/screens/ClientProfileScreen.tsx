import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Palette, Spacing, Radius, Shadow } from '../../../shared/theme';
import { Avatar, Button, BrokerSaabLogo } from '../../../shared/components';
import { useAuthStore } from '../../../shared/store';
import { useUiStore } from '../../../shared/store/uiStore';
import { contactRepository, uploadRepository } from '../../../shared/api';
import { ProfileStackParamList } from '../../../shared/navigation/types';
import { formatPhone } from '../../../shared/utils/format';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ClientProfile'>;

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://brokersaab-backend.onrender.com';

function resolveUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

const MENU_ITEMS: Array<{ label: string; icon: string; screen: keyof ProfileStackParamList; desc: string }> = [
  { label: 'My Wallet',          icon: '💳', screen: 'Wallet',           desc: 'Check balance & transactions' },
  { label: 'Contact Pack',       icon: '📦', screen: 'BuyPack',          desc: 'Buy or top up advisor contacts' },
  { label: 'Unlocked Contacts',  icon: '📞', screen: 'ContactsUnlocked', desc: 'Advisors you\'ve revealed' },
];

export const ClientProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout, updateUser } = useAuthStore();
  const { showToast } = useUiStore();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: creditStatus } = useQuery({
    queryKey: ['contact-credits'],
    queryFn: () => contactRepository.getMyStatus(),
    staleTime: 2 * 60 * 1000,
  });

  const creditsRemaining = creditStatus?.creditsRemaining ?? 0;
  const creditsTotal     = creditStatus?.creditsTotal ?? 0;
  const expiresAt        = creditStatus?.expiresAt;
  const hasPack          = creditsTotal > 0;

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const handleAvatarPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo library access to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: asset.mimeType ?? 'image/jpeg',
      name: asset.fileName ?? 'avatar.jpg',
    } as any);

    try {
      setUploadingAvatar(true);
      const res = await uploadRepository.uploadUserAvatar(formData);
      if (res.success) {
        updateUser({ avatarUrl: resolveUrl(res.avatarUrl) });
        showToast('success', 'Profile photo updated');
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Upload failed. Try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy[800]} />

      {/* Navbar */}
      <View style={styles.navbar}>
        <BrokerSaabLogo size="sm" variant="light" />
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          {/* Tappable avatar with camera badge */}
          <TouchableOpacity
            onPress={handleAvatarPress}
            disabled={uploadingAvatar}
            activeOpacity={0.85}
            style={styles.avatarWrap}
          >
            <Avatar uri={resolveUrl(user?.avatarUrl)} fallbackName={user?.fullName} size={68} showBorder />
            <View style={styles.avatarBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.avatarBadgeIcon}>📷</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.fullName ?? 'Client'}</Text>
            <Text style={styles.phone}>{formatPhone(user?.phoneNumber ?? '')}</Text>
            {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>CLIENT ACCOUNT</Text>
            </View>
          </View>
        </View>

        {/* Credits card */}
        <View style={hasPack ? styles.creditCardActive : styles.creditCardEmpty}>
          {hasPack ? (
            <>
              <View style={styles.creditRow}>
                <View>
                  <Text style={styles.creditLabel}>CONTACT CREDITS</Text>
                  <View style={styles.creditCountRow}>
                    <Text style={styles.creditCount}>{creditsRemaining}</Text>
                    <Text style={styles.creditTotal}> / {creditsTotal} remaining</Text>
                  </View>
                  {expiryLabel ? (
                    <Text style={styles.creditExpiry}>Valid till {expiryLabel}</Text>
                  ) : null}
                </View>
                <View style={styles.creditIconWrap}>
                  <Text style={{ fontSize: 28 }}>📞</Text>
                </View>
              </View>
              <View style={styles.creditBar}>
                <View
                  style={[
                    styles.creditBarFill,
                    { width: `${Math.round((creditsRemaining / creditsTotal) * 100)}%` },
                  ]}
                />
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('BuyPack')}
                style={styles.topUpBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.topUpBtnText}>+ Top Up Credits</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.emptyCreditsRow}>
                <View>
                  <Text style={styles.emptyCreditsTitle}>No Contact Pack</Text>
                  <Text style={styles.emptyCreditsDesc}>
                    Get 20 advisor contacts for just ₹116.82
                  </Text>
                </View>
                <Text style={{ fontSize: 28 }}>📦</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('BuyPack')}
                style={styles.buyPackBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.buyPackBtnText}>Buy Contact Pack →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map(({ label, icon, screen, desc }) => (
            <TouchableOpacity
              key={screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(screen as any)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Text style={styles.menuIcon}>{icon}</Text>
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{label}</Text>
                <Text style={styles.menuDesc}>{desc}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <Button label="Sign Out" onPress={() => logout()} variant="outline" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.navy[800] },
  body: { flex: 1, backgroundColor: Palette.background },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxxl },

  navbar: {
    backgroundColor: Colors.navy[800],
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, paddingBottom: Spacing.lg,
  },

  // Profile card
  profileCard: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.slate[200],
    ...Shadow.sm,
  },
  avatarWrap: { position: 'relative' },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.navy[800],
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeIcon: { fontSize: 10 },
  profileInfo: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '800', color: Colors.navy[800] },
  phone: { fontSize: 13, color: Colors.slate[500] },
  email: { fontSize: 12, color: Colors.slate[400] },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.indigo[700], letterSpacing: 1 },

  // Credits card
  creditCardActive: {
    backgroundColor: Colors.navy[800], borderRadius: Radius.xl,
    padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    ...Shadow.md, shadowColor: Colors.navy[900],
  },
  creditCardEmpty: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.4)',
    borderStyle: 'dashed',
  },
  creditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  creditLabel: { fontSize: 10, fontWeight: '700', color: Colors.gold[400], letterSpacing: 1.5, marginBottom: 4 },
  creditCountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  creditCount: { fontSize: 38, fontWeight: '900', color: Colors.white, lineHeight: 42 },
  creditTotal: { fontSize: 13, color: 'rgba(255,255,255,0.5)', paddingBottom: 6 },
  creditExpiry: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  creditIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(212,175,55,0.15)', borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  creditBar: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden',
  },
  creditBarFill: {
    height: 4, backgroundColor: Colors.gold[500], borderRadius: 2,
  },
  topUpBtn: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  topUpBtnText: { fontSize: 12, fontWeight: '700', color: Colors.gold[400] },

  emptyCreditsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyCreditsTitle: { fontSize: 16, fontWeight: '800', color: Colors.navy[800] },
  emptyCreditsDesc: { fontSize: 12, color: Colors.slate[500], marginTop: 2, maxWidth: 200 },
  buyPackBtn: {
    backgroundColor: Colors.gold[500], borderRadius: Radius.lg,
    paddingVertical: Spacing.sm + 2, alignItems: 'center',
  },
  buyPackBtnText: { fontSize: 14, fontWeight: '800', color: Colors.navy[900] },

  // Menu
  menuCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.slate[200], overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.slate[100],
  },
  menuIconWrap: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.slate[50], borderWidth: 1, borderColor: Colors.slate[200],
    alignItems: 'center', justifyContent: 'center',
  },
  menuIcon: { fontSize: 18 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: Colors.navy[800] },
  menuDesc: { fontSize: 11, color: Colors.slate[400], marginTop: 1 },
  menuArrow: { color: Colors.slate[300], fontSize: 22, fontWeight: '300' },
});
