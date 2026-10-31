/**
 * CRMate PWA Service Worker
 * Designed for maximum safety and data freshness.
 *
 * CRITICAL SAFETY RULES:
 * 1. ZERO caching for API routes (/api/*) or Supabase endpoints.
 * 2. ZERO caching for HTML navigation/pages - always fetch fresh from network.
 * 3. Never serve stale CRM data after refresh.
 * 4. Immediate activation on update (skipWaiting + clients.claim).
 */

const STATIC_CACHE_NAME = 'crmate-static-assets-v1';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
];

// 1. Install Event: Pre-cache only static branding icons and manifest
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker immediately
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[CRMate SW] Pre-cache failed (non-critical):', err);
        return self.skipWaiting();
      })
  );
});

// 2. Activate Event: Clean up old static caches & claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== STATIC_CACHE_NAME) {
              return caches.delete(name);
            }
            return null;
          })
        );
      })
      .then(() => {
        // Take control of all pages within scope immediately without reload
        return self.clients.claim();
      })
  );
});

// 3. Fetch Event: Strict Data Safety & Passthrough
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // ONLY intercept GET requests
  if (request.method !== 'GET') {
    return;
  }

  // STRICT BYPASS: Supabase, external APIs, and internal /api routes
  // NEVER cache any user authentication, mutation, or CRM pipeline data
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/auth/') ||
    url.hostname.includes('supabase.co')
  ) {
    return; // Pass through directly to browser network
  }

  // STRICT BYPASS for HTML Pages / Navigation Requests:
  // Always fetch fresh HTML from the network to ensure instant updates and no stale CRM data
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request).catch((error) => {
        // If totally offline, we return standard network error response
        throw error;
      })
    );
    return;
  }

  // Cache-first ONLY for static PWA branding icons
  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default for all other same-origin requests: Passthrough to network
  // (Zero caching of dynamic data or scripts to prevent stale application states)
  return;
});
