// sw.js — CA Final Study Tracker Service Worker
// ═══════════════════════════════════════════════════════════════════
//
// VERSION HISTORY:
//   ca-tracker-v1  — original (aggressive caching, caused iOS white screen)
//   ca-tracker-v3  — iOS-safe rewrite (network-first, non-atomic install)
//
// KEY iOS FIXES IN THIS VERSION:
//   1. Non-atomic pre-cache: each URL cached individually so one 404
//      does NOT abort the entire SW install (the v1 atomicaddAll bug).
//   2. skipWaiting() called even when pre-cache partly fails.
//   3. External CDN URLs (XLSX, Google Fonts) are never intercepted.
//   4. isExternal uses URL origin comparison — reliable across all paths.
//   5. Network-first for HTML + JS + CSS; cache-first for icons/images.
//   6. All catch() handlers return a usable response (never undefined).
//
// ═══════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'v3';
const CACHE_NAME    = `ca-tracker-${CACHE_VERSION}`;

// ── Files to pre-cache on install ──────────────────────────────────
// ONLY local same-origin files that ACTUALLY EXIST on disk.
// Missing files cause SW install failure on iOS — even one 404 can
// abort the entire install when using cache.addAll() (atomic).
// We use individual fetches below to avoid this trap.
const PRECACHE_URLS = [
  './index.html',
  './css/style.css',
  './manifest.json',
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
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-167.png',
  './assets/icons/icon-152.png',
  './assets/icons/icon-120.png',
  './assets/icons/icon-96.png',
];

// ── Install: cache assets one-by-one (NON-ATOMIC) ──────────────────
// Using individual cache.put() calls instead of cache.addAll() so that
// a single missing file does NOT abort SW installation.
// THE ROOT CAUSE: v1 used cache.addAll() which fails atomically —
// one missing icon (e.g. icon-96.png) killed the whole SW install,
// leaving iOS with no service worker and a white screen.
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      var cachePromises = PRECACHE_URLS.map(function(url) {
        return fetch(url, { cache: 'no-store' })
          .then(function(response) {
            if (response.ok) {
              return cache.put(url, response);
            }
            console.warn('[SW] Pre-cache skip (non-ok):', url, response.status);
          })
          .catch(function(err) {
            console.warn('[SW] Pre-cache skip (error):', url, err.message);
            // Non-fatal: SW install continues regardless
          });
      });
      return Promise.all(cachePromises);
    })
    .catch(function(err) {
      console.warn('[SW] Cache open failed:', err);
    })
    .then(function() {
      // CRITICAL: always call skipWaiting even if pre-cache had errors.
      // iOS keeps PWA tabs alive indefinitely — without this a new SW
      // version would NEVER activate for an iOS user.
      return self.skipWaiting();
    })
  );
});

// ── Activate: delete ALL old caches ────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) { return name !== CACHE_NAME; })
            .map(function(name) {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        // CRITICAL: take control of all open pages immediately.
        // Without this, the current iOS page stays under the old SW.
        return self.clients.claim();
      })
      .catch(function(err) {
        console.warn('[SW] Activate error:', err);
        return self.clients.claim();
      })
  );
});

// ── Message handler: SKIP_WAITING ──────────────────────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Fetch: safe network-first strategy ─────────────────────────────
self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = req.url;

  // Only handle GET
  if (req.method !== 'GET') return;

  // Skip non-http protocols
  if (url.indexOf('http') !== 0) return;

  // ── External resources: BYPASS the service worker ──────────────
  // Never intercept requests to CDNs, Google Fonts, etc.
  // Opaque (no-cors) responses corrupt iOS cache and cause 404-style
  // failures that are impossible to recover from without clearing storage.
  var requestOrigin;
  try {
    requestOrigin = new URL(url).origin;
  } catch (e) {
    return; // Malformed URL — skip
  }

  if (requestOrigin !== self.location.origin) {
    return; // Let browser handle external requests natively
  }

  // ── HTML: Network-first ─────────────────────────────────────────
  // Always try to get fresh HTML. Stale cached HTML is the top cause
  // of "frozen" iOS PWA state after an app update.
  if (url.indexOf('.html') !== -1 || url.slice(-1) === '/') {
    event.respondWith(networkFirst(req));
    return;
  }

  // ── JS and CSS: Network-first ───────────────────────────────────
  // Code updates must reach iOS immediately. Cache-first for JS/CSS
  // means stale code keeps running on iOS with no way for users to fix it.
  if (/\.(js|css)(\?|$)/.test(url)) {
    event.respondWith(networkFirst(req));
    return;
  }

  // ── Icons and images: Cache-first ──────────────────────────────
  // Static assets versioned by filename — safe to serve from cache.
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico)(\?|$)/.test(url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // ── Default: Network-first ──────────────────────────────────────
  event.respondWith(networkFirst(req));
});

// ── Network-first: try network, fall back to cache ──────────────────
function networkFirst(req) {
  return fetch(req, { cache: 'no-store' })
    .then(function(response) {
      if (response && response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(req, clone);
        }).catch(function() {});
      }
      return response;
    })
    .catch(function() {
      return caches.match(req).then(function(cached) {
        if (cached) return cached;
        return caches.match('./index.html').then(function(shell) {
          return shell || new Response(
            '<!DOCTYPE html><html><body><h2>CA Tracker</h2><p>You are offline. Please reconnect and refresh.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      });
    });
}

// ── Cache-first: serve from cache, fetch if missing ─────────────────
function cacheFirst(req) {
  return caches.match(req).then(function(cached) {
    if (cached) return cached;
    return fetch(req).then(function(response) {
      if (response && response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(req, clone);
        }).catch(function() {});
      }
      return response;
    }).catch(function() {
      return new Response('', { status: 204, statusText: 'No Content' });
    });
  });
}
