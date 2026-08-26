# Unified Hypermedia Control

## Technical Description

**Status:** Conceptual technical description  
**Date:** 2026-08-26  
**Scope:** Thought experiment; not a standards proposal

## Summary

Unified Hypermedia Control (UHC) is a model for making HTML's request-producing controls behave consistently.

Under UHC, links, forms, buttons, and form submitters participate in one request-processing model:

```text
control activation
    -> construct request
    -> resolve target
    -> issue request
    -> present response
```

Each control describes, directly or through an associated form:

```text
request = endpoint + method + payload + target
```

The kind of control determines what it contributes to the request. The kind of target determines what happens to the response:

| Target kind | Request disposition | Response disposition |
|---|---|---|
| Browsing context | Browser navigation | Load a document into the selected window, tab, or frame |
| Document element | Same-document request | Replace the selected element with returned HTML |

This is the central UHC rule:

> The target type, rather than the control type, determines whether activation causes navigation or an in-document update.

"AJAX" describes how a JavaScript polyfill could implement an element-targeted request. It is not part of the conceptual browser model. A native implementation would perform element-targeted response processing without requiring JavaScript.

## Motivation

HTML already provides declarative hypermedia controls, but its capabilities are divided unevenly:

- links describe GET navigations;
- forms describe GET and POST submissions;
- submit buttons activate forms and may override some form attributes;
- standalone buttons cannot describe network requests;
- response targets are browsing contexts, not ordinary document elements;
- additional HTTP methods generally require JavaScript or method-override conventions.

Libraries such as htmx demonstrate that authors want to combine arbitrary HTTP methods with targeted HTML replacement. Triptych demonstrates how several such capabilities could be expressed using plausible native HTML attributes. UHC treats these capabilities as consequences of one shared control model rather than as unrelated additions.

UHC does not make links, forms, and buttons semantically identical. It gives them a common execution pipeline while preserving their different sources of request data and their different meanings to users, assistive technology, search engines, and other software.

## Conceptual Request Descriptor

Activation produces an internal request descriptor equivalent to:

```text
RequestDescriptor {
    endpoint
    method
    payload
    encoding
    target
    initiator
}
```

The descriptor is independent of how the response will be presented. Target resolution selects the presentation behavior after the request has been constructed.

## Participating Controls

### Link

A link contributes:

- its `href` as the endpoint;
- `GET` as the default method;
- no form payload;
- its `target`, defaulting to `_self`.

In the generalized model, a link could also specify another permitted HTTP method:

```html
<a href="/session" method="DELETE" target="_self">Sign out</a>
```

Whether links should support unsafe methods is an important open semantic question. A link is ordinarily understood as a safe, independently navigable destination. UHC can unify request processing without necessarily recommending every method on every element.

### Form

A form contributes:

- its `action` as the endpoint;
- its `method`, defaulting to `GET`;
- its `enctype`;
- its successful controls as the payload;
- its `target`, defaulting to `_self`.

The method vocabulary would not be artificially limited to GET and POST. At minimum, the model includes GET, POST, PUT, PATCH, and DELETE. Method-specific restrictions imposed by HTTP and Fetch still apply; for example, GET and HEAD requests do not carry Fetch request bodies, and forbidden methods such as CONNECT, TRACE, and TRACK remain unavailable.

The existing non-network `method="dialog"` behavior is a special form operation and remains outside the UHC network pipeline.

### Form submitter

A submit `<button>` or `<input type="submit">` activates its associated form. It contributes:

- its own `name=value`, when present;
- its identity as the submitter;
- existing form overrides such as `formaction`, `formmethod`, `formenctype`, and `formtarget`.

The associated form continues to supply the remaining successful controls. Keyboard submission and `requestSubmit()` therefore use the same request-construction model as pointer activation.

### Independent button action

A button with its own `action` describes a request independently of a form:

```html
<button action="/session" method="DELETE" target="_self">
  Sign out
</button>
```

It contributes:

- its `action` as the endpoint;
- its `method`, defaulting to `GET`;
- its own `name=value`, when present;
- its `target`, defaulting to `_self`.

An independent button action does not implicitly collect controls from an enclosing form. A button intended to submit form data remains a form submitter and uses the established `form*` override attributes.

## Target Model

### Browsing-context targets

Browsing-context targets include:

- `_self`;
- `_blank`;
- `_parent`;
- `_top`;
- a named frame or other named navigable context.

Resolving such a target invokes browser-managed navigation. This includes behavior that a JavaScript library cannot reproduce completely:

- creation of a new `Document` and JavaScript environment;
- browser loading and failure indicators;
- navigation history;
- redirects;
- reload and method-resubmission behavior;
- download and non-HTML response handling;
- cross-origin navigation without Fetch CORS permission.

No explicit target continues to mean `_self`, preserving the existing default for links and forms and providing the natural default for independent button actions.

### Element targets

An element target refers to an element in the current document. This document uses an ID selector as its illustrative syntax:

```html
<a href="/profiles/42" target="#profile">View profile</a>
```

