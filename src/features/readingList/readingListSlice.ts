import { createAsyncThunk, createEntityAdapter, createSlice, isAnyOf } from '@reduxjs/toolkit';
import type { RootState } from '@/store/rootReducer';
import { selectIsAuthenticated } from '@/features/auth/selectors';
import {
  addBookRequest,
  clearGuestList,
  fetchBooksByIds,
  fetchReadingListIds,
  mergeGuestListRequest,
  readGuestList,
  removeBookRequest,
  writeGuestList,
} from './readingListApi';
import type { ReadingListBook, ReadingListState } from './types';

export const readingListBooksAdapter = createEntityAdapter<ReadingListBook, string>({
  selectId: (book) => book._id,
});

const initialState: ReadingListState = {
  bookIds: [],
  status: 'idle',
  books: readingListBooksAdapter.getInitialState(),
  booksStatus: 'idle',
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

/**
 * (Re)load the reading list after auth settles. For a fresh login with a
 * guest list in localStorage, merges it into the DB first (the old
 * once-per-session ref guard is unnecessary: clearing localStorage after a
 * successful merge makes the merge branch self-disabling).
 */
export const loadReadingList = createAsyncThunk<string[], void, { state: RootState }>(
  'readingList/load',
  async (_, { getState }) => {
    if (!selectIsAuthenticated(getState())) return readGuestList();

    const guestIds = readGuestList();
    if (guestIds.length > 0) {
      const merged = await mergeGuestListRequest(guestIds);
      clearGuestList();
      return merged;
    }
    return fetchReadingListIds();
  },
);

export const addBook = createAsyncThunk<string[], string, { state: RootState }>(
  'readingList/addBook',
  async (bookId, { getState }) => {
    if (selectIsAuthenticated(getState())) return addBookRequest(bookId);
    const next = Array.from(new Set([...readGuestList(), bookId]));
    writeGuestList(next);
    return next;
  },
);

export const removeBook = createAsyncThunk<string[], string, { state: RootState }>(
  'readingList/removeBook',
  async (bookId, { getState }) => {
    if (selectIsAuthenticated(getState())) return removeBookRequest(bookId);
    const next = readGuestList().filter((id) => id !== bookId);
    writeGuestList(next);
    return next;
  },
);

/** Convenience wrapper used by BookCard / popup "save" buttons. */
export const toggleBook = createAsyncThunk<void, string, { state: RootState }>(
  'readingList/toggleBook',
  async (bookId, { getState, dispatch }) => {
    const inList = getState().readingList.bookIds.includes(bookId);
    await dispatch(inList ? removeBook(bookId) : addBook(bookId)).unwrap();
  },
);

/**
 * Fetch full book details for the current membership ids in ONE request.
 * The `condition` guard dedupes concurrent consumers (page + sidebar) and
 * skips the network entirely when the cache already covers every id.
 */
export const fetchReadingListBooks = createAsyncThunk<
  ReadingListBook[],
  void,
  { state: RootState }
>(
  'readingList/fetchBooks',
  async (_, { getState }) => {
    const { bookIds } = getState().readingList;
    if (bookIds.length === 0) return [];
    return fetchBooksByIds(bookIds);
  },
  {
    condition: (_, { getState }) => {
      const { bookIds, booksStatus, books } = getState().readingList;
      if (booksStatus === 'loading') return false;
      const covered = bookIds.every((id) => books.entities[id] !== undefined);
      return !(booksStatus === 'ready' && covered);
    },
  },
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const readingListSlice = createSlice({
  name: 'readingList',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadReadingList.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadReadingList.rejected, (state) => {
        state.status = 'ready'; // fail open, same as the old hook
      })
      // Optimistic removal — the UI drops the card immediately, matching the
      // old page behaviour; the fulfilled payload reconciles the id list.
      .addCase(removeBook.pending, (state, action) => {
        state.bookIds = state.bookIds.filter((id) => id !== action.meta.arg);
        readingListBooksAdapter.removeOne(state.books, action.meta.arg);
      })
      .addCase(fetchReadingListBooks.pending, (state) => {
        state.booksStatus = 'loading';
      })
      .addCase(fetchReadingListBooks.fulfilled, (state, action) => {
        readingListBooksAdapter.setAll(state.books, action.payload);
        state.booksStatus = 'ready';
      })
      .addCase(fetchReadingListBooks.rejected, (state) => {
        state.booksStatus = 'error';
      })
      .addMatcher(
        isAnyOf(loadReadingList.fulfilled, addBook.fulfilled, removeBook.fulfilled),
        (state, action) => {
          state.bookIds = action.payload;
          state.status = 'ready';
        },
      );
  },
});

export const readingListReducer = readingListSlice.reducer;
