import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';
import { readingListBooksAdapter } from './readingListSlice';
import type { ReadingListBook } from './types';

export const selectReadingListIds = (state: RootState) => state.readingList.bookIds;

/** Mirrors the old hook's `isReady` — true once the first load has settled. */
export const selectReadingListReady = (state: RootState) =>
  state.readingList.status === 'ready';

export const selectReadingListBooksLoading = (state: RootState) =>
  state.readingList.booksStatus === 'idle' || state.readingList.booksStatus === 'loading';

export const selectReadingListCount = (state: RootState) => state.readingList.bookIds.length;

const bookEntitySelectors = readingListBooksAdapter.getSelectors(
  (state: RootState) => state.readingList.books,
);

/**
 * Book details ordered by list membership. Memoized: only recomputes when
 * the id list or the entity cache actually changes.
 */
export const selectReadingListBooks = createSelector(
  [selectReadingListIds, bookEntitySelectors.selectEntities],
  (ids, entities): ReadingListBook[] =>
    ids.flatMap((id) => (entities[id] ? [entities[id]] : [])),
);

/** Category → count map for the reading-list sidebar (derived, never stored). */
export const selectReadingListCategoryCounts = createSelector(
  [selectReadingListBooks],
  (books): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const book of books) {
      counts[book.category] = (counts[book.category] || 0) + 1;
    }
    return counts;
  },
);
