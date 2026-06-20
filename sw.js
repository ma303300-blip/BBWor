const CACHE = 'bbwoa-v2';
const ASSETS = [
  '/BBWor/',
  '/BBWor/index.html',
  '/BBWor/manifest.json',
  '/BBWor/bg.jpg',
  '/BBWor/icons/icon-192x192.png',
  '/BBWor/icons/icon-512x512.png'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
