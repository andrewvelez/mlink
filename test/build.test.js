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
import { fileURLToPath, pathToFileURL } from "node:url";

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const fixtureDirectories = [];

function createFixture() {
  const fixtureDirectory = mkdtempSync(join(tmpdir(), "mlink-build-test-"));

  for (const path of ["build.js", "package.json", "src"]) {
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
    expect(result.stderr).toContain("Usage: bun run <build|test|start>");
  });

  test("rejects importing the build script as a module", async () => {
    const fixtureDirectory = createFixture();
    const buildScriptUrl = pathToFileURL(
      join(fixtureDirectory, "build.js"),
    ).href;
    const child = Bun.spawn([
      process.execPath,
      "-e",
      `await import(${JSON.stringify(buildScriptUrl)})`,
    ], {
      cwd: fixtureDirectory,
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stderr, exitCode] = await Promise.all([
      new Response(child.stderr).text(),
      child.exited,
    ]);

    expect(exitCode).not.toBe(0);
    expect(stderr).toContain("build.js must be run directly, not imported.");
  });

  test("builds the complete browser application", async () => {
    const fixtureDirectory = createFixture();
    const outputDirectory = join(fixtureDirectory, "dist");
    const staleOutputPath = join(outputDirectory, "stale.txt");

    mkdirSync(outputDirectory);
    writeFileSync(staleOutputPath, "stale output");

    const result = await runBuildScript(fixtureDirectory, "build");

    expect(result.exitCode).toBe(0);
    expect(existsSync(staleOutputPath)).toBe(false);

    for (const path of [
      "js/app.js",
      "home.html",
      "about.html",
      "manifest.json",
      "styles/global.css",
      "external/pico.cyan.min.css",
      "external/htmx.min.js",
      "sw.js",
      "mlink",
    ]) {
      expect(existsSync(join(fixtureDirectory, "dist", path))).toBe(true);
    }

    const serviceWorker = readFileSync(
      join(fixtureDirectory, "dist", "sw.js"),
      "utf8",
    );

    expect(serviceWorker).not.toContain("__CACHE_VERSION__");
    expect(serviceWorker).not.toContain("self.__WB_MANIFEST");
    expect(serviceWorker).toMatch(
      /const cacheName = cachePrefix \+ "1\.0\.0\+\d{8}"/,
    );
  });

  test("fails when the package version is missing", async () => {
    const fixtureDirectory = createFixture();

    writeFileSync(join(fixtureDirectory, "package.json"), "{}\n");

    const result = await runBuildScript(fixtureDirectory, "build");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain(
      "package.json must contain a non-empty version string.",
    );
  });

  test("fails when the service-worker cache placeholder is missing", async () => {
    const fixtureDirectory = createFixture();
    const serviceWorkerPath = join(fixtureDirectory, "src", "web", "sw.js");
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

  test("fails when the server bundle cannot compile", async () => {
    const fixtureDirectory = createFixture();
    const serverPath = join(fixtureDirectory, "src", "server", "server.js");

    writeFileSync(serverPath, "export const =;\n");

    const result = await runBuildScript(fixtureDirectory, "build");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("error");
  });

  test("the test command propagates the test runner exit code", async () => {
    const fixtureDirectory = createFixture();
    const regressionTestPath = join(fixtureDirectory, "regression.test.js");

    writeFileSync(
      regressionTestPath,
      `import { expect, test } from "bun:test";

test("fixture failure", () => {
  expect(true).toBe(false);
});
`,
    );

    const result = await runBuildScript(fixtureDirectory, "test");

    expect(result.exitCode).toBe(1);
    expect(result.stdout + result.stderr).toContain("fixture failure");
  });

  test("the start command serves from another working directory", async () => {
    const fixtureDirectory = createFixture();
    const child = Bun.spawn([
      process.execPath,
      join(fixtureDirectory, "build.js"),
      "start",
    ], {
      cwd: tmpdir(),
      stdout: "pipe",
      stderr: "pipe",
    });
    const stderr = new Response(child.stderr).text();

    try {
      const serverUrl = await readServerUrl(child.stdout);
      const response = await fetch(serverUrl);

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("<title>Home</title>");
    } finally {
      child.kill();
      await child.exited;
      await stderr;
    }
  }, 15_000);

  test("the executable serves normal HTTP paths and rejects unsupported methods", async () => {
    const fixtureDirectory = createFixture();
    const buildResult = await runBuildScript(fixtureDirectory, "build");
    expect(buildResult.exitCode).toBe(0);

    const child = Bun.spawn([join(fixtureDirectory, "dist", "mlink")], {
      cwd: fixtureDirectory,
      stdout: "pipe",
      stderr: "pipe",
    });
    const stderr = new Response(child.stderr).text();

    try {
      const serverUrl = await readServerUrl(child.stdout);
      const pageResponse = await fetch(serverUrl);
      const headResponse = await fetch(
        new URL("styles/global.css", serverUrl),
        { method: "HEAD" },
      );
      const postResponse = await fetch(serverUrl, { method: "POST" });
      const missingResponse = await fetch(new URL("missing", serverUrl));

      expect(pageResponse.status).toBe(200);
      expect(pageResponse.headers.get("Content-Type")).toContain("text/html");
      expect(await pageResponse.text()).toContain("<title>Home</title>");
      expect(headResponse.status).toBe(200);
      expect(postResponse.status).toBe(404);
      expect(missingResponse.status).toBe(404);
    } finally {
      child.kill();
      await child.exited;
      await stderr;
    }
  }, 15_000);
});
