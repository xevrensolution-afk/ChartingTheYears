'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/kit/Icon';
import { DualSlider } from '@/components/ui/kit/DualSlider';
import { TagSelect } from '@/components/ui/kit/TagSelect';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setRating,
  setTags,
  setYearRange,
  toggleLanguage,
  toggleType,
} from '@/features/filters/filtersSlice';
import { selectFilters } from '@/features/filters/selectors';
import type { YearRange } from '@/features/filters/types';
import { setMobileFiltersOpen } from '@/features/ui/uiSlice';
import { selectCatalogLoading, selectMobileFiltersOpen } from '@/features/ui/selectors';
import { selectSiteName } from '@/features/settings/selectors';
import './UserSidebar.css';
import '@/app/user/user.css';

function SidebarContent({ isMobileOpen, onClose }: { isMobileOpen?: boolean; onClose?: () => void }) {
  const dispatch = useAppDispatch();
  const siteName = useAppSelector(selectSiteName);
  const filters = useAppSelector(selectFilters);
  const filtersLoading = useAppSelector(selectCatalogLoading);

  const handleYearRange = (range: YearRange) => dispatch(setYearRange(range));

  const formatYear = (y: number) => (y < 0 ? `${Math.abs(y)} BC` : String(y));

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="sidebar-mobile-overlay" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={`sidebar ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/user" className="sidebar-logo-link" onClick={onClose}>
            <span className="sidebar-logo-icon">
              <img src="/icon-svgs/logo-icon.svg" alt="" width="26" height="26" />
            </span>
            <span className="sidebar-logo-name">{siteName}</span>
          </Link>
          {isMobileOpen && (
            <button className="sidebar-close-btn" onClick={onClose}>
              <Icon name="plus" size={24} style={{ transform: 'rotate(45deg)' }} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="filters-header">
            <img src="/icon-svgs/filters-userside.svg" alt="" width="24" height="24" aria-hidden="true" />
            <h2>Filters</h2>
          </div>

          <div
            className="filters-body"
            style={filtersLoading ? { pointerEvents: 'none', opacity: 0.45, transition: 'opacity 0.15s' } : { transition: 'opacity 0.15s' }}
          >
            {/* Language */}
            <div className="filter-group">
              <h3 className="filter-group-title">Language</h3>
              <div className="filter-checkboxes">
                {['English', 'French'].map((l) => (
                  <label key={l} className="kit-checkbox-label">
                    <div className="kit-checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        className="kit-checkbox-input" 
                        checked={filters.lang.includes(l)}
                        onChange={() => dispatch(toggleLanguage(l))}
                      />
                      <svg className="kit-checkbox-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="kit-checkbox-text">{l}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="divider" />

            {/* Type */}
            <div className="filter-group">
              <h3 className="filter-group-title">Type</h3>
              <div className="filter-checkboxes">
                {['Fiction', 'Non-fiction'].map((t) => (
                  <label key={t} className="kit-checkbox-label">
                    <div className="kit-checkbox-wrapper">
                      <input 
                        type="checkbox" 
                        className="kit-checkbox-input" 
                        checked={filters.type.includes(t)}
                        onChange={() => dispatch(toggleType(t))}
                      />
                      <svg className="kit-checkbox-checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="kit-checkbox-text">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="divider" />

            {/* Publication Year */}
            <div className="kit-slider-wrap">
              <div className="kit-slider-header">
                <span className="kit-slider-label">Subject Year</span>
                <span className="kit-slider-value">
                  {formatYear(filters.yearRange[0])} – {formatYear(filters.yearRange[1])}
                </span>
              </div>
              <DualSlider
                min={-1250}
                max={2026}
                value={filters.yearRange}
                onChange={handleYearRange}
              />
            </div>

            <hr className="divider" />

            {/* Book Rating */}
            <div className="kit-slider-wrap">
              <div className="kit-slider-header">
                <span className="kit-slider-label">Book Rating</span>
                <span className="kit-slider-value">{filters.rating > 0 ? `${filters.rating}+ stars` : 'All'}</span>
              </div>
              <input
                type="range"
                className="kit-slider-input"
                min={0}
                max={5}
                step={1}
                value={filters.rating}
                onChange={(e) => dispatch(setRating(Number(e.target.value)))}
              />
              <div className="rating-stars-display" aria-label="Select rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    className="rating-star-btn"
                    onClick={() => dispatch(setRating(i))}
                    aria-label={`${i} stars`}
                  >
                    <Icon 
                      name="star" 
                      size={20} 
                      style={{ 
                        color: i <= filters.rating ? 'var(--ink)' : 'var(--line)', 
                        transition: 'color 0.2s'
                      }} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <hr className="divider" />

            {/* Tags */}
            <div className="filter-group">
              <h3 className="filter-group-title">Tags</h3>
              <div className="tag-search-wrap">
                <span className="tag-search-icon">
                  <img src="/icon-svgs/tags.svg" alt="" width="14" height="14" />
                </span>
                <input
                  type="text"
                  placeholder="Type to search tags"
                  className="tag-search-input"
                  value={filters.tags}
                  onChange={(e) => dispatch(setTags(e.target.value))}
                />
              </div>
              <div className="tag-select-wrap">
                <TagSelect value={filters.tags} onChange={(tags) => dispatch(setTags(tags))} />
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

export function UserSidebar() {
  const dispatch = useAppDispatch();
  const isMobileOpen = useAppSelector(selectMobileFiltersOpen);

  const handleClose = () => {
    dispatch(setMobileFiltersOpen(false));
  };

  return (
    <Suspense fallback={<aside className="sidebar" />}>
      <SidebarContent isMobileOpen={isMobileOpen} onClose={handleClose} />
    </Suspense>
  );
}
