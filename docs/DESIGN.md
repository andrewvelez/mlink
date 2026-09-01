# Link-Up Project Design

## Architecture

Keep it simple.  Don't repeat yourself.

For the Link-Up application, HTML, CSS, JavaScript, and standard browser APIs are
"good enough". "Good enough" still means correct. Link-Up uses a small, framework-free PWA written in vanilla JavaScript and
bundled with Bun.

### Application Runtime

Link-Up is a mobile-first Progressive Web App (PWA) written in vanilla JavaScript
using the hard local-first model described below. It runs in supported browsers
and as an installed PWA. Authoritative user data and essential application logic
remain on the user's device. Peer-to-peer networking is a means of exchanging
data, but data sovereignty — not eliminating every server — is the architectural
goal.

Application code and shell documents live under `src/`, while directly copied
browser assets live under `static/`. The browser UI uses HTML, CSS, the DOM, and
standard Web and PWA APIs without a frontend framework. The browser is the
application runtime. Bun installs dependencies, runs project tasks, and bundles
the application; it is not the application runtime.

A minimal PWA shell, web app manifest, registered service worker, and production
asset pipeline are configured. The complete browser build is emitted under
`dist/`. Production deployment and any future full-stack executable packaging
remain unresolved.

#### Local-First

I like to think there are two definitions of "local-first". First, the *soft*
definition: local-first software keeps data on the local client machine and uses
servers as redundant backups or replication to other clients. Then there is the
*hard* definition: local-first software keeps all users' data with the users.
The user defines where and when that data can be shared. This app will attempt to use the
second definition.

#### Network Infrastructure & P2P

Link-Up's authoritative user data and essential logic remain on the user's
device. Peer connections may require signalling, and some connection designs
may require relays. Link-Up therefore accepts remote signalling and relay
infrastructure. Discovery, synchronization, and notification delivery may also
rely on remote services as those designs are resolved. These systems must not
become the authoritative home of the application or its data.

The peer transport has not yet been selected. If direct peer connections are
used, their privacy implications and whether relay-only connections are required
must be resolved before peer networking ships.

### PWA Application Boundary

Link-Up runs within the browser security model. Its UI, essential application
logic, and authoritative user data remain local. Browser and installed-PWA
capabilities use standard Web APIs and must account for platform support.

The completed PWA is intended to provide its local interface without depending
on a remote application service. The persistence mechanism, browser storage
APIs, schema, data lifecycle, and user-controlled export path have not yet been
decided.

Link-Up first renders a minimal network-backed shell with a loading indicator
while the complete application is cached. Afterward, the app is served
`CacheOnly`, while the shell remains revalidated for updates. Each release uses
one named `Cache` containing all resource entries and a reserved
`{ createdAt, expiresAt }` entry; the entire cache expires one year after it is
populated. `app.js` and the `sw.js` registration URL use `?v=YYYY-MM-DD`,
assuming one production release per day. A replacement cache is completed
before the old cache is removed.

### Current Proof-of-Concept Boundary

The current proof of concept contains a minimal HTML application shell, web app
manifest, browser registration entry point, application-shell service worker,
and Bun build pipeline.

Service-worker registration, scope control, application-shell caching, and
offline reload have been validated in Chromium. Browser installability has not
yet been validated.

Link-Up's product workflows, local persistence, peer discovery, signalling,
relaying, peer transport, cryptographic identity, encryption, notifications,
and offline delivery are also not implemented or validated.

### PWA User Interface

The web platform is Link-Up's user-interface runtime. Vanilla JavaScript provides
application behavior, HTML and CSS provide presentation, and supported browser
APIs provide local storage, networking, installation, and notification
capabilities as those parts of the design are implemented.

```text
Link-Up PWA
├── vanilla JavaScript application behavior
├── HTML and CSS user interface
└── browser APIs → local persistence and networking
```

## Project Structure

```text
.
├── build.js
├── bun.lock
├── jsconfig.json
├── package.json
├── src/
│   ├── app.js
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
└── static/
    ├── icons/
    └── styles/
        └── global.css
```

`build.js` uses Bun to bundle `src/app.js` and `src/sw.js`, copy the shell
documents, and copy `static/` to `dist/static/`. The complete current browser
application is generated under `dist/`; that directory is build output and is
not edited directly.

## Local Authority

Link-Up is hard local-first. Its essential business logic executes locally, and
its authoritative user data remains under the user's control. Remote systems
can provide discovery, signalling, relaying, synchronization, notification
delivery, or other network capabilities, but they remain non-authoritative
infrastructure. Peer-to-peer describes one way Link-Up devices exchange data;
it does not define the local-first guarantee.

The local application boundary is distinct from the external peer boundary:

```text
Link-Up PWA ↔ standard Web APIs ↔ on-device storage

Link-Up peer ↔ untrusted network and signalling/relay infrastructure ↔ Link-Up peer
```

The persistence implementation and selected browser storage APIs remain open
decisions.

## Product Features

### Profiles

Users can create and update a Link-Up profile. A user's own profile is stored
locally on the device by the Link-Up PWA. The persistence mechanism has not yet
been decided.

Users can share their profiles with other Link-Up users and view profiles that
other users share with them. The information included in a profile has not yet
been decided.

### Messaging

Users can send and receive private messages with other Link-Up users. Message
history is stored locally on the user's device.

The installed PWA can integrate with platform notifications where supported.
How messages or notifications reach a user while Link-Up is not active, how
users connect, and how messages are encrypted have not yet been decided.
