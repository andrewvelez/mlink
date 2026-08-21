# AGENTS.md

## Overview

- Ask clarifying questions before changing code unless the task is unambiguous.
- Keep responses pragmatic and concise.
- Do not make changes without first showing the intended diff and getting approval.
- The current design direction for the project is in `docs/DESIGN.md`. All other docs may be out of date.
- Do not declare ~~editor configuration~~ **any file** valid from visual inspection. Identify the reported diagnostic, validate the relevant properties against the active extension/schema, and report what was actually verified. If the diagnostic is unavailable from the workspace, ask for its exact text without claiming validity.
- Leave unresolved architecture decisions explicitly unresolved; do not fill gaps with guesses.

## Architecture

- Link-Up is a local-first Progressive Web App (PWA) built with Bun and ReScript.
- ReScript source lives in `src/` and compiles to colocated `.res.mjs` ES modules.
- Keep the browser UI web-native, using HTML, CSS, the DOM, and standard Web and PWA APIs without a frontend framework.
- Bun is the package manager and task runner.  Being a PWA, the browser is the runtime.

## Build Commands

- Install dependencies: `bun install`
- Build the project: `bun run build`
- Watch and serve during development: `bun run watch`
- Run the test command (currently build-only): `bun run test`
- Clean generated output: `bun run clean`

## Coding Style

- Use idiomatic ReScript for application source; do not introduce a frontend framework without an explicit design decision.
- Treat `.res.mjs` files as generated compiler output; edit the corresponding `.res` source instead.
- Use standard Web and PWA APIs for browser capabilities and idiomatic Bun APIs for Bun-specific code.
- Prefer more idiomatic and smaller changesets.
- Every new source file that supports comments should contain a valid header comment with the MIT license tag, author name/year, and description.
- Regular code shouldn't be modified solely for tests unless there is a benefit for the regular code as well.
