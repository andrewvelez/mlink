#!/usr/bin/env bun
/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @description Builds and serves Link-Up's browser PWA assets with Bun.
 */

import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { injectManifest } from "workbox-build";

const buildData = {
  sourceDirectory: "./src",
  webDirectory: "./src/web",
  outputDirectory: "./dist",
  executablePath: "./dist/mlink",
  swSrc: "./src/web/sw.js",
  swDest: "./dist/sw.js",
  commands: {
    build,
    test,
    start,
  },
};

/**
 * @description Combines the semantic application version with UTC date build metadata.
 * @returns {string} The application version and date-based build number.
 * @throws {Error} If package.json cannot be read, parsed, or lacks a version.
 */
function getAppVersion() {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (typeof pkg?.version !== "string" || !pkg.version.trim()) {
    throw new Error("package.json must contain a non-empty version string.");
  }
  const buildNumber = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${pkg.version}+${buildNumber}`;
}

function replaceCacheVersion() {
  const swPath = buildData.swDest;
  const swText = readFileSync(swPath, "utf8");
  if (!swText.includes("__CACHE_VERSION__")) {
    throw new Error("The service-worker cache-version placeholder is missing.");
  }

  writeFileSync(swPath, swText.replace("__CACHE_VERSION__", getAppVersion()));
}

async function bundleManifest() {
  const { warnings } = await injectManifest({
    globDirectory: buildData.outputDirectory,
    globPatterns: ["**/*.{html,js,json,css,svg,png}"],
    swSrc: buildData.swSrc,
    swDest: buildData.swDest,
  });

  if (warnings.length > 0) {
    console.warn("Warnings encountered while injecting the manifest:", warnings.join("\n"));
  }
}

async function bundle() {
  const result = await Bun.build({
    entrypoints: [join(buildData.sourceDirectory, "server/server.js")],
    compile: { outfile: buildData.executablePath },
    naming: {
      asset: "[name].[ext]",
      entry: "[name].[ext]",
    },
  });

  if (!result.success) {
    throw new Error(result.logs.join("\n") || "Build failed.");
  }
}

async function build() {
  rmSync(buildData.outputDirectory, { recursive: true, force: true });
  cpSync(buildData.webDirectory, buildData.outputDirectory, { recursive: true });
  await bundleManifest();
  replaceCacheVersion();
  await bundle();
}

async function test() {
  await build();

  const testRunner = Bun.spawn([process.execPath, "test"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  process.exitCode = await testRunner.exited;
}

async function start() {
  await build();
  await import("./src/server/server.js");
}

/**
 * @description build.js is a module and a bun entry point, we process the command passed to build.js
 */
async function main() {
  if (!import.meta.main) {
    throw new Error("build.js must be run directly, not imported.");
  }

  process.chdir(import.meta.dir);

  const commands = buildData.commands;
  const scriptCommand = process.argv[2];

  if (!scriptCommand || !Object.hasOwn(commands, scriptCommand)) {
    console.error(`Usage: bun run <${Object.keys(commands).join("|")}>`);
    process.exitCode = 1;
    return;
  }

  await commands[scriptCommand]();
}

await main();
