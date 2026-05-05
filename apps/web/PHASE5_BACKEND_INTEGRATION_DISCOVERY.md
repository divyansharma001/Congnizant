# Phase 5 Backend Integration Discovery

Last updated: 2026-05-05

> **Pending: auth contract refresh**
> Backend devs are adding auth endpoints. Several FE→BE shapes (consent, profile, orders, addresses, events identity) will shift from explicit `customer_id` payloads to session/JWT-derived identity once auth lands. This document and the API client adapter must be re-reviewed at that point. Do not lock final integration shapes for those resources until the auth contract is published. Tag affected sections with `(pending-auth)`.

## Purpose

Before wiring the frontend to real backend APIs, this document captures:

1. frontend endpoint expectations (current app behavior),
2. backend endpoint reality (current `server` implementation),
3. required frontend changes for compatibility,
4. backend gaps required for full parity, and
5. phased integration order.

This is a pre-integration planning artifact. No blind API swapping.

## Sources reviewed

- `plan.md` (system architecture and backend rollout phases)
- `schema.md` (DynamoDB/Redis/OpenSearch contracts)
- `apps/web/event-types-description.md` (canonical FE event + recommendation context spec)
- `apps/web/src/shared/api/client.ts` (all frontend API usage)
- `apps/web/API_REQUIREMENTS.md` (target contract)
- `apps/web/API_HANDOVER_STATUS.md` (handover status baseline)
- `server/src/main.py`
- `server/src/routes/consent.py`
- `server/src/routes/recommend.py`
- `server/src/routes/jobs.py`
- `server/src/routes/traces.py`
- `server/src/routes/customer.py`

## Architecture context (from plan)

- Frontend (`apps/web`) talks to REST APIs.
- Server (`FastAPI`) handles REST, consent gate, queue handoff.
- Worker processes jobs asynchronously and produces recommendation results.
- Redis is used for queue and recommendation cache.
- DynamoDB stores events, consent, jobs.

Integration implication: frontend must support async-oriented flows (event -> job -> status) and non-uniform endpoint maturity while backend phases progress.

## Frontend expectation inventory (current)

From `apps/web/src/shared/api/client.ts`, frontend currently expects:

- catalog/listing/search:
  - `GET /catalog/categories`
  - `GET /catalog/facets`
  - `GET /catalog/products`
  - `GET /catalog/popular`
  - `GET /catalog/products/{slug}`
  - `GET /search`
- reviews:
  - `GET /catalog/products/{slug}/reviews`
  - `POST /catalog/products/{slug}/reviews`
  - `PUT /catalog/products/{slug}/reviews/{reviewId}/helpful`
- recommendations surfaces:
  - `GET /recommendations/home`
  - `GET /recommendations/{surface}`
- consent/profile/debug:
  - `GET /consent`
  - `PUT /consent`
  - `GET /me/profile`
  - `PATCH /me/preferences`
  - `GET /me/explanations`
  - `GET /debug/events`
- commerce:
  - `POST /checkout`
  - `GET /me/orders`
  - `PATCH /me/orders/{id}/delivery-address`
  - `GET /me/addresses`
  - `PATCH /me/addresses/{id}`
- tracking:
  - `POST /events`

## Backend reality inventory (current server code)

Implemented now:

- `GET /health`
- `POST /events`
- `GET /recommend`
- `POST /consent`
- `GET /consent/{customer_id}`
- `GET /jobs/{job_id}`
- `GET /traces/{job_id}`
- `DELETE /customer/{customer_id}`

Not implemented yet (from frontend perspective):

- all catalog/search/reviews endpoints
- `/recommendations/*` surface endpoints
- `GET /consent` and `PUT /consent` in frontend shape
- profile/explanations/debug endpoints used by FE
- checkout/orders/addresses endpoints used by FE

## Expectation vs reality matrix

### Group A: can integrate soon (with adapter work)

#### Consent (pending-auth)

- FE expects:
  - `GET /consent`
  - `PUT /consent`
