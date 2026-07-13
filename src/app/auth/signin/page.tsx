'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/ui/kit/Icon';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, login } from '@/features/auth/authSlice';
import { selectAuthError } from '@/features/auth/selectors';
import { useRouter } from 'next/navigation';

const signinSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SigninFormValues = z.infer<typeof signinSchema>;

export default function SigninPage() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  // Auth submission errors live in the auth slice; RHF owns the form itself.
  const globalError = useAppSelector(selectAuthError);
  const router = useRouter();

  // Don't show a stale error from a previous auth attempt
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
  });

  const onSubmit = async (data: SigninFormValues) => {
    try {
      const session = await dispatch(login(data)).unwrap();
      if (session.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/user');
      }
    } catch {
      // Error message is already in the auth slice (selectAuthError)
    }
  };

  return (
    <div className="auth-container">
      {/* Header */}
      <div className="auth-header">
        <div className="auth-logo-wrap">
          <Icon name="logo" size={32} />
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your Charting the Years account</p>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="auth-global-error">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {globalError}
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Email */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signin-email">Email address</label>
          <input
            id="signin-email"
            type="email"
            className={`auth-input ${errors.email ? 'has-error' : ''}`}
            placeholder="name@example.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && (
            <span className="auth-field-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity=".15"/><circle cx="12" cy="16" r="1"/><path d="M12 8v5"/></svg>
              {errors.email.message}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signin-password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              className={`auth-input ${errors.password ? 'has-error' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            <button
              type="button"
              className="auth-pw-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <span className="auth-field-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity=".15"/><circle cx="12" cy="16" r="1"/><path d="M12 8v5"/></svg>
              {errors.password.message}
            </span>
          )}
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="auth-spinner" />
              Signing in…
            </>
          ) : 'Sign in'}
        </button>
      </form>

      <div className="auth-footer">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="auth-link">Create one</Link>
      </div>

      <Link href="/user" className="auth-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to the app
      </Link>
    </div>
  );
}
