#!/usr/bin/env bun
/**
 * @license SPDX-License-Identifier: MIT
 * @author Andrew Velez 2026
 * @desc Builds and serves Link-Up's browser PWA assets with Bun.
 */

import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { injectManifest } from "workbox-build";

const sourceDirectory = join(import.meta.dir, "src");
const staticDirectory = join(import.meta.dir, "static");
const outputDirectory = join(import.meta.dir, "dist");
const executablePath = join(outputDirectory, "mlink");

export function getAppVersion() {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const baseVersion = pkg?.baseVersion;
  return baseVersion + '.' + new Date().toISOString().slice(0, 10).replaceAll("-", "");
}

function clean() {
  rmSync(outputDirectory, { force: true, recursive: true });
}

function insertSWCacheVersion() {
  const swText = readFileSync(join(outputDirectory, "sw.js"), "utf8");
  if (!swText.includes("__CACHE_VERSION__")) {
    throw new Error("The service-worker cache-version placeholder is missing.");
  }

  writeFileSync(join(outputDirectory, "sw.js"), swText.replace("__CACHE_VERSION__", getAppVersion()));
}

function copyStaticFiles() {
  mkdirSync(outputDirectory, { recursive: true });

  for (const filename of ["app.js", "home.html", "about.html", "manifest.json"]) {
    copyFileSync(join(sourceDirectory, filename), join(outputDirectory, filename));
  }
  cpSync(staticDirectory, join(outputDirectory, "static"), {
    filter: (source) => source !== join(staticDirectory, "js/pico-css.js"),
    recursive: true,
  });
  copyFileSync(
    join(import.meta.dir, "node_modules/@picocss/pico/css/pico.cyan.min.css"),
    join(outputDirectory, "static/styles/pico.cyan.min.css"),
  );
}

async function bundleManifest() {
  const { warnings } = await injectManifest({
    globDirectory: outputDirectory,
    globPatterns: ["**/*.{html,js,json,css,svg,png}"],
    swSrc: join(sourceDirectory, "sw.js"),
    swDest: join(outputDirectory, "sw.js"),
  });

  if (warnings.length > 0) {
    console.warn("Warnings encountered while injecting the manifest:", warnings.join("\n"));
  }
}

async function bundle() {
  let result, error;

  try {
    result = await Bun.build({
      entrypoints: [join(sourceDirectory, "server.js")],
      compile: { outfile: executablePath },
      naming: {
        asset: "[name].[ext]",
        entry: "[name].[ext]",
      },
    });
  } catch (err) {
    console.error("Caught error: ", err);
    error = err;
  }

  if (error || !result?.success) {
    console.error("Errors during bundling: \n" + result?.logs?.join("\n"));
    console.error("Build failed: ", error);
    if (error) { throw error; } else { throw new Error(result?.logs?.join("\n")); }
  }
}

async function build() {
  clean();
  copyStaticFiles();
  await bundleManifest();
  insertSWCacheVersion();
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
  await import("./src/server.js");
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
