import apiClient from '../apiClient';
import type { ApiResponse, SupportTicket, TicketDetailResponse, CreateTicketRequest } from '@brokersaab/shared-types';

export const supportRepository = {
  createTicket: (payload: CreateTicketRequest) =>
    apiClient
      .post<ApiResponse<SupportTicket>>('/support/tickets', payload)
      .then((r) => r.data),

  listTickets: () =>
    apiClient
      .get<ApiResponse<SupportTicket[]>>('/support/tickets')
      .then((r) => r.data),

  getTicket: (id: string) =>
    apiClient
      .get<TicketDetailResponse>(`/support/tickets/${id}`)
      .then((r) => r.data),
};
