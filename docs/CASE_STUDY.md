# Engineering Case Study

## Constraints & scope

Agency OS is a Next.js App Router application for TikTok Shop agency operations. It is intentionally server-backed and multi-tenant: Prisma services, server actions, JWT sessions, RBAC, and dual PostgreSQL/SQLite providers are core constraints. It is not a client-only e-commerce storefront and has no payment gateway.

## Data access pattern

All database access is isolated in `lib/services/*`. Pages compose service results, while server actions validate input and re-check the authenticated tenant and role. This boundary keeps provider-specific Prisma code out of UI components and makes the SQLite development path interchangeable with PostgreSQL production.

## State & UX

URL search parameters are used where list views need shareable filters or pagination. This gives users deep links and browser history support without duplicating server-owned state in a global client store.

## Accessibility

The application uses semantic headings, labeled controls, keyboard-visible focus states, skip links, and `role="dialog"` overlays where applicable. Client overlays close through explicit controls and `Escape`; future modal work should add a focus trap and inert background as a reusable primitive. Search and command palette behavior should preserve combobox semantics and announce result changes through an ARIA live region.

## Roadmap

1. Add typed API contracts around service methods and generate request/response schemas.
2. Extract authenticated fixtures for Playwright and cover role-specific journeys.
3. Move selected long-running sync operations to queued jobs with observable status.
4. Add a BaaS or API-route boundary only where external integrations require it; retain tenant and RBAC checks at the server boundary.

## Asset licensing / credits

Product and UI imagery is served from repository-local files under `public/`. No runtime Unsplash dependency is assumed. Every future external asset should record its source, license, and attribution in this section or an adjacent asset manifest.
