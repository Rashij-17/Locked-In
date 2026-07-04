'use client';

/* ============================================================
   LOCKED IN — Auth Context Provider (Firebase)
   Handles client-side Firebase Auth states, active loading screens,
   redirects for static builds, and exposes authentication methods.
   ============================================================ */

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useTaskStore } from '@/store/useTaskStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import LockedInLogo from '@/components/ui/LockedInLogo';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithEmail: async () => { },
  signUpWithEmail: async () => { },
  logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

const AUTH_PAGES = ['/login', '/signup', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Normalize path formatting to safely account for GitHub trailing slashes
  const cleanPathname = pathname === '/' ? '/' : pathname?.replace(/\/$/, '') || '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Asynchronously sync data from cloud if configured
        useTaskStore.getState().syncFromSupabase();
        useFocusStore.getState().syncFromSupabase();
        useSettingsStore.getState().syncFromSupabase();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    // FIX: Use .some() and .endsWith() to bypass subfolder prefixes like /Locked-In
    const isAuthPage = AUTH_PAGES.some(page => cleanPathname.endsWith(page));

    if (!user && !isAuthPage) {
      // Not logged in, trying to access app pages
      router.push('/login');
    } else if (user && isAuthPage) {
      // Logged in, trying to access auth pages
      router.push('/dashboard');
    }
  }, [user, loading, cleanPathname, router]);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name.trim(),
      });
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Cleaned duplicate loading check block to handle initializing state
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-base, #1E2124)',
          color: 'var(--text-primary, #E8E6E2)',
          gap: 16,
        }}
      >
        <LockedInLogo width={140} />
        <div
          className="pulsate-ring"
          style={{
            width: 32,
            height: 32,
            border: '2px solid var(--accent-primary, #4E9E85)',
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

  // FIX: Safe fallbacks utilizing the unified subfolder path checker
  const isAuthPage = AUTH_PAGES.some(page => cleanPathname.endsWith(page));
  if (!user && !isAuthPage) {
    return null;
  }
  if (user && isAuthPage) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, signUpWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}