'use client';

/* ============================================================
   LOCKED IN — Root Page
   Redirects to /dashboard on the client side.
   NOTE: Server-side redirect() is NOT compatible with
   Next.js static exports (output: 'export'). We must use
   useRouter().replace() or useEffect-based navigation instead.
   ============================================================ */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Render nothing — AuthProvider in layout.tsx handles the loading screen
  return null;
}