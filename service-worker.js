/* Generiert aus src/shared/service-worker.js – Änderungen dort vornehmen. */
// Offline-Zwischenspeicher für TeO.
//
// Der Zwischenspeicher trägt die Buildnummer im Namen, die der Build hier
// einsetzt. Jede Fassung legt dadurch ihren eigenen Speicher an; beim
// Aktivieren werden die Speicher älterer Fassungen geräumt.
//
// Bewusst ohne skipWaiting: Eine neue Fassung wartet, bis alle Reiter der
// alten geschlossen sind. So entsteht während einer laufenden Sitzung nie
// eine Mischung aus alter Oberfläche und neuem Programmstand. clients.claim()
// wirkt dadurch nur bei der ersten Installation - dort übernimmt der
// Zwischenspeicher sofort, statt erst beim nächsten Aufruf.

const CACHE_NAME = "teo-shell-004.037.008";

// Alles, was TeO zum Starten braucht. Fehlt hier eine Datei, startet die
// Anwendung ohne Netz nicht - tests/service-worker.test.mjs gleicht die Liste
// deshalb gegen index.html und die ausgelieferten Dateien ab.
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles.css",
  "./project-meta.js",
  "./state-schema.js",
  "./backend-client.js",
  "./app.js",
  "./vendor/localforage.min.js",
  "./assets/icons/teo-favicon.svg",
  "./assets/icons/teo-favicon-32.png",
  "./assets/icons/teo-apple-touch-icon.png",
  "./assets/icons/teo-app-icon-192.png",
  "./assets/icons/teo-app-icon-512.png",
  "./assets/icons/teo-app-icon-maskable-192.png",
  "./assets/icons/teo-app-icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("teo-shell-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Der Datenbestand darf niemals aus dem Zwischenspeicher kommen: Eine
  // veraltete Antwort würde beim Speichern zu einem Revisionskonflikt führen
  // oder Änderungen anderer Arbeitsplätze überschreiben.
  if (url.pathname.startsWith("/api/")) return;

  // Seitenaufrufe zuerst aus dem Netz, damit ein neuer Programmstand ankommt.
  // Ohne Verbindung übernimmt die zwischengespeicherte Oberfläche.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          void cacheResponse(request, response.clone());
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("./index.html")),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        void cacheResponse(request, response.clone());
        return response;
      });
    }),
  );
});

async function cacheResponse(request, response) {
  if (!response || !response.ok || response.type !== "basic") return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}
