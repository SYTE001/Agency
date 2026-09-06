# Agency OS — UX / UI / SEO / Performance Improvement Plan

> Target: transform the existing Agency OS into a faster, clearer, more premium and search-ready product without rewriting its architecture or turning the codebase into an over-engineered design system.
>
> Existing foundation: Next.js 16.3.1, React 19.2.8, Tailwind CSS 4, Prisma 7.9.1, Zod 4.4.3, Recharts 3.10.1, dual SQLite/PostgreSQL providers. `app/page.tsx` is already a Server Component and has page-level metadata; the main landing route reads the session server-side. fileciteturn2file0 fileciteturn3file0

---

## 0. NORTH STAR

Make the product feel like a serious, high-end operating system rather than an AI-generated SaaS template.

Success means:

```text
Clear in 5 seconds
Fast on mobile
Premium without decoration overload
Every interaction has an obvious next action
SEO fundamentals complete
No false claims or invented proof
No unnecessary client JavaScript
No architecture rewrite
```

Priority order:

```text
P0  correctness + UX hierarchy + SEO foundation
P1  performance + responsive behavior
P2  visual refinement + interaction polish
P3  measurement + regression guardrails
```

Do not expand product scope during this work.

---

# 1. BASELINE AUDIT — DO THIS BEFORE EDITING

Create a short audit note from the real codebase before implementation.

Inspect:

- `app/layout.tsx`
- `app/page.tsx`
- `app/(app)/**`
- all `components/landing/**`
- all `components/ui/**`
- `app/globals.css`
- `next.config.ts`
- `public/**`
- image assets
- all files using `"use client"`
- major dashboard/table/chart components
- data-fetching paths
- loading/error boundaries
- auth/session calls

Record only measurable/observable issues.

Do not invent a Lighthouse score, bundle size, Core Web Vitals value, request count, or accessibility score before testing.

---

# 2. SEO — TECHNICAL FOUNDATION

## 2.1 Metadata architecture

Root metadata is currently minimal (`title` + `description`) while the landing page overrides title/description/Open Graph. Normalize this into one intentional metadata strategy. fileciteturn4file0 fileciteturn3file0

Implement:

- consistent `metadataBase` using the real canonical production URL from deployment config; do not invent the domain
- canonical URL for public indexable pages
- meaningful title templates
- unique title + description per public route
- Open Graph title/description/site name/type/url
- Twitter/X card metadata
- `icons`/favicon references where applicable
- locale metadata only when actually supported
- prevent accidental indexing of authenticated/private routes

Do not put dashboard/private content into public SEO metadata.

## 2.2 Robots

There is no `app/robots.ts` in the current repository.

Add `app/robots.ts`.

Rules:

- allow public marketing routes
- disallow authenticated application routes, auth callbacks, internal endpoints and private utility routes
- point to the real sitemap URL
- never block CSS/JS/image assets required for rendering public pages

## 2.3 Sitemap

There is no `app/sitemap.ts` in the current repository.

Add `app/sitemap.ts` only for real public/indexable URLs.

Do not add dashboard CRUD URLs, login, settings, finance, internal search, or parameter combinations.

## 2.4 Semantic document structure

Landing page currently has semantic sections and a single `h1`; preserve that strength. Refine heading hierarchy so each section has one clear purpose and no heading is used only for visual styling. fileciteturn3file0

Use:

```text
header
main
  hero / h1
  capabilities / h2
  workflow / h2
  security / h2
  CTA / h2 or relevant heading
footer
```

## 2.5 Search intent / copy

Rewrite public copy around explicit user intent rather than generic SaaS language.

Primary topic cluster:

```text
TikTok Shop agency management
creator management
campaign management
TikTok LIVE operations
creator commissions
agency operations
```

Rules:

- one primary intent per page
- primary phrase in title, H1, first meaningful paragraph and natural supporting headings
- no keyword stuffing
- no fabricated numbers or client logos
- feature text must describe real current functionality

Existing hero contains hard-coded claims such as `70k+ Live Streams` and `1.4 million+ Monthly GMV`; these are high-risk from a trust/SEO perspective unless there is an authoritative source. Replace unsupported metrics with factual product-value statements or verified proof. fileciteturn9file0