- BE has:
  - `POST /consent`
  - `GET /consent/{customer_id}`

Required changes:

- FE:
  - introduce server-adapter methods that can call current backend shape.
  - decide how FE obtains `customer_id` (temporary constant/session identity).
  - revisit when auth endpoints land — `customer_id` should disappear from request payloads.
- BE:
  - ideally add compatibility endpoints (`GET /consent`, `PUT /consent`) or publish final auth-customer contract.

#### Jobs and traces

- FE does not yet have first-class methods for:
  - `GET /jobs/{job_id}`
  - `GET /traces/{job_id}`
- BE has both endpoints.

Required changes:

- FE:
  - add typed client methods and optional debug UI integration hooks.
- BE:
  - keep response envelope stable (`404`, `503`, `detail` message shape decisions).

#### Customer delete

- FE currently does not call:
  - `DELETE /customer/{customer_id}`
- BE supports it.

Required changes:

- FE:
  - add adapter method (later used in privacy/admin flow).

### Group B: blocked on backend delivery

- Catalog, facets, product detail, search
- Reviews and helpful votes
- Recommendations surfaces (`/recommendations/home`, `/recommendations/pdp`, etc.)
- Profile/explanations/debug events read endpoint
- Checkout, orders, addresses

For these, frontend stays on MSW until backend endpoints exist or agreed compatibility shims are shipped.

## Critical contract mismatches to resolve before real integration

1. **Consent path + method mismatch**
   - FE: `GET /consent`, `PUT /consent`
   - BE: `GET /consent/{customer_id}`, `POST /consent`

2. **Recommendation shape mismatch**
   - FE uses rail-style recommendation endpoints.
   - BE currently exposes a single orchestration endpoint: `GET /recommend`.

3. **Identity model mismatch (pending-auth)**
   - FE currently behaves with demo customer IDs in events.
   - BE consent/read paths require explicit `customer_id` input.
   - Need a temporary integration identity contract before full auth routes are ready.
   - When auth ships, `customer_id` is removed from request bodies/querystrings for authenticated routes; FE must isolate identity resolution into a single module to make this swap mechanical.

4. **Error envelope mismatch**
   - FE client currently throws generic `Error("Request failed: status")`.
   - BE returns FastAPI `detail` payloads.
   - Need normalized FE error mapper before rollout.

## Frontend modifications required before endpoint swapping

1. Create swap-ready API adapter layer (no direct path literals in feature hooks/components).
2. Add central query key factory to stabilize cache keys.
3. Add canonical error envelope mapper (status + detail + user-action text).
4. Add temporary customer identity resolver (demo-safe) for consent/jobs/traces/delete routes.
5. Add backend capability flags (per endpoint group) so FE can mix real + mock safely.

## Backend build expectations before full FE parity

Minimum for browse/search parity:

- `GET /catalog/categories`
- `GET /catalog/facets`
- `GET /catalog/products`
- `GET /catalog/products/{slug}`
- `GET /search`

Minimum for PDP social proof:

- `GET /catalog/products/{slug}/reviews`
- `POST /catalog/products/{slug}/reviews`
- `PUT /catalog/products/{slug}/reviews/{reviewId}/helpful`

Minimum for profile/personalization surfaces:

- `GET /me/profile`
- `PATCH /me/preferences`
- `GET /me/explanations`
- `GET /debug/events` (or a replacement endpoint contract)

Minimum for checkout/account:

- `POST /checkout`
- `GET /me/orders`
- `PATCH /me/orders/{orderId}/delivery-address`
- `GET /me/addresses`
- `PATCH /me/addresses/{id}`

## Event tracking integration spec (deferred — but design it now)

The canonical FE-side event vocabulary lives in `apps/web/event-types-description.md`. That file is the single source of truth for:

- allowed `event_type` values and their `payload` shapes,
- aggregation rules (debounce, dedupe, dwell, no PII),
- recommendation `context` strings.

Backend is adding a **bulk events endpoint**. FE will switch from per-event `POST /events` to bulk submission as soon as that endpoint is available. The integration **must** be reliable across:

