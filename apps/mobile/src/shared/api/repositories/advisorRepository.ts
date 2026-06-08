import apiClient from '../apiClient';
import type {
  AdvisorSearchResponse,
  AdvisorSearchParams,
  ApiResponse,
  AdvisorDetail,
  AdvisorSummary,
} from '@brokersaab/shared-types';

export const advisorRepository = {
  search: (params: AdvisorSearchParams = {}) =>
    apiClient
      .get<AdvisorSearchResponse>('/advisors', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<AdvisorDetail>>(`/advisors/${id}`)
      .then((r) => r.data),

  getMe: () =>
    apiClient
      .get<ApiResponse<AdvisorDetail>>('/advisors/me')
      .then((r) => r.data),

  updateProfile: (payload: Partial<AdvisorDetail>) =>
    apiClient
      .patch<ApiResponse<AdvisorDetail>>('/advisors/me', payload)
      .then((r) => r.data),

  updateCategories: (categoryIds: string[]) =>
    apiClient
      .put<ApiResponse>('/advisors/me/categories', { categoryIds })
      .then((r) => r.data),

  updateSpecializations: (specializationIds: string[]) =>
    apiClient
      .put<ApiResponse>('/advisors/me/specializations', { specializationIds })
      .then((r) => r.data),

  updateAvailability: (slots: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) =>
    apiClient
      .put<ApiResponse>('/advisors/me/availability', { slots })
      .then((r) => r.data),

  saveOnboardingProgress: (step: number, formSnapshot: Record<string, unknown>) =>
    apiClient
      .post<ApiResponse>('/advisors/onboarding-progress', { step, formSnapshot })
      .then((r) => r.data),

  getOnboardingSession: (phoneNumber: string) =>
    apiClient
      .get<ApiResponse<import('@brokersaab/shared-types').OnboardingSession>>('/advisors/onboarding-session', {
        params: { phoneNumber },
      })
      .then((r) => r.data),

  getReviews: (advisorId: string) =>
    apiClient
      .get<ApiResponse<Array<{ id: string; comment: string; createdAt: string }>>>(`/advisors/${advisorId}/reviews`)
      .then((r) => r.data),
};
