// @ts-nocheck
// supabase/functions/send-reminders/index.ts
// Deno Edge Function — runs every minute via pg_cron
// Finds tasks due within each user's reminder window and sends Web Push.
// NOTE: This is Deno code, not Node.js. Deploy via: supabase functions deploy send-reminders

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') ?? 'mailto:admin@locked-in.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/* ---- VAPID JWT helpers (pure crypto, no external deps) ---- */
function base64urlEncode(buf: Uint8Array): string {
  let s = '';
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function buildVapidJwt(audience: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_EMAIL,
  };

  const encode = (obj: object) =>
    base64urlEncode(new TextEncoder().encode(JSON.stringify(obj)));
  const sigInput = `${encode(header)}.${encode(payload)}`;

  // Import VAPID private key (raw base64url EC P-256 scalar)
  const rawPriv = base64urlDecode(VAPID_PRIVATE_KEY);
  const keyData = new Uint8Array(36 + rawPriv.length);
  // PKCS8 prefix for P-256 private key
  const pkcs8Prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  // Simpler: use SubtleCrypto importKey with raw format for ECDSA
  const privKey = await crypto.subtle.importKey(
    'pkcs8',
    (() => {
      // Build minimal PKCS8 for P-256 private key from raw scalar
      const prefix = new Uint8Array([
        48, 65, 2, 1, 0, 48, 19, 6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42,
        134, 72, 206, 61, 3, 1, 7, 4, 39, 48, 37, 2, 1, 1, 4, 32,
      ]);
      const der = new Uint8Array(prefix.length + rawPriv.length);
      der.set(prefix);
      der.set(rawPriv, prefix.length);
      return der.buffer;
    })(),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privKey,
    new TextEncoder().encode(sigInput)
  );

  return `${sigInput}.${base64urlEncode(new Uint8Array(sig))}`;
}

