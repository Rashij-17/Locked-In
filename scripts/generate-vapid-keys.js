/**
 * Run once: node scripts/generate-vapid-keys.js
 * Outputs VAPID public + private keys to add to .env.local
 */
const crypto = require('crypto');

function base64url(buf) {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'der' },
});

// Extract raw 65-byte uncompressed public key (skip 26-byte SPKI header)
const rawPublic = base64url(publicKey.slice(26));
// Extract raw 32-byte private key (skip 36-byte PKCS8 header)
const rawPrivate = base64url(privateKey.slice(36));

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your .env.local:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${rawPublic}`);
console.log(`VAPID_PRIVATE_KEY=${rawPrivate}`);
console.log(`VAPID_EMAIL=mailto:admin@locked-in.app`);
console.log('\nAlso add NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
console.log('and VAPID_EMAIL to your Supabase Edge Function secrets.\n');
