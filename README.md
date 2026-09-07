# Agency OS

[![CI](https://github.com/OWNER/REPOSITORY/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPOSITORY/actions/workflows/ci.yml) [![Node](https://img.shields.io/badge/node-20.19%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

**[Live Demo](https://agency.example.com)** · [Architecture Deep Dive](docs/CASE_STUDY.md) · [Case Study](docs/CASE_STUDY.md) · [Testing Strategy](docs/TESTING.md)

Agency OS is a multi-tenant operations workspace for TikTok Shop agencies managing creators, brands, campaigns, content, LIVE schedules, tasks, commissions, payouts, and settlements. It turns scattered operational work into a permission-aware system of record: tenant-scoped queries and server-side RBAC protect data, while the dashboard surfaces the work that needs attention.

## Key engineering highlights

- Next.js App Router with Server Components and Server Actions for a small client surface and clear mutation boundaries.
- Prisma service layer with dual-provider PostgreSQL production and isolated SQLite development/test workflows.
- Tenant isolation enforced by `agencyId` in service queries and mutations, with cross-tenant behavior covered by integration tests.
- Server-side RBAC matrix for owner, admin, account manager, creator manager, campaign manager, live manager, finance, and viewer roles.
- Deterministic integer-safe financial formulas for creator commission, agency revenue, payout, and settlement reconciliation.
- JWT sessions in `httpOnly` cookies, with role and agency membership reloaded from the database per request.
- URL-driven list filters and pagination where workflows need shareable state and browser history support.
- Responsive dashboard with keyboard-visible focus states, skip links, semantic headings, and accessible project detail overlays.
- Formatting, linting, typecheck, unit/service tests, production build, and Playwright smoke checks enforced in GitHub Actions.
- Local asset policy: UI imagery is resolved from repository-local `public/` files, with external asset licensing documented before adoption.

## Tech stack

| Area | Choice |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS 4, Lucide, Recharts |
| Data | Prisma 7, PostgreSQL, SQLite, `pg`, `better-sqlite3` |
| Validation and auth | Zod, `jose` JWT sessions, server-side RBAC |
| Quality | ESLint, Biome, Vitest, Node `node:test`, Playwright |
| Delivery | GitHub Actions, Dependabot, Husky, lint-staged |

## Local development

Prerequisite: Node.js 20.19.0 or newer. The pinned version is available in `.nvmrc` and `.node-version`.

```bash
npm ci
npx prisma migrate deploy
OWNER_EMAIL="owner@agency.test" OWNER_PASSWORD="minimal-12-karakter" npx prisma db seed
npm run dev
```

Open `http://localhost:3000`. The seed creates an agency and Owner account only; business records are intentionally created through the application.

## Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm test
npm run test:e2e
npm run build
```

See [docs/TESTING.md](docs/TESTING.md) for risk-based coverage and test boundaries. The repository does not contain cart, checkout, payment gateway, or order-confirmation domains; those scenarios are not represented as fabricated tests.

## Architecture

```text
app/                 Routes, layouts, server actions, metadata
components/          Reusable UI and domain components
lib/services/        The only Prisma query boundary
lib/auth.ts          JWT session and database-backed membership
lib/authorization.ts RBAC helpers and permission matrix
lib/finance.ts       Integer-safe commission formulas
prisma/              PostgreSQL and SQLite schemas/migrations
scripts/             Bootstrap and test safety utilities
docs/                Case study, testing, production readiness
```

## Assets and licensing

The application uses repository-local assets under `public/`; it does not claim to fetch product imagery from Unsplash at runtime. The image resolver policy is intentionally simple: components reference stable public paths, and future external assets must include source, license, and attribution details in [docs/CASE_STUDY.md](docs/CASE_STUDY.md). The social preview placeholder specification is documented in [OG_IMAGE.md](OG_IMAGE.md); production branding should provide `public/og.png` at 1200x630 pixels.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branches, and Conventional Commits. Read [SECURITY.md](SECURITY.md) before reporting a vulnerability. Dependabot checks npm and GitHub Actions dependencies weekly.

## License

MIT. See [LICENSE](LICENSE).
