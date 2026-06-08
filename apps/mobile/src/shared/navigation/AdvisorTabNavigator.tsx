import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import {
  AdvisorTabParamList,
  AdvisorDashboardStackParamList,
  AdvisorProfileStackParamList,
  AdvisorAccountStackParamList,
} from './types';
import { Palette } from '../theme';

import { AdvisorDashboardScreen } from '../../features/advisor-dashboard/screens/AdvisorDashboardScreen';
import { BookingDetailScreen } from '../../features/bookings/screens/BookingDetailScreen';
import { ChatScreen } from '../../features/bookings/screens/ChatScreen';
import { AdvisorProfileEditScreen } from '../../features/advisor-dashboard/screens/AdvisorProfileEditScreen';
import { AdvisorAccountScreen } from '../../features/advisor-dashboard/screens/AdvisorAccountScreen';
import { QuoteRequestsScreen } from '../../features/quotes/screens/QuoteRequestsScreen';
import { SubmitQuoteScreen } from '../../features/quotes/screens/SubmitQuoteScreen';
import { MyTicketsScreen } from '../../features/tickets/screens/MyTicketsScreen';
import { TicketDetailScreen } from '../../features/tickets/screens/TicketDetailScreen';

const Tab = createBottomTabNavigator<AdvisorTabParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Palette.surface },
  headerTintColor: Palette.text,
  headerTitleStyle: { color: Palette.text, fontWeight: '700' as const },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: Palette.background },
};

const DashStack = createNativeStackNavigator<AdvisorDashboardStackParamList>();
const DashNavigator = () => (
  <DashStack.Navigator screenOptions={screenOptions}>
    <DashStack.Screen name="AdvisorDashboard" component={AdvisorDashboardScreen} options={{ title: 'Dashboard' }} />
    <DashStack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
    <DashStack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.otherName ?? 'Chat' })} />
    <DashStack.Screen name="QuoteRequests" component={QuoteRequestsScreen} options={{ title: 'Quote Requests' }} />
    <DashStack.Screen name="SubmitQuote" component={SubmitQuoteScreen} options={({ route }) => ({ title: `Quote for ${route.params.clientName}` })} />
    <DashStack.Screen name="MyTickets" component={MyTicketsScreen} options={{ title: 'Work Tickets' }} />
    <DashStack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: 'Work Ticket' }} />
  </DashStack.Navigator>
);

const ProfileStack = createNativeStackNavigator<AdvisorProfileStackParamList>();
const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={screenOptions}>
    <ProfileStack.Screen name="ProfileEdit" component={AdvisorProfileEditScreen} options={{ title: 'My Profile' }} />
  </ProfileStack.Navigator>
);

const AccountStack = createNativeStackNavigator<AdvisorAccountStackParamList>();
const AccountNavigator = () => (
  <AccountStack.Navigator screenOptions={screenOptions}>
    <AccountStack.Screen name="AdvisorAccount" component={AdvisorAccountScreen} options={{ title: 'Account' }} />
  </AccountStack.Navigator>
);

export const AdvisorTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: Palette.surface, borderTopColor: Palette.border },
      tabBarActiveTintColor: Palette.primary,
      tabBarInactiveTintColor: Palette.textSecondary,
      tabBarIcon: ({ color }) => {
        const icons: Record<string, string> = {
          DashboardTab: '📊',
          AdvisorProfileTab: '👤',
          AdvisorAccountTab: '⚙️',
        };
        return <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>;
      },
      tabBarLabelStyle: { fontSize: 11 },
    })}
  >
    <Tab.Screen name="DashboardTab" component={DashNavigator} options={{ title: 'Dashboard' }} />
    <Tab.Screen name="AdvisorProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
    <Tab.Screen name="AdvisorAccountTab" component={AccountNavigator} options={{ title: 'Account' }} />
  </Tab.Navigator>
);
