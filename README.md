# Link-Up

Link-Up is a local-first Progressive Web App (PWA) written in vanilla
JavaScript. The browser is the application runtime; Bun installs dependencies,
runs project tasks, and bundles the application.

## Prerequisites

- Bun.js, htmx

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

## Current implementation status

The current checkout contains a minimal HTML shell, web app manifest, browser
service-worker registration, offline application-shell worker, and Bun build
pipeline. Build output is generated in `dist/`. Automated behavioral tests are
not configured; the current test command exercises the build path only.
Production deployment remains unresolved.
