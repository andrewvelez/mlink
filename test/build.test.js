/**
 * @author Andrew Velez 2026
 * @license SPDX-License-Identifier: MIT
 * @desc Tests the Bun build command and development server entry point.
 */

import { afterEach, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureDirectories = [];

function createFixture() {
  const fixtureDirectory = mkdtempSync(join(tmpdir(), "mlink-build-test-"));

  for (const path of ["build.js", "package.json", "src", "static"]) {
    cpSync(join(projectDirectory, path), join(fixtureDirectory, path), {
      recursive: true,
    });
  }

  symlinkSync(
    join(projectDirectory, "node_modules"),
    join(fixtureDirectory, "node_modules"),
    "dir",
  );
  fixtureDirectories.push(fixtureDirectory);

  return fixtureDirectory;
}

async function runBuildScript(directory, ...arguments_) {
  const child = Bun.spawn([process.execPath, "build.js", ...arguments_], {
    cwd: directory,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  return { exitCode, stderr, stdout };
}

async function readServerUrl(stream) {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let output = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      throw new Error(`The development server exited before startup:\n${output}`);
    }

    output += decoder.decode(value, { stream: true });

    const match = output.match(/MLink running at (http:\/\/\S+)/);
    if (match) {
      await reader.cancel();
      return match[1];
    }
  }
}

afterEach(() => {
  for (const directory of fixtureDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("build", () => {
  test("rejects an unknown command", async () => {
    const result = await runBuildScript(createFixture(), "unknown");

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Usage: bun run <clean|build|test|start>");
  });

  test("removes existing build output", async () => {
    const fixtureDirectory = createFixture();
    const staleFile = join(fixtureDirectory, "dist", "stale.txt");

    mkdirSync(dirname(staleFile), { recursive: true });
    writeFileSync(staleFile, "stale");

    const result = await runBuildScript(fixtureDirectory, "clean");

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(fixtureDirectory, "dist"))).toBe(false);
  });

  test("builds the complete browser application", async () => {
    const fixtureDirectory = createFixture();
    const result = await runBuildScript(fixtureDirectory, "build");

    expect(result.exitCode).toBe(0);

    for (const path of [
      "app.js",
      "app.js.map",
      "index.html",
      "manifest.json",
      "static/styles/global.css",
      "sw.js",
    ]) {
      expect(existsSync(join(fixtureDirectory, "dist", path))).toBe(true);
    }

    const serviceWorker = readFileSync(
      join(fixtureDirectory, "dist", "sw.js"),
      "utf8",
    );

    expect(serviceWorker).not.toContain("__CACHE_VERSION__");
    expect(serviceWorker).not.toContain("self.__WB_MANIFEST");
    expect(serviceWorker).toContain('const cacheName = cachePrefix + "0.1.0"');
  });

  test("fails when the service-worker cache placeholder is missing", async () => {
    const fixtureDirectory = createFixture();
    const serviceWorkerPath = join(fixtureDirectory, "src", "sw.js");
    const serviceWorker = readFileSync(serviceWorkerPath, "utf8").replace(
      "__CACHE_VERSION__",
      "missing-version",
    );

    writeFileSync(serviceWorkerPath, serviceWorker);

    const result = await runBuildScript(fixtureDirectory, "build");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain(
      "The service-worker cache-version placeholder is missing.",
    );
  });

  test("serves normal HTTP paths and rejects unsupported methods", async () => {
    const fixtureDirectory = createFixture();
    const child = Bun.spawn([process.execPath, "build.js", "start"], {
      cwd: fixtureDirectory,
      stdout: "pipe",
      stderr: "pipe",
    });
    const stderr = new Response(child.stderr).text();

    try {
      const serverUrl = await readServerUrl(child.stdout);
      const pageResponse = await fetch(serverUrl);
      const headResponse = await fetch(
        new URL("static/styles/global.css", serverUrl),
        { method: "HEAD" },
      );
      const postResponse = await fetch(serverUrl, { method: "POST" });
      const missingResponse = await fetch(new URL("missing", serverUrl));

      expect(pageResponse.status).toBe(200);
      expect(pageResponse.headers.get("Cache-Control")).toBe("no-cache");
      expect(await pageResponse.text()).toContain("<title>Link-Up</title>");
      expect(headResponse.status).toBe(200);
      expect(postResponse.status).toBe(405);
      expect(postResponse.headers.get("Allow")).toBe("GET, HEAD");
      expect(missingResponse.status).toBe(404);
    } finally {
      child.kill();
      await child.exited;
      await stderr;
    }
  }, 15_000);
});
