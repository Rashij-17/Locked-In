/* ============================================================
   LOCKED IN — Supabase Client
   If environment variables are set, connects to a real Supabase
   instance. Otherwise, runs in local mode with localStorage.
   ============================================================ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Check if Supabase is configured.
 * When false, the app runs entirely in local mode using Zustand + localStorage.
 */
export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

/**
 * Supabase client instance.
 * Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to activate.
 */
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : null;

/**
 * Helper to deterministically map an alphanumeric Firebase UID into a valid UUID.
 * Supabase database tables use UUID for primary/foreign keys referencing auth.users(id).
 * This ensures consistency when syncing client state to cloud storage.
 */
export function getUuidFromUid(uid: string): string {
  if (!uid) return '00000000-0000-4000-8000-000000000000';

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(uid)) return uid;

  // Generate a deterministic 32-character hex string from the uid
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    s1 = (s1 << 5) - s1 + char;
    s1 |= 0;
    s2 += char * (i + 1);
  }

  s1 = Math.abs(s1);
  s2 = Math.abs(s2);

  const nextHex = (seed: number, limit: number) => {
    const nextSeed = (seed * 9301 + 49297) % 233280;
    const val = Math.floor((nextSeed / 233280) * limit);
    return { val, nextSeed };
  };

  let hexStr = '';
  for (let i = 0; i < 32; i++) {
    const { val, nextSeed } = i % 2 === 0 ? nextHex(s1, 16) : nextHex(s2, 16);
    if (i % 2 === 0) s1 = nextSeed;
    else s2 = nextSeed;
    hexStr += val.toString(16);
  }

  const part1 = hexStr.substring(0, 8);
  const part2 = hexStr.substring(8, 12);
  const part3 = '4' + hexStr.substring(13, 16); // set version 4
  const part4 = ((parseInt(hexStr.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hexStr.substring(17, 20); // set variant 1 (8, 9, a, b)
  const part5 = hexStr.substring(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}
