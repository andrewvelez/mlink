# AGENTS.md

## Architecture Overview

- MLink is gay dating web app.  It uses Bun.js has a bundler and package manager; it is not the application runtime.  It is a local-first progressive web app (PWA).  It uses the Web Platform (no TypeScript).
- The browser is the application runtime. In being local-first, every effort is made for the app to be 100% cached on the first page load.
- The current design direction for the project is in `docs/DESIGN.md`. All other docs may be out of date.

## Commands

Install dependencies
```
bun install
```

Remove project build artifacts
```
bun run --bun ./build.js clean
```

Bundle project for production deployment
```
bun run --bun ./build.js build
```

Build project and run test suite
```
bun run --bun ./build.js test
```

Build project and start local dev server
```
bun run --bun ./build.js start
```


## Coding Requirements

- Ask questions to clarify the prompt before responding.
- Always show your intended diff to get approval before making any changes.
- Keep responses pragmatic, idiomatic, concise as possible; prefer commits changing the least amount of code.
- Use standard Web and PWA APIs for browser capabilities and idiomatic Bun APIs for build tooling.
- Every new source file that supports comments should contain a valid header comment with the MIT license tag, author name/year, and description.
- Regular code shouldn't be modified solely for tests unless there is a benefit for the regular code as well.
- Do not declare **any file** valid just from visual inspection. Identify the reported diagnostic, validate the relevant properties against the active extension/schema, and report what was actually verified. If the diagnostic is unavailable from the workspace, ask for its exact text without claiming validity.
- Leave unresolved architecture decisions unresolved; do not make assumptions or try to fix anything beyond what is asked for in the prompt.
