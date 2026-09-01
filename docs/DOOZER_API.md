# Doozer: A Plain JavaScript API for Service Workers

Status: second API design; no implementation  
Language: JavaScript first  
Companion: [Service Workers: Functionality Through Developer Use Cases](./SERVICE_WORKER_DEVELOPER_USE_CASES.md)

## The promise

Doozer makes a service worker read like a short set of rules.

A developer should be able to read a rule aloud:

> Get pages from the web, or use the saved copy, or show the offline page. Save good web replies.

The API should use common words, show the order of work, and keep browser terms only when they help developers use browser documentation.

Doozer is not an API for every feature near a service worker. It is one small way to say:

1. what the app must keep;
2. how requests should be answered;
3. what to do when a send fails;
4. how the page and worker talk;
5. when a new worker is ready to use.

## One model

Each request asks for an answer.

Doozer tries possible answers in the order written:

- **web** asks the server;
- **saved(name)** looks in a named saved set;
- a URL such as **"/offline.html"** uses a file from **keep**;
- a function makes an answer in JavaScript;
- **first(a, b)** asks two places together and uses the first good answer.

This one model replaces named cache strategies.

| Common name | Doozer rule |
| --- | --- |
| Network only | from the web |
| Cache only | from the saved copy |
| Network first | from the web, or the saved copy |
| Cache first | from the saved copy, or the web |
| Stale while revalidate | from the saved copy, or the web; save and refresh |
| Race | from the first of the saved copy and the web |
| Offline fallback | or use a kept file |

The developer reasons about the actual order instead of learning the name of an algorithm.

## The words Doozer uses

| Word | Meaning |
| --- | --- |
| **keep** | download these files when this worker is installed and keep them for this app version |
| **get** | match a request that reads something |
| **send** | match a request that changes something |
| **web** | use normal browser fetching |
| **saved(name)** | use a named Cache Storage set |
| **from** | try this answer first |
| **or** | try this answer if the earlier one has no good answer |
| **save** | save a good web reply |
| **refresh** | return the saved reply now, then get and save a new one |
| **first** | ask several places together and use the first good reply |
| **if** | accept an answer only when a small test passes |
| **later** | keep a failed send and try it again later |
| **start** | register the worker from a page |
| **use** | let a waiting worker take over |
| **ask** | send a message and wait for a reply |
| **tell** | send a message without waiting for a reply |
| **on** | run code when something happens |
| **native** | use the browser object underneath Doozer |

The core API should not add synonyms for these words.

## A complete worker

~~~js
import doozer, {
  get,
  web,
  saved,
} from "doozer";

export default doozer({
  version: "42",

  keep: [
    "/offline.html",
    "/app.css",
    "/app.js",
  ],

  rules: [
    get.pages()
      .from(web.for("3 seconds"))
      .or(saved("pages"))
      .or("/offline.html")
      .save(),

    get("/assets/**")
      .from(saved("assets"))
      .or(web)
      .save()
      .refresh(),

    get.images()
      .from(saved("images"))
      .or(web)
      .save({
        for: "30 days",
        upTo: 300,
      }),
  ],

  messages: {
    "profile:keep": async ({ data, saved }) => {
      await saved("profiles").keep(data.url);
      return { kept: true };
    },
  },
});
~~~

There are no route classes, strategy classes, cache plugins, lifecycle objects, feature objects, or hook objects.

## Starting Doozer from a page

~~~js
import { start } from "doozer/page";

const worker = await start("/service-worker.js");

worker.on("ready", () => {
  showOfflineReady();
});

worker.on("update", (next) => {
  showUpdateButton(() => next.use());
});
~~~

Calling **next.use()** lets the waiting worker take over and reloads the current page after control changes. This is the safe default. **next.use({ reload: false })** is available when the page and worker are known to work across versions.

## Worker API

### doozer(options)

~~~js
doozer({
  version,
  keep,
  rules,
  messages,
  events,
});
~~~

Only **version** is required when **keep** is not empty.

| Field | Default | Meaning |
| --- | --- | --- |
| **version** | none | the app release that owns the kept files |
| **keep** | empty list | files required by this worker version |
| **rules** | empty list | ordered request rules |
| **messages** | empty object | page messages the worker can answer |
| **events** | empty object | other service worker events to handle |

The app name is not required. Doozer builds its private storage name from the worker scope, so two workers on the same origin do not clear each other's data.

### keep

~~~js
keep: [
  "/",
  "/offline.html",
  "/app.css",
  "/app.js",
]
~~~

Doozer downloads the full list during install. If any file fails, the new worker does not take over. The old worker keeps working.

Kept files are served from a versioned saved set. When a new worker takes over, Doozer removes only old kept sets for the same worker scope.

