import apiClient from '../apiClient';
import type {
  ApiResponse,
  ContactStatusResponse,
  ContactCreateOrderResponse,
  ContactUnlock,
} from '@brokersaab/shared-types';

export const contactRepository = {
  getMyStatus: () =>
    apiClient
      .get<{ success: boolean; creditsRemaining: number; creditsTotal: number; expiresAt: string | null; unlockedAdvisorIds: string[] }>('/contacts/status')
      .then((r) => r.data),

  getStatus: (advisorId: string) =>
    apiClient
      .get<ContactStatusResponse>(`/contacts/status/${advisorId}`)
      .then((r) => r.data),

  unlock: (advisorId: string) =>
    apiClient
      .post<ApiResponse<ContactUnlock>>('/contacts/unlock', { advisorId })
      .then((r) => r.data),

  getMyUnlocks: () =>
    apiClient
      .get<ApiResponse<ContactUnlock[]>>('/contacts/my-unlocks')
      .then((r) => r.data),

  createOrder: () =>
    apiClient
      .post<ContactCreateOrderResponse>('/contacts/create-order')
      .then((r) => r.data),

  verifyPayment: (payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) =>
    apiClient
      .post<ApiResponse>('/contacts/verify-payment', payload)
      .then((r) => r.data),
};
