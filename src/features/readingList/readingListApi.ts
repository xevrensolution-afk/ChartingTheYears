import apiClient from '@/lib/apiClient';
import type { ApiEnvelope } from '@/features/auth/types';
import type { ReadingListBook } from './types';

// ─── Guest persistence (localStorage) ────────────────────────────────────────
// Guests keep their reading list in localStorage; authenticated users keep it
// in the DB. Redux is the single in-memory source of truth for both — the old
// window-event bus between hook instances is gone.

const LS_KEY = 'reading_list_ids';

export function readGuestList(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function writeGuestList(ids: string[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

export function clearGuestList(): void {
  localStorage.removeItem(LS_KEY);
}

// ─── API calls (authenticated users) ─────────────────────────────────────────

type BookIdsPayload = ApiEnvelope<{ bookIds: string[] }>;

export async function fetchReadingListIds(): Promise<string[]> {
  const res = await apiClient.get<BookIdsPayload>('/api/reading-list');
  if (!res.data.success) throw new Error('Failed to fetch reading list');
  return res.data.data.bookIds;
}

export async function addBookRequest(bookId: string): Promise<string[]> {
  const res = await apiClient.post<BookIdsPayload>('/api/reading-list', { bookId });
  if (!res.data.success) throw new Error('Failed to add book');
  return res.data.data.bookIds;
}

export async function removeBookRequest(bookId: string): Promise<string[]> {
  const res = await apiClient.delete<BookIdsPayload>('/api/reading-list', {
    data: { bookId },
  });
  if (!res.data.success) throw new Error('Failed to remove book');
  return res.data.data.bookIds;
}

export async function mergeGuestListRequest(bookIds: string[]): Promise<string[]> {
  const res = await apiClient.put<BookIdsPayload>('/api/reading-list/merge', { bookIds });
  if (!res.data.success) throw new Error('Failed to merge reading list');
  return res.data.data.bookIds;
}

/** Batch-fetch book details in one request (replaces the old per-id N+1). */
export async function fetchBooksByIds(ids: string[]): Promise<ReadingListBook[]> {
  const res = await apiClient.get<{ data: ReadingListBook[] }>(
    `/api/books?ids=${ids.join(',')}`,
  );
  return res.data.data;
}
