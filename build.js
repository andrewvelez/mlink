#! /usr/bin/env bun
/**
 * @license SPDX-License-Identifier: MIT
 * @author Andrew Velez 2026
 * @desc Builds and serves Link-Up's browser PWA assets with Bun.
 */

import { copyFileSync, cpSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";

const sourceDirectory = join(import.meta.dir, "src");
const staticDirectory = join(import.meta.dir, "static");
const outputDirectory = join(import.meta.dir, "dist");

function clean() {
  rmSync(outputDirectory, { force: true, recursive: true });
}

async function bundle() {
  const bundledBuild = await Bun.build({
    entrypoints: [
      join(sourceDirectory, "app.js"),
      join(sourceDirectory, "sw.js"),
    ],
    outdir: outputDirectory,
    sourcemap: "external",
    target: "browser",
  });

  if (!bundledBuild.success) {
    let logMsg;
    for (logMsg of bundledBuild.logs) {
      console.error(logMsg);
    }

    throw new Error("Bun build failed.");
  }
}

function copyAssets() {
  copyFileSync(
    join(sourceDirectory, "index.html"),
    join(outputDirectory, "index.html"),
  );

  copyFileSync(
    join(sourceDirectory, "manifest.json"),
    join(outputDirectory, "manifest.json"),
  );

  cpSync(staticDirectory, join(outputDirectory, "static"), {
    recursive: true,
  });
}

async function versionServiceWorker() {
  const buildTime = new Date();
  const appVersion = [
    buildTime.getUTCFullYear(),
    buildTime.getUTCMonth() + 1,
    buildTime.getUTCDate(),
  ].join(".");
  const buildNumber = buildTime
    .toISOString()
    .slice(11, 23)
    .replace(/[:.]/g, "");
  const cacheVersion = `${appVersion}-b${buildNumber}`;
  const serviceWorkerPath = join(outputDirectory, "sw.js");
  const serviceWorker = await Bun.file(serviceWorkerPath).text();

  if (!serviceWorker.includes("__CACHE_VERSION__")) {
    throw new Error("The service-worker cache-version placeholder is missing.");
  }

  await Bun.write(
    serviceWorkerPath,
    serviceWorker.replace("__CACHE_VERSION__", cacheVersion),
  );

  return cacheVersion;
}

async function build() {
  clean();
  await bundle();
  copyAssets();
  const cacheVersion = await versionServiceWorker();

  console.log(`Built the PWA in dist/ (${cacheVersion}).`);
}

async function test() {
  await build();
}

async function start() {
  await build();

  const outputDirectoryPrefix = outputDirectory + sep;
  const server = Bun.serve({
    hostname: "127.0.0.1",

    async fetch(request) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      }

      let pathname;

      try {
        pathname = decodeURIComponent(new URL(request.url).pathname);
      } catch {
        return new Response("Bad Request", { status: 400 });
      }

      const requestedFile =
        pathname === "/" ? "index.html" : pathname.slice(1);
      const filePath = resolve(outputDirectory, requestedFile);

      if (!filePath.startsWith(outputDirectoryPrefix)) {
        return new Response("Not Found", { status: 404 });
      }

      const file = Bun.file(filePath);

      if (!(await file.exists())) {
        return new Response("Not Found", { status: 404 });
      }

      return new Response(file, {
        headers: { "Cache-Control": "no-cache" },
      });
    },
  });

  console.log(`Serving dist/ at ${server.url.href}`);
}

const commands = {
  clean,
  build,
  test,
  start,
};

/** Dispatches the requested project command inside the Bun build-time runtime. */
async function run() {
  const scriptCommand = process.argv[2];

  if (!scriptCommand || !Object.hasOwn(commands, scriptCommand)) {
    console.error(`Usage: bun run <${Object.keys(commands).join("|")}>`);
    process.exitCode = 1;
    return;
  }

  await commands[scriptCommand]();
}

try {
  await run();
} catch (error) {
  console.error("Command failed.", error);
  process.exitCode = 1;
}