**keep** is for a small, known release set. Files learned at run time belong in a named **saved** set.

No optional keep entry exists. If a file is optional, it should not be able to break install.

## Get rules

A get rule matches GET and HEAD requests. Rules are tried from top to bottom. The first matching rule owns the request.

### Match pages

~~~js
get.pages()
~~~

This matches document navigation.

### Match images

~~~js
get.images()
~~~

This matches requests whose browser destination is image.

The same small set may include **get.scripts()**, **get.styles()**, **get.fonts()**, **get.audio()**, **get.video()**, and **get.workers()**.

### Match a URL

~~~js
get("/profiles/:id")
get("/assets/**")
get("https://cdn.example.com/images/**")
~~~

Doozer patterns use three forms:

- **:name** keeps one path part as a named value;
- **\*** matches within one path part;
- **\*\*** matches across path parts.

A relative pattern uses the worker origin.

### Match with JavaScript

~~~js
get.when(({ request, url }) => {
  return url.pathname.endsWith(".map");
})
~~~

This is the escape hatch for a match Doozer cannot name. A JavaScript match cannot use the browser's static routing fast path.

## Answer sources

### web

~~~js
get("/api/live/**")
  .from(web)
~~~

The request uses ordinary Fetch behavior.

A time limit belongs to the web source:

~~~js
get.pages()
  .from(web.for("3 seconds"))
  .or(saved("pages"))
~~~

After three seconds, Doozer may use the next answer. When the rule also says **save**, the web work may still finish and save the newer reply.

A web reply counts as an answer even when its HTTP status is an error. A rule can narrow this:

~~~js
get("/api/**")
  .from(web.if((reply) => reply.ok))
  .or(saved("api"))
~~~

### saved(name)

~~~js
get.images()
  .from(saved("images"))
  .or(web)
  .save()
~~~

A miss has no answer, so Doozer tries **or**.

The saved set name is local to this worker scope. Doozer creates the full physical cache name.

When a rule has one named saved source, **save()** uses that name. When no saved source names the target, pass it:

~~~js
get("/news/**")
  .from(web)
  .save("news")
~~~

### A kept file

~~~js
get.pages()
  .from(web)
  .or(saved("pages"))
  .or("/offline.html")
  .save()
~~~

A URL used as an answer must also appear in **keep**. Doozer checks this when the worker loads, rather than letting the first offline request fail.

### A JavaScript answer

~~~js
get("/local/profiles/:id")
  .from(async ({ params, request }) => {
    const profile = await readProfile(params.id);

    return profile
      ? Response.json(profile)
      : Response.json({ error: "not-found" }, { status: 404 });
  })
~~~

The function returns a native Response. Returning nothing means “no answer”; Doozer moves to **or**.

The handler also receives the raw FetchEvent as **event** when it needs the browser API.

### first

~~~js
import { first } from "doozer";

get("/fast/**")
  .from(first(saved("fast"), web))
  .save()
~~~

Doozer asks both sources and uses the first good answer. The web reply may still update the saved set.

## Saving replies

~~~js
.save({
  for: "30 days",
  upTo: 300,
})
~~~

| Option | Meaning |
| --- | --- |
| **for** | how long an item may be used |
| **upTo** | most items kept in this set |
| **if** | extra test before saving a reply |
| **key** | make a different request key |
| **private** | allow a reply tied to a signed-in user |
| **opaque** | allow a cross-origin reply Doozer cannot inspect |
| **withVersion** | clear this saved set when the worker version changes |

The last four options are advanced and should rarely appear.

By default, Doozer saves only:

- GET replies;
- status 200;
- readable same-origin or CORS replies;
- requests without an Authorization header;
- replies not marked no-store or private.

A failed save never turns a usable web reply into a failed request. Doozer reports the save error and returns the reply.

### refresh

~~~js
get("/assets/**")
  .from(saved("assets"))
  .or(web)
  .save()
  .refresh()
~~~

Without **refresh**, a saved answer ends the rule.

With **refresh**, Doozer returns the saved answer now, asks the web for a new one, and saves a good new reply. The page can listen for **"saved"** if it wants to update the view:

~~~js
worker.on("saved", ({ set, url }) => {
  if (set === "assets") {
    updateView(url);
  }
});
~~~

**refresh** is valid only when the rule has both a saved source and a web source. The editor should not offer it otherwise.

## Send rules

A send rule matches POST, PUT, PATCH, and DELETE requests.

~~~js
import { send, web } from "doozer";

send("/api/**")
  .to(web)
~~~

Use a standard HTTP method when the rule should be narrower:

