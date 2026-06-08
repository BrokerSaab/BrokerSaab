import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { Button, Input } from '../../../shared/components';
import { useAuthStore, useUiStore } from '../../../shared/store';
import { authRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterComplete'>;

export const RegisterCompleteScreen: React.FC<Props> = ({ route }) => {
  const { phoneNumber } = route.params;
  const { login } = useAuthStore();
  const { showToast } = useUiStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      showToast('error', 'Please enter your full name');
      return;
    }
    setLoading(true);
    try {
      const res = await authRepository.registerClient(phoneNumber, fullName.trim(), email.trim() || undefined);
      if (res.accessToken && res.refreshToken && res.user) {
        await login({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
      }
    } catch (e: any) {
      showToast('error', e?.response?.data?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Complete Registration</Text>
          <Text style={styles.subtitle}>Registering as Client for {phoneNumber}</Text>

          <Input
            label="FULL NAME"
            placeholder="e.g. Ravi Ranjan"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Input
            label="EMAIL (OPTIONAL)"
            placeholder="e.g. ravi@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1 },
  container: { padding: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.xl },
  title: { ...Typography.heading },
  subtitle: { ...Typography.caption, marginBottom: Spacing.md },
});
