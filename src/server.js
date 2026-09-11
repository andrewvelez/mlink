/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @description Serves the embedded Link-Up PWA from its standalone executable.
 */

import { files } from "./files.js";

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 3000,
  routes: files,
});

console.log(`MLink running at ${server.url}`);
