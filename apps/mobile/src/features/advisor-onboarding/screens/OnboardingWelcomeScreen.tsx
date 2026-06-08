import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdvisorOnboardingStackParamList } from '../../../shared/navigation/types';
import { Palette, Spacing, Typography } from '../../../shared/theme';
import { Button } from '../../../shared/components';

type Props = NativeStackScreenProps<AdvisorOnboardingStackParamList, 'OnboardingWelcome'>;

export const OnboardingWelcomeScreen: React.FC<Props> = ({ navigation }) => (
  <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: '10%' }]} />
      </View>
      <Text style={styles.step}>STEP 1 OF 10</Text>
      <Text style={styles.title}>Welcome, Advisor!</Text>
      <Text style={styles.body}>
        Let's set up your professional profile. This process takes about 10 minutes and helps clients find and trust you.
      </Text>
      <Button
        label="Get Started"
        onPress={() => navigation.navigate('OnboardingPhone')}
        variant="primary"
        fullWidth
        size="lg"
      />
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.background },
  container: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  progress: { height: 4, backgroundColor: Palette.card, borderRadius: 2 },
  progressBar: { height: 4, backgroundColor: Palette.primary, borderRadius: 2 },
  step: { ...Typography.label },
  title: { ...Typography.heading },
  body: { ...Typography.body, lineHeight: 22 },
});