~~~js
send.post("/messages").to(web)
send.put("/profiles/:id").to(web)
send.patch("/profiles/:id").to(web)
send.delete("/profiles/:id").to(web)
~~~

**send.when(test)** is the JavaScript escape hatch for other matches.

The word is **to**, not **from**, because the request sends data somewhere.

Doozer does not save sends in Cache Storage.

### Try again later

Retry support is a separate small add-on:

~~~js
import { later } from "doozer/later";

send("/api/messages/**")
  .to(web)
  .or(later("outbox", {
    keep: "7 days",
    key: "Idempotency-Key",
  }))
~~~

Read aloud:

> Send to the web, or keep it in the outbox for later.

**later** is used only when fetching throws by default. It does not keep 4xx or 5xx replies unless asked.

Doozer uses Background Sync when available. Otherwise, it tries again when the worker next starts and when an open page reports a useful online change. The result still says **kept**, not **sent**, until the server accepts it.

A send may happen more than once. The server must honor the idempotency key if exactly one effect matters.

## Messages

Worker:

~~~js
messages: {
  "profile:get": async ({ data }) => {
    return readProfile(data.id);
  },

  "feed:refresh": async () => {
    await refreshFeed();
  },
}
~~~

Page:

~~~js
const profile = await worker.ask("profile:get", { id: 42 });

worker.tell("feed:refresh");
~~~

**ask** waits for the returned value. **tell** does not.

Doozer supplies the message ID, reply channel, time limit, error envelope, worker version, and structured-clone handling.

Unknown message names fail clearly. They are not ignored.

A worker handler can tell every open Doozer page:

~~~js
messages: {
  "feed:refresh": async ({ all }) => {
    const changed = await refreshFeed();
    all.tell("feed:changed", changed);
  },
}
~~~

Page:

~~~js
worker.on("feed:changed", ({ data }) => {
  showFeed(data);
});
~~~

## Other service worker events

Doozer does not invent a different object model for push, sync, notifications, downloads, cookies, or payments.

It makes native worker events less repetitive:

~~~js
events: {
  push: async ({ event, data, show }) => {
    await show(data.title, data.options);
  },

  notificationclick: async ({ event, notification, windows }) => {
    notification.close();
    await windows.openOrFocus(notification.data.url);
  },

  sync: async ({ event, tag }) => {
    if (tag === "feed") {
      await refreshFeed();
    }
  },
}
~~~

The event names stay the same as the browser event names, so web documentation remains useful.

Doozer attaches the returned promise to the event lifetime. It adds small helpers only when they remove a common error, such as **show** and **openOrFocus**. The raw event is always present.

The **fetch**, **install**, **activate**, and **message** names are reserved because Doozer already owns them. Advanced code can use the native escape hatch described below.

This event map can also handle limited browser features. Doozer does not claim that an event exists. The page checks support with:

~~~js
if (worker.has("sync")) {
  // The current browser exposes Background Sync.
}
~~~

Permission prompts and subscriptions stay on the page, close to the user action that caused them.

## Page API

~~~js
const worker = await start("/service-worker.js", {
  scope: "/",
});
~~~

Doozer registers a module worker and uses an update-friendly worker cache setting. Other native registration options may be passed through **native**.

### State and events

~~~js
worker.on("ready", handler)
worker.on("update", handler)
worker.on("change", handler)
worker.on("saved", handler)
worker.on("error", handler)
~~~

| Event | Meaning |
| --- | --- |
| **ready** | the first worker installed all kept files |
| **update** | a new worker is installed and waiting |
| **change** | this page changed to a different worker |
| **saved** | a refresh changed a saved reply |
| **error** | registration, install, request, save, or message work failed |

Doozer does not expose separate public events for every browser lifecycle state. Advanced code can observe **worker.native.registration**.

When **ready** or **update** already describes the current state, adding a listener schedules it once. A fast install cannot race past page setup.

### Methods

~~~js
worker.ask(name, data)
worker.tell(name, data)
worker.on(name, handler)
worker.off(name, handler)
worker.check()
worker.has(name)
worker.info()
worker.saved(name)
worker.stop()
worker.native
~~~

- **check()** asks the browser to check the stable worker URL for a new version.
- **has(name)** checks a browser feature without a user-agent string.
- **info()** returns the worker version, state, scope, saved sets, later queues, and recent safe errors.
- **saved(name)** gives page-driven control of one saved set.
- **stop()** unregisters Doozer. It does not clear saved data unless asked.
- **native** exposes the ServiceWorkerRegistration and current ServiceWorker.

### Page-driven offline content

~~~js
const profiles = worker.saved("profiles");

await profiles.keep([
  "/profiles/42",
  "/profiles/77",
]);

