'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/kit/Icon';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchReadingListBooks } from '@/features/readingList/readingListSlice';
import {
  selectReadingListCategoryCounts,
  selectReadingListCount,
  selectReadingListIds,
  selectReadingListReady,
} from '@/features/readingList/selectors';
import { setMobileReadingListOpen } from '@/features/ui/uiSlice';
import { selectMobileReadingListOpen } from '@/features/ui/selectors';
import { selectSiteName } from '@/features/settings/selectors';
import './ReadingListSidebar.css';

const HISTORY_CATEGORIES = [
  'Social History',
  'Economic History',
  'Military History',
  'Political History',
  'General History',
  'Historical Novels',
];

function SidebarContent({ isMobileOpen, onClose }: { isMobileOpen?: boolean; onClose?: () => void }) {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const activeCategory = searchParams?.get('category') || 'All';

  const siteName = useAppSelector(selectSiteName);
  const ids = useAppSelector(selectReadingListIds);
  const isReady = useAppSelector(selectReadingListReady);
  const totalCount = useAppSelector(selectReadingListCount);
  // Derived in a memoized selector from the shared, normalized book cache —
  // the reading-list page and this sidebar share one fetch.
  const categoryCounts = useAppSelector(selectReadingListCategoryCounts);

  useEffect(() => {
    if (!isReady) return;
    // Thunk `condition` dedupes with the reading-list page and skips the
    // request entirely when the cache already covers every id.
    dispatch(fetchReadingListBooks());
  }, [ids, isReady, dispatch]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="rl-sidebar-mobile-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`rl-sidebar${isMobileOpen ? ' rl-sidebar--mobile-open' : ''}`}>
        <div className="rl-sidebar-logo">
          <Link href="/user" className="rl-sidebar-logo-link" onClick={onClose}>
            <span className="rl-sidebar-logo-icon">
              <Icon name="logo" size={26} />
            </span>
            <span className="rl-sidebar-logo-name">{siteName}</span>
          </Link>

          {/* Close button — mobile only */}
          {isMobileOpen && (
            <button className="rl-sidebar-close-btn" onClick={onClose} aria-label="Close categories">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <nav className="rl-sidebar-nav">
          <div className="rl-filters-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <h2>Categories</h2>
          </div>

          <div className="rl-categories-list">
            <Link
              href="/user/reading-list"
              className={`rl-category-link${activeCategory === 'All' ? ' rl-category-link--active' : ''}`}
              onClick={onClose}
            >
              <span className="rl-category-name">All Books</span>
              <div className="rl-category-line" />
              <span className="rl-category-count">{totalCount}</span>
            </Link>

            {HISTORY_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isActive = activeCategory === cat;
              return (
                <Link
                  key={cat}
                  href={count > 0 ? `/user/reading-list?category=${encodeURIComponent(cat)}` : '#'}
                  className={`rl-category-link${isActive ? ' rl-category-link--active' : ''}${count === 0 ? ' rl-category-link--disabled' : ''}`}
                  onClick={(e) => { if (count === 0) e.preventDefault(); else onClose?.(); }}
                >
                  <span className="rl-category-name">{cat}</span>
                  <div className="rl-category-line" />
                  <span className="rl-category-count">{count}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="rl-sidebar-footer">
        </div>
      </aside>
    </>
  );
}

export function ReadingListSidebar() {
  const dispatch = useAppDispatch();
  const isMobileOpen = useAppSelector(selectMobileReadingListOpen);

  return (
    <Suspense fallback={<aside className="rl-sidebar" />}>
      <SidebarContent
        isMobileOpen={isMobileOpen}
        onClose={() => dispatch(setMobileReadingListOpen(false))}
      />
    </Suspense>
  );
}
