const CACHE = 'dynasty-desk-v13';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './commissioner.html', './commissioner.js', './admin.css',
  './domain/models.js', './domain/simulation.js', './domain/permissions.js', './domain/audit.js', './domain/offseason.js',
  './application/league-workflow.js', './application/admin-summary.js', './application/admin-service.js',
  './application/admin-commands.js', './application/match-week-resolver.js', './stores/local.js', './stores/game-store.js',
  './stores/sharepoint.js', './stores/spfx-client.js', './stores/sharepoint-provisioning.js', './manifest.webmanifest'
];

self.addEventListener('install', (event) => event.waitUntil(
  caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
));
self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', (event) => event.respondWith(
  caches.match(event.request).then((response) => response || fetch(event.request))
));
