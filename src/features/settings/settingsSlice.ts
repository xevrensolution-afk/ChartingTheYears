import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';
import { fetchSiteSettings } from './settingsApi';
import { DEFAULT_SETTINGS, type SettingsState, type SiteSettings } from './types';

const initialState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  status: 'idle',
};

/**
 * Fetched exactly once per session — the `condition` guard makes this thunk
 * a no-op when settings are already loaded or in flight, so any number of
 * layouts/components may dispatch it safely.
 */
export const fetchSettings = createAsyncThunk<
  Partial<SiteSettings>,
  void,
  { state: RootState }
>('settings/fetch', () => fetchSiteSettings(), {
  condition: (_, { getState }) => getState().settings.status === 'idle',
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = { ...DEFAULT_SETTINGS, ...action.payload };
        state.status = 'ready';
      })
      .addCase(fetchSettings.rejected, (state) => {
        // Defaults remain in place — the app stays usable without the API.
        state.status = 'error';
      });
  },
});

export const settingsReducer = settingsSlice.reducer;
