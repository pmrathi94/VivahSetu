/**
 * Service Worker for VivahSetu
 * 
 * Features:
 * - Offline support with caching strategies
 * - Background sync for offline changes
 * - Push notifications
 * - App shell caching
 * 
 * Strategies:
 * - Network first for API calls (with fallback to cache)
 * - Cache first for assets
 * - Stale-while-revalidate for dynamic content
 */

const CACHE_NAME = 'vivahsetu-v2.0.0';
const ASSETS_CACHE = 'vivahsetu-assets-v2.0.0';
const API_CACHE = 'vivahsetu-api-v2.0.0';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/logo.svg',
];

const API_PATTERNS = [
  '/api/weddings',
  '/api/venues',
  '/api/vendors',
  '/api/guests',
  '/api/budget',
];

// Install event - cache app shell
self.addEventListener('install', (event: ExtendedEvent) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(ASSETS_TO_CACHE);
        await self.skipWaiting();
      } catch (error) {
        console.error('Cache installation failed:', error);
      }
    })()
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event: ExtendedEvent) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && !name.includes(new Date().getFullYear().toString()))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and other special protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - Network first with fallback
  if (isApiRequest(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Asset requests - Cache first
  if (isAssetRequest(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML and dynamic content - Stale while revalidate
  if (request.destination === 'document' || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(request));
});

// Network first strategy (try network, fallback to cache)
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    
    // Cache successful API responses
    if (response.ok && isApiRequest(new URL(request.url).pathname)) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fallback to cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    // Return offline page if available
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are offline. Some features may be limited.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache first strategy (use cache if available, fallback to network)
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSETS_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset not found', { status: 404 });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request: Request): Promise<Response> {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  return cached || fetchPromise;
}

// Helper functions
function isApiRequest(pathname: string): boolean {
  return API_PATTERNS.some((pattern) => pathname.includes(pattern));
}

function isAssetRequest(pathname: string): boolean {
  const assetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'];
  return assetExtensions.some((ext) => pathname.endsWith(ext));
}

// Handle messages from clients
self.addEventListener('message', (event: ExtendedMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(API_CACHE);
  }
});

// Background sync for offline changes
self.addEventListener('sync', (event: ExtendedSyncEvent) => {
  if (event.tag === 'sync-offline-changes') {
    event.waitUntil(syncOfflineChanges());
  }
});

async function syncOfflineChanges() {
  try {
    // Get offline queue from IndexedDB
    // Sync all pending changes with backend
    // Clear queue on success
    const db = await openDB();
    const queue = await db.getAll('offline-queue');
    
    for (const item of queue) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        await db.delete('offline-queue', item.id);
      } catch (error) {
        console.error('Sync error:', error);
        // Keep in queue for next attempt
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper to open IndexedDB
function openDB() {
  return new Promise<any>((resolve, reject) => {
    const request = indexedDB.open('vivahsetu', 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-queue')) {
        db.createObjectStore('offline-queue', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Type definitions for TypeScript
interface ExtendedEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends ExtendedEvent {
  request: Request;
  respondWith(promise: Promise<Response>): void;
}

interface ExtendedSyncEvent extends ExtendedEvent {
  tag: string;
  lastChance?: boolean;
}

interface ExtendedMessageEvent extends ExtendEvent {
  data: any;
  source: Client;
}
