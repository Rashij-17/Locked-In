'use client';

/* ============================================================
   LOCKED IN — Theme Provider
   Reads theme from Zustand settings store and applies
   data-theme attribute to the document root element.
   ============================================================ */

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
