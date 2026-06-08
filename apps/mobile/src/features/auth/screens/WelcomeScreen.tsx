import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { Button } from '../../../shared/components';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.hero}>
      <Text style={styles.logo}>BROKERSAAB</Text>
      <Text style={styles.tagline}>Your Trusted Advisor Marketplace</Text>
    </View>

    <View style={styles.actions}>
      <Button
        label="Login / Register"
        onPress={() => navigation.navigate('PhoneOtp')}
        variant="primary"
        size="lg"
        fullWidth
      />
      <TouchableOpacity
        onPress={() => navigation.navigate('PhoneOtp')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Are you an Advisor? Register here</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('AdminLogin')}
        style={styles.link}
      >
        <Text style={[styles.linkText, styles.linkMuted]}>Admin Portal →</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    ...Typography.hero,
    fontSize: 34,
    fontWeight: '900',
    color: Palette.primary,
    letterSpacing: 5,
  },
  tagline: {
    ...Typography.caption,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  actions: { gap: Spacing.md, paddingBottom: Spacing.md },
  link: { alignItems: 'center', paddingVertical: Spacing.xs },
  linkText: { color: Palette.primary, fontSize: 13, fontWeight: '500' },
  linkMuted: { color: Palette.textSecondary, fontSize: 12 },
});