## 2.6 Structured data

Add JSON-LD only where the content is factual and stable.

Priority:

- `SoftwareApplication` for the product
- `Organization` only when official organization identity/details are known
- `WebSite` for the public site

Do not add fake ratings, reviews, pricing, awards, screenshots or aggregate scores.

---

# 3. SEO — CONTENT + INFORMATION ARCHITECTURE

The current landing page is visually editorial but it behaves mostly as one long marketing page: Platform, Features, How it works, Security, CTA. Improve discoverability without turning it into a content farm. fileciteturn11file0 fileciteturn12file0 fileciteturn13file0 fileciteturn14file0

Recommended public information architecture:

```text
/
/features       (only if there is enough unique content)
/security       (only if useful as an independent page)
/about          (only if factual content exists)
/login          noindex
/app/**         noindex
```

Do not create pages purely to chase keywords.

Add contextual internal links where a user would naturally continue, especially from feature explanations to the login/product entry point.

---

# 4. PERFORMANCE — RENDERING STRATEGY

Current stack already supports a strong Server Component architecture; keep it. `app/page.tsx` is a Server Component and imports landing sections directly. fileciteturn3file0

## 4.1 Server-first rule

Default:

```text
Server Component
→ service/query
→ render
```

Use Client Components only for:

- stateful interaction
- event handlers
- browser APIs
- interactive charts
- theme switching
- dialogs/drawers

Do not convert server components to client components for convenience.

## 4.2 Client boundary audit

Audit every `"use client"` file.

For each one ask:

```text
Does this component truly need client state/effects/browser APIs?
```

Remove client boundaries when the answer is no.

The landing navbar currently requires client state/effects for the mobile drawer and theme behavior, so do not remove that boundary blindly. fileciteturn11file0

## 4.3 Session lookup on public landing page

`app/page.tsx` calls `getSessionUser()` server-side solely to personalize the CTA between `/overview` and `/login`. Preserve functionality, but measure the cost. fileciteturn3file0

If this materially increases TTFB for anonymous visitors:

- verify whether the session read can be made cheaper
- avoid duplicate auth/database reads elsewhere on the same request
- keep personalized CTA only if its UX value exceeds the latency cost

Do not remove authentication logic just for micro-optimization.

---

# 5. PERFORMANCE — IMAGES / FONTS / ASSETS

## 5.1 Hero image

The hero uses `next/image` with `fill`, `priority`, and explicit `sizes`, which is directionally correct. Keep the optimized image path and refine only if measured. fileciteturn9file0

Verify:

- actual source dimensions are appropriate for rendered size
- no unnecessarily huge source asset
- correct compression/format generated by Next.js
- `sizes` matches responsive layout
- only the actual LCP image is prioritized
- below-fold images are not priority-loaded

## 5.2 Decorative SVG

The hero includes a dynamically generated 24-line SVG starburst and animated transform. Prefer a static SVG/CSS representation where equivalent to reduce React work and avoid unnecessary animation. fileciteturn9file0

## 5.3 Fonts

`layout.tsx` loads Manrope, Outfit and JetBrains Mono through `next/font/google`. This is valid, but three families should be justified by actual UI usage. fileciteturn4file0

Audit:

- whether all 3 families are actually needed
- whether a single sans + mono is sufficient
- whether Outfit is essential for display typography

Do not remove fonts unless the visual system remains strong.

## 5.4 Static assets

Audit `public/**` for:

- oversized images
- duplicate images
- unused assets
- wrong formats
- decorative assets that can be CSS/SVG

Delete only confirmed dead assets.

---

# 6. PERFORMANCE — JS / DATA / NETWORK

Audit for:

- duplicate server requests
- repeated `router.refresh()`
- unnecessary polling
- unnecessary `setInterval`
- large client-fetched datasets
- repeated Prisma queries in one page
- charts rendering large datasets on first paint
- expensive derived calculations on every render
- unnecessary serialization from server to client
- client components receiving whole database records when they need only a few fields

Prefer narrow query projections and server-side aggregation.

