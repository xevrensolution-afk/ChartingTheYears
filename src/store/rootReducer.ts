import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/authSlice';
import { settingsReducer } from '@/features/settings/settingsSlice';
import { filtersReducer } from '@/features/filters/filtersSlice';
import { uiReducer } from '@/features/ui/uiSlice';
import { readingListReducer } from '@/features/readingList/readingListSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  filters: filtersReducer,
  ui: uiReducer,
  readingList: readingListReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
