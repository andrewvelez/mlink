# AGENTS.md

## Architecture Overview

- MLink (formerly Link-Up) is a local-first progressive web app (PWA) for gay men.  It uses Bun.js as a bundler and package manager.  Aside from bundling, Bun is not used as the application's runtime.  The browser and the Web Platform (no TypeScript) are the application's runtime and technology stack.
- The browser is the application runtime. In being local-first, every effort is made for the app to be 100% cached on the first page load.  This means all assets, javascript, everything that would be in a Bun full stack executable file (minus Bun).
- The complete current browser build is emitted under `dist/`. Full-stack executable packaging is future work and is not currently implemented.
- The current design direction for the project is in `docs/DESIGN.md`. Other documents within the docs folder may be out of date.

## Commands

| &nbsp; | &nbsp; |
|--------|--------|
| **Install dependencies:** | `bun install` |
| **Remove project build artifacts:** | `bun run --bun ./build.js clean` |
| **Bundle project for production deployment:** | `bun run --bun ./build.js build` |
| **Build project and run all tests (tests are coming soon):** | `bun run --bun ./build.js test` |
| **Build project and start local dev server:** | `bun run --bun ./build.js start` |
| &nbsp; | &nbsp; |


## Coding Requirements

- If needed, the preference would be for you to ask questions to clarify the prompt before responding for all non-trivial tasks.
- Always show your intended diff to get approval before making any code/configuration changes.
- Keep responses pragmatic, idiomatic and as concise as possible.
- Fewest lines changed **to satisfy the task** is the goal.
- Use standard Web and PWA APIs for browser capabilities and idiomatic Bun APIs for build tooling.
- Every new source file that supports comments should contain a valid (meaning JSDoc-like) header comment with at least these properties: author (Andrew Velez 2026), the license tag (MIT), and brief description.
- Production non-test code shouldn't be modified solely to aid in the construction of a unit test.
- Leave unresolved architecture decisions unresolved; do not make assumptions or try to fix anything beyond what is asked for in the prompt.
