# Roadmap

The path to v1 of Criptografy Web, in phases. Each phase ends with a green build. That means these commands pass:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`, run with the API unreachable

The structure and rules behind each item are in [ARCHITECTURE.md](ARCHITECTURE.md), cited as **A§n**. Visual and interaction details are in [DESIGN.md](DESIGN.md), cited as **D§n**.

| Phase | Ships |
|---|---|
| [0. Tooling](#phase-0-tooling) | `src/` layout, strict TypeScript, tests, API mocks, CI, enforced layer boundaries |
| [1. Domain and data](#phase-1-domain-and-data) | Config, domain rules, HTTP transport, API client, persistence, cache, content, search |
| [2. Design system](#phase-2-design-system) | Tokens, themes, fonts, primitives, motion presets, top progress bar |
| [3. Shell and home](#phase-3-shell-and-home) | Fixed header, sidebar (desktop and mobile), theme toggle, home, `/algorithms` |
| [4. Workbench](#phase-4-workbench) | Options form from JSON Schema, `/algorithms/[id]` with every operation and state |
| [5. Extra screens](#phase-5-extra-screens) | Compare hash, Learn and the first article, About the API |
| [6. Polish](#phase-6-polish) | Route transitions, iOS platform details, manifest, motion/transparency/contrast audits |
| [7. Deploy](#phase-7-deploy) | Cloudflare configuration and docs |
| [Later](#later) | End-to-end tests |

---

## Phase 0: Tooling

- [ ] **Project layout and test setup**
  - Move `app/` to `src/app/`, with `@/*` → `./src/*`.
  - TypeScript `strict`, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
  - Vitest, Testing Library and jsdom, with MSW mocking the API at `http://api.test`.
  - Prettier, and `.env.example` with `NEXT_PUBLIC_API_URL`.
  - GitHub Actions CI: format check, typecheck, lint, tests, and a production build against an unreachable API.
- [ ] **Enforced boundaries** (A§4)
  - ESLint boundaries between layers.
  - `fetch` only in `data/http`, and `localStorage` only in `data/persistence`.
  - No React in `domain`.
  - No arbitrary Tailwind values outside `ui/`.
  - Each rule is covered by lint tests.

## Phase 1: Domain and data

- [ ] **Typed config.** `NEXT_PUBLIC_API_URL` is parsed and validated, and fails loudly when it is missing.
- [ ] **Domain** (A§2, A§7)
  - Types for algorithms, families, operations and requests.
  - The `AppError` union.
  - The family → operations → endpoint mapping.
  - The determinism rule: AES encryption is never deterministic, and unknown algorithms are not either.
  - Hill determinant and invertibility mod 26.
- [ ] **HTTP transport** (A§5, A§6)
  - Timeout of about 75s, cancellation, and a "waking" signal after about 3s.
  - Fire-and-forget warm-up ping.
  - No retry for answered POSTs, one retry on network failure.
  - Every HTTP failure normalized into an `AppError`.
- [ ] **API client**
  - Zod-validated catalog, operations and status.
  - The non-UTF-8 result is detected as `binaryResult`.
  - Fixtures captured from the real API.
  - Input and options are sent byte-for-byte.
- [ ] **Persistence** (A§8)
  - A validated storage adapter with versioned `cw:v1:*` keys.
  - Preferences: theme, sidebar collapsed, open families.
  - Safe fallbacks for missing, malformed or throwing storage.
- [ ] **Cache** (A§7)
  - TanStack Query client and per-resource policies.
  - The catalog persisted to `localStorage`, filtered to the catalog only, with a version buster and a 7-day max age.
  - Deterministic results memoized in memory.
  - A global in-flight state.
- [ ] **Content layer** (A§9)
  - English copy for families, algorithms, options, notes, operations (labels and gerunds), errors and UI strings.
  - The join between catalog and content, including generic presentation for unknown algorithms.
- [ ] **Search.** Accent- and case-insensitive, matching titles, names and synonyms.

## Phase 2: Design system

- [ ] **Tokens and themes** (D§2–D§5)
  - Spacing, text styles, colors, materials, radii, durations and springs.
  - Light and dark token sets, with themed scrollbars, form controls and browser chrome.
  - Inter and JetBrains Mono as fallbacks.
  - A theme script that prevents any flash on load.
- [ ] **Action and display primitives** (D§6)
  - Button (four variants, iOS-style loading with gerund, fixed width).
  - ActivityIndicator, GlassCard, ListRow, IconTile, InlineMessage, Skeleton.
- [ ] **Input and disclosure primitives** (D§6)
  - TextField (with a secret mode), auto-growing TextArea, NumberStepper.
  - SegmentedControl, Accordion, SearchField, ThemeToggle.
  - MatrixEditor, from 2×2 to 6×6.
- [ ] **Top progress bar** (D§6). Shows after 150ms, trickles toward 85%, completes and fades. Static under reduced motion.

## Phase 3: Shell and home

- [ ] **App shell** (D§8)
  - Fixed header with nav.
  - Persistent, collapsible sidebar at ≥ 1024px.
  - Full-screen overlay on mobile, as a modal dialog with a focus trap and scroll lock.
  - Light/dark toggle with view-transition crossfade.
  - Progress bar wired to in-flight requests.
- [ ] **Sidebar content** (D§9)
  - Search, Home, and family accordions with counts.
  - Mobile-only nav rows.
  - Theme toggle in the footer.
  - Search opens matching families and restores their state when cleared.
- [ ] **Home and `/algorithms`** (D§9)
  - Date line, rendered on the client so it is never the build date.
  - "What are we doing today?", search with result count and empty state.
  - Three family cards, with animated filtering.

## Phase 4: Workbench

- [ ] **Options form** (A§11)
  - A widget registry from JSON Schema: integer, pattern, secret, matrix, and a JSON fallback for unknown shapes.
  - AJV validation.
  - Live Hill determinant feedback.
- [ ] **Algorithm screen** (D§9, A§6)
  - Header with name, security level and "Key required".
  - Mode switch synced with `?mode=`.
  - Input that preserves whitespace.
  - Run with ⌘/Ctrl+Enter.
  - Result with Copy and "Use as input".
  - Notes per algorithm.
  - Every error kind handled: waking, rate limit with cooldown, binary result, operation and validation errors, not found.
  - Overlapping runs are cancelled, and a result never shows under the wrong mode.

## Phase 5: Extra screens

- [ ] **Compare two texts by hash.** SHA-256 on both sides, with a match/mismatch verdict.
- [ ] **Learn.** The article list, and "Encoding is not encryption".
- [ ] **About the API**
  - What the API is, its contract, its quality bar, and source links.
  - Live status and version, streamed from the server with a short timeout. It shows "unavailable" while the API sleeps.

## Phase 6: Polish

- [ ] **Route transitions and platform details** (D§7, D§10)
  - View transitions between routes.
  - Safe areas, `100dvh`, hover only on hover-capable devices.
  - The keyboard never hides Run or the result.
  - Web manifest and app icons.
- [ ] **Audits**
  - Reduced motion and reduced transparency.
  - AA contrast on glass in both themes.
  - Real iOS Safari check.

## Phase 7: Deploy

- [ ] **Cloudflare** (A§14). OpenNext on Workers, falling back to a static export on Pages if Next 16.4 is not supported yet.
  - `preview` and `deploy` scripts.
  - Documented setup.
  - A production API URL is required before the first real deploy.

## Later

- [ ] **End-to-end tests** with Playwright, covering:
  - the core flows (search → workbench → run → copy)
  - error states
  - theme persistence
  - the mobile sidebar

  All in both themes and at phone width.

---

## Known risks

Behaviors the specs imply but do not spell out. Each one has a dedicated test in the phase that owns it.

| Risk | Expected behavior | Phase |
|---|---|---|
| Inputs with leading/trailing spaces, line breaks, tabs or emoji, including the AES password | Reach the API byte-for-byte | 1, 4 |
| The home date in a prerendered page | Always the visitor's current date, never the build date | 3 |
| Corrupted or outdated storage (invalid theme, broken JSON, an old persisted catalog, a throwing `localStorage`) | Falls back to defaults without crashing | 1 |
| Switching mode, algorithm or re-running while a request is pending | The earlier request is cancelled, and its result never appears | 4 |
| A new algorithm, or an unknown option type, from the backend | Rendered with generic copy and the JSON fallback, without crashing | 1, 4 |

## Done criteria for v1

- Format check, typecheck, lint and tests pass. The production build passes with the API unreachable.
- Against a local API, every algorithm runs in every operation it supports, and every error kind in A§6 is reachable and shown as specified.
- Both themes and phone width match the design.
