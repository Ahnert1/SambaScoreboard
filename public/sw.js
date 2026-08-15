/*
 * Minimal offline cache. Stale-while-revalidate: serve whatever is cached
 * immediately (so the app opens instantly, and works with no signal at the
 * kitchen table), then quietly refresh it in the background for next time.
 */
const CACHE = 'samba-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req)

      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone())
          return res
        })
        .catch(() => null)

      if (cached) return cached

      const fresh = await network
      if (fresh) return fresh

      // Offline, uncached, and it's a page navigation — fall back to the shell.
      if (req.mode === 'navigate') {
        const shell = await cache.match('index.html')
        if (shell) return shell
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' })
    }),
  )
})
