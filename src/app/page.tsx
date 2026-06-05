'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* Root page — client-side redirects to dashboard */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div
      style={{
        background: 'var(--bg-base)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        color: 'var(--text-secondary)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p>Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
