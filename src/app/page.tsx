'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side push ensures Next.js respects the GitHub Pages basePath automatically
    router.replace('/dashboard');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#F5F5F0', // Sand background token fallback
      fontFamily: 'system-ui, sans-serif',
      color: '#4A7C82'
    }}>
      <p style={{ fontWeight: 500, letterSpacing: '-0.01em' }}>Securing workspace connection...</p>
    </div>
  );
}