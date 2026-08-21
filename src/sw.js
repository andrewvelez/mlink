// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Andrew Velez
// Description: Caches the Link-Up application shell for offline use.

const cachePrefix = "mlink-shell-";
const cacheName = cachePrefix + "__CACHE_VERSION__";
const scopeUrl = new URL("./", self.location.href);
const offlineDocumentUrl = new URL("./index.html", scopeUrl).href;
const applicationShell = [
  "./",
  "./index.html",
  "./app.js",
  "./styles/global.css",
  "./manifest.json",
  "./assets/icons/192x192.png",
  "./assets/icons/icon_512.png",
].map((path) => new URL(path, scopeUrl).href);
const applicationShellUrls = new Set(applicationShell);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll(applicationShell))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (existingCache) =>
                existingCache.startsWith(cachePrefix) &&
                existingCache !== cacheName,
            )
            .map((existingCache) => caches.delete(existingCache)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  const isNavigation = request.mode === "navigate";

  if (
    request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    (!isNavigation && !applicationShellUrls.has(requestUrl.href))
  ) {
    return;
  }

  event.respondWith(
    caches.open(cacheName).then(async (cache) => {
      try {
        const response = await fetch(request);
        const cacheControl = response.headers.get("Cache-Control") || "";

        if (response.ok && !cacheControl.includes("no-store")) {
          await cache.put(request, response.clone());
        }

        return response;
      } catch {
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (isNavigation) {
          return (
            (await cache.match(scopeUrl.href)) ||
            (await cache.match(offlineDocumentUrl)) ||
            Response.error()
          );
        }

        return Response.error();
      }
    }),
  );
});
