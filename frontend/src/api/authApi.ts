import api from './axiosInstance';
import type { TokenResponse } from '@/types/auth.types';

export const authApi = {
  login: async (username: string, password: string): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/api/auth/login', { username, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Swallow — we always clear local state regardless of server response
    }
  },
};
