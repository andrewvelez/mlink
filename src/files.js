/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @description Defines routes for the PWA files embedded in the executable.
 */

import about from "../dist/about.html";
import app from "../dist/app.js" with { type: "file" };
import home from "../dist/home.html";
import manifest from "../dist/manifest.json" with { type: "file" };
import serviceWorker from "../dist/sw.js" with { type: "file" };
import htmx from "../dist/static/js/htmx.min.js" with { type: "file" };
import icon192 from "../dist/static/icons/192x192.png" with { type: "file" };
import icon24 from "../dist/static/icons/24x24.png" with { type: "file" };
import icon48 from "../dist/static/icons/48x48.png" with { type: "file" };
import icon512 from "../dist/static/icons/512x512.png" with { type: "file" };
import icon192Named from "../dist/static/icons/icon_192.png" with { type: "file" };
import icon24Named from "../dist/static/icons/icon_24.png" with { type: "file" };
import icon48Named from "../dist/static/icons/icon_48.png" with { type: "file" };
import icon512Named from "../dist/static/icons/icon_512.png" with { type: "file" };
import styles from "../dist/static/styles/global.css" with { type: "file" };
import picoStyles from "../dist/static/styles/pico.cyan.min.css" with { type: "file" };

function asset(path) {
  return new Response(Bun.file(path));
}

export const files = {
  "/": { GET: home },
  "/home": { GET: home },
  "/about": { GET: about },
  "/app.js": asset(app),
  "/manifest.json": asset(manifest),
  "/static/icons/192x192.png": asset(icon192),
  "/static/icons/24x24.png": asset(icon24),
  "/static/icons/48x48.png": asset(icon48),
  "/static/icons/512x512.png": asset(icon512),
  "/static/icons/icon_192.png": asset(icon192Named),
  "/static/icons/icon_24.png": asset(icon24Named),
  "/static/icons/icon_48.png": asset(icon48Named),
  "/static/icons/icon_512.png": asset(icon512Named),
  "/static/js/htmx.min.js": asset(htmx),
  "/static/styles/global.css": asset(styles),
  "/static/styles/pico.cyan.min.css": asset(picoStyles),
  "/sw.js": asset(serviceWorker),
};