For tables:

```text
filter/sort/paginate at source
→ return only visible rows + required counts
```

Do not ship full datasets to the browser just to filter them client-side.

---

# 7. PERFORMANCE — CHARTS

`recharts` is a dependency and charts are an obvious potential client/render cost. fileciteturn2file0

Rules:

- render charts only when data exists
- do not render fake charts for empty data
- avoid mounting many charts simultaneously when one summary is sufficient
- prefer pre-aggregated server data
- lazy-load heavy chart modules when below the fold
- reduce points for visual summaries when high resolution is unnecessary

Empty chart state must be an intentional UI, not an empty canvas.

---

# 8. UI/UX — DESIGN DIRECTION

Visual target:

```text
Apple-like product discipline
Swiss/editorial structure
premium enterprise software
high information density
quiet confidence
minimal decoration
```

The existing landing page already uses a restrained neutral palette, thin dividers, strong type and warm accent. Keep the visual language, but remove ornamental details that do not improve comprehension. fileciteturn5file0

Do NOT transform the product into:

- gradient-heavy AI SaaS
- glassmorphism everywhere
- glowing borders
- excessive floating cards
- oversized rounded containers
- constant motion
- excessive iconography

---

# 9. UI SYSTEM — TOKENS AND CONSISTENCY

`globals.css` already defines design tokens for background, card, muted text, borders, brand, semantic states, radii and fonts. Consolidate usage around these tokens instead of repeated hard-coded colors. fileciteturn5file0

## 9.1 Rule

Prefer:

```text
bg-background
text-foreground
text-muted-foreground
border-border
bg-card
bg-brand
```

over repeated literal hex values inside components.

This is especially important because landing components currently repeat literal palette values extensively. fileciteturn9file0 fileciteturn11file0 fileciteturn12file0

## 9.2 Spacing

Define and consistently reuse a small spacing rhythm.

Target:

```text
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96
```

Do not add arbitrary one-off spacing unless composition genuinely requires it.

## 9.3 Radius

Keep radius restrained.

Use:

- small controls: small radius
- cards: medium radius
- primary CTA: pill only where semantically appropriate

Do not make every container circular/pill-shaped.

---

# 10. LANDING PAGE — ABOVE THE FOLD

The hero is visually distinctive but currently contains several competing visual elements: oversized headline, image, floating cards, rotating starburst, metric blocks and decorative lines. fileciteturn9file0

Refine it to a clearer hierarchy:

```text
1. eyebrow / category
2. H1 = product outcome
3. supporting paragraph
4. one primary CTA
5. optional secondary link
6. product visual
7. concise proof / capability strip
```

Rules:

- H1 should communicate the product value, not only the category name
- one primary CTA should dominate
- proof must be factual
- decorative overlays should support the hierarchy, not compete with it
- remove any visual element that takes attention away from CTA or product visual

Avoid changing the entire art direction; refine it.

---

# 11. LANDING PAGE — NAVIGATION

Current navbar is client-side because of the mobile drawer and includes theme toggle + CTA. It has useful accessible labels/expanded state, but its mobile drawer is a custom fixed dialog. fileciteturn11file0

Improve:

- sticky navigation only if it measurably helps users
- clear active/hover/focus states
- correct focus management when drawer opens
- focus return to trigger when drawer closes
- Escape support
- inert/background interaction lock where appropriate
- avoid duplicate navigation labels between header and drawer
- keep CTA persistent without making header visually heavy

On mobile:

- prioritize CTA + menu
- keep navigation touch targets comfortably sized
- avoid covering the entire screen unless navigation actually needs it

---

# 12. LANDING PAGE — CONTENT SCANNABILITY

Current feature sections are text-heavy four-pillar grids with repeated descriptive paragraphs and bullet lists. fileciteturn12file0

Improve scanability:

- shorten paragraph widths
- use stronger visual distinction between category/title/details
- surface the single most valuable feature per module
- move secondary implementation details below the main message
- use progressive disclosure where a long list is not necessary

The objective is not to remove information; it is to reduce cognitive load.

---

