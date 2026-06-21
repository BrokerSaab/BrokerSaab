import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import {
  ClientTabParamList,
  HomeStackParamList,
  BookingsStackParamList,
  ProfileStackParamList,
  DocumentsStackParamList,
  PaymentsStackParamList,
} from './types';
import { Palette, Colors } from '../theme';

import { HomeScreen } from '../../features/home/screens/HomeScreen';
import { ServiceDetailScreen } from '../../features/home/screens/ServiceDetailScreen';
import { BookingsListScreen } from '../../features/bookings/screens/BookingsListScreen';
import { BookingDetailScreen } from '../../features/bookings/screens/BookingDetailScreen';
import { ChatScreen } from '../../features/bookings/screens/ChatScreen';
import { MyQuotesScreen } from '../../features/quotes/screens/MyQuotesScreen';
import { QuoteRequestScreen } from '../../features/quotes/screens/QuoteRequestScreen';
import { QuoteViewScreen } from '../../features/quotes/screens/QuoteViewScreen';
import { MyTicketsScreen } from '../../features/tickets/screens/MyTicketsScreen';
import { TicketDetailScreen } from '../../features/tickets/screens/TicketDetailScreen';
import { ClientProfileScreen } from '../../features/profile/screens/ClientProfileScreen';
import { WalletScreen } from '../../features/wallet/screens/WalletScreen';
import { ContactsUnlockedScreen } from '../../features/contacts/screens/ContactsUnlockedScreen';
import { BuyPackScreen } from '../../features/contacts/screens/BuyPackScreen';
import { AdvisorListScreen } from '../../features/advisors/screens/AdvisorListScreen';
import { AdvisorProfileScreen } from '../../features/advisors/screens/AdvisorProfileScreen';
import { DocumentsScreen } from '../../features/documents/screens/DocumentsScreen';
import { PaymentsScreen } from '../../features/payments/screens/PaymentsScreen';

const Tab = createBottomTabNavigator<ClientTabParamList>();

const stackOptions = {
  headerStyle: { backgroundColor: Palette.surface },
  headerTintColor: Palette.text,
  headerTitleStyle: { color: Palette.text, fontWeight: '700' as const },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: Palette.background },
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const HomeNavigator = () => (
  <HomeStack.Navigator screenOptions={stackOptions}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
    <HomeStack.Screen name="ServiceDetail" component={ServiceDetailScreen} options={({ route }) => ({ title: route.params.moduleName })} />
    <HomeStack.Screen name="AdvisorList" component={AdvisorListScreen} options={{ title: 'Find Advisors' }} />
    <HomeStack.Screen name="AdvisorProfile" component={AdvisorProfileScreen} options={{ title: 'Advisor' }} />
  </HomeStack.Navigator>
);

const MyCasesStack = createNativeStackNavigator<BookingsStackParamList>();
const MyCasesNavigator = () => (
  <MyCasesStack.Navigator screenOptions={stackOptions}>
    <MyCasesStack.Screen name="BookingsList" component={BookingsListScreen} options={{ title: 'My Cases' }} />
    <MyCasesStack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Case Detail' }} />
    <MyCasesStack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
    <MyCasesStack.Screen name="MyQuotes" component={MyQuotesScreen} options={{ title: 'Fee Quotes' }} />
    <MyCasesStack.Screen name="QuoteRequest" component={QuoteRequestScreen} options={{ title: 'Request Fee Quote' }} />
    <MyCasesStack.Screen name="QuoteView" component={QuoteViewScreen} options={{ title: 'Fee Quote' }} />
    <MyCasesStack.Screen name="MyTickets" component={MyTicketsScreen} options={{ title: 'My Work Tickets' }} />
    <MyCasesStack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: 'Work Ticket' }} />
  </MyCasesStack.Navigator>
);

const DocumentsStack = createNativeStackNavigator<DocumentsStackParamList>();
const DocumentsNavigator = () => (
  <DocumentsStack.Navigator screenOptions={stackOptions}>
    <DocumentsStack.Screen name="DocumentsScreen" component={DocumentsScreen} options={{ headerShown: false }} />
  </DocumentsStack.Navigator>
);

const PaymentsStack = createNativeStackNavigator<PaymentsStackParamList>();
const PaymentsNavigator = () => (
  <PaymentsStack.Navigator screenOptions={stackOptions}>
    <PaymentsStack.Screen name="PaymentsScreen" component={PaymentsScreen} options={{ headerShown: false }} />
  </PaymentsStack.Navigator>
);

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={stackOptions}>
    <ProfileStack.Screen name="ClientProfile" component={ClientProfileScreen} options={{ title: 'My Profile' }} />
    <ProfileStack.Screen name="Wallet" component={WalletScreen} options={{ title: 'My Wallet' }} />
    <ProfileStack.Screen name="BuyPack" component={BuyPackScreen} options={{ title: 'Contact Pack' }} />
    <ProfileStack.Screen name="ContactsUnlocked" component={ContactsUnlockedScreen} options={{ title: 'Unlocked Contacts' }} />
  </ProfileStack.Navigator>
);

type TabIconProps = { focused: boolean; color: string };

const TabIcon: React.FC<{ icon: string; focused: boolean }> = ({ icon, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{icon}</Text>
  </View>
);

export const ClientTabNavigator: React.FC = () => (
  <Tab.Navigator
    initialRouteName="MyCasesTab"
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: '#E2E8F0',
        borderTopWidth: 1,
        elevation: 12,
        shadowColor: '#0B1F3A',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        height: 64,
        paddingBottom: 8,
        paddingTop: 6,
      },
      tabBarActiveTintColor: Colors.navy[800],
      tabBarInactiveTintColor: '#94A3B8',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 1 },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeNavigator}
      options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }}
    />
    <Tab.Screen
      name="MyCasesTab"
      component={MyCasesNavigator}
      options={{ title: 'My Cases', tabBarIcon: ({ focused }) => <TabIcon icon="💼" focused={focused} /> }}
    />
    <Tab.Screen
      name="DocumentsTab"
      component={DocumentsNavigator}
      options={{ title: 'Documents', tabBarIcon: ({ focused }) => <TabIcon icon="📄" focused={focused} /> }}
    />
    <Tab.Screen
      name="PaymentsTab"
      component={PaymentsNavigator}
      options={{ title: 'Payments', tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} /> }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileNavigator}
      options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }}
    />
  </Tab.Navigator>
);
