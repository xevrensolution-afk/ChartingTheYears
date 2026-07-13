'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useReadingList } from '@/hooks/useReadingList';
import apiClient from '@/lib/apiClient';
import { useAppSelector } from '@/store/hooks';
import {
  selectCurrentUser,
  selectIsAdmin,
  selectIsAuthenticated,
} from '@/features/auth/selectors';
import './book-detail.css';

interface Book {
  _id: string;
  title: string;
  author: string;
  category: string;
  language: string;
  type: string;
  rating: number;
  country: string;
  historicalYear: number;
  publicationYear: number;
  reviewText?: string;
  tags?: string[];
  imageUrl?: string;
}

interface Review {
  _id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface RelatedBook {
  _id: string;
  title: string;
  author: string;
  category: string;
  rating: number;
  imageUrl?: string;
}


function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="bd-star-picker" role="group" aria-label="Select rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={`bd-star-pick-btn${i <= (hovered || value) ? ' bd-star-pick-btn--on' : ''}`}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function BookDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedBooks, setRelatedBooks] = useState<RelatedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Unified reading list — guest localStorage or authenticated DB
  const { isInList, toggleBook } = useReadingList();

  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);

  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Review form state
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Prefill reviewAuthor with user's name if logged in
  useEffect(() => {
    if (isAuthenticated && user?.name) {
      setReviewAuthor(user.name);
    }
  }, [user, isAuthenticated]);

  // Fetch book
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get<{ data: Book }>(`/api/books/${id}`)
      .then((r) => setBook(r.data.data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    apiClient
      .get<{ data: Review[] }>(`/api/reviews?bookId=${id}`)
      .then((r) => setReviews(r.data.data))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  // Fetch related books (same country)
  useEffect(() => {
    if (!book?.country) return;
    apiClient
      .get<{ data: RelatedBook[] }>(`/api/books?status=published&limit=8`)
      .then((r) => {
        const filtered = r.data.data
          .filter((b) => b._id !== book._id && b.country === book.country)
          .slice(0, 6);
        setRelatedBooks(filtered);
      })
      .catch(() => setRelatedBooks([]));
  }, [book]);

  const handleReadingListToggle = useCallback(() => {
    if (!book) return;
    toggleBook(book._id);
  }, [book, toggleBook]);

  const handleReviewDelete = async (reviewId: string) => {
    try {
      setDeletingReviewId(reviewId);
      await apiClient.delete(`/api/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch {
      // silently ignore
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const authorName = isAuthenticated ? (user?.name || '') : reviewAuthor.trim();
    if (!authorName) return setSubmitError('Please enter your name.');
    if (reviewRating === 0) return setSubmitError('Please select a star rating.');
    if (!reviewText.trim() || reviewText.trim().length < 10) return setSubmitError('Review must be at least 10 characters.');

    setSubmitting(true);
    try {
      const res = await apiClient.post<{ data: Review }>('/api/reviews', {
        bookId: id,
        author: authorName,
        rating: reviewRating,
        text: reviewText.trim(),
      });
      setReviews((prev) => [res.data.data, ...prev]);
      if (!isAuthenticated) {
        setReviewAuthor('');
      }
      setReviewRating(0);
      setReviewText('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to submit review. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bd-page">
        <div className="bd-skeleton-layout">
          <div className="bd-skeleton-cover" />
          <div className="bd-skeleton-content">
            <div className="bd-skeleton-line bd-skeleton-line--wide" />
            <div className="bd-skeleton-line" />
            <div className="bd-skeleton-line bd-skeleton-line--short" />
            <div className="bd-skeleton-line bd-skeleton-line--short" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="bd-page">
        <div className="bd-not-found">
          <h2>Book not found</h2>
          <p>This book may have been removed or the link is incorrect.</p>
          <Link href="/user" className="bd-not-found-link">← Back to Atlas</Link>
        </div>
      </div>
    );
  }

  const imgSrc = book.imageUrl || `https://placehold.co/400x533/EADCCB/453C38?text=${encodeURIComponent(book.title)}`;
  const formatYear = (y: number) => y < 0 ? `${Math.abs(y)} BC` : String(y);

  return (
    <div className="bd-page">
      {/* Back link */}
      <Link href="/user" className="bd-back-btn">
        <img src="/icon-svgs/dashboard.svg" alt="" width="16" height="16" /> Back to Dashboard
      </Link>

      {/* Book Hero */}
      <div className="bd-hero">
        {/* Cover */}
        <div className="bd-hero-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt={`Cover of ${book.title}`} className="bd-hero-cover-img" />
        </div>

        {/* Info */}
        <div className="bd-hero-info">
          <p className="bd-breadcrumb">
            <span>{book.type}</span>
            <span className="bd-breadcrumb-sep">·</span>
            <span>{book.language}</span>
          </p>

          <h1 className="bd-title">
            {book.title} ({formatYear(book.publicationYear)})
          </h1>

          <p className="bd-author">{book.author}</p>

          {/* Stars */}
          <div className="bd-stars" aria-label={`Rating: ${book.rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`bd-star${i <= Math.round(book.rating) ? ' bd-star--filled' : ''}`}>
                ★
              </span>
            ))}
          </div>

          {/* Tags */}
          {book.tags && book.tags.length > 0 && (
            <div className="bd-tags">
              {book.tags.map((tag) => (
                <span key={tag} className="bd-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {book.reviewText && (
        <div 
          className="bd-description prose prose-sm max-w-none text-ink-soft leading-relaxed" 
          dangerouslySetInnerHTML={{ __html: book.reviewText }}
        />
      )}

      {/* Reading list button */}
      <button
        type="button"
        className={`bd-rl-btn${isInList(book._id) ? ' bd-rl-btn--added' : ''}`}
        onClick={handleReadingListToggle}
      >
        {isInList(book._id) ? '✓ Saved to reading list' : (
          <><img src="/icon-svgs/add-book.svg" alt="" width="16" height="16" /> Add to reading list</>
        )}
      </button>

      {/* Related books */}
      {relatedBooks.length > 0 && (
        <section className="bd-related">
          <h2 className="bd-related-title">More from {book.country}</h2>
          <div className="bd-related-grid">
            {relatedBooks.map((rb) => (
              <Link key={rb._id} href={`/user/books/${rb._id}`} className="bd-related-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rb.imageUrl || `https://placehold.co/400x533/EADCCB/453C38?text=${encodeURIComponent(rb.title)}`}
                  alt={rb.title}
                  className="bd-related-cover"
                  loading="lazy"
                />
                <div className="bd-related-info">
                  <p className="bd-related-book-title">{rb.title}</p>
                  <p className="bd-related-book-author">{rb.author}</p>
                  <p className="bd-related-book-cat">{rb.category}</p>
                  <div className="bd-related-stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`bd-related-star${i <= Math.round(rb.rating) ? ' bd-related-star--on' : ''}`}>★</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews section */}
      <section className="bd-reviews">
        <h2 className="bd-reviews-title">Comments & Feedback</h2>

        {/* Submit form */}
        {isAuthenticated ? (
          <form onSubmit={handleReviewSubmit} className="bd-review-form" noValidate>
            <h3 className="bd-review-form-heading">Leave Feedback</h3>

            <div className="bd-review-form-row">
              <div className="bd-review-form-field">
                <label className="bd-review-label" htmlFor="review-author">Your name</label>
                <input
                  id="review-author"
                  type="text"
                  className="bd-review-input"
                  value={user?.name || ''}
                  disabled={true}
                />
              </div>
              <div className="bd-review-form-field">
                <label className="bd-review-label">Your rating</label>
                <StarPicker value={reviewRating} onChange={setReviewRating} />
              </div>
            </div>

            <div className="bd-review-form-field">
              <label className="bd-review-label" htmlFor="review-text">Comment</label>
              <textarea
                id="review-text"
                className="bd-review-textarea"
                placeholder="Share your thoughts about this book..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                disabled={submitting}
                rows={4}
                maxLength={2000}
              />
            </div>

            {submitError && (
              <p className="bd-review-error" role="alert">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="bd-review-success" role="status">Feedback submitted! Thank you.</p>
            )}

            <button type="submit" className="bd-review-submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        ) : (
          <div className="bd-review-login-prompt">
            <p>
              Please{' '}
              <Link href="/auth/signin" className="bd-review-login-link">
                Sign In
              </Link>{' '}
              to share comments and feedback about this book.
            </p>
          </div>
        )}

        {/* Review list */}
        {reviewsLoading ? (
          <div className="bd-reviews-loading">Loading feedback((s))…</div>
        ) : reviews.length === 0 ? (
          <p className="bd-reviews-empty">No reviews yet. Be the first to write one!</p>
        ) : (
          <div className="bd-reviews-list">
            {reviews.map((rev) => (
              <div key={rev._id} className="bd-review-card">
                <div className="bd-review-card-header">
                  <div className="bd-review-card-avatar" aria-hidden="true">
                    {(rev.author || 'Anonymous').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="bd-review-card-author">{rev.author || 'Anonymous'}</p>
                    <p className="bd-review-card-date">
                      {new Date(rev.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="bd-review-card-stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`bd-review-star${i <= rev.rating ? ' bd-review-star--on' : ''}`}>★</span>
                    ))}
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      className="bd-review-delete-btn"
                      onClick={() => handleReviewDelete(rev._id)}
                      disabled={deletingReviewId === rev._id}
                      aria-label="Delete review"
                    >
                      {deletingReviewId === rev._id ? '…' : '✕'}
                    </button>
                  )}
                </div>
                <p className="bd-review-card-text">{rev.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
