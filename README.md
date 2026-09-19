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

| Command | Purpose |
| --- | --- |
| `bun run build` | Build `dist/mlink`, the full-stack executable that embeds and serves the PWA. Does not run tests. |
| `bun run test` | Build `dist/mlink`, then run the Bun test suite. Use this before production deployment. |
| `bun run start` | Build and start the local host from source. Does not run tests. |

### Before production deployment

Run `bun run test` and deploy the resulting `dist/mlink` only if the command
succeeds (exit code 0). A successful `bun run build` alone does not establish
that tests pass. No separate build is needed after a successful test run.

Use `bun run test`, not bare `bun test`, for this workflow: the package script
builds before testing. None of these commands deploys the executable.

## Current implementation status

The current checkout contains minimal home and about pages, a web app manifest,
browser service-worker registration, a service worker, automated tests, and the
full-stack executable build pipeline. Build output is generated in `dist/`.

The service worker currently regresses from the required one-year CacheOnly
release-cache design. The repair is tracked in
`.devtool/features/restore-one-year-cache-only-service-worker-2026-09-11.md`.
Product workflows, local persistence, peer networking, encryption,
notifications, and offline delivery remain unimplemented.
