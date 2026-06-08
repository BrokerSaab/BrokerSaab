import apiClient from '../apiClient';

export interface TicketStage {
  id: string; ticketId: string;
  title: string; description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'AWAITING_CONFIRM' | 'CONFIRMED';
  advisorComment?: string; sortOrder: number;
  completedAt?: string; confirmedAt?: string;
  createdAt: string; updatedAt: string;
}

export interface TicketComment {
  id: string; ticketId: string;
  authorId: string; authorRole: string; authorName: string;
  content: string; createdAt: string;
}

export interface ServiceTicket {
  id: string; ticketNumber: string;
  quoteId: string; clientId: string; advisorId: string;
  totalAmount: string; commission: string; netAmount: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'AWAITING_CONFIRM' | 'DISPUTED' | 'CLOSED' | 'PAYOUT_RELEASED';
  paymentRef?: string;
  closedAt?: string; closingComment?: string;
  userRating?: number; userReview?: string;
  payoutReleasedAt?: string;
  createdAt: string; updatedAt: string;
  client:  { id: string; fullName: string; avatarUrl?: string; phoneNumber: string; pushToken?: string };
  advisor: { id: string; fullName: string; avatarUrl?: string; pushToken?: string };
  stages:   TicketStage[];
  comments: TicketComment[];
  quote:    { id: string; categorySlug?: string; lineItems: { description: string; amount: string }[] };
}

interface ApiResp<T = unknown> { success: boolean; data: T; message?: string }

export const ticketRepository = {
  list: () =>
    apiClient.get<ApiResp<ServiceTicket[]>>('/tickets').then(r => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResp<ServiceTicket>>(`/tickets/${id}`).then(r => r.data),

  addStage: (ticketId: string, payload: { title: string; description?: string }) =>
    apiClient.post<ApiResp<TicketStage>>(`/tickets/${ticketId}/stages`, payload).then(r => r.data),

  updateStageStatus: (ticketId: string, stageId: string, payload: { status: 'IN_PROGRESS' | 'AWAITING_CONFIRM'; advisorComment?: string }) =>
    apiClient.patch<ApiResp<TicketStage>>(`/tickets/${ticketId}/stages/${stageId}`, payload).then(r => r.data),

  confirmStage: (ticketId: string, stageId: string) =>
    apiClient.post<ApiResp<TicketStage>>(`/tickets/${ticketId}/stages/${stageId}/confirm`).then(r => r.data),

  addComment: (ticketId: string, content: string) =>
    apiClient.post<ApiResp<TicketComment>>(`/tickets/${ticketId}/comments`, { content }).then(r => r.data),

  closeTicket: (ticketId: string, payload: { closingComment: string; userRating: number; userReview?: string }) =>
    apiClient.post<ApiResp<ServiceTicket>>(`/tickets/${ticketId}/close`, payload).then(r => r.data),

  raiseDispute: (ticketId: string, reason?: string) =>
    apiClient.post<ApiResp<ServiceTicket>>(`/tickets/${ticketId}/dispute`, { reason }).then(r => r.data),

  quoteCheckout: (quoteId: string, gateway: 'WALLET' | 'RAZORPAY' | 'STRIPE') =>
    apiClient.post<ApiResp<{ ticket: ServiceTicket; paymentRef: string }>>('/payments/quote-checkout', { quoteId, gateway }).then(r => r.data),

  getConnectedClients: () =>
    apiClient.get<ApiResp<any[]>>('/quotes/connected-clients').then(r => r.data),

  sendProactiveQuote: (payload: {
    clientId: string; lineItems: { description: string; amount: number }[];
    advisorNote?: string; categorySlug?: string; validityHours?: number;
  }) => apiClient.post<ApiResp<any>>('/quotes/proactive', payload).then(r => r.data),
};
