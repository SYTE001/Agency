# Agency OS — Portfolio Completion Plan

> This PLAN.md replaces the previous enterprise-heavy roadmap.
>
> The goal is no longer to make Agency OS an enterprise production SaaS.
> The goal is to make it a convincing portfolio product:
>
> **clean UI/UX + complete visible workflows + responsive/mobile-safe + fast + lightweight + no errors + no fake business data.**
>
> Production deployment is OUT OF SCOPE for this coding phase.

---

# 0. MAIN GOAL

Agency OS should feel like a real, polished agency-management product when someone opens the portfolio demo.

The final experience must satisfy:

```text
Looks premium
+
Feels fast
+
Works end-to-end
+
Works on desktop
+
Works on mobile
+
No broken routes
+
No visible runtime errors
+
No fake customer/business data
+
No unnecessary complexity
```

Priority:

```text
1. Data cleanliness
2. Core functionality
3. UI/UX quality
4. Responsive/mobile experience
5. Performance
6. Final demo QA
```

Do NOT optimize for enterprise completeness.

---

# 1. HARD RULES

## 1.1 No dummy business data

The database must contain NO invented/demo business records by default.

Remove or neutralize all demo data for:

- Agency
- Brand
- BrandContact
- Creator
- CreatorMetric
- CreatorPlatformAccount
- Product
- ProductMetric
- Campaign
- CampaignCreator
- CampaignProduct
- ContentItem
- ContentRevision
- LiveSession
- LiveMetric
- Task
- Activity
- Note
- Commission
- CreatorPayout
- Settlement
- Report
- Integration
- SyncJob
- SyncLog
- any other business entity

Do NOT leave fake names, fake customers, fake creators, fake campaign values, fake GMV, fake revenue, fake reports, or fake metrics.

Do NOT use placeholder business records to make the dashboard look populated.

---

## 1.2 No fake dashboard numbers

When the database is empty:

- revenue = 0
- GMV = 0
- campaigns = 0
- creators = 0
- products = 0
- LIVE sessions = 0
- tasks = 0
- reports = empty

Do not generate fake numbers.

Do not use random values.

Do not silently invoke mock sync.

Do not create synthetic metrics during page load.

---

## 1.3 Empty state must look intentional

An empty database must produce a polished product experience.

Every major module needs a useful empty state:

```text
Title
Short explanation
Primary action
Optional secondary action
```

Examples:

```text
No creators yet
Add your first creator to start managing your roster.

[ Add Creator ]
```

Do NOT display broken-looking blank pages.

Do NOT fill empty tables with fake rows.

---

# 2. AUTH / BOOTSTRAP DATA

The application still needs a legitimate way for an owner to access the system.

Allowed:

```text
bootstrap owner
```

Not allowed:

```text
demo owner
demo agency
demo customers
demo creators
demo campaigns
```

A bootstrap owner is an actual system access mechanism, not business demo data.

Requirements:

- production secrets never committed
- no hardcoded production password
- bootstrap process remains explicit
- no automatic creation of fake business records
- no demo seed on normal development startup

If the current seed script creates business demo data:

- remove that behavior
- split system/bootstrap behavior from demo data
- make normal initialization data-empty
- preserve a safe owner/bootstrap path

Do NOT require a fake agency/customer dataset just to make login work.

---

# 3. DATABASE CLEANUP

Audit all seed/demo mechanisms.

Inspect:

- prisma/seed.ts
- database initialization
- bootstrap scripts
- mock sync
- fixtures
- test-only data
- demo constants
- hardcoded dashboard values
- sample CSVs used as fake records
- development data generators

Classify each one:

```text
SYSTEM BOOTSTRAP
TEST FIXTURE
DEMO DATA
PRODUCTION DATA
```

Rules:

- TEST FIXTURE may remain if isolated from real/dev database.
- SYSTEM BOOTSTRAP may remain.
- DEMO DATA must not populate the normal application database.
- PRODUCTION DATA must never be committed.

---

# 4. REMOVE DEMO / MOCK DATA FROM UI

