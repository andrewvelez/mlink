/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @desc Enhances Link-Up pages with standard browser APIs.
 */

const shareButton = document.querySelector("#share-button");

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

addAppListeners();
