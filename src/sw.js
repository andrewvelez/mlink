/**
 * The service worker responsible for client-side caching of the PWA.
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @desc Caches the Link-Up application shell for offline use
 */

const cachePrefix = "mlink-";
const cacheName = cachePrefix + "__CACHE_VERSION__";
const scopeUrl = new URL("./", self.location.href);
const offlineDocumentUrl = new URL("./index.html", scopeUrl).href;

const applicationShell = [
  "./",
  "./index.html",
  "./app.js",
  "./static/styles/global.css",
  "./manifest.json",
  "./static/icons/192x192.png",
  "./static/icons/icon_512.png",
].map((path) => new URL(path, scopeUrl).href);

const applicationShellUrls = new Set(applicationShell);

async function installApplicationShell() {
  const cache = await caches.open(cacheName);

  await cache.addAll(applicationShell);
  await self.skipWaiting();
}

async function activateServiceWorker() {
  const cacheNames = await caches.keys();
  const staleCacheNames = cacheNames.filter(
    (existingCache) =>
      existingCache.startsWith(cachePrefix) && existingCache !== cacheName,
  );

  await Promise.all(
    staleCacheNames.map((existingCache) => caches.delete(existingCache)),
  );
  await self.clients.claim();
}

function shouldHandleRequest(request) {
  const requestUrl = new URL(request.url);
  const isNavigation = request.mode === "navigate";

  return (
    request.method === "GET" &&
    requestUrl.origin === self.location.origin &&
    (isNavigation || applicationShellUrls.has(requestUrl.href))
  );
}

async function respondNetworkFirst(request) {
  const isNavigation = request.mode === "navigate";
  const cache = await caches.open(cacheName);

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
}

self.addEventListener("install", (event) => {
  event.waitUntil(installApplicationShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(activateServiceWorker());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!shouldHandleRequest(request)) {
    return;
  }

  event.respondWith(respondNetworkFirst(request));
});