Search entire repository for:

- hardcoded names
- sample agency names
- sample creators
- fake GMV
- fake revenue
- placeholder campaigns
- demo task rows
- mock chart series
- static analytics arrays
- example customer names
- fake TikTok handles
- sample dashboard totals

Replace only where they are actually used as business data.

Do NOT replace legitimate:

- labels
- empty-state copy
- form placeholders
- examples inside documentation
- constants
- test fixtures

The target is:

```text
UI gets business data from DB
OR
UI renders an honest empty state
```

Never:

```text
UI invents business data
```

---

# 5. CORE FUNCTIONALITY

The portfolio demo does not need every enterprise feature.

The following visible workflows must work:

## Auth

- [ ] Login
- [ ] Logout
- [ ] Session persistence
- [ ] Protected routes
- [ ] RBAC

## Dashboard

- [ ] Loads with empty database
- [ ] Zero values are correct
- [ ] Empty/zero state is visually polished
- [ ] No runtime errors
- [ ] No fake charts

## Creators

- [ ] List
- [ ] Search/filter
- [ ] Create
- [ ] Detail
- [ ] Edit
- [ ] Archive/status

## Brands

- [ ] List
- [ ] Search/filter
- [ ] Create
- [ ] Detail
- [ ] Edit
- [ ] Archive/status

## Products

- [ ] List
- [ ] Search/filter/sort
- [ ] Create
- [ ] Detail
- [ ] Edit
- [ ] Archive/status

## Campaigns

Only implement the minimum visible flow needed for a strong demo:

- [ ] List
- [ ] Create
- [ ] Detail
- [ ] Edit
- [ ] Brand relation
- [ ] Creator relation
- [ ] Product relation
- [ ] Status
- [ ] Basic campaign metrics from real DB values

Do not build enterprise workflow complexity unless already present and stable.

## Content

Minimum useful flow:

- [ ] List
- [ ] Create/edit where already supported
- [ ] Campaign relation
- [ ] Creator relation
- [ ] Status
- [ ] Empty state

## LIVE

Minimum useful flow:

- [ ] List/calendar
- [ ] Schedule
- [ ] Detail/edit where already supported
- [ ] Creator relation
- [ ] Campaign relation
- [ ] Product/brand relation where already present
- [ ] Empty calendar state

## Tasks

- [ ] List
- [ ] Create
- [ ] Status change
- [ ] Cancel
- [ ] Filter
- [ ] Empty state

## Finance / Reports

Only preserve existing working functionality.

Requirements:

- [ ] no fake numbers
- [ ] zero/empty state when no transactions exist
- [ ] existing Decimal-safe calculations remain intact
- [ ] existing exports do not break

Do not build new accounting features for this phase.

---

# 6. UI / UX POLISH

This is now a PRIMARY objective.

Do not redesign the product concept.

Improve the existing visual system consistently.

## 6.1 Global design goals

Target:

```text
Apple-inspired
minimal
premium
quiet
high information density
clear hierarchy
fast
restrained
```

Use:

- consistent spacing
- predictable card structure
- clear typography hierarchy
- subtle borders
- restrained shadows
- strong alignment
- consistent radius
- consistent button sizing
- consistent form patterns
- clear active states

Avoid:

- excessive gradients
- excessive animations
- giant empty whitespace
- oversized cards
- unnecessary decorative effects
- visual noise
- fake "AI SaaS" styling

---

# 7. NAVIGATION / INFORMATION ARCHITECTURE

Audit the entire sidebar/topbar/navigation.

Goal:

```text
User should know where they are
and what to do next within seconds.
```

Check:

- active navigation state
- section grouping
- labels
- icon consistency
- nested routes
- breadcrumb usage where useful
- back navigation
- mobile navigation

Remove confusing duplication.

Do not remove useful existing routes.

---

# 8. DASHBOARD POLISH

Dashboard is the portfolio first impression.

Optimize:

## Top section

- clear greeting
- concise context
- useful primary actions
- correct tenant/timezone context

## Metric cards