- network drops mid-flight,
- tab close / navigation away,
- full page reload,
- device sleep / app backgrounding,
- consent revocation mid-buffer.

### Goals

1. Drop zero events that the user actually performed under valid consent.
2. Never block the UI thread — tracking must always be fire-and-forget at the call site.
3. Be cost-efficient — never send one HTTP request per event in normal browsing.
4. Be idempotent — server can safely receive the same event twice and dedupe.
5. Survive reload — if the browser dies before flush, next session resumes the queue.
6. Respect consent — events emitted while consent is missing are dropped or anonymized at enqueue time.

### Architecture

A small dedicated module under `apps/web/src/features/events/tracker/` (proposed path) acts as the only producer of `POST /events/*`:

```
[any feature code]
    └─ trackEvent(type, payload)
            │
            ▼
[EventTracker]
    ├─ in-memory ring buffer (fast path)
    ├─ persistent IndexedDB queue (durable path)
    ├─ flush triggers
    │     ├─ size:    >= 50 events buffered
    │     ├─ time:    every 3000ms (idle debounce)
    │     ├─ visibility: document.visibilityState === "hidden"
    │     ├─ pagehide / freeze events
    │     └─ network: navigator.onLine -> true (after offline)
    └─ transport
          ├─ default:  fetch(`/events/batch`, { keepalive: true })
          └─ unload:   navigator.sendBeacon('/events/batch', blob)
```

No feature code may call `fetch('/events*')` directly. All event emission flows through `trackEvent`.

### Storage choice — IndexedDB (not localStorage)

**Decision:** persistent queue lives in IndexedDB.

Reasons:

- `localStorage` is synchronous and blocks the main thread on writes — unacceptable for high-frequency event emission.
- `localStorage` has a ~5MB total quota across the entire origin and is shared with other features.
- IndexedDB supports structured cloning (objects, dates), large quotas, async access, and cursor-based draining of pending records.
- Survives full page reload because writes are durable per record.

Recommended library: `idb` (small Promise wrapper around IndexedDB). Avoid building a custom transactional wrapper unless `idb` is rejected for bundle reasons.

Database layout:

- DB: `hyperpersona-events`
- Object store: `pending`
  - keyPath: `event_id` (UUID)
  - indexed by `enqueued_at` for FIFO drain order

### Per-event shape (FE-generated)

Each event the FE produces gets a client-generated UUID before it ever leaves memory. This is the basis of server-side idempotency.

```ts
type ClientEvent = {
  event_id: string;          // UUIDv4 generated on FE — idempotency key
  customer_id: string;       // resolved at enqueue time (pending-auth: see note)
  event_type: string;        // from event-types-description.md
  payload: Record<string, unknown>;
  consent_scope: string[];   // snapshot at enqueue time
  client_emitted_at: string; // ISO timestamp captured at enqueue
  client_session_id: string; // session-scoped UUID for ordering / analytics
  schema_version: number;    // 1 today; bump if payload shape changes
};
```

The server **must** treat `event_id` as the dedupe key. FE will retry the same `event_id` on transient failures.

### Batch envelope (FE → BE)

When the bulk endpoint is available, FE sends:

```ts
type EventBatch = {
  batch_id: string;          // UUIDv4 — idempotency key for the batch
  events: ClientEvent[];     // FIFO order, length 1..MAX_BATCH_SIZE
  client_sent_at: string;    // ISO timestamp at send
};
```

Server-side expectations FE relies on:

- 2xx response means batch accepted; FE may delete those `event_id`s from IndexedDB.
- 4xx response with structured error means the batch is malformed — FE drops it (do not loop forever on poison pills).
- 5xx / network error means FE retains and retries with backoff.
- Server dedupes individual `event_id`s server-side (so partial retransmits are safe).

### Flush triggers

The tracker decides to flush when **any** of these fire:

