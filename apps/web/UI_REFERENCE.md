# UI Reference And Design Translation

## Source Assets

The current visual references live in `apps/web/design-inspo/` and include:

- `original-03f5bbc4821bdc0263aef9290f2b2ba8.webp`
- `original-6c7b6700c51ccb1e3891def336f6b187.webp`
- `original-94449de32ca244b9388bd980b1dbe1dc.webp`
- `original-c144b75daafe1e79db56233940f992bf.webp`
- `original-f5439ab36a367f8370b2a6f5a0204d8c.webp`
- `original-55b4a41782c50ce0816388e539ba2c38.mp4`

These references suggest a strong direction similar to a luxury editorial home/lifestyle commerce brand rather than a dense marketplace UI.

## What The References Emphasize

### Visual language

- oversized serif typography with narrow high-contrast letterforms
- extremely sparse layouts with generous whitespace
- restrained navigation and tiny utility actions
- product photography treated like gallery art rather than grid thumbnails
- soft bone, ivory, oat, clay, moss, cocoa, and charcoal tones
- thin strokes and pill controls instead of heavy filled UI
- compositions that alternate between immersive photo blocks and quiet text fields

### UX direction

- product storytelling first, utility controls second
- editorial pace over dashboard density
- shallow chrome and low-noise navigation
- mobile layouts that keep the same visual language rather than collapsing into generic cards
- premium feel through proportion, spacing, and typography rather than decoration
- **Consent toast:** rounded card (`~1.25rem`), thin border, quiet copy + outline **Review controls**; tied to **scroll position** — visible **near the top**, **slides off to the right** when the page is scrolled down, **returns** when the user **scrolls back to the top** (Framer Motion spring; brief transition when **`prefers-reduced-motion`**)

## Design System Translation For HyperPersona

### What to adopt directly

- large serif display headlines
- calm neutral base palette
- rounded pill controls with thin borders
- quiet nav and iconography
- asymmetrical editorial section layouts
- product pages with strong negative space

### What to adapt for HyperPersona

- keep the luxury/editorial feel, but make room for recommendation, consent, profile, and debug surfaces
- preserve the minimal design language while ensuring explainability UI remains understandable
- use tokenized styling so brand direction can evolve later without rewriting components

### What not to copy blindly

- don’t hide key interaction affordances for cart, consent, or search
- don’t let oversized editorial typography break readability on data-heavy personalized surfaces
- don’t sacrifice accessibility contrast or focus clarity for minimalism

## Initial Token Direction

### Colors

- base background: warm ivory / parchment
- surface: soft white with subtle warmth
- ink: deep charcoal brown rather than pure black
- accent: muted terracotta or clay
- secondary accent: moss / eucalyptus for product color moments
- support tones: oat, sand, dusty rose, washed gold

### Typography (locked to reference PDP / editorial)

**Stacks** (loaded in `src/shared/styles/app.css`, wired as Tailwind `font-display` / `font-body`):

| Role | Family | Weights | Notes |
|------|--------|---------|--------|
| Display / wordmark / serif headlines | **Playfair Display** | 400–600 | High-contrast “modern serif” feel; use **normal (400)** for long display lines and mega wordmarks, **medium (500)** for product titles. |
| UI, body, forms, nav | **Inter** | 400–600 | Neutral sans per reference body copy; slightly negative tracking at root. |

**Theme tokens** (`@theme` in `app.css`):

- `--font-display`, `--font-body`
- `--tracking-display` (−0.042em) — default serif headlines, newsletter titles
- `--tracking-display-tight` (−0.055em) — wordmarks, multi-line editorial blocks, tight kerning like ref crops
- `--tracking-body` (−0.012em) — applied on `body` for UI + paragraphs
- `--tracking-ui-wide` (0.14em) — uppercase eyebrows / footer column labels

**Compositions** — do **not** re-specify `font-display` + ad hoc tracking in features; use `src/shared/ui/tw.ts`:

- `tw.displayH1`, `tw.displayH2`, `tw.storyTitle`
- `tw.displayProductTitle` (PDP product name)
- `tw.displayWordmarkNav`, `tw.displayWordmarkFooter`
- `tw.displayNewsletterHeading`, `tw.editorialStoryHeadline`
- `tw.eyebrow` (uppercase labels)

**Leading**: display lines use tight leading (`leading-[0.98]`–`leading-[1.06]` in `tw.*`) so descenders/ascenders sit close like the reference, without clipping.

### Shape and motion

- high radius on pills, softer radius on larger cards
- sparse use of motion
- fades and lifts only, no flashy transforms
- **Animations:** implement interactive motion with **Framer Motion** (`framer-motion` — `motion.*` components), not CSS-only transitions, so springs and **`prefers-reduced-motion`** handling stay consistent (`FE_PLAN` — Motion / animation)

## Implementation Guidance

- Keep all styling decisions token-driven: semantic tokens live in `@theme` inside `src/shared/styles/app.css` (imported from `main.tsx`). Reusable Tailwind compositions that map to those tokens live in `src/shared/ui/tw.ts`; prefer utilities and `tw.*` helpers over ad hoc hex or magic numbers in components.
- Keep the layout system generic enough that the design can later pivot without changing route and feature architecture.
- Apply this reference most strongly to:
  - home hero
  - header
  - **catalog, search, wishlist, home rails, PDP suggestions** — one **`ProductGrid`** + **`ProductCard`** pair everywhere (1px **`#e5e5e5`** hairline lattice on shell + cells—transparent fill, parent background only; Motion hover on cells); **do not** fork alternate product tiles for rails—**`EditorialNewCollectionSection`** is the only bespoke product grid; serif filter labels, dashed pill native `<select>`s on **`/catalog`**; **fixed max width per tile**; **`/catalog`** uses the **same body canvas** as the rest of the app; **department** filters need a **high-contrast selected** state (filled chip), not dashed-only idle styling
  - PDP hero
  - recommendation rail framing
  - newsletter or trust sections
  - profile/explanation surfaces
- **Loading:** use **pulse skeletons** that mirror final layout (`CatalogToolbarSkeleton`, `CatalogProductGridSkeleton`, `ProductDetailSkeleton`, `PdpSuggestionsRailsSkeleton`) instead of bare “Loading…” copy where the layout is editorial (`FE_PLAN`).

## Relation To Skills

### `extract-design-system`

Not applicable to these local media assets directly. Use it later if a public website URL is provided and we want token extraction artifacts.

### `web-design-guidelines`

This design direction still needs:

- visible focus states
- labeled controls
- responsive semantics
- proper image dimensions
- accessible interaction feedback

Minimalism should not weaken usability.
