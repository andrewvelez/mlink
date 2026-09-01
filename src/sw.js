/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @desc The service worker responsible for client-side caching of the PWA.
 */

const cachePrefix = "mlink-";
const cacheName = cachePrefix + "__CACHE_VERSION__";
const scopeUrl = new URL("./", self.location.href);
const offlineDocumentUrl = new URL("./index.html", scopeUrl).href;

const applicationShell = self.__WB_MANIFEST.map(({ url }) =>
  new URL(url, scopeUrl).href
);

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

async function cacheNetworkResponse(request, response) {
  try {
    const cacheControl = response.headers.get("Cache-Control") || "";

    if (!response.ok || cacheControl.includes("no-store")) {
      return;
    }

    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch {
    // Cache failures must not replace a successful network response.
  }
}

async function getCachedResponse(request) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse || request.mode !== "navigate") {
    return cachedResponse;
  }

  return (
    (await cache.match(scopeUrl.href)) ||
    (await cache.match(offlineDocumentUrl))
  );
}

async function respondNetworkFirst(request) {
  try {
    const response = await fetch(request);
    await cacheNetworkResponse(request, response);
    return response;
  } catch {
    return (await getCachedResponse(request)) || Response.error();
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
