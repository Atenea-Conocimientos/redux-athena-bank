const CACHE = 'athena-market-v1';
const ASSETS = ['/mercado/', '/mercado/app.js', '/style.css'];
const RATES = '/api/market/rates';
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(
        ASSETS.map((url) => new Request(url, { credentials: 'omit' })),
      );
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith('athena-market-') && name !== CACHE)
          await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // An allowlist, NOT a catch-all cache: bank APIs must always go to the server.
  if (
    url.origin !== self.location.origin ||
    event.request.method !== 'GET' ||
    url.search ||
    ![...ASSETS, RATES].includes(url.pathname)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(
          new Request(event.request, { credentials: 'omit' }),
        );
        if (!response.ok) throw new Error('Unavailable');
        // No private response can enter this cache. Validate the public data contract too.
        if (url.pathname === RATES) {
          const data = await response.clone().json();
          if (data.fictional !== true || data.base !== 'ARS' || !data.rates)
            return response;
        }
        await cache.put(event.request.url, response.clone());
        return response;
      } catch {
        const old = await cache.match(event.request.url);
        if (!old) return new Response('Sin copia offline', { status: 503 });
        const headers = new Headers(old.headers);
        headers.set('X-Lab-Cache', 'stale');
        return new Response(await old.arrayBuffer(), {
          status: old.status,
          headers,
        });
      }
    })(),
  );
});
