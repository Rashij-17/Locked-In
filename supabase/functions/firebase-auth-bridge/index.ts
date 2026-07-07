// @ts-nocheck
// supabase/functions/firebase-auth-bridge/index.ts
//
// Deno Edge Function — Firebase → Supabase Auth Bridge
//
// Flow:
//   1. Client POSTs a Firebase ID token (from user.getIdToken())
//   2. This function verifies it against Google's public certs using 'jose'
//   3. Finds or creates a matching Supabase Auth user by email
//   4. Returns a signed Supabase JWT so the client can call
//      supabase.auth.setSession() and satisfy RLS policies
//
// Deploy: supabase functions deploy firebase-auth-bridge --project-ref <ref>
// Requires env vars:
//   SUPABASE_URL              (auto-provided by Supabase runtime)
//   SUPABASE_SERVICE_ROLE_KEY (auto-provided by Supabase runtime)
//   CUSTOM_JWT_SECRET         (from Dashboard → Settings → API → JWT Secret)
//   FIREBASE_PROJECT_ID       (your Firebase project ID, e.g. locked-in-3dfae)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://esm.sh/jose@4.14.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_JWT_SECRET = Deno.env.get('CUSTOM_JWT_SECRET')!;
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') ?? 'locked-in-3dfae';

// ---- CORS headers ----
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ---- Base64url helper for custom JWT signing ----
function base64urlEncode(buf: Uint8Array): string {
  let s = '';
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Global cache for Google certificates
let cachedCerts: Record<string, string> | null = null;
let certsExpiry = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < certsExpiry) {
    return cachedCerts;
  }

  const res = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!res.ok) throw new Error(`Failed to fetch Google certs: ${res.status}`);

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  cachedCerts = await res.json();
  certsExpiry = now + maxAge * 1000;
  return cachedCerts!;
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email: string | null } | null> {
  try {
    const certs = await getGoogleCerts();
    const header = jose.decodeProtectedHeader(idToken);
    const kid = header.kid;
    if (!kid) {
      console.error('No kid claim in protected header');
      return null;
    }

    const pemCert = certs[kid];
    if (!pemCert) {
      console.error(`Certificate not found for kid: ${kid}`);
      return null;
    }

    // Import public key directly from PEM using jose
    const publicKey = await jose.importX509(pemCert, 'RS256');

    // Verify token claims and signature
    const { payload } = await jose.jwtVerify(idToken, publicKey, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });

    if (!payload.sub) {
      console.error('No sub claim in token payload');
      return null;
    }

    return {
      uid: payload.sub,
      email: (payload.email as string) || null,
    };
  } catch (err) {
    console.error('Firebase token verification error:', err);
    return null;
  }
}

// ---- Mint a Supabase JWT ----
async function mintSupabaseJWT(userId: string, email: string | null): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60; // 1 hour

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: SUPABASE_URL,
    sub: userId,
    email: email ?? '',
    role: 'authenticated',
    iat: now,
    exp,
  };

  const encode = (obj: object) =>
    base64urlEncode(new TextEncoder().encode(JSON.stringify(obj)));

  const sigInput = `${encode(header)}.${encode(payload)}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SUPABASE_JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sigInput));

  return `${sigInput}.${base64urlEncode(new Uint8Array(sig))}`;
}

// ---- Main handler ----
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing idToken' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // 1. Verify the Firebase ID token
    const firebaseUser = await verifyFirebaseIdToken(idToken);
    if (!firebaseUser) {
      return new Response(JSON.stringify({ error: 'Invalid Firebase token' }), {
        status: 401,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // 2. Find or create a Supabase Auth user
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let supabaseUserId: string;

    // Try to find existing user by email
    if (firebaseUser.email) {
      const { data: listData } = await admin.auth.admin.listUsers();
      const existingUser = listData?.users?.find(
        (u) => u.email === firebaseUser.email
      );

      if (existingUser) {
        supabaseUserId = existingUser.id;
      } else {
        // Create new Supabase Auth user
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: firebaseUser.email,
          email_confirm: true,
          user_metadata: { firebase_uid: firebaseUser.uid },
        });

        if (createErr || !created?.user) {
          console.error('Failed to create Supabase user:', createErr);
          return new Response(
            JSON.stringify({ error: 'Failed to create user' }),
            { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
          );
        }

        supabaseUserId = created.user.id;
      }
    } else {
      // No email — use Firebase UID as a deterministic identifier
      const fakeEmail = `${firebaseUser.uid}@firebase.bridge`;
      const { data: listData } = await admin.auth.admin.listUsers();
      const existingUser = listData?.users?.find((u) => u.email === fakeEmail);

      if (existingUser) {
        supabaseUserId = existingUser.id;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: fakeEmail,
          email_confirm: true,
          user_metadata: { firebase_uid: firebaseUser.uid },
        });

        if (createErr || !created?.user) {
          return new Response(
            JSON.stringify({ error: 'Failed to create user' }),
            { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
          );
        }
        supabaseUserId = created.user.id;
      }
    }

    // 3. Mint a Supabase JWT for this user
    const accessToken = await mintSupabaseJWT(supabaseUserId, firebaseUser.email);

    return new Response(
      JSON.stringify({ access_token: accessToken, user_id: supabaseUserId }),
      {
        status: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('firebase-auth-bridge error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
