/* Котоверсум: офлайн-кэш. Игра целиком работает в браузере, поэтому после первого
   запуска её можно открыть и без интернета (кооператив через STUN потребует сеть). */
const CACHE = "kotoverse-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.includes("/api/")) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (req.mode === "navigate") {
        // Страница — сначала сеть (свежая версия), при офлайне — из кэша
        try {
          const res = await fetch(req);
          if (res.ok) cache.put("./", res.clone());
          return res;
        } catch {
          return (await cache.match("./")) || Response.error();
        }
      }
      // Файлы с хешем в имени неизменны — сначала кэш
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && !url.pathname.endsWith(".map")) cache.put(req, res.clone());
      return res;
    })(),
  );
});
