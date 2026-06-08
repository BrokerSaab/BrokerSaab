import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { WelcomeScreen } from '../../features/auth/screens/WelcomeScreen';
import { TermsScreen } from '../../features/auth/screens/TermsScreen';
import { PhoneOtpScreen } from '../../features/auth/screens/PhoneOtpScreen';
import { RegisterCompleteScreen } from '../../features/auth/screens/RegisterCompleteScreen';
import { SetPasswordScreen } from '../../features/auth/screens/SetPasswordScreen';
import { AdminLoginScreen } from '../../features/auth/screens/AdminLoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0B1F3A' },
    }}
  >
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Terms" component={TermsScreen} />
    <Stack.Screen name="PhoneOtp" component={PhoneOtpScreen} />
    <Stack.Screen name="RegisterComplete" component={RegisterCompleteScreen} />
    <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
    <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
  </Stack.Navigator>
);
