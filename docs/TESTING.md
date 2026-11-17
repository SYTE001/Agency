# Testing Strategy

## Risk-based approach

Tests prioritize the highest-risk boundaries in this repository:

- `lib/domain.vtest.ts` covers deterministic money calculations and RBAC decisions.
- Existing `node:test` suites cover finance formulas, database isolation, and critical service behavior.
- Playwright smoke tests verify that the public entry point is usable and that available command UI dismisses correctly with `Escape`.

The requested cart, checkout, product-service, and order-confirmation scenarios are not implemented in this repository. This is a multi-tenant TikTok agency operations system with Prisma-backed server actions, so those scenarios are intentionally not fabricated. They should be added only when the corresponding product domain exists.

## Local commands

```bash
npm ci
npm run format:check
npm run lint
npx next typegen
npm run typecheck
npm run test:unit
npm test
npm run test:e2e
npm run build
```

Playwright starts a local development server automatically, migrates its dedicated SQLite E2E database, and seeds the synthetic owner account. Auth/routing tests and the search smoke test log in through the application. Install local Google Chrome (the local browser channel) or use CI's bundled Chromium. Do not point the runner at a shared database or reuse an app connected to customer data.

## PR-00 hardening baseline

The richer synthetic two-agency dataset is separate from `prisma/seed.ts`, which remains an owner-only bootstrap. `tests/fixtures/hardening.ts` provides stable IDs, a fixed reference date, role accounts, linked business records and literal expected money values. Creator-metric, content and commission GMV are intentionally different; do not add these buckets together.

Run the baseline route/viewport capture with no other `next dev` process using this workspace (Next.js holds a shared development lock):

```bash
npx playwright test --config playwright.hardening.config.ts
```

The separate config starts port 3100, migrates `file:./prisma/hardening-baseline.db`, invokes `scripts/seed-hardening.mts`, disables mock sync, and uses one worker. It refuses production mode and non-dedicated filenames. It captures login, overview, creators, brands, campaign detail, content board, LIVE calendar, finance, reports and integrations at widths 390, 768 and 1440. Screenshot PNGs plus keyboard/console observations are written under `test-results/hardening-baseline`; the HTML report is under `playwright-report/hardening`. These are local artifacts, not tracked source or proof of manual accessibility acceptance.

To create only the fixtures in a new disposable database (Git Bash):

```bash
DB_PROVIDER=sqlite DATABASE_URL=file:./prisma/hardening-manual.db DIRECT_URL=file:./prisma/hardening-manual.db npx prisma migrate deploy --schema prisma/schema.sqlite.prisma
DB_PROVIDER=sqlite DATABASE_URL=file:./prisma/hardening-manual.db TEST_DATABASE_URL=file:./prisma/hardening-manual.db HARDENING_FIXTURES=1 npx tsx scripts/seed-hardening.mts
```

Never seed a customer's database. The script checks its target before loading Prisma. It requires explicit opt-in and matching database/test URLs, accepts only dedicated test targets, writes transactionally, and reruns without deleting or overwriting existing paid records. Use a new file for a pristine baseline. Credentials in the fixture module are synthetic and local-only.

Fixture verification runs with the normal `npm test` suite; it uses `lib/test-env.ts` disposable database setup. To run only this suite:

```bash
node --import ./scripts/test-guard.mjs node_modules/tsx/dist/cli.mjs --test lib/hardening-fixtures.test.ts
```

See [PR-00-BASELINE.md](hardening/PR-00-BASELINE.md) for executed results and remaining blockers. PostgreSQL migration/runtime verification requires an actual isolated PostgreSQL server; compiling with a placeholder connection does not satisfy it.

## CI principles

Pull requests must pass formatting, linting, typechecking, unit tests, and production build. E2E is kept as a separate job because it needs a browser installation and a running application.
