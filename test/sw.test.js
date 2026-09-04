/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @desc Unit tests for the service-worker lifecycle and caching behavior.
 */

import { afterEach, describe, expect, mock, test } from "bun:test";

const originalGlobals = new Map(
  ["caches", "fetch", "self"].map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ]),
);
let importNumber = 0;

function restoreGlobal(name) {
  const descriptor = originalGlobals.get(name);

  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor);
  } else {
    delete globalThis[name];
  }
}

async function loadServiceWorker() {
  const listeners = new Map();
  const cache = {
    addAll: mock(async () => {}),
    match: mock(async () => undefined),
    put: mock(async () => {}),
  };
  const cacheStorage = {
    delete: mock(async () => true),
    keys: mock(async () => []),
    open: mock(async () => cache),
  };
  const fetchMock = mock(async () => new Response("network"));
  const serviceWorkerScope = {
    location: new URL("https://mlink.test/app/sw.js"),
    __WB_MANIFEST: [
      { url: "app.js" },
      { url: "index.html" },
      { url: "static/styles/global.css" },
    ],
    addEventListener: mock((type, listener) => listeners.set(type, listener)),
    skipWaiting: mock(async () => {}),
    clients: { claim: mock(async () => {}) },
  };

  globalThis.caches = cacheStorage;
  globalThis.fetch = fetchMock;
  globalThis.self = serviceWorkerScope;

  await import(`../src/sw.js?test=${importNumber++}`);

  return {
    cache,
    cacheStorage,
    fetchMock,
    listeners,
    serviceWorkerScope,
  };
}

async function dispatchExtendableEvent(listener) {
  let lifetimePromise;
  const waitUntil = mock((promise) => {
    lifetimePromise = promise;
  });

  listener({ waitUntil });
  expect(waitUntil).toHaveBeenCalledTimes(1);
  await lifetimePromise;
}

async function dispatchFetchEvent(listener, request) {
  let responsePromise;
  const respondWith = mock((promise) => {
    responsePromise = promise;
  });

  listener({ request, respondWith });

  return {
    respondWith,
    response: responsePromise ? await responsePromise : undefined,
  };
}

function shellRequest() {
  return {
    method: "GET",
    mode: "same-origin",
    url: "https://mlink.test/app/app.js",
  };
}

afterEach(() => {
  mock.restore();
  mock.clearAllMocks();
  restoreGlobal("caches");
  restoreGlobal("fetch");
  restoreGlobal("self");
});

