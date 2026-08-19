/* Sunday HQ service worker — app shell caching */
const V = 'shq-v8';
const SHELL = ['./', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  /* app shell: network first (updates land immediately), cache fallback (offline boot) */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(V).then(c => c.put('./', copy));
        return r;
      }).catch(() => caches.match('./'))
    );
    return;
  }
  /* static CDN (react, fonts, logos): cache first */
  if (/unpkg\.com|fonts\.(googleapis|gstatic)\.com|a\.espncdn\.com/.test(u.hostname)) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(V).then(c => c.put(e.request, copy));
        return r;
      }))
    );
    return;
  }
  /* live data (espn, weather, relay, anthropic): network only — never serve stale scores */
});
