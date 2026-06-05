'use client';

/* ============================================================
   LOCKED IN — Signup Page
   ============================================================ */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    // In local mode, just redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__logo">Locked In</div>
        <div className="auth-card__tagline">Create your account</div>

        {error && (
          <div style={{ color: 'var(--accent-coral)', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label className="input-label" htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            className="input-field"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            className="input-field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="signup-confirm">Confirm Password</label>
          <input
            id="signup-confirm"
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn--primary btn--full">
          Create Account
        </button>

        <Link href="/login" className="auth-card__link">
          Already have an account? <strong>Sign in</strong>
        </Link>
      </form>
    </div>
  );
}
