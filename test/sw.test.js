/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @description Tests the service worker's Workbox precache configuration.
 */

import { afterEach, describe, expect, mock, test } from "bun:test";

const originalSelf = Object.getOwnPropertyDescriptor(globalThis, "self");
const precacheAndRoute = mock(() => {});

mock.module("workbox-precaching", () => ({ precacheAndRoute }));

/**
 * @description Restores the original global service-worker scope.
 * @returns {undefined}
 */
function restoreSelf() {
  if (originalSelf) {
    Object.defineProperty(globalThis, "self", originalSelf);
  } else {
    delete globalThis.self;
  }
}

afterEach(() => {
  mock.clearAllMocks();
  restoreSelf();
});

describe("service worker", () => {
  test("passes the injected manifest to Workbox precaching", async () => {
    const manifest = [
      { revision: "app-revision", url: "js/app.js" },
      { revision: "home-revision", url: "home.html" },
    ];

    globalThis.self = { __WB_MANIFEST: manifest };

    await import(`../src/web/sw.js?test=${Date.now()}`);

    expect(precacheAndRoute).toHaveBeenCalledTimes(1);
    expect(precacheAndRoute).toHaveBeenCalledWith(manifest);
  });
});
