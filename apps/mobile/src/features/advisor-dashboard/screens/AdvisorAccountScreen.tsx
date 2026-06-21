import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette, Colors, Spacing, Radius, Shadow, Typography } from '../../../shared/theme';
import { Button, Avatar } from '../../../shared/components';
import { useAuthStore } from '../../../shared/store';
import { useUiStore } from '../../../shared/store/uiStore';
import { advisorRepository, uploadRepository } from '../../../shared/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'https://brokersaab-backend.onrender.com';

function resolveUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export const AdvisorAccountScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuthStore();
  const { showToast } = useUiStore();
  const qc = useQueryClient();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { data: imagesData, refetch: refetchImages } = useQuery({
    queryKey: ['advisor-images'],
    queryFn: () => advisorRepository.getMe(),
    staleTime: 5 * 60 * 1000,
  });

  const advisor = (imagesData?.data as any);
  const coverUrl = resolveUrl(advisor?.coverImageUrl);
  const avatarUrl = resolveUrl(advisor?.avatarUrl ?? user?.avatarUrl);

  const pickAndUpload = async (type: 'avatar' | 'cover') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo library access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: asset.mimeType ?? 'image/jpeg',
      name: asset.fileName ?? `${type}.jpg`,
    } as any);

    try {
      if (type === 'avatar') {
        setUploadingAvatar(true);
        const res = await uploadRepository.uploadAvatar(formData);
        if (res.success) {
          updateUser({ avatarUrl: resolveUrl(res.avatarUrl) });
          qc.invalidateQueries({ queryKey: ['advisor-images'] });
          showToast('success', 'Profile photo updated');
        }
      } else {
        setUploadingCover(true);
        const res = await uploadRepository.uploadCover(formData);
        if (res.success) {
          qc.invalidateQueries({ queryKey: ['advisor-images'] });
          showToast('success', 'Cover photo updated');
        }
      }
      refetchImages();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Upload failed. Try again.');
    } finally {
      setUploadingAvatar(false);
      setUploadingCover(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Cover photo */}
        <View style={styles.coverWrap}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>Add a cover photo to showcase your work</Text>
            </View>
          )}

          {/* Cover upload button */}
          <TouchableOpacity
            style={styles.coverEditBtn}
            onPress={() => pickAndUpload('cover')}
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.cameraIcon}>📷</Text>
            )}
          </TouchableOpacity>

          {/* Avatar overlapping cover bottom */}
          <View style={styles.avatarAnchor}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => pickAndUpload('avatar')}
              disabled={uploadingAvatar}
              activeOpacity={0.85}
            >
              <Avatar uri={avatarUrl} fallbackName={user?.fullName} size={88} showBorder />
              <View style={styles.avatarEditBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.avatarEditIcon}>✎</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Identity info */}
        <View style={styles.identitySection}>
          <Text style={styles.advisorName}>{user?.fullName ?? 'Advisor'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>ADVISOR</Text>
          </View>
          {user?.phoneNumber ? (
            <Text style={styles.phoneLine}>{user.phoneNumber}</Text>
          ) : null}
        </View>

        {/* Upload hint cards */}
        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Profile Photo</Text>
          <Text style={styles.hintDesc}>
            Tap your avatar above to upload a professional headshot. Use a square image for best results.
          </Text>
          <TouchableOpacity
            style={styles.hintBtn}
            onPress={() => pickAndUpload('avatar')}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color={Palette.primary} />
            ) : (
              <Text style={styles.hintBtnText}>
                {avatarUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>Cover Photo</Text>
          <Text style={styles.hintDesc}>
            Add a wide banner image (16:9) to showcase your work, certificates, or office. This is the first thing clients see on your profile.
          </Text>
          <TouchableOpacity
            style={styles.hintBtn}
            onPress={() => pickAndUpload('cover')}
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <ActivityIndicator size="small" color={Palette.primary} />
            ) : (
              <Text style={styles.hintBtnText}>
                {coverUrl ? 'Change Cover Photo' : 'Upload Cover Photo'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.signOutWrap}>
          <Button label="Sign Out" onPress={() => logout()} variant="outline" fullWidth />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const COVER_HEIGHT = 190;
const AVATAR_SIZE = 88;
const AVATAR_OVERLAP = AVATAR_SIZE / 2 + 6;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  scroll: { paddingBottom: Spacing.xxxl },

  // Cover
  coverWrap: {
    height: COVER_HEIGHT + AVATAR_OVERLAP,
    backgroundColor: Colors.navy[800],
  },
  coverImage: {
    width: '100%',
    height: COVER_HEIGHT,
  },
  coverPlaceholder: {
    height: COVER_HEIGHT,
    backgroundColor: Colors.navy[700],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  coverPlaceholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  coverEditBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { fontSize: 16 },

  // Avatar overlapping cover
  avatarAnchor: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.lg,
  },
  avatarWrap: { position: 'relative' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: { color: Colors.white, fontSize: 12, fontWeight: '800' },

  // Identity
  identitySection: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: 4,
  },
  advisorName: { fontSize: 20, fontWeight: '800', color: Colors.navy[800] },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800', color: Palette.primary, letterSpacing: 1 },
  phoneLine: { fontSize: 13, color: Colors.slate[400], marginTop: 2 },

  // Hint cards
  hintCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.slate[200],
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  hintTitle: { fontSize: 14, fontWeight: '800', color: Colors.navy[800] },
  hintDesc: { fontSize: 12, color: Colors.slate[500], lineHeight: 18 },
  hintBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.primaryLight,
    borderWidth: 1,
    borderColor: Palette.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  hintBtnText: { fontSize: 12, fontWeight: '700', color: Palette.primary },

  signOutWrap: { marginHorizontal: Spacing.lg, marginTop: Spacing.sm },
});
