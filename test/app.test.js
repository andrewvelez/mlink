/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @desc Tests the browser application entry point with Bun's test runner.
 */

import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { AuthenticationState } from "../src/web/js/authentication.js";

const originalGlobals = new Map(
  ["document", "navigator", "window"].map((name) => [
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

function createElement(properties = {}) {
  const attributes = new Map();
  const listeners = new Map();

  return {
    hidden: false,
    focus: mock(() => {}),
    addEventListener: mock((type, listener) => listeners.set(type, listener)),
    setAttribute: mock((name, value) => attributes.set(name, value)),
    removeAttribute: mock((name) => attributes.delete(name)),
    getAttribute: (name) => attributes.get(name),
    ...properties,
    listeners,
  };
}

async function loadApp({
  share,
  serviceWorker,
  href = "https://example.test/home.html",
} = {}) {
  const shareButton = createElement({ hidden: true });
  const windowListeners = new Map();
  const document = {
    querySelector: mock((selector) => {
      if (selector === "#share-button") return shareButton;
      return null;
    }),
  };
  const window = {
    location: {
      href,
      replace: mock(() => {}),
    },
    addEventListener: mock((type, listener, options) => {
      windowListeners.set(type, { listener, options });
    }),
  };
  const navigator = {};

  if (share) navigator.share = share;
  if (serviceWorker) navigator.serviceWorker = serviceWorker;

  globalThis.document = document;
  globalThis.window = window;
  globalThis.navigator = navigator;

  const app = await import(`../src/web/js/app.js?test=${importNumber++}`);

  return {
    shareButton,
    window,
    windowListeners,
    app,
  };
}

afterEach(() => {
  mock.restore();
  mock.clearAllMocks();
  restoreGlobal("document");
  restoreGlobal("navigator");
  restoreGlobal("window");
});

describe("app", () => {
  test.each(["/", "/Default.html"])("Unknown startup redirects to About at %s", async (path) => {
    const context = await loadApp({ href: `https://example.test${path}` });
    expect(context.window.location.replace).toHaveBeenCalledWith("https://example.test/about.html");
    expect(context.window.location.replace).toHaveBeenCalledTimes(1);
  });

  test.each([
    [AuthenticationState.Known, "/"],
    [AuthenticationState.Known, "/Default.html"],
    [AuthenticationState.Authenticated, "/"],
    [AuthenticationState.Authenticated, "/Default.html"],
  ])("redirects %s startup at %s to Home", async (state, path) => {
    const context = await loadApp({ href: `https://example.test${path}` });
    context.window.location.replace.mockClear();
    context.app.redirectStartup(state);
    expect(context.window.location.replace).toHaveBeenCalledWith("https://example.test/home.html");
    expect(context.window.location.replace).toHaveBeenCalledTimes(1);
  });

  test.each(["/about.html", "/about.html#startup", "/about", "/home.html", "/home"])("preserves explicit navigation to %s", async (path) => {
    const context = await loadApp({ href: `https://example.test${path}` });
    for (const state of Object.values(AuthenticationState)) {
      context.app.redirectStartup(state);
    }
    expect(context.window.location.replace).not.toHaveBeenCalled();
  });

  test("shares the current page", async () => {
    const share = mock(() => Promise.resolve());
    const context = await loadApp({ share });

    expect(context.shareButton.hidden).toBe(false);
    context.shareButton.listeners.get("click")();

    expect(share).toHaveBeenCalledWith({
      title: "Link-Up",
      text: "Take a look at Link-Up.",
      url: "https://example.test/home.html",
    });
  });

  test.each([
    ["AbortError", 0],
    ["NotAllowedError", 1],
  ])("handles a %s share rejection", async (name, errorCount) => {
    const error = { name };
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const context = await loadApp({
      share: mock(() => Promise.reject(error)),
    });

    context.shareButton.listeners.get("click")();
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledTimes(errorCount);
    if (errorCount > 0) {
      expect(errorSpy).toHaveBeenCalledWith("Unable to share Link-Up.", error);
    }
  });

  test("registers the service worker on the window load event", async () => {
    const register = mock(() => Promise.resolve());
    const context = await loadApp({ serviceWorker: { register } });

    expect(register).not.toHaveBeenCalled();
    expect(context.windowListeners.get("load").options).toEqual({ once: true });

    context.windowListeners.get("load").listener();
    expect(register).toHaveBeenCalledWith("./sw.js");
  });

  test("leaves unsupported sharing and service workers disabled", async () => {
    const context = await loadApp();

    expect(context.shareButton.hidden).toBe(true);
    expect(context.shareButton.listeners.has("click")).toBe(false);
    expect(context.windowListeners.has("load")).toBe(false);
  });

});
