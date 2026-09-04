/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @desc Tests the browser application entry point with Bun's test runner.
 */

import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";

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
  app = createElement(),
  hash = "",
  share,
  serviceWorker,
} = {}) {
  const homeLink = createElement({ hash: "#home" });
  const aboutLink = createElement({ hash: "#about" });
  const homeSection = createElement({ id: "home" });
  const aboutSection = createElement({ id: "about", hidden: true });
  const shareButton = createElement({ hidden: true });
  const windowListeners = new Map();
  const document = {
    title: "",
    querySelector: mock((selector) => {
      if (selector === "#app") return app;
      if (selector === "#share-button") return shareButton;
      return null;
    }),
    querySelectorAll: mock((selector) => {
      if (selector === "nav a") return [homeLink, aboutLink];
      if (selector === "#app > .page") return [homeSection, aboutSection];
      return [];
    }),
  };
  const window = {
    location: {
      hash,
      href: `https://example.test/index.html${hash}`,
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

  await import(`../src/app.js?test=${importNumber++}`);

  return {
    aboutLink,
    aboutSection,
    app,
    document,
    homeLink,
    homeSection,
    shareButton,
    window,
    windowListeners,
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
  test("renders the home and about routes", async () => {
    const context = await loadApp();

    expect(context.homeSection.hidden).toBe(false);
    expect(context.aboutSection.hidden).toBe(true);
    expect(context.homeLink.getAttribute("aria-current")).toBe("page");
    expect(context.aboutLink.getAttribute("aria-current")).toBeUndefined();
    expect(context.document.title).toBe("Link-Up");

    context.window.location.hash = "#about";
    context.windowListeners.get("hashchange").listener();

    expect(context.homeSection.hidden).toBe(true);
    expect(context.aboutSection.hidden).toBe(false);
    expect(context.homeLink.getAttribute("aria-current")).toBeUndefined();
    expect(context.aboutLink.getAttribute("aria-current")).toBe("page");
    expect(context.document.title).toBe("About | Link-Up");
    expect(context.app.focus).toHaveBeenCalledTimes(2);
  });

  test("shares the current page without its hash", async () => {
    const share = mock(() => Promise.resolve());
    const context = await loadApp({ hash: "#about", share });

    expect(context.shareButton.hidden).toBe(false);
    context.shareButton.listeners.get("click")();

    expect(share).toHaveBeenCalledWith({
      title: "Link-Up",
      text: "Take a look at Link-Up.",
      url: "https://example.test/index.html",
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

  test("fails when the application root is missing", async () => {
    await expect(loadApp({ app: null })).rejects.toThrow(
      "The application root is missing.",
    );
  });
});
