# MLink

MLink is a local-first Progressive Web App (PWA) written in vanilla JavaScript.
The browser is the PWA runtime. Bun installs dependencies, runs project tasks,
stages browser assets, and compiles the VPS-deployable application host.

## Prerequisites

- Bun.js

## Install dependencies

```bash
bun install
```

## Bun.js build scripts

```bash
bun run clean
bun run build
bun run test
bun run start
```

`bun run build` produces `dist/mlink`, the full-stack executable that embeds
and serves the PWA. `bun run start` builds and starts the local host. `bun run
test` builds first, then runs the Bun test suite.

## Current implementation status

The current checkout contains minimal home and about pages, a web app manifest,
browser service-worker registration, a service worker, automated tests, and the
full-stack executable build pipeline. Build output is generated in `dist/`.

The service worker currently regresses from the required one-year CacheOnly
release-cache design. The repair is tracked in
`.devtool/features/restore-one-year-cache-only-service-worker-2026-09-11.md`.
Product workflows, local persistence, peer networking, encryption,
notifications, and offline delivery remain unimplemented.
