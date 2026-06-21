import apiClient from '../apiClient';
import type { UploadResponse } from '@brokersaab/shared-types';

export const uploadRepository = {
  uploadDocument: (formData: FormData) =>
    apiClient
      .post<UploadResponse>('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  // Advisor-specific avatar upload → /advisors/upload/avatar
  uploadAvatar: (formData: FormData) =>
    apiClient
      .post<{ success: boolean; avatarUrl: string }>('/advisors/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  // Advisor cover / banner image → /advisors/upload/cover
  uploadCover: (formData: FormData) =>
    apiClient
      .post<{ success: boolean; coverImageUrl: string }>('/advisors/upload/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  // Client user avatar upload → /users/upload/avatar
  uploadUserAvatar: (formData: FormData) =>
    apiClient
      .post<{ success: boolean; avatarUrl: string }>('/users/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
};