1. **Size trigger** — buffer length >= `MAX_BATCH_SIZE` (default 50).
2. **Time trigger** — `FLUSH_INTERVAL_MS` since the oldest unsent event (default 3000ms).
3. **Visibility trigger** — `document.visibilitychange` -> `hidden`.
4. **Pagehide trigger** — `pagehide` and `freeze` events.
5. **Online trigger** — `online` event after a previous offline period.
6. **Manual trigger** — `tracker.flush()` for tests and explicit moments (e.g. checkout submit).

`beforeunload` is intentionally **not** used — it's unreliable across browsers and can interact badly with bfcache. Use `pagehide` instead.

### Transport rules

- **Normal flush**: `fetch('/events/batch', { method: 'POST', keepalive: true, body: JSON, headers: { 'Content-Type': 'application/json' } })`.
  - `keepalive: true` allows the request to survive a tab close that begins after dispatch.
  - Allows JSON content-type (which `sendBeacon` does not).
- **Unload flush** (`pagehide`): use `navigator.sendBeacon('/events/batch', blob)` as a guaranteed-attempt fallback.
  - Wrap payload as `new Blob([JSON.stringify(batch)], { type: 'application/json' })`.
  - If `sendBeacon` is unavailable, fall back to `fetch(..., { keepalive: true })`.
- **Payload size cap**: `keepalive` is limited to ~64KB per request across all keepalive fetches. The tracker must enforce a serialized-size cap and split into multiple batches if exceeded.

### Reliability rules

1. **Persist before send.** Every event is written to IndexedDB at `trackEvent()` time, not at flush time. This means a tab kill between enqueue and flush still leaves the event recoverable.
2. **Acknowledged delete.** On 2xx, delete only the `event_id`s that came back as accepted. Do not delete on partial failure.
3. **Retry policy.** Exponential backoff per batch attempt: 1s, 2s, 4s, 8s, capped at 30s. Reset on success.
4. **Max age.** Drop persisted events older than 7 days at boot (configurable). Avoid uploading stale signal weeks later.
5. **Cap on queue size.** Hard cap at `MAX_QUEUE_SIZE` (default 1000). When exceeded, drop the **oldest** events (FIFO eviction) and log a debug counter.
6. **Boot drain.** On app boot, run `drainPending()` before any new events are enqueued so events from a previous tab session are flushed first.
7. **Consent gate at enqueue.** Inspect the latest known consent snapshot before persisting. If `personalization` is not granted, either drop or persist with `consent_scope: []` per policy decision.
8. **Consent revocation.** When consent is revoked, the tracker must purge events that were enqueued under personalization scope but not yet sent.
9. **Schema migrations.** If `schema_version` of stored events is older than the current code's expectation, run a migration step at boot (for now: drop them).
10. **Single instance per tab.** Tracker is a module-level singleton; do not instantiate in components.
11. **Multi-tab safety.** IndexedDB writes are scoped to origin and shared across tabs. Use a `BroadcastChannel('hyperpersona-events')` so only one tab is the active flusher at a time, preventing duplicate sends. The chosen tab pings every few seconds; if it goes silent, another tab takes over.
12. **Clock skew tolerance.** All timestamps are FE-provided ISO strings — server may correct using its own clock if needed.

### Aggregation rules (mirror `event-types-description.md`)

Implemented inside the producer side (before enqueue), not on the server:

- `search` — fired on submit only, not on keystroke.
- `product_dwell` — at most once per PDP load, only after >=10s.
- Generic dedupe — drop the same `event_type` + `payload` hash within a 2s window.

These rules belong inside `trackEvent()` so callers can stay simple.

### Auth note (pending-auth)

Today FE will resolve `customer_id` from a temporary identity provider (demo customer or local stub). When backend ships auth:

- `customer_id` will move out of payload and become server-resolved from the session/JWT.
- The `ClientEvent.customer_id` field may either be dropped from FE or retained as a hint that the server may verify against the session.
- The tracker module must isolate identity resolution into a single function so this swap is one-line.

### Recommendation API integration

Recommendations follow the rules in `apps/web/event-types-description.md` (sections 2 and 3). Reinforced here so they don't drift:

