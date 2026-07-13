'use client';

import { useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchReadingListBooks, removeBook } from '@/features/readingList/readingListSlice';
import {
  selectReadingListBooks,
  selectReadingListBooksLoading,
  selectReadingListIds,
  selectReadingListReady,
} from '@/features/readingList/selectors';
import './reading-list.css';

function ReadingListContent() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const activeCategory = searchParams?.get('category') || 'All';

  const ids = useAppSelector(selectReadingListIds);
  const isReady = useAppSelector(selectReadingListReady);
  // One batch request into the normalized cache, shared with the sidebar
  // (replaces the old one-request-per-book fetch that only this page saw).
  const books = useAppSelector(selectReadingListBooks);
  const booksLoading = useAppSelector(selectReadingListBooksLoading);

  useEffect(() => {
    if (!isReady) return;
    dispatch(fetchReadingListBooks());
  }, [ids, isReady, dispatch]);

  const loading = !isReady || (booksLoading && ids.length > 0);

  // Removal is optimistic in the slice — the card disappears immediately.
  const handleRemove = useCallback((id: string) => {
    dispatch(removeBook(id));
  }, [dispatch]);

  const filteredBooks = books.filter((book) =>
    activeCategory === 'All' || book.category === activeCategory
  );

  return (
    <div className="rl-page">
      <div className="rl-header">
        <h1 className="rl-title">Reading list</h1>
        {!loading && filteredBooks.length > 0 && (
          <span className="rl-count-pill">{filteredBooks.length} saved</span>
        )}
      </div>

      {loading ? (
        <div className="rl-skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rl-skeleton-card" />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rl-empty">
          <div className="rl-empty-icon" aria-hidden="true">
            <img src="/icon-svgs/books.svg" alt="" width="48" height="48" />
          </div>
          <h2 className="rl-empty-title">Your reading list is empty</h2>
          <p className="rl-empty-subtitle">
            {books.length === 0
              ? 'Discover books on the Atlas and add them to your list.'
              : `No books found in the "${activeCategory}" category.`}
          </p>
          <Link href="/user" className="rl-empty-cta">
            Explore the Atlas
          </Link>
        </div>
      ) : (
        <div className="rl-list">
          {filteredBooks.map((book) => (
            <div key={book._id} className="rl-card">
              <Link href={`/user/books/${book._id}`} className="rl-card-cover-link">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    book.imageUrl ||
                    `https://placehold.co/400x533/EADCCB/453C38?text=${encodeURIComponent(book.title)}`
                  }
                  alt={`Cover of ${book.title}`}
                  className="rl-card-cover"
                  loading="lazy"
                />
              </Link>

              <div className="rl-card-body">
                <Link href={`/user/books/${book._id}`} className="rl-card-title-link">
                  <h2 className="rl-card-title">
                    {book.title} {book.publicationYear ? `(${book.publicationYear})` : ''}
                  </h2>
                </Link>
                <p className="rl-card-author">{book.author}</p>

                <div className="rl-card-meta">
                  <span className="rl-card-badge">{book.category}</span>
                  <div className="rl-card-stars" aria-label={`Rating: ${book.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={`rl-star${i <= Math.round(book.rating) ? ' rl-star--filled' : ''}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {book.reviewText && (
                  <p className="rl-card-desc">{book.reviewText}</p>
                )}
              </div>

              <div className="rl-card-actions">
                <button
                  type="button"
                  className="rl-card-remove"
                  onClick={() => handleRemove(book._id)}
                  aria-label={`Remove ${book.title} from reading list`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReadingListPage() {
  return (
    <Suspense fallback={<div className="rl-page" />}>
      <ReadingListContent />
    </Suspense>
  );
}
