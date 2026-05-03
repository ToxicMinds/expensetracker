const CACHE_NAME = 'synculariti-v2-passive-v1';

// PASSIVE WORKER
// This worker satisfies OS requirements for PWA Standalone mode 
// WITHOUT intercepting network traffic, restoring 100% performance.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// fetch listener is empty - we let Next.js 14 handle the high-speed Turbopack loading
self.addEventListener('fetch', () => {
  // Passive - No interception
});
