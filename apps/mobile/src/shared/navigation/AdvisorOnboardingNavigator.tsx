import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdvisorOnboardingStackParamList } from './types';
import { Palette } from '../theme';

import { OnboardingWelcomeScreen } from '../../features/advisor-onboarding/screens/OnboardingWelcomeScreen';
import { OnboardingPhoneScreen } from '../../features/advisor-onboarding/screens/OnboardingPhoneScreen';
import { OnboardingAdvisorTypeScreen } from '../../features/advisor-onboarding/screens/OnboardingAdvisorTypeScreen';
import { OnboardingAccountScreen } from '../../features/advisor-onboarding/screens/OnboardingAccountScreen';
import { OnboardingProfileScreen } from '../../features/advisor-onboarding/screens/OnboardingProfileScreen';
import { OnboardingKYCScreen } from '../../features/advisor-onboarding/screens/OnboardingKYCScreen';
import { OnboardingServicesScreen } from '../../features/advisor-onboarding/screens/OnboardingServicesScreen';
import { OnboardingAvailabilityScreen } from '../../features/advisor-onboarding/screens/OnboardingAvailabilityScreen';
import { OnboardingReviewScreen } from '../../features/advisor-onboarding/screens/OnboardingReviewScreen';
import { OnboardingSuccessScreen } from '../../features/advisor-onboarding/screens/OnboardingSuccessScreen';

const Stack = createNativeStackNavigator<AdvisorOnboardingStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Palette.surface },
  headerTintColor: Palette.text,
  headerTitleStyle: { color: Palette.text, fontWeight: '700' as const },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: Palette.background },
};

export const AdvisorOnboardingNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
    <Stack.Screen name="OnboardingPhone" component={OnboardingPhoneScreen} />
    <Stack.Screen name="OnboardingAdvisorType" component={OnboardingAdvisorTypeScreen} />
    <Stack.Screen name="OnboardingAccount" component={OnboardingAccountScreen} />
    <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
    <Stack.Screen name="OnboardingKYC" component={OnboardingKYCScreen} />
    <Stack.Screen name="OnboardingServices" component={OnboardingServicesScreen} />
    <Stack.Screen name="OnboardingAvailability" component={OnboardingAvailabilityScreen} />
    <Stack.Screen name="OnboardingReview" component={OnboardingReviewScreen} />
    <Stack.Screen name="OnboardingSuccess" component={OnboardingSuccessScreen} />
  </Stack.Navigator>
);
