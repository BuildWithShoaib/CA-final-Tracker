// sw.js — CA Final Study Tracker Service Worker
// ═══════════════════════════════════════════════════════════════════
//
// VERSIONING STRATEGY:
//   Bump CACHE_VERSION whenever you deploy changes.
//   The activate handler deletes all caches that don't match CACHE_NAME.
//   This ensures iOS Safari never serves stale cached files after an update.
//
//   Old cache:  ca-tracker-v1   ← deleted on next activate
//   Current:    ca-tracker-v2
//
// iOS-SPECIFIC FIXES:
//   1. self.skipWaiting() — activates new SW immediately instead of waiting
//      for all tabs to close (iOS keeps PWA tabs alive indefinitely)
//   2. clients.claim() — takes control of existing pages immediately
//   3. SKIP_WAITING message handler — allows the page to trigger activation
//   4. Network-first strategy for HTML — ensures iOS never loads stale shell
//   5. Cache-busting: HTML and JS files use network-first (not cache-first)
//      so updates propagate immediately on iOS
//   6. External resource handling bypasses SW to avoid opaque response issues
//
// ═══════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'v2';
const CACHE_NAME    = `ca-tracker-${CACHE_VERSION}`;

// ── Files to pre-cache on install ──────────────────────────────────
// These are fetched and stored during SW installation.
// Only local (same-origin) files — external URLs cause opaque responses
// that inflate cache storage and can fail on iOS.
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
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-152.png',
  './assets/icons/icon-167.png',
  './assets/icons/icon-120.png',
];

// ── Install: pre-cache local assets ────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // addAll fails atomically — if one URL fails, nothing is cached.
        // We filter to only local files to avoid opaque response issues.
        const localUrls = PRECACHE_URLS.filter(u => !u.startsWith('http'));
        return cache.addAll(localUrls);
      })
      .then(() => {
        // CRITICAL for iOS: activate this SW immediately without waiting
        // for existing tabs to close. iOS PWAs often keep one tab open
        // indefinitely, so without skipWaiting(), updates never activate.
        return self.skipWaiting();
      })
      .catch(err => {
        // Pre-cache failure must not break the SW installation.
        // The app will still work — just won't be fully offline-capable
        // until the next successful install.
        console.warn('[SW] Pre-cache partial failure (non-fatal):', err);
        // Still call skipWaiting even if some files failed
        return self.skipWaiting();
      })
  );
});

// ── Activate: delete ALL old caches ────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            // Delete every cache that isn't the current version
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        )
      )
      .then(() => {
        // CRITICAL for iOS: take control of ALL open tabs immediately.
        // Without clients.claim(), the new SW only controls pages opened
        // AFTER activation — the current page stays under the old SW.
        return self.clients.claim();
      })
  );
});

// ── Message handler: SKIP_WAITING ──────────────────────────────────
// The index.html JS sends this message to trigger immediate activation
// of a waiting SW. This is the correct pattern for iOS where the user
// can't easily close all tabs to trigger a SW update.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch: layered caching strategy ────────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;
  const method = event.request.method;

  // Only handle GET requests
  if (method !== 'GET') return;

  // Skip chrome-extension and non-http(s) URLs
  if (!url.startsWith('http')) return;
  if (url.startsWith('chrome-extension://')) return;

  // ── External resources: BYPASS SERVICE WORKER ──────────────────
  // We do NOT intercept external CDN/font requests in the SW.
  // Reasons:
  //   1. Opaque responses (no-cors) bloat iOS cache storage unpredictably
  //   2. External resources have their own CDN caching
  //   3. Avoids SSL/CORS issues in iOS WebKit
  //   4. The XLSX library and Google Fonts work fine without SW caching
  const isExternal = !url.startsWith(self.location.origin) &&
                     !url.startsWith('./');

  if (isExternal) {
    // Let the browser handle it normally — no SW interception
    return;
  }

  // ── HTML files: NETWORK-FIRST with cache fallback ───────────────
  // CRITICAL for iOS: always try network first for the app shell.
  // Cache-first for HTML means iOS would never see updates.
  // If network fails (offline), serve from cache.
  if (url.endsWith('.html') || url.endsWith('/') ||
      url === self.location.origin + '/') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            // Clone and cache the fresh response
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: serve cached HTML
          return caches.match(event.request)
            .then(cached => cached || caches.match('./index.html'));
        })
    );
    return;
  }

  // ── JS and CSS: NETWORK-FIRST with cache fallback ───────────────
  // Same as HTML — ensures JS/CSS updates propagate to iOS immediately.
  // Cache-first would mean old JS runs indefinitely on iOS.
  if (url.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // ── Icons and other static assets: CACHE-FIRST ─────────────────
  // Icons/images don't change between versions (they're versioned by filename).
  // Cache-first is appropriate here — faster and reduces network requests.
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        // Not in cache — fetch and store it
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => {
            // Offline and not cached — return index.html as last resort
            return caches.match('./index.html');
          });
      })
  );
});
