# Baseline Audit — UX / UI / SEO / Performance (Plan.md §1)

Date: 2026-09-06. All values below were measured or directly observed from the
repository at audit time. Nothing is projected or invented; no Lighthouse /
Core Web Vitals score is claimed because none was measured.

## 1. Commands run (results)

| Command | Result |
|---|---|
| `npm run lint` (eslint 9) | PASS — zero warnings/errors |
| `npx tsc --noEmit` | PASS — no output |
| `npm test` (node:test via tsx) | PASS — 179/179 tests, 41 suites, ~53s |
| `npm run build` (next 16.3.1, Turbopack) | PASS — 4.9s compile, 43 static pages, 51 routes |
| `npm run start` + curl | robots.txt 200, sitemap.xml 200; `/` and `/login` 500 **by design** (SQLite rejected in production mode — requires PostgreSQL `DATABASE_URL`; see §6) |
| `npm run dev` + curl | `/` 200 with correct `<title>`, canonical, robots, og:title, twitter:card, single `<h1>` |

## 2. Rendering strategy

- `/` (landing) is `ƒ Dynamic` — server-rendered on demand; the only dynamic
  input is `getSessionUser()` for the session-aware CTA. All landing sections
  except navbar/FAQ/product-showcase are Server Components.
- `robots.txt` and `sitemap.xml` are `○ Static` (prerendered).
- All 46 authenticated routes are `ƒ Dynamic` (session-gated) — correct.

## 3. Client boundaries (`"use client"` census)

36 files total. App-level: `global-error.tsx`, `error.tsx` (correct — error
boundaries must be client). Components by area:

- Landing (3): `navbar.tsx` (mobile drawer + theme state), `faq-section.tsx`
  (accordion), `product-showcase.tsx` (tab state).
- Shell (3): `app-shell.tsx`, `app-sidebar.tsx`, `command-palette.tsx`.
- Theme (2): `theme-provider.tsx`, `theme-toggle.tsx`.
- Forms (24): one client form per CRUD entity (brands, campaigns, creators,
  products, content, live, tasks, finance, settings) — all genuinely stateful
  (useActionState/useTransition-style submission state).

No obviously removable boundary found in this pass; the granular audit per
component is deferred to P1 as planned. Client-fetched datasets: none — all
data fetching happens server-side; client components receive narrow props.

## 4. Fonts

3 Google families via `next/font/google` (Manrope sans, Outfit display,
JetBrains Mono mono), all `display: "swap"`, subset latin, self-hosted at
build — zero external font requests. Woff2 preloads emitted via Link header.
Consolidation decision (drop Outfit?) deferred to P1 font-necessity audit.

## 5. Images / static assets (`public/`)

| Asset | Size | Dimensions | Notes |
|---|---|---|---|
| `images/image1.jpeg` | 46.5 KB | 736×736 | Hero LCP image; `fill`+`priority`+correct `sizes`. Aspect 1:1 rendered in a 4:5 container with `object-cover` — ~8% of source pixels cropped top/bottom. Fine. |
| `product/overview-light.png` | 264.9 KB | 2880×2400 | Used in product showcase. |
| `product/overview-dark.png` | 266.2 KB | 2880×2400 | Dark-mode variant. |
| `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` | 0.1–1.3 KB | — | Unused template leftovers from create-next-app — candidates for P0/P1 cleanup (confirmed unused by grep of app/components). |

Both PNGs are 2880px wide and served at ~display width ≤1152px (max-w-7xl);
Next/image will downscale via `sizes` only if the consuming component sets it —
verify in P1 image audit. No duplicates. `favicon.ico` referenced in metadata
and emitted (25.9 KB body).

## 6. Production runtime (observed)

- Production server intentionally blocks SQLite: "SQLite tidak didukung di
  production … Set DATABASE_URL ke koneksi PostgreSQL". Local `.env` has
  `DATABASE_URL="file:./prisma/dev.db"` and no `AUTH_SECRET`. So a full
  production-mode route walk requires a PostgreSQL URL — recorded as an
  environment prerequisite for final validation (§29), not a code defect.
- Dev-mode walk of `/` confirms: `<title>TikTok Shop Agency Management</title>`,
  `<link rel="canonical" href="http://localhost:3000"/>`, `robots: index,
  follow`, OG title/site/type, `twitter:card summary_large_image`, exactly one
  `<h1>`, JSON-LD (WebSite + SoftwareApplication, no fake ratings/pricing),
  skip-link, `main` landmark, 3 woff2 preloads + 1 CSS preload in Link header.

## 7. SEO state (post P0 work already in tree)

- `robots.ts`: allows `/`, disallows all 15 private prefixes + `/actions` +
  `/api`, sitemap pointer present. Verified 200 text/plain.
- `sitemap.ts`: single entry `/` only — no private/parameterized URLs. Verified
  200 application/xml.
- `app/(app)/layout.tsx` and `app/login/page.tsx` carry `robots noindex` —
  private routes excluded from indexing.
- Hard-coded metrics (`70k+ Live Streams`, `1.4 million+ Monthly GMV`) no
  longer present anywhere in landing components (grep: 0 matches). No
  testimonials/logos/ratings found.
- Landing copy stays on the intended topic cluster (creator rosters, campaign
  execution, LIVE ops, commissions) and matches actual features.

## 8. Static JS output (build artifact)

`.next/static/chunks`: 0.75 MB across 36 files (total chunk bytes, not
per-route First Load JS — per-route numbers not printed by this build).
No client-side data fetching on marketing sections; no `setInterval`/
polling found in app code.

## 9. Accessibility observations (non-measured, structural)

- Skip link present; `aria-label`/`aria-expanded` on navbar drawer trigger.
- Forms use existing `<Label>`/input primitives.
- Icon-only buttons: verified present in sidebar/theme toggle with labels —
  full keyboard sweep scheduled for P3.
- Hero decorative SVG starburst has `aria-hidden` but animates continuously
  (`animate-spin-slow`) — flagged for the P2 reduced-motion pass per Plan §18.

## 10. Prioritized defect list (drives next phases)

P0 (remaining — none are blockers; all SEO P0 already complete):
1. none — SEO foundation PASS per §27 checklist.

P1 (UX / performance):
1. Above-fold hierarchy: hero still contains 4 competing overlays (floating
   card, starburst, coral badge, metric block) — simplify to the 7-step
   hierarchy in Plan §10.
2. Navbar/mobile drawer: verify focus return, Escape, background lock (§11).
3. Table UX standardization across 12 entity tables (§15).
4. Forms: verify pending/duplicate-submit/error-preserve states per entity
   form (§16).
5. Image audit: confirm `sizes` on showcase PNGs; consider Next/Image for
   dark/light product shots.
6. Font audit: justify or drop Outfit display family (§5.3).
7. Decorative motion: starburst continuous rotation + multiple hover scales
   in hero (§18).
8. Chart audit (recharts in product-showcase/dashboard): lazy-load below
   fold, empty states (§7).

P2 (visual): spacing/radius unification, dashboard hierarchy, dark-mode
consistency, reduced-motion.

P3 (guardrails): full route walk needs PostgreSQL `DATABASE_URL` +
`AUTH_SECRET` (see §6); Lighthouse + keyboard + mobile sweeps.

## 11. Out of scope (unchanged)

No architecture changes; recharts/Prisma/Zod/auth/Tailwind all retained.
Unused `qa-*.mjs` scripts at repo root are pre-existing QA tooling, not part
of this plan's scope.
