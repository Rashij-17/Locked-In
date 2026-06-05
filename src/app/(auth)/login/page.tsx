'use client';

/* ============================================================
   LOCKED IN — Login Page
   Clean card layout with email/password form.
   ============================================================ */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__logo">Locked In</div>
        <div className="auth-card__tagline">Plan the day. Own the hour.</div>

        {error && (
          <div style={{ color: 'var(--accent-coral)', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label className="input-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="input-field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <Link href="/forgot-password" className="auth-card__link">
          Forgot password?
        </Link>

        <Link href="/signup" className="auth-card__link">
          Don&apos;t have an account? <strong>Sign up</strong>
        </Link>
      </form>
    </div>
  );
}
