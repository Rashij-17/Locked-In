'use client';

/* ============================================================
   LOCKED IN — Auth Provider
   Handles client-side Firebase Auth states, active loading screens,
   and redirects for static builds (output: 'export').
   ============================================================ */

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const AUTH_PAGES = ['/login', '/signup', '/forgot-password'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = AUTH_PAGES.includes(pathname);

    if (!user && !isAuthPage) {
      // Not logged in, trying to access app pages
      router.push('/login');
    } else if (user && isAuthPage) {
      // Logged in, trying to access auth pages
      router.push('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-default)',
          color: 'var(--text-primary)',
          gap: 16,
        }}
      >
        <div className="loader-logo" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>
          Locked In
        </div>
        <div
          className="pulsate-ring"
          style={{
            width: 32,
            height: 32,
            border: '2px solid var(--accent-primary)',
            borderRadius: '50%',
            opacity: 0.8,
            animation: 'pulsate 1.8s infinite ease-in-out',
          }}
        />
        <style jsx global>{`
          @keyframes pulsate {
            0% {
              transform: scale(0.6);
              opacity: 0.2;
            }
            50% {
              transform: scale(1);
              opacity: 0.8;
            }
            100% {
              transform: scale(0.6);
              opacity: 0.2;
            }
          }
        `}</style>
      </div>
    );
  }

  // Prevent flash of unauthorized content
  const isAuthPage = AUTH_PAGES.includes(pathname);
  if (!user && !isAuthPage) {
    return null;
  }
  if (user && isAuthPage) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
