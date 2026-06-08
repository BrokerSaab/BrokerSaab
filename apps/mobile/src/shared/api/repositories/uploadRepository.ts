import apiClient from '../apiClient';
import type { UploadResponse } from '@brokersaab/shared-types';

export const uploadRepository = {
  // formData should include 'file' and optionally 'documentType' fields
  uploadDocument: (formData: FormData) =>
    apiClient
      .post<UploadResponse>('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  uploadAvatar: (formData: FormData) =>
    apiClient
      .post<UploadResponse>('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  uploadCover: (formData: FormData) =>
    apiClient
      .post<UploadResponse>('/upload/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
};
