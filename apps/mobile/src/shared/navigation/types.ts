import { NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Welcome: undefined;
  PhoneOtp: undefined;
  RegisterComplete: { phoneNumber: string; isNewUser: boolean };
  AdminLogin: undefined;
};

// ─── Client stacks ───────────────────────────────────────────────────────────
export type HomeStackParamList = {
  HomeScreen: undefined;
  ServiceDetail: { moduleId: string; moduleName: string };
};

export type AdvisorsStackParamList = {
  AdvisorList: { category?: string } | undefined;
  AdvisorProfile: { advisorId: string };
};

export type BookingsStackParamList = {
  BookingsList: undefined;
  BookingDetail: { bookingId: string };
  Chat: { bookingId: string; otherName?: string };
  MyQuotes: undefined;
  QuoteRequest: { advisorId: string; advisorName: string };
  QuoteView: { quoteId: string };
};

export type ProfileStackParamList = {
  ClientProfile: undefined;
  Wallet: undefined;
  ContactsUnlocked: undefined;
  Support: undefined;
};

export type ClientTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  AdvisorsTab: NavigatorScreenParams<AdvisorsStackParamList>;
  BookingsTab: NavigatorScreenParams<BookingsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// ─── Advisor stacks ───────────────────────────────────────────────────────────
export type AdvisorDashboardStackParamList = {
  AdvisorDashboard: undefined;
  BookingDetail: { bookingId: string };
  Chat: { bookingId: string; otherName?: string };
  QuoteRequests: undefined;
  SubmitQuote: { quoteId: string; clientName: string };
};

export type AdvisorProfileStackParamList = {
  ProfileEdit: undefined;
  Services: undefined;
  Availability: undefined;
  KYC: undefined;
};

export type AdvisorAccountStackParamList = {
  AdvisorAccount: undefined;
  Support: undefined;
};

export type AdvisorTabParamList = {
  DashboardTab: NavigatorScreenParams<AdvisorDashboardStackParamList>;
  AdvisorProfileTab: NavigatorScreenParams<AdvisorProfileStackParamList>;
  AdvisorAccountTab: NavigatorScreenParams<AdvisorAccountStackParamList>;
};

// ─── Advisor Onboarding ───────────────────────────────────────────────────────
export type AdvisorOnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingPhone: undefined;
  OnboardingAdvisorType: undefined;
  OnboardingAccount: undefined;
  OnboardingProfile: undefined;
  OnboardingKYC: undefined;
  OnboardingServices: undefined;
  OnboardingAvailability: undefined;
  OnboardingReview: undefined;
  OnboardingSuccess: undefined;
};

// ─── Admin stacks ─────────────────────────────────────────────────────────────
export type AdminAdvisorsStackParamList = {
  AdminAdvisorList: undefined;
  AdminAdvisorDetail: { advisorId: string };
};

export type AdminTabParamList = {
  OverviewTab: undefined;
  AdminAdvisorsTab: NavigatorScreenParams<AdminAdvisorsStackParamList>;
  AdminSupportTab: undefined;
  AdminAccountTab: undefined;
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  ClientTabs: NavigatorScreenParams<ClientTabParamList>;
  AdvisorOnboarding: NavigatorScreenParams<AdvisorOnboardingStackParamList>;
  AdvisorTabs: NavigatorScreenParams<AdvisorTabParamList>;
  AdminTabs: NavigatorScreenParams<AdminTabParamList>;
};
