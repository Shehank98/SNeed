/* Service worker: precaches the built app so it works offline after the first visit.
   __PRECACHE__ and __VERSION__ are filled in by vite.config.js after the build. */
const VERSION = '__VERSION__';
const CACHE = 'letter-heroes-' + VERSION;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(Array.isArray(PRECACHE) ? PRECACHE : ['./'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('letter-heroes-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Navigations: app shell from cache, refreshed in the background.
  if (req.mode === 'navigate') {
    e.respondWith(
      caches.match('./').then((hit) => {
        const net = fetch(req).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put('./', r.clone())); return r; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return r;
    }))
  );
});
