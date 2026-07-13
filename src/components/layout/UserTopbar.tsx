'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMobileFiltersOpen, setMobileReadingListOpen } from '@/features/ui/uiSlice';
import { selectSiteName } from '@/features/settings/selectors';
import { AuthDropdown } from './AuthDropdown';
import { LanguageSwitcher } from './LanguageSwitcher';
import './UserTopbar.css';

const navItems = [
  { label: 'Atlas Dashboard', href: '/user', icon: '/icon-svgs/dashboard.svg' },
  { label: 'Reading list', href: '/user/reading-list', icon: '/icon-svgs/books.svg' },
  { label: 'About', href: '/user/about', icon: '' },
];

export function UserTopbar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const siteName = useAppSelector(selectSiteName);
  const isAboutPage = pathname === '/user/about';
  const isReadingList = pathname === '/user/reading-list' || pathname.startsWith('/user/books/');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="user-topbar">
      {/* Logo — only on About page */}
      {isAboutPage && (
        <Link href="/user" className="user-topbar-logo-link">
          <span className="user-topbar-logo-icon">
            <img src="/icon-svgs/logo-icon.svg" alt="" width="26" height="26" />
          </span>
          <span className="user-topbar-logo-name">{siteName}</span>
        </Link>
      )}

      {/* Right group */}
      <div className="user-topbar-right">
        <nav className="user-topbar-nav">
          {/* Filters button — mobile only, main atlas page */}
          {!isAboutPage && !isReadingList && (
            <button
              className="user-topbar-filters-btn d-lg-none"
              onClick={() => dispatch(setMobileFiltersOpen(true))}
              aria-label="Open Filters"
            >
              <img src="/icon-svgs/filters-userside.svg" alt="" width="20" height="20" aria-hidden="true" />
              <span className="user-topbar-filters-label">Filters</span>
            </button>
          )}

          {/* Categories button — mobile only, reading list / book detail pages */}
          {isReadingList && (
            <button
              className="user-topbar-filters-btn d-lg-none"
              onClick={() => dispatch(setMobileReadingListOpen(true))}
              aria-label="Open Categories"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span className="user-topbar-filters-label">Categories</span>
            </button>
          )}

          {/* Nav links — desktop only */}
          <div className="user-topbar-nav-links">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`user-topbar-nav-link${active ? ' active' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {item.icon && (
                    <img src={item.icon} alt="" width="16" height="16" style={{ opacity: active ? 1 : 0.6 }} />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="user-topbar-hamburger"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </nav>

        <div className="user-topbar-actions">
          <LanguageSwitcher />
          <AuthDropdown />
        </div>
      </div>

      {/* Mobile nav dropdown — full-width panel below topbar */}
      {mobileNavOpen && (
        <div className="user-topbar-mobile-nav">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`user-topbar-mobile-nav-link${active ? ' active' : ''}`}
                onClick={() => setMobileNavOpen(false)}
              >
                {item.icon && (
                  <img src={item.icon} alt="" width="18" height="18" style={{ opacity: active ? 1 : 0.6 }} />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
