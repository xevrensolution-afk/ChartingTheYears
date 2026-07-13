'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/ui/kit/Icon';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, signup } from '@/features/auth/authSlice';
import { selectAuthError } from '@/features/auth/selectors';
import { useRouter } from 'next/navigation';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await dispatch(signup(data)).unwrap();
      router.push('/user');
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join Charting the Years and start your journey</p>
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
        {/* Full Name */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-name">Full Name</label>
          <input
            id="signup-name"
            type="text"
            className={`auth-input ${errors.name ? 'has-error' : ''}`}
            placeholder="John Doe"
            autoComplete="name"
            {...register('name')}
          />
          {errors.name && (
            <span className="auth-field-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity=".15"/><circle cx="12" cy="16" r="1"/><path d="M12 8v5"/></svg>
              {errors.name.message}
            </span>
          )}
        </div>

        {/* Email */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-email">Email address</label>
          <input
            id="signup-email"
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
          <label className="auth-label" htmlFor="signup-password">Password</label>
          <div className="auth-input-wrap">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              className={`auth-input ${errors.password ? 'has-error' : ''}`}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
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

        {/* Confirm Password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
          <div className="auth-input-wrap">
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              className={`auth-input ${errors.confirmPassword ? 'has-error' : ''}`}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              className="auth-pw-toggle"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
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
          {errors.confirmPassword && (
            <span className="auth-field-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity=".15"/><circle cx="12" cy="16" r="1"/><path d="M12 8v5"/></svg>
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        <button type="submit" className="auth-btn" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="auth-spinner" />
              Creating account…
            </>
          ) : 'Create account'}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <Link href="/auth/signin" className="auth-link">Sign in</Link>
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