- visually consistent
- zero-safe
- no fake numbers
- no unnecessary animation
- fast rendering

## Charts

When empty:

Do NOT draw fabricated graphs.

Use a polished empty visualization state:

```text
No data yet
Metrics will appear once activity is recorded.
```

## Activity / Tasks

Prioritize useful information instead of filling space.

---

# 9. TABLE UX

Tables are important for Agency OS.

Improve:

- row spacing
- column alignment
- status badges
- numeric formatting
- sort affordances
- filters
- search
- empty state
- hover state
- row actions
- mobile behavior

On mobile:

Do NOT force a desktop table into a tiny viewport.

Use the best existing pattern:

```text
responsive table
OR
horizontal scroll
OR
mobile card/list representation
```

Choose based on information density.

---

# 10. FORMS

All major forms should feel consistent.

Standardize:

- label hierarchy
- input height
- spacing
- required indicators
- validation text
- loading state
- disabled state
- success feedback
- error feedback
- submit/cancel actions

Avoid:

- giant forms with unclear grouping
- generic browser validation as the only feedback
- silent failures

---

# 11. EMPTY / LOADING / ERROR STATES

Every major page must explicitly handle:

## Empty

No data yet.

## Loading

Data is being fetched.

## Error

Something went wrong.

## Success

Mutation succeeded.

No route should visually collapse when one of these states occurs.

---

# 12. MOBILE / RESPONSIVE

This is a PRIMARY requirement.

Test at least:

```text
360px
390px
430px
768px
1024px
1280px+
```

Check:

- login
- dashboard
- sidebar/navigation
- tables
- forms
- detail pages
- charts
- modals
- dropdowns
- buttons
- cards
- tabs
- calendar
- finance pages

Requirements:

- no horizontal overflow unless intentional
- no clipped text
- no unusable controls
- no giant desktop-only components
- no broken fixed positioning
- no inaccessible mobile menus

Touch targets should remain comfortable.

---

# 13. PERFORMANCE

Goal:

```text
fast first render
low unnecessary JavaScript
low network duplication
low memory use
```

Audit:

- unnecessary `"use client"`
- giant client components
- duplicate requests
- unnecessary `router.refresh()`
- repeated server actions
- excessive re-renders
- oversized images
- unoptimized images
- unnecessary libraries
- polling
- setInterval
- heavy chart rendering
- giant data fetches

Do NOT optimize prematurely.

Only change confirmed bottlenecks or obvious waste.

---

# 14. DATA FETCHING

Prefer:

```text
Server Component
→ service
→ Prisma
```

Use Client Components where interaction genuinely requires them.

Avoid:

```text
Server Component
→ API
→ client fetch
→ refresh
→ duplicate fetch
```

Do not rewrite working architecture merely for theoretical purity.

---

# 15. SEARCH / FILTER / SORT

Verify every major data table:

- search works
- filter works
- sort works
- empty results are clear
- query state survives expected navigation
- SQLite development still works
- PostgreSQL compatibility remains intact

Preserve the provider-aware `containsInsensitive()` fix.

Do not regress it.

---

# 16. PERFORMANCE ON MOBILE

Do a focused mobile audit.

Pay special attention to:

- dashboard charts
- large tables
- calendar
- settings
- forms
- sidebar
- global search

Do not send unnecessary datasets to the client.

---

# 17. CONSOLE / RUNTIME CLEANUP

Before code-complete:

Search for:

- console errors
- hydration warnings
- React warnings
- missing keys
- invalid nesting
- failed requests
- failed image loads
- unhandled promise rejections

The portfolio demo should open cleanly without obvious runtime errors.

Allowed:

```text
intentional server logging
```

Not allowed:

```text
browser console red errors
framework runtime error overlays
```

---

# 18. ACCESSIBILITY BASELINE

Do not perform an enterprise accessibility rewrite.

Ensure at minimum:

- buttons are accessible
- inputs have labels
- dialogs can close
- keyboard focus is visible
- icons with actions have accessible labels
- contrast is readable
- mobile controls are usable

---

# 19. CODE QUALITY BOUNDARIES

