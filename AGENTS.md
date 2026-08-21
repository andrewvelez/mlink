# AGENTS.md

## Overview

- Ask clarifying questions before changing code unless the task is unambiguous.
- Keep responses pragmatic and concise.
- Do not make changes without first showing the intended diff and getting approval.
- The current design direction for the project is in `docs/DESIGN.md`. All other docs may be out of date.
- Do not declare ~~editor configuration~~ **any file** valid from visual inspection. Identify the reported diagnostic, validate the relevant properties against the active extension/schema, and report what was actually verified. If the diagnostic is unavailable from the workspace, ask for its exact text without claiming validity.
- Leave unresolved architecture decisions explicitly unresolved; do not fill gaps with guesses.

## Architecture

- Link-Up is a local-first Progressive Web App (PWA) written in vanilla JavaScript.
- Keep the browser UI web-native, using HTML, CSS, the DOM, and standard Web and PWA APIs without a frontend framework.
- The browser is the application runtime. Bun installs dependencies, runs project tasks, and bundles the application; it is not the application runtime.

## Build Commands

- Install dependencies: `bun install`
- Build scripts are: clean, build, test, start

## Coding Style

- Use idiomatic vanilla JavaScript for application source; do not introduce TypeScript, ReScript, or a frontend framework without an explicit design decision.
- Treat `dist/` as generated output; edit the corresponding source under `src/` instead.
- Use standard Web and PWA APIs for browser capabilities and idiomatic Bun APIs for build tooling.
- Prefer more idiomatic and smaller changesets.
- Every new source file that supports comments should contain a valid header comment with the MIT license tag, author name/year, and description.
- Regular code shouldn't be modified solely for tests unless there is a benefit for the regular code as well.
