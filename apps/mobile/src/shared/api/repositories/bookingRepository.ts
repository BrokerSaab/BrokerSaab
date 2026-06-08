import apiClient from '../apiClient';
import type { ApiResponse, Booking, CreateBookingRequest } from '@brokersaab/shared-types';

export const bookingRepository = {
  list: (status?: string) =>
    apiClient
      .get<ApiResponse<Booking[]>>('/bookings', { params: status ? { status } : {} })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Booking>>(`/bookings/${id}`)
      .then((r) => r.data),

  create: (payload: CreateBookingRequest) =>
    apiClient
      .post<ApiResponse<Booking>>('/bookings', payload)
      .then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    apiClient
      .post<ApiResponse<Booking>>(`/bookings/${id}/status`, { status })
      .then((r) => r.data),

  addReview: (bookingId: string, payload: { comment: string; score: number; title?: string }) =>
    apiClient
      .post<ApiResponse>(`/bookings/${bookingId}/review`, payload)
      .then((r) => r.data),
};
