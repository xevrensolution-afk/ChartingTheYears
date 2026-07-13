import { isAnyOf } from '@reduxjs/toolkit';
import { startAppListening } from '@/store/listenerMiddleware';
import { initializeAuth, login, logout, signup } from '@/features/auth/authSlice';
import { loadReadingList } from './readingListSlice';

/**
 * The reading list depends on WHO is logged in, but auth should not know the
 * reading list exists. This listener reloads (and, on login, merges) the list
 * whenever the auth session settles or changes.
 */
export function addReadingListListeners(): void {
  startAppListening({
    matcher: isAnyOf(
      initializeAuth.fulfilled,
      login.fulfilled,
      signup.fulfilled,
      logout.fulfilled,
    ),
    effect: async (_action, { dispatch }) => {
      dispatch(loadReadingList());
    },
  });
}
