import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { Input, Button } from '../../../shared/components';
import { useUiStore } from '../../../shared/store/uiStore';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { OnboardingProgress } from '../components/OnboardingProgress';
import { advisorRepository, uploadRepository } from '../../../shared/api';
import { DocumentType, AdvisorType } from '@brokersaab/shared-types';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingKYC'>;

interface DocTileProps {
  label: string;
  required: boolean;
  url: string;
  onPick: () => Promise<void>;
  uploading: boolean;
}

const DocTile: React.FC<DocTileProps> = ({ label, required, url, onPick, uploading }) => (
  <TouchableOpacity style={[styles.docTile, url ? styles.docTileDone : undefined]} onPress={onPick} disabled={uploading}>
    <View style={styles.docLeft}>
      <Text style={styles.docIcon}>{url ? '✅' : uploading ? '⏳' : '📄'}</Text>
      <View>
        <Text style={styles.docLabel}>{label}</Text>
        <Text style={styles.docSub}>
          {url ? 'Uploaded ✓' : required ? 'Required' : 'Optional'}
        </Text>
      </View>
    </View>
    {uploading ? (
      <ActivityIndicator size="small" color={Palette.primary} />
    ) : (
      <Text style={styles.docAction}>{url ? 'Change' : 'Upload'}</Text>
    )}
  </TouchableOpacity>
);

export const OnboardingKYCScreen: React.FC<Props> = ({ navigation }) => {
  const { showToast } = useUiStore();
  const { form, updateForm } = useOnboardingStore();

  const [aadhaarNum, setAadhaarNum] = useState(form.aadhaarNumber);
  const [aadhaarUrl, setAadhaarUrl] = useState(form.aadhaarUrl);
  const [photoUrl, setPhotoUrl] = useState(form.passportPhotoUrl);
  const [licenseUrl, setLicenseUrl] = useState(form.licenseUrl);
  const [gstUrl, setGstUrl] = useState(form.gstUrl);
  const [uploading, setUploading] = useState<string | null>(null);

  const isAuthorized = form.advisorType === AdvisorType.AUTHORIZED;

  const pickAndUpload = async (docType: DocumentType, setter: (url: string) => void, field: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      if (result.canceled) return;

      setUploading(field);
      const asset = result.assets[0];
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'document.jpg',
      } as any);
      form.append('documentType', docType);

      const res = await uploadRepository.uploadDocument(form);
      if (res.data?.url) {
        setter(res.data.url);
        showToast('success', `${docType.replace(/_/g, ' ')} uploaded!`);
      }
    } catch {
      showToast('error', 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const { mutate: saveProgress, isPending } = useMutation({
    mutationFn: () =>
      advisorRepository.saveOnboardingProgress(6, {
        aadhaarNumber: aadhaarNum,
        aadhaarUrl, passportPhotoUrl: photoUrl, licenseUrl, gstUrl,
      }),
    onSuccess: () => {
      updateForm({
        aadhaarNumber: aadhaarNum,
        aadhaarUrl, passportPhotoUrl: photoUrl, licenseUrl, gstUrl,
      });
      navigation.navigate('OnboardingServices');
    },
    onError: (err: any) => showToast('error', err?.response?.data?.error ?? 'Failed to save KYC'),
  });

  const canProceed = aadhaarNum.length === 12 && aadhaarUrl && photoUrl && (!isAuthorized || licenseUrl);

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingProgress step={6} title="KYC Documents" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Upload Your Documents</Text>
        <Text style={styles.subtitle}>
          All documents are securely stored and reviewed by our admin team only.
        </Text>

        <View>
          <Input
            label="Aadhaar Number *"
            value={aadhaarNum}
            onChangeText={(v) => setAadhaarNum(v.replace(/\D/g, '').slice(0, 12))}
            keyboardType="numeric"
            maxLength={12}
            placeholder="12-digit Aadhaar number"
          />
          <Text style={styles.consent}>
            By entering your Aadhaar, you consent to identity verification as per UIDAI guidelines.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>DOCUMENT UPLOADS</Text>

        <DocTile
          label="Aadhaar Card *"
          required
          url={aadhaarUrl}
          onPick={() => pickAndUpload(DocumentType.AADHAAR_CARD, setAadhaarUrl, 'aadhaar')}
          uploading={uploading === 'aadhaar'}
        />
        <DocTile
          label="Passport-size Photo *"
          required
          url={photoUrl}
          onPick={() => pickAndUpload(DocumentType.PASSPORT_PHOTO, setPhotoUrl, 'photo')}
          uploading={uploading === 'photo'}
        />
        {isAuthorized && (
          <DocTile
            label="License / Authorization Copy *"
            required
            url={licenseUrl}
            onPick={() => pickAndUpload(DocumentType.LICENSE_COPY, setLicenseUrl, 'license')}
            uploading={uploading === 'license'}
          />
        )}
        <DocTile
          label="GST Certificate"
          required={false}
          url={gstUrl}
          onPick={() => pickAndUpload(DocumentType.GST_CERTIFICATE, setGstUrl, 'gst')}
          uploading={uploading === 'gst'}
        />

        <Button
          label={isPending ? 'Saving…' : 'Continue'}
          onPress={() => saveProgress()}
          variant="primary"
          loading={isPending}
          disabled={!canProceed || isPending}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { ...Typography.heading },
  subtitle: { ...Typography.body, color: Palette.textSecondary, lineHeight: 22 },
  consent: { ...Typography.caption, marginTop: Spacing.xs, color: Palette.textMuted },
  sectionLabel: { ...Typography.label },
  docTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  docTileDone: { borderColor: Palette.success },
  docLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  docIcon: { fontSize: 24 },
  docLabel: { ...Typography.body, fontWeight: '600' },
  docSub: { ...Typography.caption },
  docAction: { color: Palette.primary, fontWeight: '700', fontSize: 13 },
});
