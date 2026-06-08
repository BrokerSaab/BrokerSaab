import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminTabParamList, AdminAdvisorsStackParamList } from './types';
import { Palette } from '../theme';
import { AdminDashboardScreen } from '../../features/admin/screens/AdminDashboardScreen';
import { AdminAdvisorListScreen } from '../../features/admin/screens/AdminAdvisorListScreen';
import { AdminAdvisorDetailScreen } from '../../features/admin/screens/AdminAdvisorDetailScreen';
import { AdminAccountScreen } from '../../features/admin/screens/AdminAccountScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Palette.surface },
  headerTintColor: Palette.text,
  headerTitleStyle: { color: Palette.text, fontWeight: '700' as const },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: Palette.background },
};

const AdminAdvisorsStack = createNativeStackNavigator<AdminAdvisorsStackParamList>();
const AdminAdvisorsNavigator = () => (
  <AdminAdvisorsStack.Navigator screenOptions={screenOptions}>
    <AdminAdvisorsStack.Screen name="AdminAdvisorList" component={AdminAdvisorListScreen} options={{ title: 'Advisors' }} />
    <AdminAdvisorsStack.Screen name="AdminAdvisorDetail" component={AdminAdvisorDetailScreen} options={{ title: 'Advisor Detail' }} />
  </AdminAdvisorsStack.Navigator>
);

const AdminSupportPlaceholder = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Support Tickets — Coming in Phase 5</Text>
  </View>
);

export const AdminTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: route.name === 'OverviewTab' || route.name === 'AdminSupportTab' || route.name === 'AdminAccountTab',
      headerStyle: { backgroundColor: Palette.surface },
      headerTintColor: Palette.text,
      tabBarStyle: { backgroundColor: Palette.surface, borderTopColor: Palette.border },
      tabBarActiveTintColor: Palette.primary,
      tabBarInactiveTintColor: Palette.textSecondary,
      tabBarIcon: ({ color }) => {
        const icons: Record<string, string> = {
          OverviewTab: '📊',
          AdminAdvisorsTab: '👤',
          AdminSupportTab: '🎫',
          AdminAccountTab: '⚙️',
        };
        return <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>;
      },
      tabBarLabelStyle: { fontSize: 11 },
    })}
  >
    <Tab.Screen name="OverviewTab" component={AdminDashboardScreen} options={{ title: 'Overview', headerTitle: 'Admin Dashboard' }} />
    <Tab.Screen name="AdminAdvisorsTab" component={AdminAdvisorsNavigator} options={{ title: 'Advisors' }} />
    <Tab.Screen name="AdminSupportTab" component={AdminSupportPlaceholder} options={{ title: 'Support', headerTitle: 'Support Tickets' }} />
    <Tab.Screen name="AdminAccountTab" component={AdminAccountScreen} options={{ title: 'Account', headerTitle: 'My Account' }} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { color: Palette.textSecondary, fontSize: 14 },
});
