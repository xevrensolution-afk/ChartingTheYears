import Cookies from 'js-cookie';
import apiClient from '@/lib/apiClient';
import type { ApiEnvelope, AuthSession, AuthUser, SigninRequest, SignupRequest } from './types';

const TOKEN_COOKIE = 'token';
const TOKEN_EXPIRY_DAYS = 7;

// ─── Token persistence ───────────────────────────────────────────────────────
// The JWT lives in a cookie (not redux-persist) because the Edge middleware
// at src/middleware.ts reads this exact cookie to guard /admin and /auth.

export function getStoredToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE);
}

export function persistToken(token: string): void {
  Cookies.set(TOKEN_COOKIE, token, { expires: TOKEN_EXPIRY_DAYS });
}

export function clearStoredToken(): void {
  Cookies.remove(TOKEN_COOKIE);
}

// ─── API calls ───────────────────────────────────────────────────────────────

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const res = await apiClient.get<ApiEnvelope<{ user: AuthUser }>>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.data.success) throw new Error(res.data.message || 'Invalid session');
  return res.data.data.user;
}

export async function signinRequest(payload: SigninRequest): Promise<AuthSession> {
  const res = await apiClient.post<ApiEnvelope<AuthSession>>('/api/auth/signin', payload);
  if (!res.data.success) throw new Error(res.data.message || 'Failed to sign in');
  return res.data.data;
}

export async function signupRequest(payload: SignupRequest): Promise<AuthSession> {
  const res = await apiClient.post<ApiEnvelope<AuthSession>>('/api/auth/signup', payload);
  if (!res.data.success) throw new Error(res.data.message || 'Failed to create account');
  return res.data.data;
}

// ─── Axios interceptors ──────────────────────────────────────────────────────

interface InterceptorHandlers {
  /** Called on any 401 outside /auth — should dispatch logout + redirect. */
  onUnauthorized: () => void;
}

/**
 * Attaches the token to every request and auto-logs-out on 401 responses.
 * Returns a cleanup function that ejects both interceptors.
 */
export function setupAuthInterceptors({ onUnauthorized }: InterceptorHandlers): () => void {
  const requestInterceptor = apiClient.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const responseInterceptor = apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (
        error.response?.status === 401 &&
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/auth')
      ) {
        onUnauthorized();
      }
      return Promise.reject(error);
    },
  );

  return () => {
    apiClient.interceptors.request.eject(requestInterceptor);
    apiClient.interceptors.response.eject(responseInterceptor);
  };
}
