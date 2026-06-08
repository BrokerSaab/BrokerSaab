import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { Button, Input } from '../../../shared/components';
import { useAuthStore, useUiStore } from '../../../shared/store';
import { authRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'AdminLogin'>;

export const AdminLoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login } = useAuthStore();
  const { showToast } = useUiStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showToast('error', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await authRepository.loginPassword(email.trim(), password);
      await login({ accessToken: res.accessToken, refreshToken: res.refreshToken }, res.user);
    } catch (e: any) {
      showToast('error', e?.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Admin Portal</Text>
          <Text style={styles.subtitle}>Sign in with your admin credentials</Text>

          <Input
            label="EMAIL ADDRESS"
            placeholder="admin@brokersaab.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="PASSWORD"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            secureToggle
          />

          <Button label="Sign In" onPress={handleLogin} loading={loading} fullWidth size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  flex: { flex: 1 },
  container: { padding: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.xl },
  back: { marginBottom: Spacing.lg },
  backText: { color: Palette.textSecondary, fontSize: 14 },
  title: { ...Typography.heading },
  subtitle: { ...Typography.caption, marginBottom: Spacing.md },
});
