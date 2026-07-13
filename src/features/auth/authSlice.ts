import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { AuthSession, AuthState, SigninRequest, SignupRequest } from './types';
import {
  clearStoredToken,
  fetchCurrentUser,
  getStoredToken,
  persistToken,
  signinRequest,
  signupRequest,
} from './authApi';

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const axiosMessage = (err as { response?: { data?: { message?: string } } }).response?.data
      ?.message;
    if (axiosMessage) return axiosMessage;
    const message = (err as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

// ─── Thunks ──────────────────────────────────────────────────────────────────

/** Restore the session from the token cookie on app boot. */
export const initializeAuth = createAsyncThunk<AuthSession | null>(
  'auth/initialize',
  async () => {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const user = await fetchCurrentUser(token);
      return { token, user };
    } catch {
      clearStoredToken();
      return null;
    }
  },
);

export const login = createAsyncThunk<AuthSession, SigninRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const session = await signinRequest(credentials);
      persistToken(session.token);
      return session;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, 'Failed to sign in. Please try again.'));
    }
  },
);

export const signup = createAsyncThunk<AuthSession, SignupRequest, { rejectValue: string }>(
  'auth/signup',
  async (payload, { rejectWithValue }) => {
    try {
      const session = await signupRequest(payload);
      persistToken(session.token);
      return session;
    } catch (err) {
      return rejectWithValue(
        extractErrorMessage(err, 'Failed to create account. Please try again.'),
      );
    }
  },
);

/** A thunk (not a plain reducer) because clearing the cookie is a side effect. */
export const logout = createAsyncThunk<void>('auth/logout', async () => {
  clearStoredToken();
});

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.status = 'authenticated';
        } else {
          state.status = 'unauthenticated';
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.status = 'unauthenticated';
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.status = 'unauthenticated';
        state.error = null;
      })
      .addMatcher(isAnyOf(login.pending, signup.pending), (state) => {
        state.error = null;
      })
      .addMatcher(isAnyOf(login.fulfilled, signup.fulfilled), (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.status = 'authenticated';
        state.error = null;
      })
      .addMatcher(isAnyOf(login.rejected, signup.rejected), (state, action) => {
        state.error = action.payload ?? 'Something went wrong. Please try again.';
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;
