#!/usr/bin/env bun
/**
 * @author Andrew Velez
 * @license MIT
 * @description Builds and serves Link-Up's browser PWA assets with Bun.
 */

import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { injectManifest } from "workbox-build";

/**
 * Application build paths.
 * @type {Object}
 * @property {string} sourceDirectory The source-code directory.
 * @property {string} webDirectory The browser-asset directory.
 * @property {string} outputDirectory The build-output directory.
 * @property {string} executablePath The compiled server executable path.
 * @property {string} swSrc The source service-worker path.
 * @property {string} swBundle The intermediate bundled service-worker path.
 * @property {string} swDest The output service-worker path.
 */
const buildPaths = Object.freeze({
  sourceDirectory: "./src",
  webDirectory: "./src/web",
  outputDirectory: "./dist",
  executablePath: "./dist/mlink",
  swSrc: "./src/web/sw.js",
  swBundle: "./dist/sw.bundle.js",
  swDest: "./dist/sw.js",
});

// #region Helper functions for building
/**
 * @description Bundles Workbox and the service-worker source for the browser.
 * @returns {Promise} Resolves after bundling succeeds.
 * @throws {Error} If Bun cannot bundle the service worker.
 */
async function bundleServiceWorker() {
  /** @type {Object} Bun compilation result containing success and logs properties. */
  const result = await Bun.build({
    entrypoints: [buildPaths.swSrc],
    outdir: buildPaths.outputDirectory,
    naming: { entry: "sw.bundle.js" },
    target: "browser",
    minify: true,
  });

  if (!result.success) {
    throw new Error(result.logs.join("\n") || "Service-worker build failed.");
  }
}

/**
 * @description Injects the output-file manifest into the service worker.
 * @returns {Promise} Resolves after the manifest is injected.
 * @throws {Error} If Workbox cannot inject the manifest.
 */
async function bundleManifest() {
  /** @type {Object} Workbox result containing a warnings array. */
  const { warnings } = await injectManifest({
    globDirectory: buildPaths.outputDirectory,
    globPatterns: ["**/*.{html,js,json,css,svg,png}"],
    swSrc: buildPaths.swBundle,
    swDest: buildPaths.swDest,
  });

  rmSync(buildPaths.swBundle, { force: true });

  if (warnings.length > 0) {
    console.warn("Warnings encountered while injecting the manifest:", warnings.join("\n"));
  }
}

/**
 * @description Compiles the server entry point into an executable.
 * @returns {Promise} Resolves after compilation succeeds.
 * @throws {Error} If Bun cannot compile the server executable.
 */
async function bundle() {
  /** @type {Object} Bun compilation result containing success and logs properties. */
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
// #endregion

// #region Build Command Functions
/*
 * @type {Function}
 * @description Creates a clean production build of the complete application.
 * @returns {Promise} Resolves after all build steps succeed.
 * @throws {Error} If any build step fails.
 */
const build = async () => {
  rmSync(buildPaths.outputDirectory, { recursive: true, force: true });
  cpSync(buildPaths.webDirectory, buildPaths.outputDirectory, { recursive: true });
  await bundleServiceWorker();
  await bundleManifest();
  await bundle();
};

/**
 * @type {Function}
 * @description Builds the application and runs its test suite.
 * @returns {Promise} Resolves after the test process exits.
 * @throws {Error} If the build fails or the test process cannot be started.
 */
const test = async () => {
  await build();

  /** @type {Object} Spawned test process with an exited promise. */
  const testRunner = Bun.spawn([process.execPath, "test"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  process.exitCode = await testRunner.exited;
};

/**
 * @type {Function}
 * @description Builds the application and starts the development server.
 * @returns {Promise} Resolves after the server module loads.
 * @throws {Error} If the build or server-module import fails.
 */
const start = async () => {
  await build();
  await import("./src/server/server.js");
};
// #endregion

// #region Main script
if (!import.meta.main) {
  throw new Error("build.js must be run directly, not imported.");
}
process.chdir(import.meta.dir);

const buildCommands = [build, test, start];
const argvCommand = process.argv[2];
const cmdFunc = buildCommands.find(cmdFunc => cmdFunc.name === argvCommand);

if (cmdFunc) {
  await cmdFunc();
} else {
  throw new Error(`Usage: bun run <${buildCommands.map(cmd => cmd.name).join("|")}>`);
}
// #endregion
