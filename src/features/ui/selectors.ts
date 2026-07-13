import type { RootState } from '@/store/rootReducer';

export const selectMobileFiltersOpen = (state: RootState) => state.ui.mobileFiltersOpen;
export const selectMobileReadingListOpen = (state: RootState) =>
  state.ui.mobileReadingListOpen;
export const selectCatalogLoading = (state: RootState) => state.ui.catalogLoading;
