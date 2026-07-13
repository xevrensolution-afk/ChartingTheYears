import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';
import { FULL_YEAR_MAX, FULL_YEAR_MIN } from './types';

export const selectFilters = (state: RootState) => state.filters;
export const selectFilterLanguages = (state: RootState) => state.filters.lang;
export const selectFilterTypes = (state: RootState) => state.filters.type;
export const selectYearRange = (state: RootState) => state.filters.yearRange;
export const selectRatingFilter = (state: RootState) => state.filters.rating;
export const selectTagsFilter = (state: RootState) => state.filters.tags;

/**
 * The sidebar filters as a `/api/books` query-string fragment.
 *
 * Memoized derived state — computed here (never stored) so the book-fetch
 * effect can depend on a single stable string instead of the whole filters
 * object. Unrelated filter-object churn can no longer trigger refetches.
 */
export const selectFilterQuery = createSelector([selectFilters], (filters): string => {
  const params = new URLSearchParams();

  if (filters.lang.length > 0) params.set('lang', filters.lang.join(','));
  if (filters.type.length > 0) params.set('type', filters.type.join(','));

  // Only send the year range when the user actually narrowed it
  if (filters.yearRange[0] > FULL_YEAR_MIN || filters.yearRange[1] < FULL_YEAR_MAX) {
    params.set('yearMin', filters.yearRange[0].toString());
    params.set('yearMax', filters.yearRange[1].toString());
  }

  if (filters.rating > 0) params.set('rating', filters.rating.toString());
  if (filters.tags) params.set('tags', filters.tags);

  return params.toString();
});
