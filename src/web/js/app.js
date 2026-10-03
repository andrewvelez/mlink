/**
 * @author Andrew Velez
 * @license MIT
 * @description Enhances Link-Up pages with standard browser APIs.
 */

import { getAuthenticationState, getStartPage } from "./authentication.js";

const shareButton = document.querySelector("#share-button");

/**
 * @description Redirects startup entries while preserving explicit page navigation.
 * @param {string} state An authentication state used to select the startup page.
 * @returns {undefined}
 */
export function redirectStartup(state) {
  /** @type {URL} The current page URL. */
  const currentUrl = new URL(window.location.href);
  if (currentUrl.pathname !== "/" && currentUrl.pathname !== "/Default.html") {
    return;
  }

  /** @type {URL} The selected page at the application root. */
  const startUrl = new URL(getStartPage(state), currentUrl);
  window.location.replace(startUrl.href);
}

function shareLinkUp() {
  navigator.share({
    title: "Link-Up",
    text: "Take a look at Link-Up.",
    url: window.location.href.split("#")[0],
  }).catch((error) => {
    if (error.name !== "AbortError") {
      console.error("Unable to share Link-Up.", error);
    }
  });
}

function registerServiceWorker() {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("Service-worker registration failed.", error);
  });
}

function addAppListeners() {
  if (shareButton && typeof navigator.share === "function") {
    shareButton.hidden = false;
    shareButton.addEventListener("click", shareLinkUp);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", registerServiceWorker, { once: true });
  }
}

redirectStartup(getAuthenticationState());
addAppListeners();
