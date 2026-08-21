// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Andrew Velez
// Description: Builds the browser application and prepares its static PWA shell.

import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = import.meta.dir;
const sourceDirectory = join(projectRoot, "src");
const outputDirectory = join(projectRoot, "dist");

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(join(outputDirectory, "styles"), { recursive: true });

const build = await Bun.build({
  entrypoints: [
    join(sourceDirectory, "app.js"),
    join(sourceDirectory, "sw.js"),
  ],
  outdir: outputDirectory,
  sourcemap: "external",
  target: "browser",
});

if (!build.success) {
  for (const log of build.logs) {
    console.error(log);
  }

  throw new Error("Bun build failed.");
}

await Promise.all([
  Bun.write(
    join(outputDirectory, "index.html"),
    Bun.file(join(sourceDirectory, "index.html")),
  ),
  Bun.write(
    join(outputDirectory, "manifest.json"),
    Bun.file(join(sourceDirectory, "manifest.json")),
  ),
  Bun.write(
    join(outputDirectory, "styles", "global.css"),
    Bun.file(join(sourceDirectory, "styles", "global.css")),
  ),
  cp(join(sourceDirectory, "assets"), join(outputDirectory, "assets"), {
    recursive: true,
  }),
]);

const shellFiles = [
  "index.html",
  "app.js",
  "styles/global.css",
  "manifest.json",
  "assets/icons/192x192.png",
  "assets/icons/icon_512.png",
];
const hasher = new Bun.CryptoHasher("sha256");

for (const file of shellFiles) {
  hasher.update(await Bun.file(join(outputDirectory, file)).arrayBuffer());
}

const cacheVersion = hasher.digest("hex").slice(0, 12);
const serviceWorkerPath = join(outputDirectory, "sw.js");
const serviceWorker = await Bun.file(serviceWorkerPath).text();

if (!serviceWorker.includes("__CACHE_VERSION__")) {
  throw new Error("The service-worker cache-version placeholder is missing.");
}

await Bun.write(
  serviceWorkerPath,
  serviceWorker.replace("__CACHE_VERSION__", cacheVersion),
);

console.log("Built the PWA in dist/.");