# 13. PRODUCT UI — INFORMATION ARCHITECTURE

Audit authenticated application navigation using this test:

```text
Where am I?
What is important here?
What can I do next?
What changed?
```

For each major route ensure:

- one clear page title
- one concise description when useful
- primary action visible without hunting
- filters/search placed near the data they control
- destructive actions visually separated
- detail/edit actions predictable
- breadcrumbs only where hierarchy is deep enough to justify them

Do not add UI chrome just because enterprise products often have it.

---

# 14. DASHBOARD UX

Dashboard should prioritize operational decisions, not visual density.

Recommended hierarchy:

```text
Header + primary action
→ critical metrics
→ urgent tasks / upcoming LIVE
→ recent operational activity
→ secondary analytics
```

Rules:

- never fabricate metrics
- zero state must look intentional
- no chart when no data
- metric cards should answer a question, not merely show a number
- use consistent numeric formatting
- show context/period next to time-based metrics
- keep primary actions visible on mobile

---

# 15. TABLE UX

Tables are core to agency operations.

Standardize:

- row height
- header hierarchy
- alignment
- status badge semantics
- action placement
- selection behavior
- search/filter placement
- empty state
- loading skeleton
- error state
- pagination/infinite loading behavior

Rules:

```text
Name/text → left
Status → compact badge
Counts/money → right
Primary action → predictable location
Destructive action → separated
```

Mobile strategy must be deliberate:

- card representation for low-column entities
- horizontal scroll for dense analytical tables
- never squeeze 8–12 columns into a 360px viewport

---

# 16. FORMS + CRUD UX

Standardize every create/edit flow.

Required behavior:

```text
idle
→ editing
→ validating
→ submitting
→ success/error
```

Implement:

- labels always visible
- clear required/optional treatment
- field-level validation
- server error mapping
- submit pending state
- disabled duplicate submit
- success feedback
- preserve entered values after recoverable errors
- cancel/back without accidental data loss

Use existing Zod validation and server actions; do not introduce a second validation system. The repository already uses Zod and server-action architecture. fileciteturn2file0

---

# 17. EMPTY / LOADING / ERROR / SUCCESS STATES

Create a consistent state vocabulary across the entire app.

## Empty

```text
Title
Why it is empty
Primary action
Optional secondary action
```

## Loading

Use layout-preserving skeletons only for meaningful loading regions.

Do not animate entire pages during routine navigation.

## Error

Show:

- what failed
- what the user can do
- retry when safe

Do not expose stack traces.

## Success

Use concise inline/toast feedback; avoid disruptive modal confirmations for routine mutations.

---

# 18. MICRO-INTERACTIONS

Motion should communicate state, not decorate screens.

Allowed:

- subtle hover transitions
- pressed state
- focus state
- drawer enter/exit
- small loading indicators
- chart entrance only where useful

Avoid:

- continuous decorative animation
- excessive `animate-*`
- parallax
- scroll-triggered effects on every section
- animations that delay interaction

Respect `prefers-reduced-motion` globally for non-essential motion.

The current hero uses continuous starburst rotation and multiple hover/scale effects; reduce these to one or two intentional interactions. fileciteturn9file0

---

# 19. ACCESSIBILITY

Baseline requirements:

- semantic landmarks
- one logical H1 per page
- keyboard navigation
- visible focus ring
- labels for inputs
- icon-only buttons with accessible names
- dialogs with correct semantics
- Escape behavior
- sufficient text contrast
- no color-only status meaning
- reduced-motion support
- logical tab order
- touch targets that are usable on mobile

Current navbar already exposes `aria-label` and `aria-expanded`; preserve and extend that quality. fileciteturn11file0

Do not perform a broad accessibility rewrite unrelated to real defects.

---

# 20. DARK MODE

The theme system currently uses a client provider with `useSyncExternalStore` and toggles the root `dark` class in an effect. fileciteturn15file0

Audit for:

- initial theme flash
- contrast parity
- token consistency
- hard-coded light-mode colors inside components
- charts/icons that disappear in dark mode
- native form controls

Prefer token-based styling over per-component light/dark hex overrides.

Do not remove dark mode; make it coherent.

