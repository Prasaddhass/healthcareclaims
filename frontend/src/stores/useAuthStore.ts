/**
 * Zustand authentication store.
 * Token stored in memory only — never localStorage (OWASP A02).
 */
import { create } from 'zustand';
import type { AuthUser } from '@/types/auth.types';

interface AuthState {
  token:           string | null;
  user:            AuthUser | null;
  isAuthenticated: boolean;
  login:           (token: string, user: AuthUser) => void;
  logout:          () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token:           null,
  user:            null,
  isAuthenticated: false,

  login: (token, user) => set({ token, user, isAuthenticated: true }),
  logout: ()           => set({ token: null, user: null, isAuthenticated: false }),
}));
