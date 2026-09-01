/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @desc Renders the Link-Up proof-of-concept with standard browser APIs.
 */

const app = document.querySelector("#app");
const navigationLinks = document.querySelectorAll("nav a");
const pageSections = document.querySelectorAll("#app > .page");
const shareButton = document.querySelector("#share-button");

function currentPage() {
  return window.location.hash === "#about" ? "about" : "home";
}

function updateNavigation(page) {
  for (const link of navigationLinks) {
    if (link.hash === "#" + page) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
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

function render() {
  const page = currentPage();

  for (const pageSection of pageSections) {
    pageSection.hidden = pageSection.id !== page;
  }

  updateNavigation(page);
  document.title = page === "about" ? "About | Link-Up" : "Link-Up";

  app.focus();
}

function registerServiceWorker() {
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.error("Service-worker registration failed.", error);
  });
}

function addAppListeners() {
  if (!app) {
    throw new Error("The application root is missing.");
  }

  if (shareButton && typeof navigator.share === "function") {
    shareButton.hidden = false;
    shareButton.addEventListener("click", shareLinkUp);
  }

  window.addEventListener("hashchange", render);
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", registerServiceWorker, { once: true });
  }
}

addAppListeners();
