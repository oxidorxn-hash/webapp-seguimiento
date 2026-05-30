const CACHE_NAME = 'oxiflow-kanban-v2';
const ASSETS = [
    'index.html',
    'css/styles.css',
    'icon.svg',
    'manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Network-first: always gets latest files, cache only as offline fallback
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
                return response;
            })
            .catch(() => caches.match(e.request).then((cached) =>
                cached || (e.request.mode === 'navigate' ? caches.match('index.html') : undefined)
            ))
    );
});
