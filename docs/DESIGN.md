# MLink Project Design

## Architecture

Keep it simple.  Don't repeat yourself.

MLink is a local-first, mobile-first Progressive Web App (PWA). Its user
interface is framework-free vanilla JavaScript, HTML, CSS, and standard browser
and PWA APIs. The browser is the PWA runtime; Bun installs dependencies, runs
project tasks, stages browser assets, and compiles the application host.

### Application and Deployment Runtime

MLink is a mobile-first Progressive Web App (PWA) written in vanilla JavaScript
using the hard local-first model described below. It runs in supported browsers
and as an installed PWA. Authoritative user data and essential application logic
remain on the user's device. Peer-to-peer networking is a means of exchanging
data, but data sovereignty — not eliminating every server — is the architectural
goal.

The production deployment artifact is `dist/mlink`, a full-stack executable for
VPS deployment. It embeds the completed PWA assets and serves them through its
local HTTP routes. Its current host listens on `127.0.0.1:3000`; any public
VPS-facing proxy or TLS arrangement is outside this project's current design.

All shipped application source lives under `src/`, organized by responsibility:
`web/` contains the browser application, including third-party assets under
`web/external/`, and `server/` contains the executable host. The build copies
`web/` into `dist/`, preserving its directory layout for browser asset URLs.
`dist/` is generated build output and is never edited directly.

#### Local-First

My two definitions of "local-first". First, the *soft* definition: local-first software keeps data on the local client machine and uses servers as redundant backups or replication to other clients. Then there is the *hard* definition: local-first software keeps all users' data with the users. The user defines where and when that data can be shared. This app will attempt to use the second definition.

#### Network Infrastructure and P2P

MLink's authoritative user data and essential logic remain on the user's
device. Peer connections may require signalling, and some connection designs
may require relays. MLink therefore accepts remote signalling and relay
infrastructure. Discovery, synchronization, and notification delivery may also
rely on remote services as those designs are resolved. These systems must not
become the authoritative home of the application or its data.

The peer transport has not yet been selected. If direct peer connections are
used, their privacy implications and whether relay-only connections are required
must be resolved before peer networking ships.

### PWA Application Boundary

MLink runs within the browser security model. Its UI, essential application
logic, and authoritative user data remain local. Browser and installed-PWA
capabilities use standard Web APIs and must account for platform support.

The completed PWA is intended to provide its local interface without depending
on a remote application service. The persistence mechanism, browser storage
APIs, schema, data lifecycle, and user-controlled export path have not yet been
decided.

### Service-Worker Cache Design

On a first load, MLink may render a minimal network-backed shell with a loading
indicator while it prepares the complete application cache. Once that cache is
complete, application resources are served CacheOnly.

Each release owns one named Cache containing all release resources and a
reserved `{ createdAt, expiresAt }` metadata entry. `expiresAt` is one year
after the cache is populated. A replacement cache must be complete before the
previous release cache is removed.

`getAppVersion()` in `build.js` is the single authoritative application version.
It returns `baseVersion.YYYYMMDD`, using the UTC date from `package.json`'s
`baseVersion`. The build and cache identity must use that exact value, and the
`app.js` and service-worker registration URLs must use
`?v=${getAppVersion()}`.

#### Current Regression

The current `src/web/sw.js` does not meet this design: it is network-first for
handled shell and navigation requests, has no one-year expiry metadata, and
does not version `app.js` or the service-worker registration URL with
`getAppVersion()`. Restoring the required behavior is tracked as a high-priority
Todo card in `.devtool/features/restore-one-year-cache-only-service-worker-2026-09-11.md`.

### Current Proof-of-Concept Boundary

The proof of concept contains minimal home and about pages, a web app manifest,
browser service-worker registration, a service worker, and a build pipeline
that emits the VPS-deployable executable. Product workflows, local persistence,
peer discovery, signalling, relaying, peer transport, cryptographic identity,
encryption, notifications, and offline delivery are not implemented.

### PWA User Interface

The web platform is MLink's user-interface runtime. Vanilla JavaScript provides
application behavior, HTML and CSS provide presentation, and supported browser
APIs provide local storage, networking, installation, and notification
capabilities as those parts of the design are implemented.

```text
MLink PWA
├── vanilla JavaScript application behavior
├── HTML and CSS user interface
└── browser APIs → local persistence and networking
```

## Build and Delivery

`bun run build` performs these stages in order:

1. Delete `dist/` if it exists.
2. Copy the PWA pages, manifest, and static assets from `src/web/` into `dist/`.
3. Inject the Workbox asset manifest into `dist/sw.js`.
4. Replace the service-worker cache-version placeholder with `getAppVersion()`.
5. Compile `src/server/server.js` and its route-embedded assets into `dist/mlink`.

`bun run start` performs the same build and starts `src/server/server.js` for
local development. Neither `build` nor `start` runs tests.

**Before production deployment, run `bun run test`.** This command performs the
same build, then runs the Bun test suite and returns its exit code. A build
failure stops the command before tests run. Deploy the resulting `dist/mlink`
only when the command succeeds (exit code 0); do not deploy after a build or
test failure. No separate build is needed after a successful test run.

Bare `bun test` runs the test suite without the build step provided by
`bun run test`. None of these commands deploys the executable; deployment is a
separate step.

## Project Structure

```text
.
├── build.js
├── bun.lock
├── jsconfig.json
├── package.json
├── docs/
│   └── DESIGN.md
├── src/
│   ├── web/
│   │   ├── about.html
│   │   ├── home.html
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   ├── icons/
│   │   ├── js/
│   │   │   └── app.js
│   │   ├── external/
│   │   │   ├── htmx.min.js
│   │   │   └── pico.cyan.min.css
│   │   └── styles/
│   │       └── global.css
│   └── server/
│       ├── routes.js
│       └── server.js
├── test/
│   ├── app.test.js
│   ├── build.test.js
│   └── sw.test.js
└── dist/                         generated
    └── mlink                     VPS deployment executable
```

## Local Authority

MLink is hard local-first. Its essential business logic executes locally, and
its authoritative user data remains under the user's control. Remote systems
can provide discovery, signalling, relaying, synchronization, notification
delivery, or other network capabilities, but they remain non-authoritative
infrastructure. Peer-to-peer describes one way MLink devices exchange data;
it does not define the local-first guarantee.

The local application boundary is distinct from the external peer boundary:

```text
MLink PWA ↔ standard Web APIs ↔ on-device storage

MLink peer ↔ untrusted network and signalling/relay infrastructure ↔ MLink peer
```

The persistence implementation and selected browser storage APIs remain open
decisions.

## Product Features

### Profiles

Users can create and update an MLink profile. A user's own profile is stored
locally on the device by the MLink PWA. The persistence mechanism has not yet
been decided.

Users can share their profiles with other MLink users and view profiles that
other users share with them. The information included in a profile has not yet
been decided.

### Messaging

Users can send and receive private messages with other MLink users. Message
history is stored locally on the user's device.

The installed PWA can integrate with platform notifications where supported.
How messages or notifications reach a user while MLink is not active, how
users connect, and how messages are encrypted have not yet been decided.
