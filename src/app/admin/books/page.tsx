'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/kit/Card';
import { KitButton } from '@/components/ui/kit/Button';
import { KitBadge } from '@/components/ui/kit/Badge';
import { Stars } from '@/components/ui/kit/Stars';
import { Icon } from '@/components/ui/kit/Icon';
import { Modal } from '@/components/ui/kit/Modal';
import apiClient from '@/lib/apiClient';
import { getApiErrorMessage, showApiToast } from '@/components/ui/kit/Toast';
import { BookReviewsSection } from '@/components/features/BookReviewsSection';

interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  historicalYear: number;
  rating: number;
  status: 'draft' | 'published';
  createdAt?: string;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [reviewBook, setReviewBook] = useState<Book | null>(null);

  // Debounce search query and reset page
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [q]);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * limit;
      const response = await apiClient.get<{ data: Book[]; total: number }>(
        `/api/books?limit=${limit}&skip=${skip}&q=${encodeURIComponent(debouncedQ)}`,
      );
      setBooks(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedQ]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const confirmDelete = async () => {
    if (!bookToDelete) return;
    try {
      setDeletingId(bookToDelete._id);
      await apiClient.delete(`/api/books/${bookToDelete._id}`);
      showApiToast({
        variant: 'success',
        title: 'Book deleted',
        message: `"${bookToDelete.title}" was removed from the catalog.`,
      });
      setBookToDelete(null);
      fetchBooks();
    } catch (err) {
      showApiToast({
        variant: 'error',
        title: 'Unable to delete book',
        message: getApiErrorMessage(err, 'Delete request failed'),
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && books.length === 0) {
    return <div className="h-96 bg-surface-2 rounded-2xl animate-pulse" />;
  }

  if (error) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/30 rounded-2xl text-danger text-sm">
        Error: {error}
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <h2 className="text-2xl font-semibold">
          All books{' '}
          <span className="text-ink-mute font-normal text-base">
            {books.length > 0 ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)}` : '0'} of {total}
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon
              name="search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search books..."
              className="h-10 w-64 rounded-lg bg-surface-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-mute outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <Link href="/admin/books/add">
            <KitButton variant="accent" size="md" className="rounded-md">
              <Icon name="plus" size={14} /> Add book
            </KitButton>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${loading ? 'opacity-50 transition-opacity' : 'transition-opacity'}`}>
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.14em] text-ink-mute border-t border-line/60">
              <Th>Title</Th>
              <Th>Author</Th>
              <Th>Year</Th>
              <Th>Category</Th>
              <Th>Rating</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr
                key={b._id}
                className="border-t border-line/40 hover:bg-surface-2/40 transition-colors"
              >
                <Td className="font-medium text-ink">{truncate(b.title, 22)}</Td>
                <Td>{b.author}</Td>
                <Td>{b.historicalYear}</Td>
                <Td>
                  <KitBadge variant="category">{b.category}</KitBadge>
                </Td>
                <Td>
                  <Stars value={Math.round(b.rating)} />
                </Td>
                <Td>
                  <KitBadge variant={b.status === 'published' ? 'publish' : 'draft'}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </KitBadge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Link href={`/admin/books/${b._id}/edit`}>
                      <KitButton variant="primary" size="sm">
                        <Icon name="edit" size={12} /> Edit
                      </KitButton>
                    </Link>
                    <KitButton
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewBook(b)}
                    >
                      <Icon name="star" size={12} /> Reviews
                    </KitButton>
                    <KitButton
                      variant="danger"
                      size="sm"
                      onClick={() => setBookToDelete(b)}
                      disabled={deletingId === b._id}
                    >
                      <Icon name="delete" size={12} /> Delete
                    </KitButton>
                  </div>
                </Td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-ink-mute text-sm">
                  No books match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-line/40 text-sm text-ink-soft bg-surface-1">
          <div className="flex items-center gap-3">
            <span>Show</span>
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value));
                  setPage(1);
                }}
                className="h-9 w-28 rounded-lg bg-surface-2 pl-3 pr-8 text-xs text-ink outline-none border border-line focus:ring-2 focus:ring-accent/50 appearance-none transition"
              >
                {[5, 10, 20, 50].map((v) => (
                  <option key={v} value={v}>
                    {v} items
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <KitButton
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-2"
              title="First Page"
            >
              <span className="sr-only">First</span>
              &laquo;
            </KitButton>
            <KitButton
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft /> Prev
            </KitButton>

            <div className="flex items-center gap-1">
              {getPageNumbers(page, totalPages).map((p, idx) =>
                p === -1 ? (
                  <span key={`dots-${idx}`} className="px-2 text-ink-mute">…</span>
                ) : (
                  <KitButton
                    key={p}
                    variant={p === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 p-0 ${p === page ? 'bg-ink text-canvas font-bold' : ''}`}
                  >
                    {p}
                  </KitButton>
                )
              )}
            </div>

            <KitButton
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1"
            >
              Next <ChevronRight />
            </KitButton>
            <KitButton
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-2"
              title="Last Page"
            >
              <span className="sr-only">Last</span>
              &raquo;
            </KitButton>
          </div>
        </div>
      )}

      {/* Reviews modal */}
      <Modal open={!!reviewBook} onClose={() => setReviewBook(null)} size="lg">
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-ink">{reviewBook?.title}</h3>
              <p className="text-sm text-ink-mute">{reviewBook?.author}</p>
            </div>
            <KitButton variant="outline" size="sm" onClick={() => setReviewBook(null)}>
              <Icon name="plus" size={14} style={{ transform: 'rotate(45deg)' }} /> Close
            </KitButton>
          </div>
          {reviewBook && <BookReviewsSection bookId={reviewBook._id} bare />}
        </div>
      </Modal>

      <Modal open={!!bookToDelete} onClose={() => setBookToDelete(null)} size="sm">
        <div className="p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 ring-8 ring-danger/5">
            <Icon name="delete" size={28} className="text-danger" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-ink">Delete this book?</h3>
          <p className="mb-8 text-sm text-ink-soft leading-relaxed">
            You're about to permanently remove <span className="font-semibold text-ink">"{bookToDelete?.title}"</span> by <span className="font-medium text-ink">{bookToDelete?.author}</span> from the catalog. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <KitButton variant="outline" className="w-full flex-1" onClick={() => setBookToDelete(null)} disabled={!!deletingId}>
              Cancel
            </KitButton>
            <KitButton variant="danger" className="w-full flex-1" onClick={confirmDelete} disabled={!!deletingId}>
              {deletingId ? 'Deleting...' : (
                <><Icon name="delete" size={16} /> Delete book</>
              )}
            </KitButton>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-6 py-4">{children}</th>;
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-5 text-ink-soft ${className}`}>{children}</td>;
}

function ChevronLeft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
  );
}

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
  );
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: number[] = [];
  const maxButtons = 3; // Show fewer adjacent numbers to fit small screens

  if (totalPages <= maxButtons + 2) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push(-1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push(-1);
    }

    pages.push(totalPages);
  }

  return pages;
}