An element target invokes a same-document request. The current `Document`, JavaScript environment, and browsing history entry remain in place. The returned HTML is parsed and applied to the target.

The initial UHC model assumes outer replacement:

```js
targetElement.replaceWith(...responseNodes)
```

Outer replacement is sufficient to replace, remove, or expand a target without introducing a collection of swap modes. Whether a future design should permit inner replacement or other insertion positions is outside the core model.

This document does not settle whether element targets may be arbitrary CSS selectors or only unambiguous element references such as ID selectors. Arbitrary selectors are expressive but introduce collisions with named browsing contexts, dynamic matching, invalid-selector handling, and questions about multiple matches.

### Target resolution

A working resolution order is:

1. recognize reserved browsing-context keywords;
2. resolve an existing named browsing context;
3. resolve an element target in the current document;
4. report target-resolution failure.

That ordering preserves established browsing-context behavior, but it may make some target values dependent on document state. A standards-quality design may need unambiguous syntax rather than contextual resolution.

## Request and Response Processing

### Activation

Only the control's normal activation behavior initiates a UHC request:

- link activation for a link;
- submission for a form;
- activation for an independent button action.

This deliberately excludes arbitrary event triggers, polling, visibility observers, and application-defined event expressions.

Modified link activation, downloads, user preferences, disabled controls, constraint validation, and form-submission cancellation must retain their established meanings wherever applicable.

### Payload encoding

Forms continue to use established successful-control and encoding rules. GET-like requests encode applicable data into the URL. Methods that permit a body use the selected form encoding.

Links have no payload source. Independent buttons may contribute their own `name=value`, but do not become implicit one-field forms.

The exact treatment of payloads for methods such as DELETE requires specification. HTTP permits method semantics that are broader than common server and intermediary support, so UHC should not invent a method-specific payload meaning.

### Element-targeted response

A minimal response algorithm is:

1. construct the request from the activated control;
2. resolve the element target;
3. issue a request governed by Fetch, CORS, credentials, Content Security Policy, and service-worker rules;
4. follow applicable redirects;
5. verify that the response contains replaceable HTML;
6. parse the response body into nodes in the current document's context;
7. replace the target element with those nodes.

HTTP error status codes can still carry useful hypermedia representations. Status alone should therefore not necessarily suppress replacement. A returned HTML error representation may be more useful than leaving stale content in place. Network failure, cancellation, an invalid target, or an unusable media type leaves the existing target unchanged.

An empty HTML response can represent removal of the target. A `204 No Content` response should normally mean that no replacement occurs. These behaviors must be distinguished explicitly in any later specification.

The following details remain open:

- whether scripts in returned HTML execute;
- how declarative shadow roots and custom elements are handled;
- which URL supplies the base for relative references;
- whether a complete HTML document is accepted or only a fragment;
- how focus, selection, scroll position, and accessibility announcements change;
- how simultaneous requests to the same target are ordered or cancelled;
- which lifecycle events are exposed to JavaScript.

### Server awareness

A server may need to distinguish a request for a complete document from a request for an element replacement. Existing libraries commonly use custom request headers. A native design would need standardized request metadata or a clearly defined representation-negotiation mechanism.

That signal must not make URLs cease to identify resources. It only informs the server of the response disposition requested by the client, allowing the same resource to be represented as a complete document or as an embeddable fragment.

## Examples

### Link that updates an element

```html
<a href="/profiles/42" target="#profile">View profile</a>

<section id="profile">
  Select a profile.
</section>
```

Activation issues `GET /profiles/42` and replaces `#profile` with the returned HTML. It does not create a history entry or replace the current document.

### The same endpoint as navigation

```html
<a href="/profiles/42" target="_self">View profile</a>
```

Activation performs ordinary navigation and loads the response as the current document.

### Form that updates an element

```html
<form action="/profiles/42" method="PATCH" target="#profile">
  <label>
    Display name
    <input name="display-name">
  </label>
  <button type="submit">Save</button>
</form>
```

The form supplies the payload. The element target causes the returned representation to replace `#profile` without navigating.

### The same form as navigation

```html
<form action="/profiles/42" method="PATCH" target="_self">
  <!-- controls -->
  <button type="submit">Save</button>
</form>
```

The request is constructed identically, but `_self` makes the response a new document navigation.

### Independent action button

```html
<button action="/session" method="DELETE" target="_self">
  Sign out
</button>
```

The button supplies an endpoint and method but no form payload. The browsing-context target requests a full navigation response.

```html
<button action="/items/42" method="DELETE" target="#item-42">
  Delete
</button>
```

The same control model uses an element target. An empty HTML response can remove the selected item from the document.

## Relationship to REST and HATEOAS

UHC expands HTML's ability to describe state transitions inside server-provided representations.

A response can declare:

- the resource endpoint;
- the method appropriate to the transition;
- the data required by the transition;
- the control that activates it;
- the destination for the next representation.

The server can return both updated state and the controls available from that state. The client does not need hard-coded route knowledge or imperative request code for each transition. This is directly compatible with HATEOAS.

