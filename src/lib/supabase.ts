/* ============================================================
   LOCKED IN — Supabase Client
   If environment variables are set, connects to a real Supabase
   instance. Otherwise, runs in local mode with localStorage.
   ============================================================ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Check if Supabase is configured.
 * When false, the app runs entirely in local mode using Zustand + localStorage.
 */
export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

/**
 * Placeholder for Supabase client initialization.
 * To enable cloud sync, set these environment variables in .env.local:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 *
 * Then install @supabase/supabase-js and initialize here:
 *
 *   import { createClient } from '@supabase/supabase-js';
 *   export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
 */
export const supabase = null;
