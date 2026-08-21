// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Andrew Velez
// Description: Renders the Link-Up proof-of-concept with standard browser APIs.

const app = document.querySelector("#app");
const navigationLinks = document.querySelectorAll("nav a");

if (!app) {
  throw new Error("The application root is missing.");
}

const homePage = [
  '<section class="page" aria-labelledby="welcome-heading">',
  '  <div class="card">',
  '    <h1 id="welcome-heading">Welcome to Link-Up</h1>',
  "    <p>",
  "      Link-Up is a local-first Progressive Web App built with vanilla",
  "      JavaScript and standard browser APIs.",
  "    </p>",
  '    <button id="share-button" type="button">Share Link-Up</button>',
  "  </div>",
  '  <div class="card">',
  "    <h2>Technology</h2>",
  "    <ul>",
  "      <li>HTML and CSS</li>",
  "      <li>Vanilla JavaScript</li>",
  "      <li>Progressive Web App APIs</li>",
  "      <li>Bun bundling</li>",
  "    </ul>",
  "  </div>",
  "</section>",
].join("\n");

const aboutPage = [
  '<section class="page" aria-labelledby="about-heading">',
  '  <div class="card">',
  '    <h1 id="about-heading">About Link-Up</h1>',
  "    <p>",
  "      Link-Up keeps authoritative user data and essential application",
  "      logic on the user&rsquo;s device.",
  "    </p>",
  "    <p>",
  "      Product workflows, persistence, and peer networking remain open",
  "      design work.",
  "    </p>",
  "  </div>",
  "</section>",
].join("\n");

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

async function shareLinkUp() {
  try {
    await navigator.share({
      title: "Link-Up",
      text: "Take a look at Link-Up.",
      url: window.location.href.split("#")[0],
    });
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Unable to share Link-Up.", error);
    }
  }
}

function render() {
  const page = currentPage();

  app.innerHTML = page === "about" ? aboutPage : homePage;
  updateNavigation(page);
  document.title = page === "about" ? "About | Link-Up" : "Link-Up";

  const shareButton = document.querySelector("#share-button");

  if (shareButton) {
    if (typeof navigator.share === "function") {
      shareButton.addEventListener("click", shareLinkUp);
    } else {
      shareButton.hidden = true;
    }
  }

  app.focus();
}

async function registerServiceWorker() {
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.error("Service-worker registration failed.", error);
  }
}

window.addEventListener("hashchange", render);
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", registerServiceWorker, { once: true });
}
