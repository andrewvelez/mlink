#!/usr/bin/env bun
/**
 * @license SPDX-License-Identifier: MIT
 * @author Andrew Velez 2026
 * @desc Builds and serves Link-Up's browser PWA assets with Bun.
 */

import { copyFileSync, cpSync, rmSync } from "node:fs";
import { cp, copyFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { injectManifest } from "workbox-build";
import packageJson from "./package.json" with { type: "json" };

const sourceDirectory = join(import.meta.dir, "src");
const staticDirectory = join(import.meta.dir, "static");
const outputDirectory = join(import.meta.dir, "dist");

function clean() {
  rmSync(outputDirectory, { force: true, recursive: true });
}

async function insertSWCacheVersion() {
  const swText = await Bun.file(join(outputDirectory, "sw.js")).text();
  if (!swText.includes("__CACHE_VERSION__")) {
    throw new Error("The service-worker cache-version placeholder is missing.");
  }

  await Bun.write(join(outputDirectory, "sw.js"), swText.replace("__CACHE_VERSION__", packageJson.version));
}

async function bundle() {
  const bundled = await Bun.build({
    entrypoints: [
      join(sourceDirectory, "app.js"),
    ],
    outdir: outputDirectory,
    sourcemap: "external",
    target: "browser",
  })
  .catch(err => {
    console.error(err);
    throw new Error("Bun build failed.");
  });

  if (!bundled.success) {
    console.error("Errors during bundling: \n" + bundled.logs?.join("\n"));
    throw new Error("Bun build failed.");
  }
}

async function copyStaticFiles() {
  await copyFile(join(sourceDirectory, "index.html"), join(outputDirectory, "index.html"));
  await copyFile(join(sourceDirectory, "manifest.json"), join(outputDirectory, "manifest.json"));
  await cp(staticDirectory, join(outputDirectory, "static"), { recursive: true });
}

async function build() {
  clean();

  await bundle();
  await copyStaticFiles();

  await injectManifest({
    globDirectory: outputDirectory,
    globPatterns: ["**/*.{html,js,json,css,svg,png}"],
    swSrc: join(sourceDirectory, "sw.js"),
    swDest: join(outputDirectory, "sw.js"),
  }).then(({ count, size, warnings }) => {
    if (warnings.length > 0) {
      console.warn('Warnings encountered while injecting the manifest:', warnings.join('\n'));
    }
  });
  await insertSWCacheVersion();
}

async function test() {
  await build();
}

/**
 * @description resolves what's requested to what can actually be served.  If it can't be
 * served, then we return the empty string, never null, no exceptions.
 * @param {object} request
 * @returns {object} bunfile
 */
function resolveRequestFilepath(request) {
  let filePath = "";
  let bunfile = Bun.file(filePath);

  try {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const requestedFile = (pathname === "/" ? "index.html" : pathname.slice(1));
    filePath = resolve(outputDirectory, requestedFile);

    if (!filePath.startsWith(outputDirectory + sep)) {
      filePath = "";
    }

    bunfile = Bun.file(filePath);
  } catch (err) {
    filePath = "";
    bunfile = Bun.file("");
  }

  return bunfile;
}

async function fetch(request) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const file = resolveRequestFilepath(request);

  if ((await file.exists())) {
    return new Response(file, {
      headers: { "Cache-Control": "no-cache" },
    });
  } else {
    return new Response(null, { status: 404 });
  }
}

async function start() {
  await build();

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch,
  });
}

const commands = {
  clean,
  build,
  test,
  start,
};

/**
 * @description build.js is a module and a bun entry point, we process the command passed to build.js
 */
async function main() {
  const scriptCommand = process.argv[2];

  if (!scriptCommand || !Object.hasOwn(commands, scriptCommand)) {
    console.error(`Usage: bun run <${Object.keys(commands).join("|")}>`);
    process.exitCode = 1;
    return;
  }

  await commands[scriptCommand]();
}

await main();