describe("service worker", () => {
  test("installs the application shell before skipping waiting", async () => {
    const context = await loadServiceWorker();
    const calls = [];

    context.cache.addAll.mockImplementation(async () => calls.push("cache"));
    context.serviceWorkerScope.skipWaiting.mockImplementation(async () =>
      calls.push("skipWaiting"),
    );

    expect([...context.listeners.keys()]).toEqual(["install", "activate", "fetch"]);
    await dispatchExtendableEvent(context.listeners.get("install"));

    expect(context.cacheStorage.open).toHaveBeenCalledWith(
      "mlink-__CACHE_VERSION__",
    );
    expect(context.cache.addAll).toHaveBeenCalledWith([
      "https://mlink.test/app/app.js",
      "https://mlink.test/app/index.html",
      "https://mlink.test/app/static/styles/global.css",
    ]);
    expect(calls).toEqual(["cache", "skipWaiting"]);
  });

  test("deletes only stale application caches during activation", async () => {
    const context = await loadServiceWorker();

    context.cacheStorage.keys.mockResolvedValue([
      "mlink-old",
      "mlink-__CACHE_VERSION__",
      "unrelated-cache",
    ]);

    await dispatchExtendableEvent(context.listeners.get("activate"));

    expect(context.cacheStorage.delete).toHaveBeenCalledTimes(1);
    expect(context.cacheStorage.delete).toHaveBeenCalledWith("mlink-old");
    expect(context.serviceWorkerScope.clients.claim).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["non-GET request", { method: "POST", mode: "navigate", url: "https://mlink.test/app/" }],
    ["cross-origin navigation", { method: "GET", mode: "navigate", url: "https://other.test/" }],
    ["non-shell request", { method: "GET", mode: "same-origin", url: "https://mlink.test/app/profile" }],
  ])("ignores a %s", async (_description, request) => {
    const context = await loadServiceWorker();
    const event = await dispatchFetchEvent(context.listeners.get("fetch"), request);

    expect(event.respondWith).not.toHaveBeenCalled();
    expect(context.fetchMock).not.toHaveBeenCalled();
  });

  test("returns and caches a successful network response", async () => {
    const context = await loadServiceWorker();
    const request = shellRequest();
    const networkResponse = new Response("fresh");

    context.fetchMock.mockResolvedValue(networkResponse);

    const event = await dispatchFetchEvent(context.listeners.get("fetch"), request);
    const cachedResponse = context.cache.put.mock.calls[0][1];

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    expect(event.response).toBe(networkResponse);
    expect(context.fetchMock).toHaveBeenCalledWith(request);
    expect(context.cache.put).toHaveBeenCalledTimes(1);
    expect(context.cache.put.mock.calls[0][0]).toBe(request);
    expect(cachedResponse).not.toBe(networkResponse);
    expect(await cachedResponse.text()).toBe("fresh");
  });

  test.each([
    ["non-successful", new Response("missing", { status: 404 })],
    [
      "no-store",
      new Response("private", { headers: { "Cache-Control": "no-store" } }),
    ],
  ])("does not cache a %s network response", async (_description, response) => {
    const context = await loadServiceWorker();

    context.fetchMock.mockResolvedValue(response);

    const event = await dispatchFetchEvent(
      context.listeners.get("fetch"),
      shellRequest(),
    );

    expect(event.response).toBe(response);
    expect(context.cache.put).not.toHaveBeenCalled();
  });

  test("keeps a successful response when writing to the cache fails", async () => {
    const context = await loadServiceWorker();
    const networkResponse = new Response("fresh");

    context.fetchMock.mockResolvedValue(networkResponse);
    context.cache.put.mockRejectedValue(new Error("cache unavailable"));

    const event = await dispatchFetchEvent(
      context.listeners.get("fetch"),
      shellRequest(),
    );

    expect(event.response).toBe(networkResponse);
  });

  test("returns an exact cached response when the network fails", async () => {
    const context = await loadServiceWorker();
    const request = shellRequest();
    const cachedResponse = new Response("cached");

    context.fetchMock.mockRejectedValue(new Error("offline"));
    context.cache.match.mockResolvedValue(cachedResponse);

    const event = await dispatchFetchEvent(context.listeners.get("fetch"), request);

    expect(event.response).toBe(cachedResponse);
    expect(context.cache.match).toHaveBeenCalledWith(request);
  });

  test.each([
    ["scope root", [undefined, new Response("root")], "root"],
    [
      "offline document",
      [undefined, undefined, new Response("document")],
      "document",
    ],
  ])("uses the %s for an offline navigation", async (_description, matches, body) => {
    const context = await loadServiceWorker();
    const request = {
      method: "GET",
      mode: "navigate",
      url: "https://mlink.test/app/profile",
    };

    context.fetchMock.mockRejectedValue(new Error("offline"));
    for (const match of matches) {
      context.cache.match.mockResolvedValueOnce(match);
    }

    const event = await dispatchFetchEvent(context.listeners.get("fetch"), request);

    expect(await event.response.text()).toBe(body);
    expect(context.cache.match.mock.calls.map(([value]) => value)).toEqual(
      matches.length === 2
        ? [request, "https://mlink.test/app/"]
        : [
            request,
            "https://mlink.test/app/",
            "https://mlink.test/app/index.html",
          ],
    );
  });

  test("returns an error response when the network and cache miss", async () => {
    const context = await loadServiceWorker();

    context.fetchMock.mockRejectedValue(new Error("offline"));

    const event = await dispatchFetchEvent(
      context.listeners.get("fetch"),
      shellRequest(),
    );

    expect(event.response.status).toBe(0);
    expect(event.response.type).toBe("error");
  });
});
