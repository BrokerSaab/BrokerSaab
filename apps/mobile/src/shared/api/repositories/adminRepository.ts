import apiClient from '../apiClient';
import type {
  ApiResponse,
  AdminDashboardResponse,
  AdminAdvisorListParams,
  AdvisorDetail,
  SubAdmin,
  SupportTicket,
} from '@brokersaab/shared-types';

export const adminRepository = {
  getDashboard: () =>
    apiClient
      .get<AdminDashboardResponse>('/admin/dashboard')
      .then((r) => r.data),

  getAdvisors: (params: AdminAdvisorListParams = {}) =>
    apiClient
      .get<ApiResponse<AdvisorDetail[]>>('/admin/advisors', { params })
      .then((r) => r.data),

  getAdvisorDetail: (id: string) =>
    apiClient
      .get<ApiResponse<AdvisorDetail>>(`/admin/advisors/${id}`)
      .then((r) => r.data),

  verifyAdvisor: (id: string, action: 'approve' | 'reject', comment?: string) =>
    apiClient
      .patch<ApiResponse>(`/admin/advisors/${id}/verify`, { action, comment })
      .then((r) => r.data),

  grantDealer: (id: string) =>
    apiClient
      .patch<ApiResponse>(`/admin/advisors/${id}/grant-dealer`)
      .then((r) => r.data),

  assignSubAdmin: (advisorId: string, subAdminId: string) =>
    apiClient
      .patch<ApiResponse>(`/admin/advisors/${advisorId}/assign`, { subAdminId })
      .then((r) => r.data),

  getSubAdmins: () =>
    apiClient
      .get<ApiResponse<SubAdmin[]>>('/admin/sub-admins')
      .then((r) => r.data),

  getTickets: (params?: { status?: string }) =>
    apiClient
      .get<ApiResponse<SupportTicket[]>>('/admin/tickets', { params })
      .then((r) => r.data),

  updateTicket: (id: string, payload: { status?: string; note?: string }) =>
    apiClient
      .patch<ApiResponse>(`/admin/tickets/${id}`, payload)
      .then((r) => r.data),
};
