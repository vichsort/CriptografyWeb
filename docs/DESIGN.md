# Design

The visual language of Criptografy Web, and the conventions every screen and component follows. For structure and data flow, see [ARCHITECTURE.md](ARCHITECTURE.md).

Token **values** live in code: CSS custom properties in `src/ui/tokens.css`, exposed through Tailwind's `@theme`. They are the single source of truth. This document explains the tokens and links to them, but does not restate values that could drift. The values quoted below are the starting points the tokens are built from.

## Contents

1. [Principles](#1-principles)
2. [Spacing](#2-spacing)
3. [Typography](#3-typography)
4. [Color, materials and radii](#4-color-materials-and-radii)
5. [Theming](#5-theming)
6. [Components](#6-components)
7. [Motion](#7-motion)
8. [Layout](#8-layout)
9. [Screens](#9-screens)
10. [iOS and mobile details](#10-ios-and-mobile-details)
11. [Accessibility](#11-accessibility)
12. [Copy](#12-copy)

---

## 1. Principles

**The feel is iOS and Apple-like: translucent, modern, intellectual, and always easy to understand.**

- **Frosted glass, not decoration.** Surfaces are glass over a soft, diffuse background. Glass separates content; it is never ornament.
- **Typography carries the hierarchy.** It is done with size, weight and color. No badges, tags or chips.
- **Lists, not dashboards.** Content is grouped in inset lists inside glass cards, the way iOS Settings and Reminders present it.
- **Intent first.** Rows say what you want to do ("Shift letters"), with the algorithm name as the subtitle.
- **Motion explains change.** Nothing jumps from one state to another.

**Avoid:**

- Anything that reads as a generated landing page: pastel blobs, a centered gradient headline over a chat-like "describe what you want" box, emoji chips.
- Parallax, or anything that follows the pointer.
- Motion that lags behind input or makes the user wait.
- Raw pixel, color, duration or easing values in components. Everything comes from tokens. Lint forbids arbitrary values outside `src/ui/`.

## 2. Spacing

The scale has a 4px base. Every margin, padding and gap uses a named step:

| Token | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 11 | 12 | 16 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| px | 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 44 | 48 | 64 |

Common pairings:

| Element | Spacing |
|---|---|
| Card header | 16 / 16 / 12 |
| List row | 11 vertical, 16 horizontal |
| Gap between cards | 20 |
| Side gutter, mobile | 16 |
| Side gutter, desktop | 36–40 |

## 3. Typography

**Fonts**

| Role | Stack |
|---|---|
| Text | The Apple system font first (`-apple-system`, SF Pro), then **Inter** via `next/font` on other platforms |
| Monospace | `ui-monospace`, SF Mono, then **JetBrains Mono** via `next/font` |

Monospace is for data: results, keys, matrices, hex, and the small family hints.

**Text styles**

Each style defines size, weight, line height and letter spacing.

| Style | Desktop | Mobile | Use |
|---|---|---|---|
| `largeTitle` | 44 / 700 / −0.04em | 34 | Screen title |
| `title1` | 28 / 700 / −0.03em | 26 | Section heads |
| `title2` | 22 / 600 | 20 | Sub-sections |
| `headline` | 17 / 600 / −0.015em | | Card titles |
| `body` | 15 / 400 | 16 | Rows, paragraphs |
| `callout` | 14 / 400 | | Sidebar rows |
| `footnote` | 13 / 400 | | Descriptions, nav, help text |
| `eyebrow` | 13 / 600 / uppercase / +0.02em | | Date line, family label above a title |
| `caption` | 12 / 400 | | Row subtitles, counters |
| `mono` | 14 | | Results |
| `monoSmall` | 12 | | Hints, determinant, API messages |

Inputs are never smaller than 16px on mobile, so iOS does not zoom in on focus.

## 4. Color, materials and radii

**Semantic colors**, defined for both themes:

- `label`, `labelSecondary`, `labelTertiary`
- `separator`
- `fill`: the gray of search fields and segmented controls
- `tint`: the blue (#0a84ff family) used for actions, selection and focus
- `success`, `warning`, `danger`

**Family icon colors.** Each family has a color ramp for its icon tiles:

| Family | Ramp |
|---|---|
| Encrypt | indigo to blue |
| Hash | cyans |
| Encode | oranges |

**Materials (glass levels)**

| Material | Use |
|---|---|
| `glassThin` | Inline surfaces, notes |
| `glassRegular` | Cards and accordions |
| `glassThick` | The mobile overlay |
| `chrome` | Fixed header and sidebar |

Each material defines its fill alpha, background blur, saturation, a 1px highlight border and a soft shadow, for both themes.

**Glass fallback.** When `backdrop-filter` is unsupported, or `prefers-reduced-transparency` is set, every material falls back to an opaque token.

**Background.** A frosted pane: soft light (cool top-right, warm bottom-left) over a neutral base, plus a very fine grain. There is no grid and no texture beyond the grain. Dark mode has its own version: a deep neutral with faint cool and warm light.

**Radii**

| Token | `xs` | `sm` | `md` | `lg` | `xl` | `2xl` | `pill` |
|---|---|---|---|---|---|---|---|
| px | 6 | 8 | 12 | 14 | 18 | 22 | 999 |

Usage:

| Radius | Elements |
|---|---|
| `xs` | Icon tiles (small) |
| `md` | Inputs, buttons |
| `lg` | Sidebar accordions |
| `xl` | Cards |

## 5. Theming

- Light and dark are complete token sets. Dark is never `invert()`. Text contrast meets WCAG AA on glass in both themes, checked over the lightest and darkest parts of the background.
- **Everything follows the theme, including what the browser draws:**
  - `color-scheme` is set per theme, so native controls, autofill and default scrollbars switch with it.
  - Scrollbars are thin, with a rounded, translucent thumb and a transparent track (`scrollbar-color`/`scrollbar-width`, with `::-webkit-scrollbar` for Safari).
  - `<meta name="theme-color">` is set per theme, so the browser chrome on iOS and Android matches.
  - The selection color, focus rings, the caret (`caret-color: tint`) and the placeholder color all come from tokens.
- The **toggle** sits in the sidebar footer. It is labeled **Light / Dark** and has sun and moon icons in its knob.
  - The default follows the system.
  - Using the toggle sets an explicit theme. While the theme is explicit, a small tertiary "Use system setting" action appears next to the toggle.
- Switching themes crossfades through a view transition.

## 6. Components

**Hierarchy rule: at most one primary action per view.**

### Buttons

| Variant | Look | Use |
|---|---|---|
| `primary` | Filled tint, white label | The one main action (Run) |
| `secondary` | Tinted fill | Supporting actions (Copy) |
| `tertiary` | Tint-colored text, no fill | Low-emphasis actions (Use as input, Use system setting) |
| `destructive` | Danger color | Irreversible actions |

Sizes: `sm`, `md` and `lg`, plus an `icon` variant.

States:

| State | Look |
|---|---|
| Rest | Default variant style |
| Hover | Shown only under `@media (hover: hover)` |
| Pressed | Scales to about 0.97, with a spring |
| Focus-visible | Tint ring |
| Disabled | Reduced opacity |
| Loading | See below |

**Loading.** The iOS activity indicator (eight fading spokes) slides in from the left, and the label switches to its gerund ("Encrypt" → "Encrypting…", "Generate hash" → "Generating…"). The button keeps its width. The gerunds live in the content layer.

### Primitives

| Component | Notes |
|---|---|
| `GlassCard` | Title and description inside the card, content below |
| `ListRow` | Icon tile, title, subtitle, chevron; inset separators |
| `Accordion` | Glass; title, count, rotating chevron; animated height |
| `SearchField` | `fill` background; tint ring on focus; `/` focuses the main one |
| `TextField` / `TextArea` | Masked variant with a reveal toggle for secrets; the text area grows with its content |
| `NumberStepper` | − value +, typing allowed |
| `SegmentedControl` | Sliding thumb; shown only when an algorithm has two operations |
| `MatrixEditor` | Size control from 2×2 to 6×6; new cells animate in; live determinant line |
| `ResultPanel` | Monospace output, character count, Copy (with a "Copied ✓" confirmation), Use as input |
| `InlineMessage` | `info`, `warning`, `error`: headline, explanation, and the API message in `monoSmall` |
| `ActivityIndicator` | The iOS spokes, sizes `sm` and `md`; the only spinner in the app |
| `TopProgressBar` | See below |
| `ThemeToggle` | Light / Dark, sun and moon icons |
| `Skeleton` | Glass placeholder rows while the catalog loads |

### Top progress bar

While any request is in flight (an operation or the catalog), a thin bar (2–3px, tint color) runs along the top of the screen, just under the fixed header, like a browser's loading bar.

- It is driven globally by TanStack Query's in-flight counters, so no feature wires it by hand.
- The API reports no progress, so the bar is an estimate:
  1. It appears only after about 150ms, so fast requests do not flash it.
  2. It moves quickly at first, then slows as it approaches about 85%.
  3. When the last request settles, it completes to 100% and fades out.
  4. If a new request starts while it is fading, it restarts cleanly.

## 7. Motion

**Feel.** Motion starts the same instant as the input, is short, and uses springs. It never trails the pointer, and it never makes anyone wait.

**Tokens**

| Kind | Values |
|---|---|
| Durations | `instant` 100ms · `fast` 160ms · `base` 220ms · `slow` 320ms |
| Springs | `snappy` (controls) · `gentle` (larger surfaces) |

**Tools**

- **Motion** (motion.dev) for state inside a component.
- **React `<ViewTransition>`** for route changes and for content swaps across the whole page.

Rule: within a component, use Motion. Across routes or whole-page content, use ViewTransition.

**Everything that changes is animated:**

- Accordion height and chevron rotation.
- Sidebar collapse, with the main column reflowing smoothly.
- Mobile overlay: fade plus a slight scale.
- Menu icon morph (☰ ↔ ✕).
- Search filtering: rows and cards leave and enter, and the grid reflows.
- Route transitions.
- Workbench mode switch (the segmented control thumb slides).
- Matrix cells appearing when the size changes.
- Results revealing (height, then fade and rise).
- Messages appearing.
- Copy confirmation.
- Theme crossfade.
- Button press and hover.
- Button loading (spokes in, gerund label).
- The top progress bar.
- The waking state.

**Reduced motion.** Under `prefers-reduced-motion`, every animation becomes a plain opacity fade or none, and the progress bar becomes a static bar that fades in and out.

## 8. Layout

- **Fixed header:** 56px plus the top safe area, in the `chrome` material, across the full width on every screen. Content scrolls under it and shows through the blur. It holds the sidebar toggle (desktop), the brand and the nav (Algorithms, Learn, About the API), or the menu button (mobile).
- **Sidebar:** persistent at ≥ 1024px, about 290px wide, below the header, and collapsible. Below 1024px it becomes a full-screen overlay under the header.
- **Content:** max width of about 1000–1080px on home, about 760px on the workbench.
- **Home cards:**

  | Context | Columns |
  |---|---|
  | Wide screen | 3 |
  | Sidebar open and space tight | 2 |
  | Mobile | 1 |

## 9. Screens

### Home

From top to bottom:

1. The date line (`eyebrow`, e.g. "Tuesday, November 10").
2. "What are we doing today?" (`largeTitle`).
3. The search field.
4. Three glass cards, one per family.

Each card has its family title ("Encrypt", "Hash", "Encode") and a one-line description inside it, plus a small monospace hint beside the title (`encrypt · decrypt`, `hash`, `encode · decode`). The list rows follow.

**Search:**

- Ignores accents and case.
- Matches intent titles, subtitles, algorithm names and synonyms.
- Shows "N options for '…'" while filtering, and hides cards that end up empty.
- When nothing matches, a glass message lists the available algorithms.

### Sidebar

From top to bottom:

1. Its own search field.
2. "Home".
3. The three families as accordions, each with a count.
4. The theme toggle, in the footer.

Behavior:

- When searching, only the accordions with matches stay visible, and they open themselves. Clearing the search restores the previous open/closed state.
- The current route is highlighted.
- On mobile, the overlay also lists Algorithms, Learn and About the API, as rows between the accordions and the footer, because the header nav is hidden there.
- Picking an item closes the overlay.

### Workbench

From top to bottom:

1. **Header:** the family as an eyebrow, the icon tile with the intent title, and a subtitle line with the algorithm name and security level as plain text ("Caesar · educational"), not a badge. Then a short description.
2. **Mode switch:** a segmented control (Encrypt | Decrypt, Encode | Decode), only when there are two operations.
3. **Options card:** generated from the schema (see ARCHITECTURE.md §11). Help text sits under each label, and errors expand under the field.
4. **Input card:** a growing text area, a character count, and the note "spaces count".
5. **Run:** the primary button, labeled after the current mode, with a ⌘ Enter hint on desktop.
6. **Result:** revealed below in a `ResultPanel`. "Use as input" moves the result into the input and flips the mode.
7. **Messages:** waking, rate limit, binary result and errors appear as `InlineMessage`s between Run and the result.
8. **Notes:** a per-algorithm note at the end, from the content layer.

### Other screens

Compare hash, Learn and About follow the same language: a large title, then glass cards. Article prose uses the text styles.

## 10. iOS and mobile details

**Viewport and safe areas**

- `viewport-fit=cover`, with `env(safe-area-inset-*)` padding on the header, the overlay and the bottom of scroll areas (notch and home indicator).
- `100dvh` for full-height layouts, so Safari's collapsing toolbar does not cut content.
- `-webkit-text-size-adjust: 100%`.

**Touch**

- `-webkit-tap-highlight-color: transparent`. The design system provides the press state instead.
- `touch-action: manipulation` on controls, so there is no double-tap delay.
- Hover styles only under `@media (hover: hover)`, so taps do not leave stuck hover states.

**Scrolling**

- `overscroll-behavior: contain` on the sidebar and the overlay.
- Body scroll is locked while the overlay is open.

**Keyboard and inputs**

- The on-screen keyboard must not hide the Run button or the result. The focused field scrolls into view.
- Cipher inputs and keys use the right `inputmode`, plus `autocapitalize="off"`, `autocorrect="off"` and `spellcheck="false"`. The main input sets `enterkeyhint`.

**Home screen install**

- `apple-touch-icon`, a web manifest with theme and background colors, and `apple-mobile-web-app-title`.

Screens are checked on real iOS Safari (or the simulator) before they are considered done.

## 11. Accessibility

**Keyboard**

- Everything is keyboard-operable, including the sidebar, accordions, segmented control and matrix editor.
- Focus rings are always visible.
- `/` focuses the main search, and ⌘/Ctrl+Enter runs the operation.

**Roles and announcements**

- Accordion buttons carry `aria-expanded`.
- The mobile overlay is a modal dialog, with a focus trap and Esc to close.
- Results and messages are announced through a polite live region.

**Contrast**

- Text meets AA in both themes, measured on glass.

## 12. Copy

**Voice**

- English, short, plain.
- Rows are phrased as intents ("Hide a message with a key", "Fingerprint a text"), with the technical name as the subtitle.

**API messages.** They are shown verbatim under a short headline that names what failed ("Couldn't decrypt").

**Fixed phrases**

| Situation | Copy |
|---|---|
| Waking | "Waking up the server…" |
| Rate limit | "Wait a moment" |
| Binary result | "The result is binary data" |

**Where copy lives.** All copy is in the content layer. No string literals in components.