UHC does not make an application RESTful automatically. Safe and idempotent method semantics, cache behavior, resource design, authorization, and meaningful representations remain application and protocol responsibilities. The response target is presentation metadata; it does not change the resource semantics of the request.

## Polyfill Model and Its Limits

A JavaScript implementation can closely reproduce the element-targeted branch:

```text
delegated activation handler
    -> prevent native behavior
    -> construct Request
    -> fetch()
    -> parse HTML
    -> replace target
```

It cannot fully reproduce navigation with methods that browsers do not natively support as navigations. Fetching a document, replacing the current DOM, and calling the History API does not create a true navigation. It cannot perfectly reproduce reload, resubmission, browser progress UI, a fresh JavaScript realm, navigation timing, or all security metadata.

Consequently, a UHC polyfill would have two levels of fidelity:

- high fidelity for element-targeted requests;
- approximate behavior for browser-targeted PUT, PATCH, DELETE, and other newly enabled methods.

## Existing Implementations

### htmx 4

[htmx 4](https://four.htmx.org/docs) demonstrates the practical request-and-replacement machinery:

- Fetch-based requests;
- common HTTP methods;
- requests initiated by many element types;
- element targeting;
- HTML response swapping;
- lifecycle and error handling.

It does not implement UHC semantics directly. Its `hx-*` request attributes opt an element into htmx behavior, and `hx-target` selects an element after that choice has already been made. The target type itself does not uniformly choose between native navigation and replacement.

### Triptych

[Triptych](https://triptychproject.org/proposals/) is the closest standards-oriented prior work. Its form-method, independent-button, and [partial-page-replacement](https://triptychproject.org/proposals/partial-page-replacement) proposals use existing or plausible HTML attributes and approximate browser behavior with a proof-of-concept implementation.

UHC differs primarily in framing: it describes one shared request-and-response model from which those capabilities follow.

### Current implementation decision

No dedicated UHC polyfill is presently justified. Htmx 4 demonstrates the mature element-targeted mechanics, while Triptych demonstrates much of the proposed-native authoring model. A small UHC-specific prototype should be considered only if a later technical proposal defines behavior that these implementations cannot adequately demonstrate.

## Backward-Compatibility Risks

The most natural-looking syntax is not automatically safe in existing browsers:

- an unsupported form method may fall back to GET;
- an element-shaped `target` may be interpreted as the name of a browsing context;
- `action` and `method` on a standalone button are currently ignored;
- a button inside a form may retain its existing submit behavior when the enhancement is unavailable;
- failure to load a polyfill can therefore change behavior rather than merely remove enhancement.

Servers must never perform unsafe operations in response to GET, which limits the damage of some fallbacks but does not make the user experience correct. A future proposal would need a careful compatibility strategy, feature detection, and possibly an explicit opt-in or unambiguous target syntax.

## Security and Accessibility Considerations

- Unsafe methods must require deliberate user activation and must never participate in speculative fetching or crawler traversal.
- Cross-origin element replacement must remain subject to CORS and existing Fetch protections.
- Authentication credentials, CSRF protections, Content Security Policy, Trusted Types, and service-worker interception must retain well-defined behavior.
- Returned HTML must not create an implicit script-execution bypass.
- Links with non-GET methods complicate established operations such as copying a link, opening it in a new tab, saving it, dragging it, or exposing it to automated agents.
- Controls must preserve their native keyboard, focus, disabled, validation, and accessibility semantics.
- Element replacement needs predictable focus management and an accessible indication that content has changed.

These are design requirements, not peripheral implementation details.

## Non-goals

The core UHC model does not include:

- arbitrary event triggers;
- polling, Server-Sent Events, or WebSockets;
- client-side routing;
- automatic history entries for element replacement;
- multiple-target or out-of-band updates;
- DOM morphing;
- animation orchestration;
- a configurable collection of swap strategies;
- JSON-to-DOM binding;
- client-side state management;
- a requirement to build a single-page application;
- a requirement to use a service worker or PWA architecture.

Those capabilities can be layered above the primitive where needed.

## Open Questions

1. Should every control support every permitted method, or should links remain restricted to safe navigation methods?
2. Should element targets accept arbitrary CSS selectors, ID references only, or a new unambiguous reference syntax?
3. How should conflicts between named browsing contexts and element targets be resolved?
4. Is outer replacement the sole primitive, or is another single default more appropriate?
5. What response media types are eligible for replacement?
6. How should complete HTML documents, fragments, scripts, relative URLs, and declarative shadow roots be processed?
7. What request metadata tells a server that the response is intended for element replacement?
8. How should redirects behave for each method and target type?
9. How should reload and history represent browser-targeted requests using additional methods?
10. What are the precise payload rules for independent buttons and methods such as DELETE?
11. What cancellation, concurrency, and lifecycle event model is necessary?
12. What focus, scroll, and accessibility behavior should follow replacement?
13. How can enhanced markup fail safely in browsers that do not implement UHC and when a polyfill does not load?

## Concise Definition

> Unified Hypermedia Control is a model in which HTML controls declaratively construct method-appropriate HTTP requests, while the resolved target determines whether the returned representation is loaded through browser navigation or applied to an element in the current document.
