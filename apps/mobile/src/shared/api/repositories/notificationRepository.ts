import apiClient from '../apiClient';
import type { ApiResponse, RegisterPushTokenRequest } from '@brokersaab/shared-types';

export const notificationRepository = {
  registerPushToken: (payload: RegisterPushTokenRequest) =>
    apiClient
      .post<ApiResponse>('/users/push-token', payload)
      .then((r) => r.data),
};
