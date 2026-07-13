export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

/**
 * 'idle' | 'loading'  → the cookie check hasn't settled yet (treat as "loading")
 * 'authenticated'     → valid session
 * 'unauthenticated'   → guest
 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}
