import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { Palette } from '../theme';
import { useAuthStore } from '../store/authStore';
import { setLogoutCallback } from '../api/apiClient';
import { Role } from '@brokersaab/shared-types';

import { AuthNavigator } from './AuthNavigator';
import { ClientTabNavigator } from './ClientTabNavigator';
import { AdvisorTabNavigator } from './AdvisorTabNavigator';
import { AdvisorOnboardingNavigator } from './AdvisorOnboardingNavigator';
import { AdminTabNavigator } from './AdminTabNavigator';

const Root = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, isHydrated, hydrate, logout } = useAuthStore();

  useEffect(() => {
    hydrate();
    setLogoutCallback(() => logout());
  }, []);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: Palette.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Palette.primary} size="large" />
      </View>
    );
  }

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!user) return 'Auth';
    if (user.role === Role.CLIENT) return 'ClientTabs';
    if (user.role === Role.ADVISOR) return 'AdvisorTabs';
    if (user.role === Role.SUPER_ADMIN || user.role === Role.SUB_ADMIN) return 'AdminTabs';
    return 'Auth';
  };

  return (
    <Root.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{ headerShown: false, animation: 'fade' }}
    >
      <Root.Screen name="Auth" component={AuthNavigator} />
      <Root.Screen name="ClientTabs" component={ClientTabNavigator} />
      <Root.Screen name="AdvisorOnboarding" component={AdvisorOnboardingNavigator} />
      <Root.Screen name="AdvisorTabs" component={AdvisorTabNavigator} />
      <Root.Screen name="AdminTabs" component={AdminTabNavigator} />
    </Root.Navigator>
  );
};
