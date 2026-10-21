/* Cache namespace belongs exclusively to /v2/. */
const PREFIX = 'debitar-v2-';
const CACHE = PREFIX + '2010';
const ASSETS = ['./', 'index.html', 'styles.css?v=2010', 'app.js?v=2010',
  'v2-ui.js?v=2010', 'v2-ui.css?v=2010', 'manifest.webmanifest', '../debitar-logo.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(PREFIX) && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const scope = new URL('./', self.location.href).pathname;
  const logo = new URL('../debitar-logo.png', self.location.href).pathname;
  if (!url.pathname.startsWith(scope) && url.pathname !== logo) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type !== 'opaque') await cache.put(event.request, response.clone());
      return response;
    } catch {
      const cached = await cache.match(event.request);
      return cached || Response.error();
    }
  })());
});