---

# 21. RESPONSIVE QA

Test at:

```text
360px
390px
430px
768px
1024px
1280px
1440px+
```

Priority surfaces:

- landing hero
- navbar/drawer
- login
- dashboard
- tables
- forms
- dialogs
- charts
- calendar
- finance tables

Check:

- no accidental horizontal overflow
- no clipped dialogs
- no oversized headings
- CTA remains visible
- table strategy is intentional
- spacing does not become excessive on desktop
- touch controls remain comfortable

---

# 22. SECURITY / TRUST COPY

The current security section makes detailed claims about tenant isolation, JWT/HMAC, scrypt and database architecture. These claims should remain only when directly true in the current implementation. fileciteturn14file0

Rule:

```text
Marketing claim = implementation fact
```

Do not use vague security buzzwords.

Do not expose internal implementation details that create unnecessary attack surface or confuse users.

Prefer outcome-oriented wording backed by the actual architecture.

---

# 23. SEO + UX CONTENT TRUST

Remove unsupported marketing proof from public pages.

Review for:

- invented customer counts
- invented GMV
- invented usage stats
- fake testimonials
- fake logos
- fake ratings
- fake security certifications
- fake integration claims

The README explicitly states mock TikTok sync is not an official TikTok API connection; public marketing copy must never imply an official integration exists unless that changes. fileciteturn16file0

---

# 24. CODE QUALITY / SCOPE CONTROL

DO:

- reuse existing UI primitives
- extract repeated visual patterns only when repetition is real
- reduce repeated hard-coded values
- simplify oversized client components
- delete dead UI code
- improve naming where directly related to edited areas

DO NOT:

- replace Next.js
- replace Prisma
- replace auth
- replace Zod
- replace Tailwind
- introduce a component library without a concrete gap
- create a giant new design system
- rewrite working database services
- add dependencies unless there is a measurable requirement

---

# 25. IMPLEMENTATION ORDER

## P0 — FOUNDATION

- [ ] baseline performance/a11y/SEO measurements
- [ ] normalize metadata
- [ ] add robots
- [ ] add sitemap
- [ ] canonical/OG/Twitter foundations
- [ ] audit indexability of private routes
- [ ] remove unsupported public metrics/claims
- [ ] establish semantic heading hierarchy
- [ ] tokenize repeated landing colors

## P1 — HIGH IMPACT UX

- [ ] simplify above-fold hierarchy
- [ ] refine navbar/mobile drawer behavior
- [ ] standardize primary/secondary CTA patterns
- [ ] standardize table UX
- [ ] standardize forms
- [ ] standardize empty/loading/error states
- [ ] responsive pass across core routes

## P1 — PERFORMANCE

- [ ] client-boundary audit
- [ ] request duplication audit
- [ ] query/data payload audit
- [ ] image asset audit
- [ ] font necessity audit
- [ ] chart lazy-loading/data reduction where justified
- [ ] decorative animation reduction

## P2 — VISUAL REFINEMENT

- [ ] unify spacing/radius/type scale
- [ ] remove unnecessary decoration
- [ ] refine card density
- [ ] improve dashboard hierarchy
- [ ] dark-mode consistency pass
- [ ] reduced-motion support

## P3 — REGRESSION GUARDRAILS

- [ ] automated lint/test/build
- [ ] Lighthouse/DevTools checks on representative routes
- [ ] accessibility keyboard sweep
- [ ] mobile sweep
- [ ] browser console sweep
- [ ] verify public/private indexing rules

---

# 26. PERFORMANCE ACCEPTANCE TARGETS

Do not hard-code success numbers without measuring them first.

Use these as engineering targets:

```text
No obvious render-blocking custom JS on the public landing page
No unnecessary client-side data fetching for static marketing sections
LCP image is correctly prioritized
CLS caused by app UI = effectively zero
No accidental horizontal overflow at mobile widths
No repeated network request loops
No visible hydration warnings
```

For Core Web Vitals, measure real production-like builds with Chrome DevTools/Lighthouse or equivalent. Record actual results in the completion note; never write fabricated scores.

---

