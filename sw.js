
const CACHE = 'pushup-cache-v2';
const FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', evt => {
  evt.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', evt => {
  evt.respondWith(caches.match(evt.request).then(r => r || fetch(evt.request)));
});