await profiles.drop("/profiles/42");
await profiles.list();
await profiles.clear();
~~~

These calls use the same save rules as worker requests. They make “Keep offline” a direct product action.

**clear()** affects only the named Doozer set for this worker scope.

## Updates

Doozer uses the browser's safe update model.

1. A new worker installs its full **keep** list.
2. It waits while the old worker controls open pages.
3. The page receives **update**.
4. The app may show its own update UI.
5. Calling **next.use()** tells the new worker to take over.
6. Doozer reloads the page after the control change.

~~~js
worker.on("update", (next) => {
  showUpdateButton(async () => {
    await saveOpenWork();
    await next.use();
  });
});
~~~

If the app does nothing, the browser uses the new worker after old pages close. Doozer has no lifecycle policy language because the browser already has a good default.

The worker URL stays the same across releases.

## What Doozer does without new API words

Doozer should quietly do these things correctly:

- call respondWith at the right time;
- attach extra work with waitUntil;
- clone streamed replies before saving;
- use navigation preload when a rule starts with the web;
- use static browser routing when a rule can be expressed safely;
- leave unmatched requests to normal browser fetching;
- keep route order the same after optimization;
- namespace all owned storage by worker scope;
- install kept files as one required set;
- remove only old kept sets it owns;
- keep run-time saved sets across versions by default;
- honor storage limits and remove expired items;
- preserve the native error as the cause;
- never trust navigator.onLine as proof that a request will work;
- never claim a later send was delivered before the server accepts it.

These are implementation duties, not concepts every developer should have to configure.

## The native escape hatch

Simple APIs fail when they try to name every advanced case. A worker file remains ordinary JavaScript, so advanced setup can live beside Doozer:

~~~js
self.addEventListener("some-new-event", nativeHandler);

export default doozer({
  // ordinary Doozer options
});
~~~

Application code must not register a second fetch, install, activate, or message owner because Doozer already owns those events. A custom fetch answer belongs in **get.when(...).from(handler)**.

On the page, the native browser objects are available through:

~~~js
worker.native.registration
worker.native.controller
~~~

A developer should never need to fork Doozer to reach the platform.

## Errors

Doozer has one public error type:

~~~js
DoozerError {
  code,
  work,
  cause,
  details,
}
~~~

The short **code** is stable. **cause** keeps the native error. **details** never includes request bodies, authorization data, cookie values, push endpoints, or signed URLs.

The error message uses the same API words:

- Could not keep "/app.js".
- The "images" saved set is full.
- No answer was found for this request.
- The new worker could not be used.
- No reply came back for "profile:get".

Doozer does not create a class tree developers must learn.

## Testing

The worker definition returned by **doozer()** is plain data plus handler functions. The test package uses that same definition:

~~~js
import { test } from "doozer/test";
import worker from "./service-worker.js";

const app = test(worker);

await app.install();
await app.get("/photos/1.jpg", {
  web: Response.error(),
});

app.saved("images").has("/photos/1.jpg");
app.events;
~~~

The first test release needs only:

- install success and failure;
- ordered get rules;
- web and saved answers;
- save and refresh work;
- messages;
- worker updates.

Real browser tests still cover scope, control, more than one tab, permissions, quota, and WebView differences.

## Package surface

| Import | Purpose |
| --- | --- |
| **doozer** | worker, get rules, sources, saving |
| **doozer/page** | start, updates, page messages |
| **doozer/later** | optional failed-send queue |
| **doozer/test** | deterministic unit tests |

There is no feature package for each browser event. Native event names go in **events**.

There is no required build tool. A Vite, Vite+, Bun, or other adapter may write the **keep** list, but the output is the same API.

## First release

The first release should contain only:

1. **doozer()**
2. **keep**
3. **get**
4. **web**
5. **saved**
6. **from**
7. **or**
8. **save**
9. **refresh**
10. **first**
11. **if**
12. **messages**
13. **start**
14. **on**
15. **use**
16. **ask**
17. **tell**
18. **events**
19. **native**

The first release should not contain **send** or **later** yet. Their proposed grammar remains in this document so the core does not grow in a direction that conflicts with them.

Push, notifications, sync, periodic sync, background fetch, content index, cookie changes, and payment handling use **events** plus the native page API until repeated use proves that one more plain word would make them meaningfully easier.

## Why this is smaller

The earlier Doozer design had separate concepts for routes, strategies, caches, lifecycle policy, queues, stores, feature modules, capabilities, hooks, diagnostics, plugins, testing, and many error classes.

This design has three ideas:

1. **Keep these files.**
2. **Try these answers in this order.**
3. **Run this code when this happens.**

The rest is ordinary JavaScript or the native browser API.

That is the line Doozer should hold.
