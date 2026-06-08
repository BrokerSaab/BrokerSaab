import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import {
  ClientTabParamList,
  HomeStackParamList,
  AdvisorsStackParamList,
  BookingsStackParamList,
  ProfileStackParamList,
} from './types';
import { Palette } from '../theme';

import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { ServiceDetailScreen } from '../../features/home/screens/ServiceDetailScreen';
import { AdvisorListScreen } from '../../features/advisors/screens/AdvisorListScreen';
import { AdvisorProfileScreen } from '../../features/advisors/screens/AdvisorProfileScreen';
import { BookingsListScreen } from '../../features/bookings/screens/BookingsListScreen';
import { BookingDetailScreen } from '../../features/bookings/screens/BookingDetailScreen';
import { ChatScreen } from '../../features/bookings/screens/ChatScreen';
import { MyQuotesScreen } from '../../features/quotes/screens/MyQuotesScreen';
import { QuoteRequestScreen } from '../../features/quotes/screens/QuoteRequestScreen';
import { QuoteViewScreen } from '../../features/quotes/screens/QuoteViewScreen';
import { ClientProfileScreen } from '../../features/profile/screens/ClientProfileScreen';
import { WalletScreen } from '../../features/wallet/screens/WalletScreen';
import { ContactsUnlockedScreen } from '../../features/contacts/screens/ContactsUnlockedScreen';

const Tab = createBottomTabNavigator<ClientTabParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Palette.surface },
  headerTintColor: Palette.text,
  headerTitleStyle: { color: Palette.text, fontWeight: '700' as const },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: Palette.background },
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const HomeNavigator = () => (
  <HomeStack.Navigator screenOptions={screenOptions}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'BrokerSaab' }} />
    <HomeStack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={({ route }) => ({ title: route.params.moduleName })} />
  </HomeStack.Navigator>
);

const AdvisorsStack = createNativeStackNavigator<AdvisorsStackParamList>();
const AdvisorsNavigator = () => (
  <AdvisorsStack.Navigator screenOptions={screenOptions}>
    <AdvisorsStack.Screen name="AdvisorList" component={AdvisorListScreen} options={{ title: 'Find Advisors' }} />
    <AdvisorsStack.Screen name="AdvisorProfile" component={AdvisorProfileScreen} options={{ title: 'Advisor' }} />
  </AdvisorsStack.Navigator>
);

const BookingsStack = createNativeStackNavigator<BookingsStackParamList>();
const BookingsNavigator = () => (
  <BookingsStack.Navigator screenOptions={screenOptions}>
    <BookingsStack.Screen name="BookingsList" component={BookingsListScreen} options={{ title: 'My Bookings' }} />
    <BookingsStack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
    <BookingsStack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params.otherName ?? 'Chat' })} />
    <BookingsStack.Screen name="MyQuotes" component={MyQuotesScreen} options={{ title: 'Fee Quotes' }} />
    <BookingsStack.Screen name="QuoteRequest" component={QuoteRequestScreen} options={{ title: 'Request Fee Quote' }} />
    <BookingsStack.Screen name="QuoteView" component={QuoteViewScreen} options={{ title: 'Fee Quote' }} />
  </BookingsStack.Navigator>
);

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={screenOptions}>
    <ProfileStack.Screen name="ClientProfile" component={ClientProfileScreen} options={{ title: 'My Profile' }} />
    <ProfileStack.Screen name="Wallet" component={WalletScreen} options={{ title: 'My Wallet' }} />
    <ProfileStack.Screen name="ContactsUnlocked" component={ContactsUnlockedScreen} options={{ title: 'Unlocked Contacts' }} />
  </ProfileStack.Navigator>
);

const tabBarStyle = {
  backgroundColor: Palette.surface,
  borderTopColor: Palette.border,
};

export const ClientTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle,
      tabBarActiveTintColor: Palette.primary,
      tabBarInactiveTintColor: Palette.textSecondary,
      tabBarIcon: ({ color }) => {
        const icons: Record<string, string> = {
          HomeTab: '🏠',
          AdvisorsTab: '👤',
          BookingsTab: '📅',
          ProfileTab: '⚙️',
        };
        return <Text style={{ fontSize: 18 }}>{icons[route.name]}</Text>;
      },
      tabBarLabelStyle: { fontSize: 11 },
    })}
  >
    <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
    <Tab.Screen name="AdvisorsTab" component={AdvisorsNavigator} options={{ title: 'Advisors' }} />
    <Tab.Screen name="BookingsTab" component={BookingsNavigator} options={{ title: 'Bookings' }} />
    <Tab.Screen name="ProfileTab" component={ProfileNavigator} options={{ title: 'Profile' }} />
  </Tab.Navigator>
);
