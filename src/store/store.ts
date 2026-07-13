import { configureStore } from '@reduxjs/toolkit';
import { rootReducer, type RootState } from './rootReducer';
import { listenerMiddleware } from './listenerMiddleware';
import { addReadingListListeners } from '@/features/readingList/listeners';

// Register cross-feature listeners once at module load (the middleware
// instance is shared by every store created by makeStore).
addReadingListListeners();

// A factory (rather than a singleton) so each SSR request gets its own
// store and state never leaks between users on the server.
export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type { RootState };
