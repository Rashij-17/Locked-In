'use client';

/* ============================================================
   LOCKED IN — Forgot Password Page
   ============================================================ */

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">Locked In</div>
        <div className="auth-card__tagline">
          {sent ? 'Check your email' : 'Reset your password'}
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn--primary btn--full">
              Send Reset Link
            </button>
          </form>
        )}

        <Link href="/login" className="auth-card__link">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
