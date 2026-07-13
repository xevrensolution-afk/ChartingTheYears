'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addBook, removeBook, toggleBook } from '@/features/readingList/readingListSlice';
import {
  selectReadingListIds,
  selectReadingListReady,
} from '@/features/readingList/selectors';

/**
 * Facade over the readingList feature so components don't repeat the
 * membership/toggle wiring. State lives in Redux — every consumer shares
 * one list and one fetch (the old version gave each consumer its own copy,
 * synced through a window event bus).
 */
export function useReadingList() {
  const dispatch = useAppDispatch();
  const ids = useAppSelector(selectReadingListIds);
  const isReady = useAppSelector(selectReadingListReady);

  const isInList = useCallback((bookId: string) => ids.includes(bookId), [ids]);

  const handleToggle = useCallback(
    (bookId: string) => dispatch(toggleBook(bookId)),
    [dispatch],
  );
  const handleAdd = useCallback((bookId: string) => dispatch(addBook(bookId)), [dispatch]);
  const handleRemove = useCallback(
    (bookId: string) => dispatch(removeBook(bookId)),
    [dispatch],
  );

  return {
    ids,
    isReady,
    isInList,
    toggleBook: handleToggle,
    addBook: handleAdd,
    removeBook: handleRemove,
  };
}
