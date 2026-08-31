import api from './axiosInstance';
import type { DocumentItem } from '@/types/claim.types';

export interface DocumentsListResponse {
  documents: DocumentItem[];
}

export interface UploadDocumentResponse {
  document_id: number;
  file_name: string;
  file_size: number;
  document_tag: 'PolicyDocument' | 'ProviderContractAgreement' | 'InsuranceID' | 'MISC';
}

export interface DownloadDocumentResult {
  blob: Blob;
  filename: string;
}

const readFilename = (contentDisposition?: string): string => {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? 'document';
};

export const documentsApi = {
  getDocuments: (claimId: string): Promise<DocumentsListResponse> =>
    api.get(`/api/claims/${claimId}/documents`).then((response) => response.data),

  uploadDocument: (
    claimId: string,
    file: File,
    documentTag: UploadDocumentResponse['document_tag'],
    onProgress?: (percent: number) => void,
  ): Promise<UploadDocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_tag', documentTag);
    return api
      .post(`/api/claims/${claimId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total || !onProgress) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        },
      })
      .then((response) => response.data);
  },

  deleteDocument: (claimId: string, docId: number): Promise<void> =>
    api.delete(`/api/claims/${claimId}/documents/${docId}`).then(() => undefined),

  downloadDocument: async (claimId: string, docId: number): Promise<DownloadDocumentResult> => {
    const response = await api.get(`/api/claims/${claimId}/documents/${docId}/download`, {
      responseType: 'blob',
    });
    return {
      blob: response.data as Blob,
      filename: readFilename(response.headers['content-disposition']),
    };
  },
};