/* ---- Send a single Web Push notification ---- */
async function sendPush(
  endpoint: string,
  p256dh: string,
  authKey: string,
  payload: object
): Promise<boolean> {
  try {
    const origin = new URL(endpoint).origin;
    const jwt = await buildVapidJwt(origin);
    const rawPubKey = base64urlDecode(VAPID_PUBLIC_KEY);

    const headers: Record<string, string> = {
      Authorization: `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      'Content-Type': 'application/json',
      TTL: '86400',
    };

    // For encrypted push we need Web Push encryption (RFC 8291)
    // For simplicity we send unencrypted to endpoints that accept it,
    // and fallback to encrypted via the Web Push Protocol.
    // Full RFC 8291 encryption is complex; we use the payload approach
    // supported by modern browsers via the push event handler in sw.js.

    // Build encrypted payload using RFC 8188 / RFC 8291
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

    // Generate sender (server) ephemeral key pair
    const senderKeys = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
    const senderPubKeyRaw = new Uint8Array(
      await crypto.subtle.exportKey('raw', senderKeys.publicKey)
    );

    // Import receiver public key
    const receiverPubKey = await crypto.subtle.importKey(
      'raw',
      base64urlDecode(p256dh),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Derive shared secret
    const sharedBits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: receiverPubKey },
      senderKeys.privateKey,
      256
    );

    // Auth secret
    const authSecret = base64urlDecode(authKey);

    // HKDF to derive content encryption key + nonce (RFC 8291)
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const hkdfKey = await crypto.subtle.importKey(
      'raw',
      sharedBits,
      'HKDF',
      false,
      ['deriveKey', 'deriveBits']
    );

    // PRK from auth secret
    const prkHmac = await crypto.subtle.importKey(
      'raw',
      authSecret,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
    const prkBits = await crypto.subtle.sign('HMAC', prkHmac, authInfo);

    // Context for key derivation
    const receiverPubRaw = base64urlDecode(p256dh);
    const context = new Uint8Array(
      5 + 2 + receiverPubRaw.length + 2 + senderPubKeyRaw.length
    );
    context.set(new TextEncoder().encode('P-256'), 0);
    context[5] = 0;
    context[6] = receiverPubRaw.length;
    context.set(receiverPubRaw, 7);
    context[7 + receiverPubRaw.length] = 0;
    context[8 + receiverPubRaw.length] = senderPubKeyRaw.length;
    context.set(senderPubKeyRaw, 9 + receiverPubRaw.length);

    // Derive CEK and nonce
    const cekInfo = new Uint8Array([
      ...new TextEncoder().encode('Content-Encoding: aesgcm\0'),
      ...context,
    ]);
    const nonceInfo = new Uint8Array([
      ...new TextEncoder().encode('Content-Encoding: nonce\0'),
      ...context,
    ]);

    const prkKey = await crypto.subtle.importKey('raw', prkBits, 'HKDF', false, [
      'deriveBits',
    ]);

    const cekBits = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo },
      prkKey,
      128
    );
    const nonceBits = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo },
      prkKey,
      96
    );

    const cek = await crypto.subtle.importKey(
      'raw',
      cekBits,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Pad payload (RFC 8291 requires 2-byte padding length prefix)
    const padded = new Uint8Array(2 + payloadBytes.length);
    padded.set(payloadBytes, 2);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonceBits },
      cek,
      padded
    );

    // Build aesgcm body
    headers['Encryption'] = `salt=${base64urlEncode(salt)}`;
    headers['Crypto-Key'] =
      `dh=${base64urlEncode(senderPubKeyRaw)};p256ecdsa=${VAPID_PUBLIC_KEY}`;
    headers['Content-Encoding'] = 'aesgcm';
    headers['Content-Length'] = String(encrypted.byteLength);

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: encrypted,
    });

    return resp.ok || resp.status === 201;
  } catch (err) {
    console.error('sendPush error:', err);
    return false;
  }
}

/* ---- Main handler ---- */
Deno.serve(async (req) => {
  // Allow cron invocation (no body required) or manual POST
  try {
    const now = new Date();
    const nowUtc = now.toISOString();

    // Fetch all push subscriptions with their user's tasks
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth, timezone, reminder_mins');

    if (subErr || !subs?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
    }

    let sent = 0;

    for (const sub of subs) {
      // Compute "now" in user's timezone
      const userNow = new Date(
        now.toLocaleString('en-US', { timeZone: sub.timezone })
      );
      const targetMs = userNow.getTime() + sub.reminder_mins * 60_000;
      const target = new Date(targetMs);

      // Format date as YYYY-MM-DD and time window
      const targetDate = target.toISOString().slice(0, 10);
      const targetHH = target.getHours().toString().padStart(2, '0');
      const targetMM = target.getMinutes().toString().padStart(2, '0');
      const targetTime = `${targetHH}:${targetMM}:00`;

      // Window: tasks whose start_time is within [now_local_time, target_time]
      const nowHH = userNow.getHours().toString().padStart(2, '0');
      const nowMM = userNow.getMinutes().toString().padStart(2, '0');
      const nowTime = `${nowHH}:${nowMM}:00`;

      // Find incomplete tasks due at the target time on the target date
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, start_time, due_date')
        .eq('user_id', sub.user_id)
        .eq('completed', false)
        .eq('due_date', targetDate)
        .gte('start_time', nowTime)
        .lte('start_time', targetTime);

      if (!tasks?.length) continue;

      for (const task of tasks) {
        // Check if we already sent a notification for this task+subscription recently
        const { data: alreadySent } = await supabase
          .from('push_notifications_sent')
          .select('id')
          .eq('subscription_id', sub.id)
          .eq('task_id', task.id)
          .gte('sent_at', new Date(now.getTime() - 30 * 60_000).toISOString())
          .single();

        if (alreadySent) continue;

        const minsUntil = Math.round(
          (new Date(`${targetDate}T${task.start_time}`).getTime() - userNow.getTime()) / 60_000
        );

        const ok = await sendPush(sub.endpoint, sub.p256dh, sub.auth, {
          title: `⏰ ${task.title}`,
          body: `Due in ${minsUntil} min${minsUntil !== 1 ? 's' : ''}`,
          tag: `task-${task.id}`,
          url: '/Locked-In/agenda/',
        });

        if (ok) {
          // Record that we sent this notification
          await supabase.from('push_notifications_sent').insert({
            subscription_id: sub.id,
            task_id: task.id,
            sent_at: nowUtc,
          });
          sent++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-reminders error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
    });
  }
});