# 27. SEO ACCEPTANCE CHECKLIST

```text
[ ] indexable public pages have unique titles
[ ] unique meta descriptions
[ ] canonical URLs
[ ] Open Graph metadata
[ ] Twitter/X metadata
[ ] robots generated
[ ] sitemap generated
[ ] private app routes excluded
[ ] one meaningful H1 per public page
[ ] logical H2/H3 hierarchy
[ ] semantic landmarks
[ ] descriptive internal links
[ ] factual structured data only
[ ] no fake proof/metrics
[ ] image alt text describes meaningful images
[ ] decorative images use empty alt / hidden semantics
```

---

# 28. UX ACCEPTANCE CHECKLIST

```text
[ ] User knows where they are
[ ] User sees the primary action immediately
[ ] Forms explain errors locally
[ ] Tables are readable without guesswork
[ ] Empty states tell the user what to do next
[ ] Loading states preserve layout
[ ] Destructive actions are obvious
[ ] Mobile navigation is predictable
[ ] Keyboard navigation works
[ ] Dark mode preserves hierarchy
[ ] Motion is restrained
```

---

# 29. FINAL VALIDATION

Run the real commands:

```bash
npm run lint
npm test
npm run build
```

Then run a production-like local server:

```bash
npm run start
```

Validate at least:

```text
/
/login
/dashboard / overview equivalent
/creators
/brands
/products
/campaigns
/content
/live
/tasks
/finance
/reports
/settings
```

For each route verify:

- HTTP response works
- no runtime error
- no console error
- no hydration warning
- mobile layout works
- main action works
- loading/empty/error state works where applicable

For public pages also verify:

- title
- description
- canonical
- OG
- robots
- sitemap inclusion/exclusion

---

# 30. STOP CONDITIONS

Stop when:

```text
SEO FOUNDATION: PASS
PUBLIC INDEXING: PASS
UX HIERARCHY: PASS
RESPONSIVE: PASS
PERFORMANCE: PASS
ACCESSIBILITY BASELINE: PASS
VISUAL CONSISTENCY: PASS
LINT: PASS
TEST: PASS
BUILD: PASS
```

Do not continue into:

- production deployment
- real TikTok API integration
- new accounting features
- enterprise workflow expansion
- unrelated refactors

The goal of this plan is product quality, not feature count.

---

# 31. AGENT EXECUTION RULES — ANTI SLOP / TOKEN CONTROL

This section is mandatory for the coding agent.

## Rule A — Inspect before modifying

Before each change:

```text
read the target file
identify the exact defect
make the smallest coherent change
```

Do not rewrite whole files when a focused edit is enough.

## Rule B — No speculative dependencies

Do not install a package because it is popular.

Every new dependency must have:

```text
specific problem
measurable benefit
no simpler existing solution
```

## Rule C — No invented design language

Do not generate random gradients, glass cards, glow effects, giant rounded cards, random badges or decorative grids.

Stay inside the existing neutral/editorial visual language.

## Rule D — No fabricated proof

Never create numbers, testimonials, client logos, ratings, certifications, usage claims or integration claims.

## Rule E — Preserve working architecture

Prefer incremental edits over architectural rewrites.

## Rule F — Measure before performance claims

Never state “faster”, “optimized”, “Lighthouse 100”, “zero CLS”, etc. unless it was actually tested.

## Rule G — One concern per change

Group related edits, but avoid mixing unrelated refactors into the same change.

## Rule H — Keep diff reviewable

After each logical phase:

```bash
git diff --stat
git diff --check
```

Review changed files before moving on.

## Rule I — Preserve data truth

Business UI must always come from real data or honest empty state.

## Rule J — STOP when acceptance criteria pass

Do not keep polishing indefinitely.

---

# 32. FIRST ACTION

Start with:

```text
1. inspect current route tree + landing + global styles + client boundaries
2. run baseline lint/test/build
3. run a production build and performance inspection
4. audit public metadata/indexability
5. produce a prioritized defect list
6. implement P0 only
7. validate before P1
```

Do not start by redesigning every page.

Fix hierarchy and foundations first; visual polish comes after the system is correct.
