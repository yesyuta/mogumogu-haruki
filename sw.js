// アプリを更新したら VERSION の数字を1つ上げてください
// Bump VERSION whenever you upload changed files.
const VERSION = 'v14';
const SHELL = ['./', './index.html', './config.js', './tips.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Firebase data traffic is handled by the Firebase SDK itself
  if (url.hostname.endsWith('googleapis.com') && !url.hostname.startsWith('fonts.')) return;
  const sameOrigin = url.origin === self.location.origin;
  const cacheable = sameOrigin || url.hostname === 'www.gstatic.com' || url.hostname.startsWith('fonts.');
  if (!cacheable) return;
  if (sameOrigin) {
    // network first for the app itself, so updates arrive; cache when offline
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r;
    })));
  }
});
