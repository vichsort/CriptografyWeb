# Architecture

How Criptografy Web is structured: layers, how data moves through them, and the rules that keep it that way. For what the app is and the API contract, see the [README](../README.md). For the visual language and components, see [DESIGN.md](DESIGN.md).

## Contents

1. [Goals and constraints](#1-goals-and-constraints)
2. [Principles](#2-principles)
3. [Folder layout](#3-folder-layout)
4. [Dependency rules](#4-dependency-rules)
5. [Requests](#5-requests)
6. [Errors](#6-errors)
7. [Caching](#7-caching)
8. [Persistence](#8-persistence)
9. [Content layer](#9-content-layer)
10. [Routes](#10-routes)
11. [Options forms](#11-options-forms)
12. [API coverage](#12-api-coverage)
13. [Quality](#13-quality)
14. [Deploy](#14-deploy)
15. [Backend wishlist](#15-backend-wishlist)

---

## 1. Goals and constraints

**The product is a hub for trying out cryptography.** It covers classical ciphers, authenticated encryption, hashes and encodings. Someone picks a goal ("hide a message", "fingerprint a text") and gets a result in seconds, while learning what they just did.

**Everything the API offers is covered.** That means every algorithm, every operation, every metadata field and every error. Work ships feature by feature, but nothing the API delivers is left out. Section 12 tracks coverage.

**The UI is English only.** That covers copy, routes and errors, consistent with the API. All copy lives in the content layer (section 9), so adding a locale later does not touch components.

Non-goals:

- Accounts, auth and server-side storage. The API is stateless, and so is this app.
- Operation history, and saved inputs or keys.
- Features the API does not offer: binary or file I/O, operation chaining, cryptanalysis.

Constraints:

| | |
|---|---|
| **Stack** | Next.js 16.4 (App Router), React 19.3, Tailwind CSS 4.3, TypeScript strict. Next 16 differs from earlier versions; the bundled docs in `node_modules/next/dist/docs/` are the reference. |
| **Source of truth** | `GET /api/algorithms` decides which algorithms exist and what options they take (JSON Schema). Forms and lists are never hardcoded. |
| **Data** | `input` is never trimmed. Leading and trailing whitespace is data. |
| **Rate limit** | 60 requests per minute per client IP. Operations run on explicit action, never per keystroke. |
| **Cold starts** | The backend may sleep (Render free tier). The first request can take close to a minute, and the UI must handle that gracefully. The build never depends on the API being up. |
| **Config** | The API base URL comes from `NEXT_PUBLIC_API_URL`. |

## 2. Principles

1. **Layers with one-way dependencies, enforced by lint.** A violation fails CI.
2. **The domain is plain TypeScript.** No React, no `fetch`, no Next. It tests in milliseconds.
3. **Data enters through a validated boundary.** Every API response is parsed with Zod before anything else sees it. Malformed data becomes a typed error, never an `undefined` deep inside a component.
4. **The catalog drives the UI, and content enriches it.** What exists and how it is configured comes from the API. Presentation (intent titles, synonyms, icons, copy) comes from the content layer, keyed by algorithm id.
5. **One cache: TanStack Query.** All server state lives in the TanStack Query cache in the browser. Next renders static shells, and the browser calls the API directly. Nothing depends on Next's server-side data cache, which keeps the app portable across hosts.

## 3. Folder layout

```
src/
  app/            Routing only: layouts, pages, loading/error/not-found, metadata. Thin.
  features/       Vertical slices, each exposing a public index.ts
    shell/          Fixed header, sidebar, accordions, mobile overlay, theme toggle, top progress bar
    home/           Large title, date line, family cards
    search/         Search index and matching, shared by home and sidebar
    workbench/      Algorithm screen: mode switch, options form, input, run, result
    compare-hash/   Compare two texts by hash
    learn/          Articles
    about/          About the API
  domain/         Pure types and rules: Algorithm, Family, Operation, OperationRequest,
                  OperationResult, AppError, family → endpoint mapping, determinism rule
  data/
    http/           Transport: fetch wrapper, timeouts, AbortSignal, cold-start signal,
                    HTTP → AppError normalization. Knows nothing about Criptografy.
    api/            Criptografy client: one function per endpoint, Zod response schemas,
                    DTO → domain mapping
    cache/          TanStack Query client, query keys, per-resource policies,
                    catalog persister setup
    persistence/    Storage adapter (localStorage): typed, versioned keys,
                    Zod-validated reads; preferences repository
  content/        Copy and presentation: per-algorithm intents, synonyms, icon and color,
                  option label/help overrides, UI strings, error copy, articles
  ui/             Design system: tokens.css, primitives, motion presets. No business logic.
  config/         Environment parsing (Zod) → typed config
  lib/            Small generic helpers (cn, assertNever, …)
```

The `@/*` path alias points to `./src/*`.

## 4. Dependency rules

```
app ──▶ features ──▶ ui, content, data, domain, lib
                    data ──▶ domain, config, lib
                 content ──▶ domain
                      ui ──▶ lib
                  domain ──▶ (nothing)
```

- A feature imports another feature only through that feature's `index.ts`, never its internals.
- `ui/` never imports from `data/`, `features/` or `content/`.
- Only `data/http` calls `fetch`. Only `data/persistence` touches `localStorage`.
- Components never call the API client directly. They use feature hooks, which wrap TanStack Query.
- These rules are enforced by an ESLint boundaries rule in CI.

## 5. Requests

### Catalog: `GET /api/algorithms`

- Fetched in the browser by a single query (`useCatalog()`), shared by home, sidebar and workbench under one query key.
- **Persisted** to `localStorage` through TanStack's persister (`@tanstack/react-query-persist-client` with a sync-storage persister). A returning visitor sees the lists instantly, even while the backend wakes up.
  - Only the catalog query is persisted (`dehydrateOptions.shouldDehydrateQuery`).
  - The persisted copy has a `buster` tied to the app version and a `maxAge` of about 7 days.
  - The persister writes through the persistence adapter (section 8).
- Stale-while-revalidate: the app shows the persisted catalog, refetches it in the background, and swaps in the fresh one when it arrives.
- First visit with a sleeping backend: the static shell (header, title, search) renders at once. The lists show glass skeleton rows and the waking state, and the query retries with backoff.

### Operations: `POST /api/{encrypt,decrypt,hash,encode,decode}`

- Sent **from the browser directly to the API**, not through a Next route handler or server action:
  - The rate limit is per client IP. Proxying through the frontend host would pool every visitor behind a few IPs, so one busy user could throttle everyone.
  - CORS is open and the API is stateless, so a proxy would only add a hop.
- Run on explicit action only: the Run button, or ⌘/Ctrl+Enter.
- Exposed to components through feature hooks such as `useRunOperation`.

### Transport (`data/http`)

- **Timeout:** about 75s by default, to outlast a cold start.
- **Cancellation:** every call takes an `AbortSignal`. Leaving the screen or re-running cancels the pending request.
- **Cold-start signal:** a request with no answer after about 3s is flagged as "waking", and the UI switches its loading copy to "Waking up the server…".
- **Warm-up:** on first client load, one `GET /` is sent fire-and-forget to start waking the backend. `GET /` is outside `/api/*` and sends no CORS headers, so the request uses `mode: "no-cors"` and its opaque response is ignored.
- **Retries:** none for POSTs that received an HTTP response. One retry is allowed for pure network failures.
- **Credentials:** never send `credentials: "include"`.

## 6. Errors

Every failure becomes an `AppError`, a discriminated union, before it leaves `data/`.

| Kind | Source | UI |
|---|---|---|
| `validation` | 422 with `errors` | Message on the input field or the options card |
| `operation` | 422 with `message` only | Inline message near the result |
| `binaryResult` | 422 with the non-UTF-8 message | "The result is binary data", explained, shown as information rather than failure |
| `notFound` | 404 | Algorithm not found screen |
| `rateLimited` | 429 | "Wait a moment"; the Run button re-enables by itself |
| `network` / `timeout` | fetch failure, or abort by timeout | Retry action |
| `server` | 5xx, or 405 (a client bug, logged) | Generic error with retry |
| `contract` | 2xx body that fails Zod | Logged; generic error |

Each kind has a short headline in the content layer ("Couldn't encrypt"). The API's own `message` is shown under it verbatim, because those messages are specific and written for end users (for example, the Hill determinant).

**Field errors.** The API's per-field `errors` only ever name `algorithm`, `input` or `options`. Problems inside an option (a missing shift, a non-invertible Hill matrix) arrive as an `operation` message. So `validation` maps onto the input field or onto the options card as a whole.

**Binary results.** Detecting `binaryResult` means matching the backend message text. The exact string is pinned by a test fixture copied from `../Criptografy/app/Cryptography/NonTextResultException.php`.

**Rate limit.** The backend's CORS config exposes no headers, so `Retry-After` is not readable from the browser. The message promises no exact time, and the button re-enables after an estimated 60s. The normalizer reads `Retry-After` whenever it is readable, so exposing it on the backend makes the cooldown exact with no frontend change.

## 7. Caching

TanStack Query is the only cache. Query keys and per-resource policies live in `data/cache`, so no component invents its own key or `staleTime`.

- **Catalog:** `staleTime` of about 1h, persisted as described in section 5.
- **Deterministic operation results:** memoized in memory, keyed by `[operation, algorithmId, input, options]`, so re-running the same thing costs no request.
  - They run through `queryClient.fetchQuery` behind `useRunOperation`. That keeps the explicit-run UX and still reuses cached results.
  - Results have a bounded `gcTime` (a few minutes).
- **Determinism** is a domain rule:
  - `aes-256-gcm` encryption is not deterministic (random nonce). It runs as a plain mutation and is never memoized.
  - An algorithm the frontend does not know defaults to "not deterministic".
- **The in-flight counters** (`useIsFetching`, `useIsMutating`) drive the global top progress bar (see DESIGN.md).
- **Nothing containing user input is ever persisted.** Only the catalog passes the persister's filter, and a test pins this.

## 8. Persistence

`data/persistence` holds a single storage adapter:

- SSR-safe: a no-op on the server.
- Versioned keys: `cw:v1:*`.
- Every read is validated with Zod. A bad value falls back to the default.
- Storage exceptions (private mode, quota) are swallowed.

It stores UI preferences, plus the persisted catalog:

| Key | Values | Default |
|---|---|---|
| `theme` | `light` \| `dark` \| `system` | `system` |
| `sidebar.collapsed` | boolean (desktop) | `false` |
| `sidebar.openFamilies` | list of family ids | first family open |

**Theme without a flash.** A small inline script in `<head>` reads the stored theme and sets `data-theme` on `<html>` before the first paint. Components read the theme through a context backed by the preferences repository, never from `localStorage` directly.

Keys and inputs are never stored.

## 9. Content layer

`content/algorithms.ts` maps each algorithm id to its presentation:

- Family, intent title ("Shift letters"), subtitle ("Caesar").
- Icon tile (glyph and color token) and search synonyms ("password" → AES-256-GCM, "fingerprint" → SHA).
- Optional overrides for the description and for each option's label and help. When there is no override, the schema `title` and `description` are used.
- Which options are secret (rendered masked, for example the AES key).
- Per-algorithm notes (for example: Hill normalizes text, AES output changes on every run).

Join rules with the catalog:

- An id in the catalog with no content entry still appears, with the API's name and description and a neutral icon.
- A content entry whose id is not in the catalog is hidden.
- Frontend-only entries (compare-hash, articles) are declared separately and link to their own routes.

Home rows and sidebar rows come from the same joined source, and the search index is built once from it.

## 10. Routes

| Path | Screen |
|---|---|
| `/` | Home |
| `/algorithms` | All algorithms (the family cards without the hero) |
| `/algorithms/[id]` | Workbench; `?mode=` selects the operation (`encrypt`, `decrypt`, `encode`, `decode`) |
| `/tools/compare-hash` | Compare two texts by hash |
| `/learn` | Article list |
| `/learn/encoding-is-not-encryption` | Article |
| `/about` | About the API |

An unknown algorithm id renders a not-found screen in the same visual language.

## 11. Options forms

Each algorithm's options form is generated from the JSON Schema in the catalog, by a small renderer of our own.

Why not react-jsonschema-form:

- Its default widgets and templates would have to be overridden almost entirely to match the design system.
- The schemas use a small subset of JSON Schema.
- The Hill matrix needs a custom widget either way.

Validation is not reinvented: it uses **AJV**, the same validator react-jsonschema-form uses.

A **widget registry** resolves each schema node to a component:

| Schema | Widget |
|---|---|
| `integer` | `NumberStepper` |
| `string` with `pattern` | `TextField` with live pattern validation |
| `string` marked secret in content | Masked `TextField` with a reveal toggle |
| `array` of `array` of `integer` | `MatrixEditor`, with a size control from `minItems`/`maxItems`, and live determinant feedback for Hill |
| anything unrecognized | JSON `TextArea` fallback, so a new backend option never breaks the screen |

- **Client-side validation:** AJV against the schema as served (draft-07-compatible).
- **Integers are sent as numbers.**
- **The server has the final word.** A 422 is mapped as described in section 6.

## 12. API coverage

| API surface | Where it is used |
|---|---|
| `GET /api/algorithms`: `id` | Routes, query keys, join with content |
| `name`, `description` | Workbench header; fallback copy for unknown algorithms |
| `category` | Family grouping; which endpoints apply |
| `supportsEncryption`, `supportsDecryption`, `supportsHashing` | Which modes the workbench offers |
| `requiresKey` | Workbench header ("Key required") and options card |
| `securityLevel` | Workbench header: "educational", "modern", "not applicable" |
| `options` (JSON Schema, `title`, `description`) | Options form, labels, help text |
| `POST /api/encrypt`, `/decrypt` | Workbench, encryption family |
| `POST /api/hash` | Workbench, hashing family; compare-hash tool |
| `POST /api/encode`, `/decode` | Workbench, encoding family |
| `GET /` (`name`, `status`, `version`) | Warm-up ping; the About page shows the API version |
| `GET /up` | Used by the API host's health check; not needed by the UI |
| 404, 405, 422, 429 | Error kinds, section 6 |
| Whitespace preservation | Input is sent exactly as typed; the input card says so |
| Numeric strings for integers | Accepted by the API; the form still sends numbers |

All eight algorithms (`caesar`, `vigenere`, `hill`, `aes-256-gcm`, `sha-256`, `sha-512`, `base64`, `hex`) are covered in every operation they support. A new algorithm added to the backend appears automatically, with generic copy, until it gets a content entry.

`GET /` sends no CORS headers, so the browser cannot read it. The About page reads it on the server inside a `<Suspense>` boundary with a short timeout, and shows "unavailable" when the API is asleep.

## 13. Quality

- **TypeScript:** `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`.
- **Lint and format:** ESLint (the Next config plus the boundaries rule) and Prettier.
- **Unit and integration tests:** Vitest and Testing Library, with **MSW** mocking the API. Handlers and fixtures are built from real API responses. Required coverage:
  - `domain/` and `data/` near 100%
  - every row of the error table
  - schema-to-widget resolution
  - search matching
  - persistence fallbacks
  - the "only the catalog is persisted" rule
- **CI** (GitHub Actions): typecheck, lint, unit tests, and a production build with the API unreachable. The last step proves the build does not depend on it.
- **Later:** end-to-end tests with Playwright, covering the core flows in both themes and at mobile width.

## 14. Deploy

The target is Cloudflare, using its Next.js integration (OpenNext on Workers). Data does not depend on Next's server cache, so the app only needs static pages plus the Next runtime. If the Workers integration does not support Next 16.4 yet, a static export to Cloudflare Pages is the fallback; in that case the About page reads `GET /` on the client once the backend exposes CORS there.

Deploy configuration is the last phase of v1. Until the API has a production URL, the deploy stays wired to `NEXT_PUBLIC_API_URL` and documented.

## 15. Backend wishlist

Changes that would improve the frontend. They belong in the backend repository and are proposed there, not worked around here.

- Expose `Retry-After` and `X-RateLimit-Remaining` in CORS `exposed_headers`. This gives an exact cooldown, and a warning before the limit is hit.
- Raise the CORS preflight `max_age` above 0, so each operation costs one request instead of two.
- Send CORS headers on `GET /`, so the browser can read the API version and status.
