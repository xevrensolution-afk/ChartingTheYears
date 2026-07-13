'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { useRouter } from 'next/navigation';
import { makeStore, type AppStore } from './store';
import { useAppDispatch } from './hooks';
import { initializeAuth, logout } from '@/features/auth/authSlice';
import { setupAuthInterceptors } from '@/features/auth/authApi';
import { fetchSettings } from '@/features/settings/settingsSlice';

/**
 * One-time app bootstrap: axios auth interceptors, session restore from the
 * token cookie, and the site-settings fetch (once per session, app-wide —
 * previously refetched on every /user layout mount).
 */
function AppBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const teardown = setupAuthInterceptors({
      onUnauthorized: () => {
        dispatch(logout());
        router.push('/user');
      },
    });

    dispatch(initializeAuth());
    dispatch(fetchSettings());

    return teardown;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // useRef (not useState/module singleton) so the store is created exactly
  // once per client and never shared between SSR requests.
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <AppBootstrap>{children}</AppBootstrap>
    </Provider>
  );
}
