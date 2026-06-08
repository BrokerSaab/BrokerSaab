import apiClient from '../apiClient';

export interface FeeQuoteLineItem {
  id: string; quoteId: string; description: string;
  amount: string; sortOrder: number;
}

export interface FeeQuote {
  id: string;
  clientId: string; advisorId: string;
  categorySlug?: string; clientMessage?: string;
  status: 'REQUESTED' | 'QUOTED' | 'VIEWED' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';
  advisorNote?: string; validUntil?: string;
  totalAmount?: string; viewedAt?: string;
  createdAt: string; updatedAt: string;
  lineItems: FeeQuoteLineItem[];
  advisor: { id: string; fullName: string; avatarUrl?: string; pushToken?: string };
  client:  { id: string; fullName: string; phoneNumber: string; pushToken?: string };
}

interface ApiResp<T = unknown> { success: boolean; data: T; message?: string }

export const quoteRepository = {
  requestQuote: (payload: { advisorId: string; categorySlug?: string; clientMessage?: string }) =>
    apiClient.post<ApiResp<FeeQuote>>('/quotes', payload).then((r) => r.data),

  list: () =>
    apiClient.get<ApiResp<FeeQuote[]>>('/quotes').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResp<FeeQuote>>(`/quotes/${id}`).then((r) => r.data),

  getAdvisorUnreadCount: () =>
    apiClient.get<{ success: boolean; count: number }>('/quotes/unread-count').then((r) => r.data),

  submitQuote: (id: string, payload: {
    lineItems: { description: string; amount: number }[];
    advisorNote?: string;
    validityHours?: number;
  }) => apiClient.post<ApiResp<FeeQuote>>(`/quotes/${id}/submit`, payload).then((r) => r.data),

  markViewed: (id: string) =>
    apiClient.post<ApiResp<FeeQuote>>(`/quotes/${id}/view`).then((r) => r.data),

  acceptQuote: (id: string) =>
    apiClient.post<ApiResp<FeeQuote>>(`/quotes/${id}/accept`).then((r) => r.data),

  cancelQuote: (id: string) =>
    apiClient.post<ApiResp<FeeQuote>>(`/quotes/${id}/cancel`).then((r) => r.data),
};
