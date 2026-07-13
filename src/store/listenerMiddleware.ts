import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { RootState } from './rootReducer';
import type { AppDispatch } from './store';

// Shared listener middleware instance. Features register cross-slice
// side effects (e.g. reload the reading list when auth settles) via
// `startAppListening` so slices never import each other directly.
export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();
