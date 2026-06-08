import {
  UserProfile,
  AdvisorSummary,
  AdvisorDetail,
  Booking,
  WalletTransaction,
  SupportTicket,
  TicketActivity,
  ContactUnlock,
  ContactSubscription,
  Wallet,
  SubAdmin,
  AdminStats,
  OnboardingSession,
  AdvisorSubscription,
  ChatMessage,
} from './entities';

// ─── Generic API wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthLoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface OtpSendResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
  sid?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
  user?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  advisor?: { onboardingStep: number; id: string };
}

export interface TokenRefreshResponse {
  success: boolean;
  accessToken: string;
}

// ─── Advisor search / filter ──────────────────────────────────────────────────

export interface AdvisorSearchParams {
  q?: string;
  category?: string;
  categories?: string;
  state?: string;
  minFee?: number;
  maxFee?: number;
  minExp?: number;
  minRating?: number;
  dealerOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface AdvisorSearchResponse {
  success: boolean;
  data: AdvisorSummary[];
  total: number;
  page: number;
  limit: number;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface CreateBookingRequest {
  advisorId: string;
  slotId: string;
  scheduledDate?: string;
  mode: string;
  notes?: string;
  paymentMethod?: string;
}

export interface UpdateBookingStatusRequest {
  status: string;
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export interface ContactStatusResponse {
  success: boolean;
  data: {
    isUnlocked: boolean;
    isFree: boolean;
    advisor?: AdvisorSummary;
    phoneNumber?: string;
    email?: string;
    subscription?: ContactSubscription;
  };
}

export interface ContactCreateOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export interface WalletBalanceResponse {
  success: boolean;
  data: Wallet & { transactions: WalletTransaction[] };
}

export interface WalletAddFundsRequest {
  amount: number;
}

// ─── Support ──────────────────────────────────────────────────────────────────

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: string;
  priority: string;
}

export interface TicketDetailResponse {
  success: boolean;
  data: SupportTicket & { activities: TicketActivity[] };
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    documentType?: string;
    id?: string;
  };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminDashboardResponse {
  success: boolean;
  data: {
    stats: AdminStats;
    recentAuditLogs: Array<{
      id: string;
      action: string;
      performedBy: string;
      details: Record<string, unknown>;
      createdAt: string;
    }>;
  };
}

export interface AdminAdvisorListParams {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}

// ─── Push notifications ───────────────────────────────────────────────────────

export interface RegisterPushTokenRequest {
  token: string;
  platform: 'android' | 'ios';
}
