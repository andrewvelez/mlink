#!/usr/bin/env bun
/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @description Builds and serves Link-Up's browser PWA assets with Bun.
 */

import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { injectManifest } from "workbox-build";

/**
 * @typedef {Object} BuildCommands
 * @property {function(): Promise<void>} build Builds the application.
 * @property {function(): Promise<void>} test Builds and tests the application.
 * @property {function(): Promise<void>} start Builds and starts the application.
 */

/**
 * @typedef {Object} BuildPaths
 * @property {string} sourceDirectory The source-code directory.
 * @property {string} webDirectory The browser-asset directory.
 * @property {string} outputDirectory The build-output directory.
 * @property {string} executablePath The compiled server executable path.
 * @property {string} swSrc The source service-worker path.
 * @property {string} swDest The output service-worker path.
 */

/**
 * @typedef {Object} PackageData
 * @property {*} [version] The unvalidated application version.
 */

/**
 * @typedef {Object} ManifestResult
 * @property {Array<string>} warnings Warnings produced during manifest injection.
 */

/**
 * @typedef {Object} BundleResult
 * @property {boolean} success Whether compilation succeeded.
 * @property {Array<*>} logs Messages produced during compilation.
 */

/**
 * @typedef {Object} TestRunner
 * @property {Promise<number>} exited The test process's eventual exit code.
 */

/** @type {BuildPaths} Application build paths. */
const buildPaths = {
  sourceDirectory: "./src",
  webDirectory: "./src/web",
  outputDirectory: "./dist",
  executablePath: "./dist/mlink",
  swSrc: "./src/web/sw.js",
  swDest: "./dist/sw.js",
};

/**
 * @description Combines the semantic application version with UTC date build metadata.
 * @returns {string} The application version and date-based build number.
 * @throws {Error} If package.json cannot be read, parsed, or lacks a version.
 */
function getAppVersion() {
  /** @type {PackageData} Parsed package metadata. */
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (typeof pkg?.version !== "string" || !pkg.version.trim()) {
    throw new Error("package.json must contain a non-empty version string.");
  }
  /** @type {string} UTC date-based build number. */
  const buildNumber = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${pkg.version}+${buildNumber}`;
}

/**
 * @description Replaces the service worker's cache-version placeholder with the application version.
 * @returns {void}
 * @throws {Error} If the service worker cannot be read or written, or lacks the placeholder.
 */
function replaceCacheVersion() {
  /** @type {string} Output service-worker path. */
  const swPath = buildPaths.swDest;
  /** @type {string} Output service-worker source text. */
  const swText = readFileSync(swPath, "utf8");
  if (!swText.includes("__CACHE_VERSION__")) {
    throw new Error("The service-worker cache-version placeholder is missing.");
  }

  writeFileSync(swPath, swText.replace("__CACHE_VERSION__", getAppVersion()));
}

/**
 * @description Injects the output-file manifest into the service worker.
 * @returns {Promise<void>} Resolves after the manifest is injected.
 * @throws {Error} If Workbox cannot inject the manifest.
 */
async function bundleManifest() {
  /** @type {ManifestResult} Workbox manifest-injection result. */
  const { warnings } = await injectManifest({
    globDirectory: buildPaths.outputDirectory,
    globPatterns: ["**/*.{html,js,json,css,svg,png}"],
    swSrc: buildPaths.swSrc,
    swDest: buildPaths.swDest,
  });

  if (warnings.length > 0) {
    console.warn("Warnings encountered while injecting the manifest:", warnings.join("\n"));
  }
}

/**
 * @description Compiles the server entry point into an executable.
 * @returns {Promise<void>} Resolves after compilation succeeds.
 * @throws {Error} If Bun cannot compile the server executable.
 */
async function bundle() {
  /** @type {BundleResult} Bun compilation result. */
  const result = await Bun.build({
    entrypoints: [join(buildPaths.sourceDirectory, "server/server.js")],
    compile: { outfile: buildPaths.executablePath },
    naming: {
      asset: "[name].[ext]",
      entry: "[name].[ext]",
    },
  });

  if (!result.success) {
    throw new Error(result.logs.join("\n") || "Build failed.");
  }
}

/**
 * @type {function(): Promise<void>}
 * @description Creates a clean production build of the complete application.
 * @returns {Promise<void>} Resolves after all build steps succeed.
 * @throws {Error} If any build step fails.
 */
const build = async function build() {
  rmSync(buildPaths.outputDirectory, { recursive: true, force: true });
  cpSync(buildPaths.webDirectory, buildPaths.outputDirectory, { recursive: true });
  await bundleManifest();
  replaceCacheVersion();
  await bundle();
};

/**
 * @type {function(): Promise<void>}
 * @description Builds the application and runs its test suite.
 * @returns {Promise<void>} Resolves after the test process exits.
 * @throws {Error} If the build fails or the test process cannot be started.
 */
const test = async function test() {
  await build();

  /** @type {TestRunner} Spawned test process. */
  const testRunner = Bun.spawn([process.execPath, "test"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  process.exitCode = await testRunner.exited;
};

/**
 * @type {function(): Promise<void>}
 * @description Builds the application and starts the development server.
 * @returns {Promise<void>} Resolves after the server module loads.
 * @throws {Error} If the build or server-module import fails.
 */
const start = async function start() {
  await build();
  await import("./src/server/server.js");
};

/** @type {BuildCommands} Supported command handlers. */
const buildCommands = {
  build,
  test,
  start,
};

/**
 * @description Processes the requested command when build.js runs as Bun's entry point.
 * @returns {Promise<void>} Resolves after the selected command completes.
 * @throws {Error} If the module is imported or the selected command fails.
 */
async function main() {
  if (!import.meta.main) {
    throw new Error("build.js must be run directly, not imported.");
  }

  process.chdir(import.meta.dir);

  /** @type {(string|undefined)} Command requested on the command line. */
  const scriptCommand = process.argv[2];

  if (!scriptCommand || !Object.hasOwn(buildCommands, scriptCommand)) {
    console.error(`Usage: bun run <${Object.keys(buildCommands).join("|")}>`);
    process.exitCode = 1;
    return;
  }

  await buildCommands[scriptCommand]();
}

await main();
