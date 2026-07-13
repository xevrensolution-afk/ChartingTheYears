import type { EntityState } from '@reduxjs/toolkit';

/** Book fields needed by the reading-list page and its category sidebar. */
export interface ReadingListBook {
  _id: string;
  title: string;
  author: string;
  category: string;
  language: string;
  rating: number;
  imageUrl?: string;
  publicationYear?: number;
  reviewText?: string;
}

export type ReadingListStatus = 'idle' | 'loading' | 'ready';

export interface ReadingListState {
  /** Membership — the source of truth for "is this book saved?". */
  bookIds: string[];
  /** False until the first load after auth settles (mirrors old `isReady`). */
  status: ReadingListStatus;
  /** Normalized book details, fetched lazily for pages that render covers. */
  books: EntityState<ReadingListBook, string>;
  booksStatus: 'idle' | 'loading' | 'ready' | 'error';
}
