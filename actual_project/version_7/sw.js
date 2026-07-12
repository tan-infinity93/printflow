/**
 * sw.js — §11 PrintFlow Service Worker
 *
 * Strategy:
 *   - Same-origin assets  → cache-first (always serve from cache, update in bg)
 *   - CDN assets (pinned) → cache-first (version-pinned → safe to cache forever)
 *   - Everything else     → network-first with cache fallback
 *
 * Bump CACHE_VERSION on every release. The activate handler deletes old caches.
 */

const CACHE_VERSION = "printflow-v7.0.0";

/* All CDN URLs that are version-pinned and safe to cache indefinitely.
   Keep this list in sync with workspace.html and index.html. */
const CDN_URLS = [
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/svg2pdf.js@2.2.4/dist/svg2pdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/js/all.min.js",
  // Three.js lazy-loaded by inspector3d.js
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/three.min.js",
  // JsBarcode & qrcode lazy-loaded by barcodes.js
  "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js",
];

/* Same-origin assets to pre-cache on install */
const SAME_ORIGIN_ASSETS = [
  "./",
  "./index.html",
  "./workspace.html",
  "./style.css",
  "./shared-db.js",
  "./license.js",
  "./layout.js",
  "./canvas-elements.js",
  "./canvas-interactions.js",
  "./scripts.js",
  "./letters.js",
  "./labels.js",
  "./merge.js",
  "./brandkit.js",
  "./barcodes.js",
  "./approval.js",
  "./inspector3d.js",
  "./darkmode.js",
  "./exports.js",
  "./imports.js",
  "./stats.js",
  "./help.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

/* ============================================================
   INSTALL — pre-cache same-origin assets
   CDN assets are cached on first use (lazy), not at install time,
   to keep install fast and avoid failing on a slow connection.
   ============================================================ */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll() will fail silently per-resource if a file 404s during dev;
      // use individual add() with a catch so one missing asset doesn't abort.
      Promise.allSettled(
        SAME_ORIGIN_ASSETS.map((url) => cache.add(url).catch(() => {}))
      )
    ).then(() => self.skipWaiting())
  );
});

/* ============================================================
   ACTIVATE — delete stale caches
   ============================================================ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ============================================================
   FETCH — routing logic
   ============================================================ */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET requests and browser-extension requests
  if (request.method !== "GET" || !url.startsWith("http")) return;

  // Determine if this is a same-origin or known CDN request
  const isSameOrigin = url.startsWith(self.location.origin);
  const isCdn = CDN_URLS.some((cdn) => url === cdn || url.startsWith(cdn));

  if (isSameOrigin || isCdn) {
    // Cache-first
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        // Not cached yet — fetch, cache, and return
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Offline and not cached: return a minimal offline page for navigation
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
      })
    );
  } else {
    // Network-first with cache fallback (Google Fonts, etc.)
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
