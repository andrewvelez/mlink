# Link-Up

Link-Up is a local-first Progressive Web App (PWA) built with Bun and
ReScript. ReScript source lives in `src/` and compiles to colocated `.res.mjs`
ES modules.

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

## Watch and serve during development

```bash
bun run watch
```

## Run the current test command

```bash
bun run test
```

## Clean generated ReScript output

```bash
bun run res:clean
```

## Current implementation status

The current checkout contains a minimal HTML shell, web app manifest, browser
service-worker registration, offline application-shell worker, and Bun build
and development-server wiring. Automated behavioral tests are not configured;
the current test command exercises the build path only.
