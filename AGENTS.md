# AGENTS.md

## Overview

- MLink (formerly Link-Up) is a local-first progressive web app (PWA) for gay men.  It uses Bun.js as a bundler and package manager.  Aside from bundling, Bun is not used as the application's runtime.  The browser and the Web Platform (no TypeScript) are the application's runtime and technology stack.
- The browser is the application runtime for the PWA. The app is deployed as a Bun full stack executable.  The PWA will be cached 100% on the first page hit. The complete current browser build is emitted under `dist/`.
- The current design direction for the project is in `docs/DESIGN.md`. Other documents within the docs folder may be out of date.

## Commands

* Install dependencies
  >
  > `bun install`
  >

* Bundle project for production deployment
  >
  > `bun run build` **or** `bun build.js build`
  >

* Build project and run all tests (tests are WIP)
  >
  > `bun run test` **or** `bun build.js test`
  >

* Build project and start local dev server
  >
  > `bun run start` **or** `bun build.js start`
  >

## Code Style

- Change only what the request requires. Prefer the smallest correct diff; stop and ask before adding scope.
- Add author metadata to newly authored files. Use `Andrew Velez <andrewvelez@outlook.com>`, or `Andrew Velez` for public, served, or bundled files. Ask if the format cannot store attribution. New JavaScript files require `@author`, `@license MIT`, and `@description`.
- Tests must use production interfaces. Do not alter non-test code solely to support tests without approval.
- Follow architectural decisions established by the request, current code, or authoritative documentation. Ask about unresolved decisions.
- Priority: correctness, readability, then idiom.
- Use dot notation for known valid identifiers; otherwise use bracket notation.
- Document new or modified JavaScript functions, object shapes, and ambiguous declarations with JSDoc. Describe unsupported types in prose.  Objects with known primitive properties can be annotated as such. Do not add documentation retroactively.

## Misc

- Specific saved metadata created by Codex extension that is specific to this repository can be saved in `<project_root>/.vscode/codex/`