During polish:

DO:

- remove obvious duplication
- extract repeated UI patterns
- simplify unnecessarily large components
- fix clear naming inconsistencies
- remove dead UI code
- reduce obvious client-side weight

DO NOT:

- rewrite architecture
- replace Next.js
- replace Prisma
- replace auth
- replace RBAC
- rewrite the database layer
- add frameworks without need
- build a new design system from scratch

---

# 20. FINAL DEMO QA

Run the actual app and manually verify:

## Desktop

- [ ] Login
- [ ] Dashboard
- [ ] Creator
- [ ] Brand
- [ ] Product
- [ ] Campaign
- [ ] Content
- [ ] LIVE
- [ ] Tasks
- [ ] Finance
- [ ] Reports
- [ ] Settings

## Mobile

Repeat the important flows on:

- [ ] 360px
- [ ] 390px
- [ ] 430px

## Empty database

Confirm:

- [ ] no fake business records
- [ ] no fake dashboard metrics
- [ ] no fake charts
- [ ] empty tables look intentional
- [ ] empty states have useful CTA
- [ ] login still works with legitimate owner/bootstrap flow

## Runtime

- [ ] no error overlay
- [ ] no browser console errors
- [ ] no hydration warnings
- [ ] no broken navigation
- [ ] no infinite loading
- [ ] no obvious duplicate requests

---

# 21. FINAL AUTOMATED CHECKS

Run:

```bash
npm run lint
npm test
npm run build
```

Also verify Prisma only when relevant.

Record exact results.

Never write PASS without running the command.

---

# 22. DATABASE STATE CHECK

Before declaring code complete:

Audit the local development database.

Goal:

```text
NO DEMO BUSINESS DATA
```

Expected:

- no fake creators
- no fake brands
- no fake products
- no fake campaigns
- no fake finance records
- no fake metrics
- no fake tasks
- no fake reports

Only legitimate bootstrap/auth state may exist if required for local access.

If the development database currently contains demo data:

- remove it safely
- do not reset unrelated schema
- do not touch production
- verify that empty states still work afterward

---

# 23. CODE-COMPLETE STOP CONDITION

When all above passes:

```text
UI/UX POLISH: PASS
RESPONSIVE: PASS
PERFORMANCE: PASS
EMPTY DATA: PASS
RUNTIME: PASS
LINT: PASS
TEST: PASS
BUILD: PASS
```

STOP CODE DEVELOPMENT.

Do NOT continue into production deployment.

The application is then:

```text
PORTFOLIO COMPLETE
```

not:

```text
PRODUCTION LIVE
```

---

# 24. OUTSIDE CODE — USER'S WORK

After code completion, remaining work belongs outside Claude Code:

## Vercel

- environment variables
- deployment configuration
- production settings

## PostgreSQL / Supabase

- create production database
- connection string
- migration
- production owner
- production data

## Real integrations

- TikTok developer account
- OAuth credentials
- API scopes
- approval
- production callback URL

## Domain

- DNS
- domain
- OAuth callback URLs
- HTTPS

## Real business data

- agency
- users
- brands
- creators
- products
- campaigns
- finance
- reports

No demo data should be copied into production.

---

# 25. OPERATING MODE FOR CLAUDE CODE

At the start of every task:

```text
Read PLAN.md.
Find the next unchecked item.
Implement only that scope.
Do not revisit completed work without a concrete regression.
Run validation.
Update PLAN.md.
Report.
Continue.
```

The agent may continue sequentially through the plan until:

```text
PORTFOLIO COMPLETE
```

Then it must STOP.

---

# 26. FINAL SUCCESS CRITERIA

Agency OS is finished for portfolio purposes when:

```text
No fake business data
+
Core workflows work
+
UI looks polished
+
Desktop works
+
Mobile works
+
Empty states look intentional
+
No visible runtime errors
+
No obvious console errors
+
Pages load quickly
+
No obvious unnecessary client weight
+
Lint PASS
+
Tests PASS
+
Build PASS
```

That is the end of the coding phase.
