#!/usr/bin/env bun
/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @description Builds and serves Link-Up's browser PWA assets with Bun.
 */

import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { injectManifest } from "workbox-build";

const buildData = {
  sourceDirectory: join(import.meta.dir, "src"),
  webDirectory: join(import.meta.dir, "src/web"),
  externalDirectory: join(import.meta.dir, "src/external"),
  outputDirectory: join(import.meta.dir, "dist"),
  executablePath: join(import.meta.dir, "dist/mlink"),
  commands: {
    clean,
    build,
    test,
    start,
  },
};

export function getAppVersion() {
  const pkg = JSON.parse(readFileSync(join(import.meta.dir, "package.json"), "utf8"));
  if (typeof pkg?.baseVersion !== "string" || !pkg.baseVersion.trim()) {
    throw new Error("package.json must contain a non-empty baseVersion string.");
  }
  return pkg.baseVersion + '.' + new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

function clean() {
  const { outputDirectory } = buildData;
  rmSync(outputDirectory, { force: true, recursive: true });
}

function insertSWCacheVersion(version) {
  const { outputDirectory } = buildData;
  const swText = readFileSync(join(outputDirectory, "sw.js"), "utf8");
  if (!swText.includes("__CACHE_VERSION__")) {
    throw new Error("The service-worker cache-version placeholder is missing.");
  }

  writeFileSync(join(outputDirectory, "sw.js"), swText.replace("__CACHE_VERSION__", version));
}

function copyBrowserFiles() {
  const { webDirectory, externalDirectory, outputDirectory } = buildData;
  mkdirSync(outputDirectory, { recursive: true });

  for (const filename of ["app.js", "home.html", "about.html", "manifest.json"]) {
    copyFileSync(join(webDirectory, filename), join(outputDirectory, filename));
  }
  for (const directory of ["icons", "styles"]) {
    cpSync(join(webDirectory, directory), join(outputDirectory, "static", directory), {
      recursive: true,
    });
  }
  mkdirSync(join(outputDirectory, "static/js"), { recursive: true });
  copyFileSync(join(externalDirectory, "htmx.min.js"), join(outputDirectory, "static/js/htmx.min.js"));
  copyFileSync(join(externalDirectory, "pico.cyan.min.css"), join(outputDirectory, "static/styles/pico.cyan.min.css"));
}

async function bundleManifest() {
  const { webDirectory, outputDirectory } = buildData;
  const { warnings } = await injectManifest({
    globDirectory: outputDirectory,
    globPatterns: ["**/*.{html,js,json,css,svg,png}"],
    swSrc: join(webDirectory, "sw.js"),
    swDest: join(outputDirectory, "sw.js"),
  });

  if (warnings.length > 0) {
    console.warn("Warnings encountered while injecting the manifest:", warnings.join("\n"));
  }
}

async function bundle() {
  const { sourceDirectory, executablePath } = buildData;
  const result = await Bun.build({
    entrypoints: [join(sourceDirectory, "server/server.js")],
    compile: { outfile: executablePath },
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
  const version = getAppVersion();
  clean();
  copyBrowserFiles();
  await bundleManifest();
  insertSWCacheVersion(version);
  await bundle();
}

async function test() {
  await build();

  const testRunner = Bun.spawn([process.execPath, "test"], {
    cwd: import.meta.dir,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await testRunner.exited;

  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}

async function start() {
  await build();
  await import("./src/server/server.js");
}

/**
 * @description build.js is a module and a bun entry point, we process the command passed to build.js
 */
async function main() {
  const { commands } = buildData;
  const scriptCommand = process.argv[2];

  if (!scriptCommand || !Object.hasOwn(commands, scriptCommand)) {
    console.error(`Usage: bun run <${Object.keys(commands).join("|")}>`);
    process.exitCode = 1;
    return;
  }

  await commands[scriptCommand]();
}

if (import.meta.main) {
  await main();
}
