import apiClient from '../apiClient';
import type { ApiResponse, WalletBalanceResponse } from '@brokersaab/shared-types';

export const walletRepository = {
  getBalance: () =>
    apiClient
      .get<WalletBalanceResponse>('/wallet')
      .then((r) => r.data),

  addFunds: (amount: number) =>
    apiClient
      .post<ApiResponse<{ orderId: string; amount: number; keyId: string }>>('/wallet/add-funds', { amount })
      .then((r) => r.data),

  verifyTopup: (payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) =>
    apiClient
      .post<ApiResponse>('/wallet/verify-topup', payload)
      .then((r) => r.data),
};
