'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/kit/Card';
import { KitButton } from '@/components/ui/kit/Button';
import { KitInput, KitLabel, KitTextarea } from '@/components/ui/kit/Input';
import { Icon } from '@/components/ui/kit/Icon';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import { showApiToast, getApiErrorMessage } from '@/components/ui/kit/Toast';

interface Review {
  _id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 mt-1" role="group" aria-label="Select rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          className={`text-2xl transition-colors leading-none ${i <= (hovered || value) ? 'text-accent' : 'text-ink-mute'}`}
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

interface BookReviewsSectionProps {
  bookId: string;
  /** When true, the Card wrapper is omitted (use when inside a modal) */
  bare?: boolean;
}

export function BookReviewsSection({ bookId, bare = false }: BookReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: Review[] }>(`/api/reviews?bookId=${bookId}`);
      setReviews(res.data.data);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (reviewId: string) => {
    try {
      setDeletingId(reviewId);
      await apiClient.delete(`/api/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      showApiToast({ variant: 'success', title: 'Review deleted', message: 'The review has been removed.' });
    } catch (err) {
      showApiToast({ variant: 'error', title: 'Delete failed', message: getApiErrorMessage(err, 'Failed to delete review') });
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (rev: Review) => {
    setEditingId(rev._id);
    setEditRating(rev.rating);
    setEditText(rev.text);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleSaveEdit = async (reviewId: string) => {
    setEditError(null);
    if (editRating === 0) return setEditError('Please select a rating.');
    if (editText.trim().length < 10) return setEditError('Review must be at least 10 characters.');

    try {
      setSavingEdit(true);
      const res = await apiClient.patch<{ data: Review }>(`/api/reviews/${reviewId}`, {
        rating: editRating,
        text: editText.trim(),
      });
      setReviews((prev) => prev.map((r) => (r._id === reviewId ? res.data.data : r)));
      setEditingId(null);
      showApiToast({ variant: 'success', title: 'Review updated', message: 'Changes have been saved.' });
    } catch (err) {
      setEditError(getApiErrorMessage(err, 'Failed to update review'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (reviewRating === 0) return setSubmitError('Please select a star rating.');
    if (reviewText.trim().length < 10) return setSubmitError('Review must be at least 10 characters.');

    setSubmitting(true);
    try {
      const res = await apiClient.post<{ data: Review }>('/api/reviews', {
        bookId,
        author: user?.name || 'Admin',
        rating: reviewRating,
        text: reviewText.trim(),
      });
      setReviews((prev) => [res.data.data, ...prev]);
      setReviewRating(0);
      setReviewText('');
      showApiToast({ variant: 'success', title: 'Feedback submitted', message: 'Your review has been added.' });
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Failed to submit feedback'));
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-ink">Comments & Feedback</h2>

      {/* Leave Feedback form */}
      <div className="border border-line/40 rounded-xl p-5 bg-surface-2 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-mute">Leave Feedback</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <KitLabel>Your name</KitLabel>
              <KitInput value={user?.name || 'Admin'} disabled />
            </div>
            <div>
              <KitLabel>Your rating</KitLabel>
              <StarPicker value={reviewRating} onChange={setReviewRating} />
            </div>
          </div>
          <div>
            <KitLabel>Comment</KitLabel>
            <KitTextarea
              placeholder="Share your thoughts about this book..."
              value={reviewText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewText(e.target.value)}
              disabled={submitting}
              rows={3}
            />
          </div>
          {submitError && <p className="text-xs text-danger">{submitError}</p>}
          <KitButton type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </KitButton>
        </form>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="text-sm text-ink-mute py-2">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-mute py-2">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev._id} className="border border-line/40 rounded-xl p-4 bg-surface-1">
              {editingId === rev._id ? (
                /* ── inline edit form ── */
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-9 w-9 rounded-full bg-ink text-canvas flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {(rev.author || 'A').charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-ink">{rev.author || 'Anonymous'}</p>
                  </div>
                  <div>
                    <KitLabel>Rating</KitLabel>
                    <StarPicker value={editRating} onChange={setEditRating} />
                  </div>
                  <div>
                    <KitLabel>Comment</KitLabel>
                    <KitTextarea
                      value={editText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
                      disabled={savingEdit}
                      rows={3}
                    />
                  </div>
                  {editError && <p className="text-xs text-danger">{editError}</p>}
                  <div className="flex gap-2">
                    <KitButton variant="primary" size="sm" onClick={() => handleSaveEdit(rev._id)} disabled={savingEdit}>
                      {savingEdit ? 'Saving…' : 'Save'}
                    </KitButton>
                    <KitButton variant="outline" size="sm" onClick={cancelEdit} disabled={savingEdit}>
                      Cancel
                    </KitButton>
                  </div>
                </div>
              ) : (
                /* ── read-only view ── */
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-ink text-canvas flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {(rev.author || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{rev.author || 'Anonymous'}</p>
                      <p className="text-xs text-ink-mute">
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} className={`text-sm ${i <= rev.rating ? 'text-accent' : 'text-ink-mute'}`}>★</span>
                        ))}
                      </div>
                      <KitButton
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(rev)}
                      >
                        <Icon name="edit" size={12} /> Edit
                      </KitButton>
                      <KitButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(rev._id)}
                        disabled={deletingId === rev._id}
                      >
                        <Icon name="delete" size={12} />
                        {deletingId === rev._id ? 'Deleting…' : 'Delete'}
                      </KitButton>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-soft leading-relaxed">{rev.text}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (bare) return content;
  return <Card className="space-y-6">{content}</Card>;
}
