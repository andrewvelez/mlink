/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @description Defines routes for the PWA files embedded in the executable.
 */

import about from "../../dist/about.html";
import app from "../../dist/js/app.js" with { type: "file" };
import home from "../../dist/home.html";
import manifest from "../../dist/manifest.json" with { type: "file" };
import serviceWorker from "../../dist/sw.js" with { type: "file" };
import htmx from "../../dist/external/htmx.min.js" with { type: "file" };
import icon192 from "../../dist/icons/192x192.png" with { type: "file" };
import icon24 from "../../dist/icons/24x24.png" with { type: "file" };
import icon48 from "../../dist/icons/48x48.png" with { type: "file" };
import icon512 from "../../dist/icons/512x512.png" with { type: "file" };
import icon192Named from "../../dist/icons/icon_192.png" with { type: "file" };
import icon24Named from "../../dist/icons/icon_24.png" with { type: "file" };
import icon48Named from "../../dist/icons/icon_48.png" with { type: "file" };
import icon512Named from "../../dist/icons/icon_512.png" with { type: "file" };
import styles from "../../dist/styles/global.css" with { type: "file" };
import picoStyles from "../../dist/external/pico.cyan.min.css" with { type: "file" };

function asset(path) {
  return new Response(Bun.file(path));
}

export const routes = {
  "/": { GET: home },
  "/home": { GET: home },
  "/about": { GET: about },
  "/js/app.js": asset(app),
  "/manifest.json": asset(manifest),
  "/icons/192x192.png": asset(icon192),
  "/icons/24x24.png": asset(icon24),
  "/icons/48x48.png": asset(icon48),
  "/icons/512x512.png": asset(icon512),
  "/icons/icon_192.png": asset(icon192Named),
  "/icons/icon_24.png": asset(icon24Named),
  "/icons/icon_48.png": asset(icon48Named),
  "/icons/icon_512.png": asset(icon512Named),
  "/external/htmx.min.js": asset(htmx),
  "/styles/global.css": asset(styles),
  "/external/pico.cyan.min.css": asset(picoStyles),
  "/sw.js": asset(serviceWorker),
};