1. FE must call `/recommend` only on:
   - mount of a surface that has a recommendation slot,
   - a major surface transition (e.g. cart becomes empty/active),
   - email/notification generation flows.
2. FE must **not** call `/recommend` on:
   - every event,
   - per-render renders inside scroll/hover handlers.
3. All `context` strings come from a single `Context.*` helper module — no string concatenation at call sites.
4. Context format is strictly `lowercase + underscores`, no PII, no SKUs, no timestamps.
5. React Query caching:
   - cache key: `["recommend", customer_id, context]`
   - `staleTime`: 5 minutes (mirrors Redis offer cache TTL on the server)
   - background refetch disabled by default; explicit invalidation only on consent change or persona switch.
6. Backend currently exposes a single `GET /recommend?customer_id=&context=`. Until backend ships rail-style endpoints, FE rail components consume the same single endpoint with different `context` values and FE composes the page-level layout.
7. After auth lands, `customer_id` is dropped from the query and resolved server-side (pending-auth).



### Phase 5.0 - Discovery lock (current)

- freeze this document as single source of truth for integration sequencing.
- confirm endpoint contracts with backend team.

### Phase 5.1 - Integration scaffolding (no endpoint swaps yet)

- implement FE adapter boundary and query key factory.
- implement FE normalized error handling.
- add capability-flag strategy (`real`, `mock`, `hybrid` per resource family).

### Phase 5.2 - Low-risk real backend adoption

- integrate real:
  - consent (through adapter with current route shape),
  - jobs,
  - traces,
  - customer delete.
- keep catalog/search/reviews/profile/checkout/recommendations on MSW.

### Phase 5.3 - Catalog/search migration (when backend ready)

- switch catalog + search endpoints to real backend as a single slice.
- verify facet-count semantics and pagination parity before enabling by default.

### Phase 5.4 - PDP reviews migration

- switch reviews endpoints to real backend.
- verify optimistic updates, duplicate-review behavior, helpful vote idempotency.

### Phase 5.5 - Profile + account migration

- switch profile/explanations/debug reads + checkout/orders/addresses.
- enforce real backend error and empty-state UX.

### Phase 5.6 - Event and recommendation integration (deferred until preceding slices are stable)

Hold reasons:

- backend bulk events endpoint is being authored by backend devs.
- recommendation rail strategy may change once backend exposes more than `GET /recommend`.

Steps when unblocked:

1. **Event tracker module**
   - implement the architecture described in *Event tracking integration spec* above.
   - keep the new module behind a `tracking.enabled` capability flag so it can be rolled out gradually.
   - integrate with consent state so revocation flushes/purges per policy.
2. **Endpoint cutover**
   - swap `apiClient.trackEvent()` to use `POST /events/batch` only.
   - retire any per-event `POST /events` callsites.
3. **Recommendation cutover**
   - switch FE recommendation queries from MSW to the real `GET /recommend` using `Context.*` helpers.
   - keep React Query keys stable: `["recommend", customer_id, context]`.
4. **Job + trace surfacing**
   - add adapter methods for `GET /jobs/{job_id}` and `GET /traces/{job_id}`.
   - wire optional debug surfacing for recommendation provenance.

### Phase 5.7 - Auth contract re-alignment (pending-auth)

When backend publishes auth endpoints:

- replace the temporary identity resolver with a session-aware identity provider.
- remove explicit `customer_id` from FE-emitted bodies and querystrings where the server now derives it from the session.
- re-review every `(pending-auth)` block in this document and update FE adapter shapes.
- update `API_REQUIREMENTS.md` and `API_HANDOVER_STATUS.md` to reflect the auth-aware contract.

## Exit criteria for "ready to start real integration"

- this document approved by FE + BE owners.
- backend confirms route/method/shape for consent and recommendation strategy.
- FE adapter layer merged with capability flags and error normalization.
- no component-level direct dependency on backend route shape.
- event tracker design validated against the bulk endpoint contract before implementation begins.
- pending-auth blocks acknowledged so no integration work is blocked on contract churn that's already known.
