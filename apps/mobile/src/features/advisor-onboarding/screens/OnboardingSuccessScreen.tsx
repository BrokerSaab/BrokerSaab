import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography, Radius, Shadow } from '../../../shared/theme';
import { Button, Badge } from '../../../shared/components';
import { useOnboardingStore } from '../hooks/useOnboardingStore';
import { useAuthStore } from '../../../shared/store';
import { notificationRepository } from '../../../shared/api';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingSuccess'>;

export const OnboardingSuccessScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { reset } = useOnboardingStore();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Request push notification permission and register token
    registerPushToken();
  }, []);

  const registerPushToken = async () => {
    try {
      // expo-notifications remote push not available in Expo Go — use dev build for this feature
      const Notifications = require('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = await Notifications.getExpoPushTokenAsync();
      if (token.data) {
        await notificationRepository.registerPushToken({
          token: token.data,
          platform: Platform.OS as 'android' | 'ios',
        });
      }
    } catch {}
  };

  const handleGoToDashboard = () => {
    reset();
    // The auth flow: advisor is now registered but in PENDING state.
    // They need to log in again. Redirect to auth.
    logout();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <Text style={styles.emoji}>🎉</Text>
        </Animated.View>

        <Animated.View style={[styles.content, { opacity: opacityAnim }]}>
          <Text style={styles.title}>Application Submitted!</Text>
          <Text style={styles.subtitle}>
            Your advisor profile has been submitted for review. Our admin team will verify
            your documents and credentials within 2-3 business days.
          </Text>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Application Status</Text>
              <Badge text="Under Review" color="amber" />
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Account</Text>
              <Text style={styles.statusValue}>{user?.email ?? user?.phoneNumber}</Text>
            </View>
          </View>

          <View style={styles.whatNext}>
            <Text style={styles.whatNextTitle}>WHAT HAPPENS NEXT?</Text>
            {[
              '📋 Admin reviews your documents (1-2 days)',
              '📧 You receive an email notification on approval',
              '✅ Profile goes live — clients can find and book you',
              '💰 Start earning from consultations',
            ].map((step) => (
              <Text key={step} style={styles.whatNextStep}>{step}</Text>
            ))}
          </View>
        </Animated.View>

        <Button
          label="Done — Go to Login"
          onPress={handleGoToDashboard}
          variant="primary"
          fullWidth
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: {
    flex: 1, padding: Spacing.xl,
    justifyContent: 'center', gap: Spacing.xl,
  },
  iconWrap: { alignSelf: 'center' },
  emoji: { fontSize: 80 },
  content: { gap: Spacing.lg },
  title: { ...Typography.heading, fontSize: 24, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Palette.textSecondary, textAlign: 'center', lineHeight: 22 },

  statusCard: {
    backgroundColor: Palette.card, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Palette.border,
    padding: Spacing.md, gap: Spacing.sm,
    ...Shadow.sm,
  },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  statusLabel: { ...Typography.caption },
  statusValue: { ...Typography.body, fontWeight: '600' },

  whatNext: {
    backgroundColor: Palette.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Palette.border,
    padding: Spacing.md, gap: Spacing.sm,
  },
  whatNextTitle: { ...Typography.label },
  whatNextStep: { ...Typography.body, lineHeight: 22 },
});
