/**
 * Axios instance — base URL from VITE_API_BASE_URL.
 * Request interceptor: attaches JWT Bearer token.
 * Response interceptor: handles 401 globally (auto-logout + redirect).
 */
import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/stores/useAuthStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
});

// ── Request interceptor: attach JWT ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: global 401 handler ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const err = error as { response?: { status: number }; config?: { url?: string } };
    const status    = err?.response?.status;
    const requestUrl = err?.config?.url ?? '';

    // Skip auto-logout for the login endpoint itself (wrong credentials give 401)
    const isLoginRequest = requestUrl.includes('/api/auth/login');

    if (status === 401 && !isLoginRequest) {
      useAuthStore.getState().logout();
      message.error('Your session has expired. Please log in again.', 4);
      // Use window.location — interceptor runs outside React component tree
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
