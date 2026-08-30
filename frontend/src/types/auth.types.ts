/** Auth type interfaces — used by useAuthStore and authApi. */

export interface AuthUser {
  userId: number;
  username: string;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface LoginRequest {
  username: string;
  password: string;
}
