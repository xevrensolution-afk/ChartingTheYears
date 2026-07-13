import type { RootState } from '@/store/rootReducer';

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthStatus = (state: RootState) => state.auth.status;

export const selectIsAuthenticated = (state: RootState) => state.auth.status === 'authenticated';

/** True until the cookie check on app boot has settled. */
export const selectAuthIsLoading = (state: RootState) =>
  state.auth.status === 'idle' || state.auth.status === 'loading';

export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'ADMIN';
