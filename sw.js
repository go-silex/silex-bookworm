/* ── Service worker : cache des couvertures ──────────────────────
   Les images de couverture (Open Library, Google Books) sont mises
   en cache à la première requête : le retour sur un onglet est
   instantané. Le reste du site n'est pas intercepté. */

const CACHE = 'covers-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  if (!/covers\.openlibrary\.org|books\.google(usercontent)?\.com/.test(e.request.url)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request);
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
    return res;
  })());
});
