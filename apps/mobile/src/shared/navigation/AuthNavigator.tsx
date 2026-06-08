import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { Palette } from '../theme';
import { WelcomeScreen } from '../../features/auth/screens/WelcomeScreen';
import { PhoneOtpScreen } from '../../features/auth/screens/PhoneOtpScreen';
import { RegisterCompleteScreen } from '../../features/auth/screens/RegisterCompleteScreen';
import { AdminLoginScreen } from '../../features/auth/screens/AdminLoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: Palette.surface },
      headerTintColor: Palette.text,
      headerTitleStyle: { color: Palette.text, fontWeight: '700' },
      headerBackTitleVisible: false,
      contentStyle: { backgroundColor: Palette.background },
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PhoneOtp" component={PhoneOtpScreen} options={{ headerShown: false }} />
    <Stack.Screen
      name="RegisterComplete"
      component={RegisterCompleteScreen}
      options={{ title: 'Create Account' }}
    />
    <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);
