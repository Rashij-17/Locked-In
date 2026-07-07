/* ============================================================
   LOCKED IN — Supabase Client
   If environment variables are set, connects to a real Supabase
   instance. Otherwise, runs in local mode with localStorage.
   ============================================================ */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Startup warning validation
if (typeof window !== 'undefined') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      'Locked-In: Supabase environment variables are missing! Running in local-only mode (using localStorage).'
    );
  }
}

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

// Track the logged-in Supabase user UUID from our hybrid bridge
export let supabaseUserId: string | null = null;

/**
 * Calls the edge function auth bridge to exchange a Firebase token for a Supabase JWT session.
 */
export async function signInToSupabase(firebaseIdToken: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/firebase-auth-bridge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: firebaseIdToken }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error('Supabase auth bridge failed:', res.status, errData);
      return false;
    }

    const { access_token, user_id } = await res.json();
    if (!access_token || !user_id) {
      console.error('Invalid response from Supabase auth bridge');
      return false;
    }

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token: access_token,
    });

    if (error) {
      console.error('Failed to set Supabase session:', error);
      return false;
    }

    supabaseUserId = user_id;
    return true;
  } catch (err) {
    console.error('Error in signInToSupabase:', err);
    return false;
  }
}

export function clearSupabaseSession() {
  supabaseUserId = null;
  if (supabase) {
    supabase.auth.signOut().catch(() => {});
  }
}

export function showStorageErrorToast(message: string) {
  if (typeof document === 'undefined') return;
  let container = document.querySelector('.toast-container') as HTMLElement;
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast--error';

  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(text);

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      if (container.children.length === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 500);
  }, 4000);
}

/**
 * Helper to deterministically map an alphanumeric Firebase UID into a valid UUID.
 * @deprecated Use supabaseUserId set by the bridge instead for authenticating tables.
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

