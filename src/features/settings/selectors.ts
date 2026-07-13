import type { RootState } from '@/store/rootReducer';

export const selectSettings = (state: RootState) => state.settings.settings;

export const selectSettingsLoading = (state: RootState) =>
  state.settings.status === 'idle' || state.settings.status === 'loading';

// Field-level selectors so components subscribe to a primitive and only
// re-render when that exact value changes.
export const selectSiteName = (state: RootState) => state.settings.settings.siteName;
export const selectDefaultEra = (state: RootState) => state.settings.settings.defaultEra;
export const selectDefaultLanguage = (state: RootState) =>
  state.settings.settings.defaultLanguage;
export const selectBooksPerPage = (state: RootState) =>
  state.settings.settings.booksPerPage || 20;
export const selectMapStyle = (state: RootState) => state.settings.settings.mapStyle;
