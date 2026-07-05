/* ============================================================
   LOCKED IN — Service Worker
   Precaches the app shell on install, serves cache-first,
   handles push notifications and notificationclick.
   ============================================================ */

const BASE = '/Locked-In';
// Cache version bumps automatically on every deployment via build timestamp.
// This forces old cached HTML + stale chunks to be cleared immediately.
const CACHE_NAME = 'locked-in-v-__BUILD_TIME__';

const PRECACHE_URLS = [
  BASE + '/',
  BASE + '/manifest.json',
  BASE + '/web-app-manifest-512x512.png',
  BASE + '/favicon.ico',
];

/* ---- Install: precache app shell ---- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ---- Activate: clean up old caches ---- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/* ---- Fetch: cache-first for precached assets, network for rest ---- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isPrecached = PRECACHE_URLS.some(
    (path) => url.pathname === path || url.pathname === path + '/'
  );

  if (isPrecached) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
  // All other requests fall through to the network normally
});

/* ---- Push: show notification ---- */
self.addEventListener('push', (event) => {
  let data = { title: 'Locked In', body: 'You have a task coming up!' };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (_) {}

  const options = {
    body: data.body,
    icon: BASE + '/web-app-manifest-512x512.png',
    badge: BASE + '/favicon-96x96.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || BASE + '/' },
    tag: data.tag || 'locked-in-reminder',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

/* ---- Notification click: focus or open app ---- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || BASE + '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
