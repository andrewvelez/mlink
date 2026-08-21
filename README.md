# Link-Up

Link-Up is a local-first Progressive Web App (PWA) written in vanilla
JavaScript. The browser is the application runtime; Bun installs dependencies,
runs project tasks, and bundles the application.

## Prerequisites

- Install Bun.

## Install dependencies

```bash
bun install
```

## Build the project

```bash
bun run build
```

## Run the current test command

```bash
bun run test
```

## Current implementation status

The current checkout contains a minimal HTML shell, web app manifest, browser
service-worker registration, offline application-shell worker, and Bun build
pipeline. Build output is generated in `dist/`. Automated behavioral tests are
not configured; the current test command exercises the build path only.
Production deployment remains unresolved.
