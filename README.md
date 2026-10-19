# Agency OS

[![CI](https://github.com/SYTE001/Agency/actions/workflows/ci.yml/badge.svg)](https://github.com/SYTE001/Agency/actions/workflows/ci.yml) [![Node](https://img.shields.io/badge/node-20.19%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

[Engineering Case Study](docs/CASE_STUDY.md) · [Testing Strategy](docs/TESTING.md) · [PostgreSQL Migration Audit](docs/production-readiness.md) · [Baseline Audit](docs/baseline-audit.md)

## Product purpose

**Agency OS** is a multi-tenant internal operations workspace for TikTok Shop agencies managing creator rosters, brand partners, product catalogs, campaigns, content pipelines, LIVE streaming schedules, operational tasks, commissions, creator payouts, and brand settlements.

It is designed as an internal agency system of record—not a consumer e-commerce storefront, shopping cart, or payment gateway. Every business record is scoped to an `Agency` (`agencyId`), and mutations are gated by server-side role-based access control (RBAC).

## Implemented features

- **Operations Overview (`/overview`)**: Tenant-scoped KPI summary (GMV, active creators, active campaigns, upcoming LIVE sessions), GMV trend chart, active project tracking, recent activity feed, and operational alerts (overdue tasks, overdue content drafts, pending settlements).
- **Master Data Management (`/creators`, `/brands`, `/products`)**: Multi-tenant CRUD for creators (category, health status, platform handles, metrics), brands (primary contacts, status), and products (agency-scoped SKU uniqueness, `Decimal` pricing, soft archive/inactive status).
- **Campaign, Content, LIVE, & Task Workflows (`/campaigns`, `/content`, `/live`, `/tasks`)**:
  - Campaign planning and tracking with GMV, content, creator, and LIVE session targets.
  - Content production pipeline and review workflow across lifecycle states (`Brief`, `Assigned`, `WaitingForDraft`, `DraftSubmitted`, `Revision`, `Approved`, `Scheduled`, `Published`, `Rejected`, `Cancelled`).
  - LIVE streaming session logging and calendar scheduling (`/live/schedule`) with tenant timezone handling.
  - Operational task assignment, status transitions, overdue calculation, and cancellation.
- **Financial Operations (`/finance`, `/finance/commissions`, `/finance/payouts`, `/finance/settlements`)**: Deterministic integer-Rupiah calculations (`lib/finance.ts`) and `Decimal` persistence for creator commissions, agency revenue share, creator payouts, and brand settlement tracking.
- **Reporting & CSV Exports (`/reports`, `/reports/internal`)**: Client-facing and internal agency performance summaries with downloadable CSV export routes (`/reports/export/client`, `/reports/export/internal`) and CSV template downloads for bulk imports.
- **Authentication, Session Security, & Server-Side RBAC (`/login`, `/settings/*`)**:
  - Signed `HS256` JWT sessions (`jose`) stored in `httpOnly` cookies, with user role and `agencyId` re-resolved from the database on every request (`lib/auth.ts`).
  - Open-redirect sanitization on login `next` destinations (`lib/redirect.ts`) and `no-store` cache headers on protected routes (`proxy.ts`).
  - Server-side permission matrix (`lib/authorization.ts`) across 8 roles: `owner`, `admin`, `account_manager`, `creator_manager`, `campaign_manager`, `live_manager`, `finance`, and `viewer`.
  - Team user management (`/settings/users/*`), role matrix inspection (`/settings/roles`), and agency profile/timezone settings (`/settings/agency`).

## TikTok integration scope & limitations

The Integrations module (`/settings/integrations`) does **not** connect to a live TikTok Shop Partner API and does **not** implement live TikTok OAuth. Instead, the repository currently provides:

1. **CSV Bulk Import**: Bulk creation and update of creators (`importCreatorsCsv`) and products (`importProductsCsv`) from semicolon-delimited CSV files, matching records per tenant by `externalId` or `username`/`name` to prevent duplicates.
2. **Deterministic Mock Sync (Development/Demo Only)**: A simulated sync job (`runMockSync` in `lib/services/integrations.ts`) that writes reproducible `CreatorMetric` rows for active creators with an `externalId` without modifying campaign GMV or business records. Mock sync is disabled by default and requires both `MOCK_SYNC_ENABLED=true` and `NODE_ENV !== "production"` (it is explicitly rejected in production mode).

## Development status

This repository is an active portfolio and engineering project (`v0.1.0`):

- **Implemented & verified in repo**: Full Next.js App Router UI and server actions, dual-provider Prisma schema (PostgreSQL + SQLite twin with compile-time schema-drift guard), tenant isolation, RBAC enforcement, integer-safe IDR commission math, unit/service/integration test suites, and Playwright E2E authentication/routing checks.
- **Not yet implemented**: Live TikTok Partner API / OAuth integration, Google Workspace or Microsoft Entra ID SSO (SSO buttons on `/login` display informational status modals), self-service email password reset, background job queues for long-running syncs, and live production performance/load benchmarks.

## Tech stack

| Area | Choice |
| --- | --- |
| Application | Next.js 16.3.1 (App Router, Server Components, Server Actions), React 19, TypeScript 5 |
| UI | Tailwind CSS 4, Lucide Icons, Recharts |
| Data | Prisma 7.9.1, PostgreSQL (`@prisma/adapter-pg`, `pg`), SQLite (`@prisma/adapter-better-sqlite3`, `better-sqlite3`) |
| Validation & Auth | Zod 4, `jose` JWT sessions, `scrypt` password hashing (`node:crypto`), server-side RBAC |
| Quality & Testing | ESLint 9, Biome, Vitest, Node `node:test`, Playwright |
| Tooling & CI | GitHub Actions, Dependabot, Husky, lint-staged |

## Architecture

```text
app/                 Next.js App Router pages, layouts, server actions, metadata routes
components/          Reusable UI primitives and domain feature components
lib/services/        The sole Prisma query and mutation boundary (tenant-scoped)
lib/prismaClient.ts  Runtime provider selector (PostgreSQL vs SQLite) + schema-drift guard
lib/auth.ts          JWT session signing/verification and DB-backed user resolution
lib/authorization.ts Role definitions and server-side RBAC permission matrix
lib/finance.ts       Deterministic integer-safe Rupiah commission and revenue formulas
lib/timezone.ts      IANA tenant timezone boundary helpers
prisma/              PostgreSQL (schema.prisma) and SQLite (schema.sqlite.prisma) schemas & migrations
scripts/             Test isolation guard (test-guard.mjs) and owner bootstrap scripts
e2e/                 Playwright smoke and authentication/routing end-to-end specs
docs/                Engineering case study, testing strategy, PostgreSQL & baseline audits
```

## Local development

Prerequisite: **Node.js `>=20.19.0`** (pinned in `.nvmrc` and `.node-version`).

By default, local development can run with zero external database setup using the SQLite provider:

```bash
npm ci
DB_PROVIDER=sqlite DATABASE_URL="file:./prisma/dev.db" npx prisma migrate deploy --schema prisma/schema.sqlite.prisma
DB_PROVIDER=sqlite DATABASE_URL="file:./prisma/dev.db" OWNER_EMAIL="owner@agency.test" OWNER_PASSWORD="localdev-owner-pass-1" npx prisma db seed
npm run dev
```

Open `http://localhost:3000`. The seed script (`prisma/seed.ts`) is idempotent and creates only the initial `Agency` and `Owner` account; business records are created through the application UI or CSV import.

### Deployment & environment configuration

No live deployment URL is hardcoded in this repository. Copy `.env.example` to `.env` and configure the following variables when deploying to a PostgreSQL environment (such as Vercel + Supabase):

```dotenv
DB_PROVIDER=postgresql
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
AUTH_SECRET="<random-secret-at-least-32-characters>"
NEXT_PUBLIC_SITE_URL="https://<your-deployment-domain>"
```

- `DATABASE_URL` / `DIRECT_URL`: Runtime pooled connection and direct migration connection for PostgreSQL (`npx prisma migrate deploy --schema prisma/schema.prisma`).
- `AUTH_SECRET`: Required in production (`NODE_ENV=production`), minimum 32 characters (e.g. `openssl rand -base64 48`).
- `NEXT_PUBLIC_SITE_URL`: Set `https://<your-deployment-domain>` to your actual deployed origin so canonical metadata, `app/robots.ts`, and `app/sitemap.ts` emit your real domain (falls back to `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_URL`, or `http://localhost:3000` when unset).

## Testing & verification

```bash
npm run format:check
npm run lint
npx next typegen
npm run typecheck
npm run test:unit
npm test
npm run test:e2e
npm run build
```

- **Unit tests (`npm run test:unit`)**: Runs Vitest (`lib/domain.vtest.ts`) for pure domain and financial formula checks.
- **Service & integration tests (`npm test`)**: Runs 45 suites (197 tests) via `node:test`. Preloads `scripts/test-guard.mjs` and `lib/test-env.ts` so tests always execute against an isolated throwaway SQLite database in the OS temp directory (or a dedicated `/agency-os-test-db` PostgreSQL database via `TEST_DATABASE_URL`) and never touch a shared/production database.
- **End-to-end tests (`npm run test:e2e`)**: Runs Playwright (`e2e/smoke.spec.ts` and `e2e/auth-routing.spec.ts`) against an isolated SQLite test database (`file:./prisma/e2e-test.db`) with automatic migration and owner seeding, verifying landing access, login validation, safe `next` redirects, open-redirect rejection, session persistence, logout, and route protection.

See [docs/TESTING.md](docs/TESTING.md) for testing boundaries and [docs/production-readiness.md](docs/production-readiness.md) for dual-provider PostgreSQL/SQLite details.

## Assets and licensing

UI and marketing imagery is served from repository-local files under `public/` (including `public/og.png` for Open Graph previews). External asset attribution rules are documented in [docs/CASE_STUDY.md](docs/CASE_STUDY.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, branching conventions, and Conventional Commits guidelines. Dependabot checks npm and GitHub Actions dependencies weekly (`.github/dependabot.yml`).

## License

MIT. See [LICENSE](LICENSE).
