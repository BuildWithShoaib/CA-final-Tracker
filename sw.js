// sw.js — CA Final Study Tracker Service Worker
// Provides offline support by caching all app assets.

const CACHE_NAME = 'ca-tracker-v1';

// All assets to pre-cache on install
const PRECACHE_URLS = [
  './index.html',
  './css/style.css',
  './js/constants.js',
  './js/storage.js',
  './js/risk-engine.js',
  './js/metrics.js',
  './js/helpers.js',
  './js/ui-dash.js',
  './js/timer.js',
  './js/planner.js',
  './js/tests.js',
  './js/diary.js',
  './js/strategy.js',
  './js/app.js',
  // Google Fonts — cached on first use via network-first strategy
  'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700;800&display=swap',
];

// External CDN resources cached on first request
const EXTERNAL_CACHE_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
];

// ── Install: pre-cache local assets ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS.filter(u => !u.startsWith('http'))))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Pre-cache failed:', err))
  );
});

// ── Activate: clean up old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for local, network-first for external ────
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (url.startsWith('chrome-extension://')) return;

  // For external CDN / fonts: network-first with cache fallback
  const isExternal = url.startsWith('https://') &&
    !url.includes(self.location.hostname);

  if (isExternal) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For local app files: cache-first, fallback to network then index.html
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
            }
            return response;
          })
          .catch(() => caches.match('./index.html')); // offline fallback
      })
  );
});
