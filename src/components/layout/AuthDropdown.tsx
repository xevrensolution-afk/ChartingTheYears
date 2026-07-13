'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/authSlice';
import {
  selectAuthIsLoading,
  selectCurrentUser,
  selectIsAuthenticated,
} from '@/features/auth/selectors';
import { Icon } from '@/components/ui/kit/Icon';
import './AuthDropdown.css';

export function AuthDropdown() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthIsLoading);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setIsOpen(false);
    dispatch(logout());
    router.push('/user');
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) return null;

  // ── Logged In ─────────────────────────────────────────────
  if (isAuthenticated && user) {
    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    return (
      <div className="auth-wrap" ref={dropdownRef}>
        <button
          className="auth-trigger"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open account menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="auth-avatar">{initials}</div>
          <span className="auth-name">{user.name.split(' ')[0]}</span>
          <Icon
            name="chevron-down"
            size={13}
            className={`auth-chevron ${isOpen ? 'open' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="auth-menu" role="menu">
            {/* User info header */}
            <div className="auth-menu-header">
              <div className="auth-menu-avatar">{initials}</div>
              <div className="auth-menu-info">
                <span className="auth-menu-name">{user.name}</span>
                <span className="auth-menu-email">{user.email}</span>
              </div>
            </div>

            <span className="auth-menu-role">{user.role}</span>

            <div className="auth-menu-divider" />

            <button
              className="auth-menu-item auth-menu-item--danger"
              onClick={handleLogout}
              role="menuitem"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Guest ─────────────────────────────────────────────────
  return (
    <div className="auth-wrap" ref={dropdownRef}>
      <button
        className="auth-trigger auth-trigger--guest"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Sign in to your account"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="auth-guest-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <span className="auth-name">Account</span>
        <Icon
          name="chevron-down"
          size={13}
          className={`auth-chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="auth-menu" role="menu">
          <div className="auth-menu-guest-header">
            <p className="auth-menu-guest-title">Welcome back</p>
            <p className="auth-menu-guest-sub">Sign in to access your reading list and personalized features.</p>
          </div>

          <div className="auth-menu-divider" />

          <div className="auth-menu-guest-actions">
            <Link
              href="/auth/signin"
              className="auth-menu-btn auth-menu-btn--primary"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="auth-menu-btn auth-menu-btn--ghost"
              onClick={() => setIsOpen(false)}
              role="menuitem"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
