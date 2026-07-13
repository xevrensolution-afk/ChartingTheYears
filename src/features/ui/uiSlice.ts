import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Globally-controlled UI state only. These flags live in Redux (not local
 * useState) because they are set and read by different component trees:
 * the topbar opens the drawers, the sidebars close them, and the atlas page
 * drives the loading dim on the filter sidebar.
 */
export interface UiState {
  mobileFiltersOpen: boolean;
  mobileReadingListOpen: boolean;
  /** True while the atlas page is fetching books — dims the filter sidebar. */
  catalogLoading: boolean;
}

const initialState: UiState = {
  mobileFiltersOpen: false,
  mobileReadingListOpen: false,
  catalogLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMobileFiltersOpen(state, action: PayloadAction<boolean>) {
      state.mobileFiltersOpen = action.payload;
    },
    setMobileReadingListOpen(state, action: PayloadAction<boolean>) {
      state.mobileReadingListOpen = action.payload;
    },
    setCatalogLoading(state, action: PayloadAction<boolean>) {
      state.catalogLoading = action.payload;
    },
  },
});

export const { setMobileFiltersOpen, setMobileReadingListOpen, setCatalogLoading } =
  uiSlice.actions;
export const uiReducer = uiSlice.reducer;
