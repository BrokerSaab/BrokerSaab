import apiClient from '../apiClient';
import type {
  ApiResponse,
  OtpSendResponse,
  OtpVerifyResponse,
  AuthLoginResponse,
  TokenRefreshResponse,
} from '@brokersaab/shared-types';

export const authRepository = {
  sendOtp: (phoneNumber: string) =>
    apiClient
      .post<OtpSendResponse>('/auth/otp/send', { phoneNumber })
      .then((r) => r.data),

  verifyOtp: (phoneNumber: string, otp: string, role?: string) =>
    apiClient
      .post<OtpVerifyResponse>('/auth/otp/verify', { phoneNumber, otp, role })
      .then((r) => r.data),

  signupAdvisor: (payload: {
    phoneNumber: string;
    email: string;
    password: string;
    fullName?: string;
    advisorType?: string;
  }) =>
    apiClient
      .post<AuthLoginResponse & { data?: { advisorId?: string } }>('/auth/signup/advisor', payload)
      .then((r) => r.data),

  loginPassword: (email: string, password: string) =>
    apiClient
      .post<AuthLoginResponse>('/auth/login/password', { email, password })
      .then((r) => r.data),

  registerClient: (tempToken: string, fullName: string, email?: string) =>
    apiClient
      .post<{ success: boolean; tokens: { accessToken: string; refreshToken: string }; user: AuthLoginResponse['user'] }>(
        '/auth/register/complete',
        { tempToken, fullName, email }
      )
      .then((r) => r.data),

  setAdvisorPassword: (password: string) =>
    apiClient
      .post<ApiResponse>('/auth/set-password', { password })
      .then((r) => r.data),

  setClientPassword: (newPassword: string) =>
    apiClient
      .post<ApiResponse>('/auth/password/set', { newPassword })
      .then((r) => r.data),

  refreshToken: (refreshToken: string) =>
    apiClient
      .post<TokenRefreshResponse>('/auth/token/refresh', { refreshToken })
      .then((r) => r.data),

  getMe: () =>
    apiClient
      .get<ApiResponse<{ user: import('@brokersaab/shared-types').UserProfile }>>('/auth/me')
      .then((r) => r.data),
};
