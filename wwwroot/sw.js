// ============================================
// SMARTBUDGET - Service Worker
// Enables offline support and PWA features
// ============================================

const CACHE_NAME = 'smartbudget-v1.0.0';
const ASSETS = [
  '/',
  '/dashboard',
  '/transactions',
  '/budgets',
  '/reports',
  '/goals',
  '/settings',
  
  // CSS
  '/css/app.css',
  
  // JS
  '/js/app.js',
  '/js/dashboard.js',
  '/js/transactions.js',
  '/js/budgets.js',
  '/js/install.js',
  
  // Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  
  // Fonts
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// ============================================
// INSTALL
// ============================================
self.addEventListener('install', event => {
  console.log('🔄 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete!');
        return self.skipWaiting();
      })
  );
});

// ============================================
// ACTIVATE
// ============================================
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Ready to serve!');
      return self.clients.claim();
    })
  );
});

// ============================================
// FETCH - Network first, fallback to cache
// ============================================
self.addEventListener('fetch', event => {
  // Skip cross-origin requests except CDN
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cached => {
            if (cached) {
              return cached;
            }
            return caches.match('/offline');
          });
      })
  );
});

// ============================================
// MESSAGE HANDLING
// ============================================
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});