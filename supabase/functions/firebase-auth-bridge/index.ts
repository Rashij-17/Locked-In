// @ts-nocheck
// supabase/functions/firebase-auth-bridge/index.ts
//
// Deno Edge Function — Firebase → Supabase Auth Bridge
//
// Flow:
//   1. Client POSTs a Firebase ID token (from user.getIdToken())
//   2. This function verifies it against Google's public certs
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

// ---- Base64url helpers ----
function base64urlDecode(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function base64urlEncode(buf: Uint8Array): string {
  let s = '';
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ---- Verify a Firebase ID token ----
// Google publishes RS256 certs at this well-known URL.
const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

async function getGoogleCerts(): Promise<Record<string, string>> {
  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error(`Failed to fetch Google certs: ${res.status}`);
  return res.json();
}

async function importRSAPublicKey(pemCert: string): Promise<CryptoKey> {
  // Extract base64 DER from PEM certificate
  const pemBody = pemCert
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s+/g, '');

  const certDer = base64urlDecode
    ? Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))
    : new Uint8Array(0);

  // Parse the X.509 certificate to extract the RSA public key
  // SubtleCrypto can't import X.509 certs directly; we use the spki format.
  // For RS256 in Google's certs, we import the entire DER cert as "spki" after
  // stripping the cert wrapper — use a simpler approach: import via SubtleCrypto
  // with the 'RSASSA-PKCS1-v1_5' algorithm.

  // Deno supports importKey with "raw" X.509 DER if we use the correct algorithm
  try {
    return await crypto.subtle.importKey(
      'spki',
      // The DER-encoded SubjectPublicKeyInfo from the cert
      // We need to extract the SPKI from the X.509 cert DER manually.
      extractSPKIFromX509(certDer),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  } catch {
    // Fallback: try importing the full cert DER (some runtimes support this)
    const certBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      'spki',
      certBytes,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  }
}

// Minimal ASN.1 DER parser to extract SubjectPublicKeyInfo from X.509 cert
function extractSPKIFromX509(der: Uint8Array): ArrayBuffer {
  // X.509 structure: SEQUENCE { SEQUENCE { ... }, BIT STRING { SPKI } }
  // We walk the DER to find the SubjectPublicKeyInfo
  let offset = 0;

  function readLength(buf: Uint8Array, pos: number): { len: number; nextPos: number } {
    if (buf[pos] < 0x80) return { len: buf[pos], nextPos: pos + 1 };
    const numBytes = buf[pos] & 0x7f;
    let len = 0;
    for (let i = 0; i < numBytes; i++) {
      len = (len << 8) | buf[pos + 1 + i];
    }
    return { len, nextPos: pos + 1 + numBytes };
  }

  // Skip outer SEQUENCE
  offset++; // tag
  const outer = readLength(der, offset);
  offset = outer.nextPos;

  // Skip tbsCertificate SEQUENCE
  offset++; // tag (SEQUENCE)
  const tbs = readLength(der, offset);
  offset = tbs.nextPos;

  // tbsCertificate contains: version[0], serialNumber, signature, issuer,
  // validity, subject, subjectPublicKeyInfo
  // We need to find SubjectPublicKeyInfo by walking the TBS fields
  const tbsEnd = offset + tbs.len;

  // version (optional, context[0])
  if (der[offset] === 0xa0) {
    offset++;
    const v = readLength(der, offset);
    offset = v.nextPos + v.len;
  }

  // serialNumber (INTEGER)
  offset++;
  const serial = readLength(der, offset);
  offset = serial.nextPos + serial.len;

  // signature (SEQUENCE)
  offset++;
  const sig = readLength(der, offset);
  offset = sig.nextPos + sig.len;

  // issuer (SEQUENCE)
  offset++;
  const issuer = readLength(der, offset);
  offset = issuer.nextPos + issuer.len;

  // validity (SEQUENCE)
  offset++;
  const validity = readLength(der, offset);
  offset = validity.nextPos + validity.len;

  // subject (SEQUENCE)
  offset++;
  const subject = readLength(der, offset);
  offset = subject.nextPos + subject.len;

  // subjectPublicKeyInfo (SEQUENCE) — this is what we want
  const spkiStart = offset;
  offset++;
  const spki = readLength(der, offset);
  const spkiEnd = offset + spki.nextPos - offset + spki.len;

  return der.slice(spkiStart, spkiStart + 1 + (offset - spkiStart) + spki.len).buffer;
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email: string | null } | null> {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Basic claims validation
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    if (payload.iat > now + 300) return null; // allow 5 min clock skew
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    if (!payload.sub) return null;

    // Fetch Google certs and verify signature
    const certs = await getGoogleCerts();
    const pemCert = certs[header.kid];
    if (!pemCert) return null;

    const pubKey = await importRSAPublicKey(pemCert);

    const sigInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64urlDecode(parts[2]);

    const valid = await crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' },
      pubKey,
      signature,
      sigInput
    );

    if (!valid) return null;

    return { uid: payload.sub, email: payload.email ?? null };
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
      // Store as a fake email to avoid duplication
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
