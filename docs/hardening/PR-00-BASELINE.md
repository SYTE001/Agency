# PR-00 — baseline and regression evidence

Requirement: Commercial Readiness & Product Hardening PRD v1.0 (2026-11-17), Phase 0. This is a local reviewable change set; no commit, push, pull request, or deployment has been performed.

## Source provenance

- Initial workspace: extracted `Agency-main` source without `.git`.
- Fresh upstream lookup: `https://github.com/SYTE001/Agency.git`, `refs/heads/main` → `233dd7f403df10585f2bf6dbf2a81bfb39ccbc6d`.
- Compared every upstream tracked file using the authentic fetched index and `git diff HEAD` with `core.autocrlf=false`: no tracked-file differences before implementation.
- Attached the fetched authentic Git metadata after that comparison and created `hardening/pr-00-baseline`. No manufactured baseline commit. Original source files were preserved.
- Untracked `.zcode/` host/session files are outside the deliverable and must not be staged.
- PRD/session date is 2026-11-17. Host package-download timestamps are 2026-11-16 UTC; command evidence retains its actual timestamps rather than inferring a different clock.

## Scope and behavior

**Before:** historical audit documents, inline test fixtures, a minimal production bootstrap seed, and auth-focused Playwright tests. No hardening checklist, current command evidence, or complete access inventory.

**After:** source-linked A01–A18 register, current verification evidence, synthetic two-agency fixtures with known financial values, a complete access inventory, and reproducible 30-view baseline captures. Product correctness fixes remain in their assigned PR-01 onward boundaries.

No schema/migration changes or production data operations are part of PR-00. Fixtures are test-only, not a change to the owner bootstrap seed. No external verification of TikTok metrics is claimed.

## Environment

| Item | Observed value |
| --- | --- |
| OS / shell | Windows x64 / Git Bash |
| Initial Node | v26.13.1 |
| Initial npm | 11.9.0 |
| Framework in lockfile | Next.js 16.3.1 |
| Prisma in lockfile | 7.9.1 |
| CI Node pin | `.nvmrc`: 22.14.0 |
| Alternate Node declaration | `.node-version`: 20.19.0; both differ from initial host runtime |
| Initial dependencies/generated clients/env | absent |
| PostgreSQL tooling | `docker`, `psql`, `postgres` absent from PATH; `C:/Program Files/PostgreSQL` absent |
| Google Chrome | `C:/Program Files/Google/Chrome/Application/chrome.exe` exists |

Use explicit synthetic environment values per command. Do not copy placeholder remote credentials from `.env.example` into an executable configuration. SQLite tests use the existing guards in `scripts/test-guard.mjs` / `lib/test-env.ts`; PostgreSQL requires a separately confirmed disposable database.

## Command results

Current results are below. Interrupted diagnostic runs, TODOs, and blocked checks are not counted as passed acceptance.

| Command / check | Original baseline | After PR-00 | Evidence / limitation |
| --- | --- | --- | --- |
| `npm ci` | PASS (exit 0, 709 packages; both Prisma clients generated) | unchanged lockfile | 24 advisories: 8 moderate, 13 high, 3 critical; dependency review tracked under P4-07 |
| `npm run format:check` | PASS (5 files) | PASS; additional new capture files formatted directly | Repository script checks a narrow named file set, not all source formatting |
| `npm run lint` | PASS (exit 0) | PASS (exit 0, no warnings after unused suppression removed) | ESLint |
| `npx next typegen` | PASS (exit 0) | PASS; typecheck repeated after final capture edits | Required before standalone typecheck |
| `npm run typecheck` | PASS (exit 0) | PASS after fixture/capture typing repairs | Includes representative Prisma schema drift assertion |
| `npm run test:unit` | PASS (2 tests) | unchanged domain code; baseline PASS | Vitest |
| `npm test` | PASS on clean rerun: 197 tests, 45 suites, 0 failures, 106.5s | PASS: 211 passed, 3 TODO, 0 failed, 0 skipped (214 registered tests, 47 suites, 86.0s) | Premature first run overlapped Prisma generation: 187 passed + one failed test file (missing generated SQLite client); clean rerun after install resolved it. TODO security cases remain open under PR-04 |
| `npm run test:e2e` | FAIL: initial startup timeout; prepared-app rerun 12 passed, 2 failed, 1 skipped | PASS: complete 15-test suite, zero skips | Targeted auth/smoke repair first passed 9/9. Full run used prepared, seeded isolated app; cold automatic-start path separately exercised by capture config |
| `npm run build` | Compiled in 115s; typecheck overlapped new in-progress PR-00 files and failed | PASS: compile 7.8s, TypeScript 19.2s, 12 static pages, exit 0 | PostgreSQL configured with a dummy localhost test URL; no database runtime/connectivity/migration claim |
| PostgreSQL migration/build/start | blocked | blocked | No local PostgreSQL server/container tools found; no remote DB used |
| Baseline screenshot matrix | diagnostic timing failures recorded | PASS: 3 viewport tests, 30 PNGs, zero captured console errors (2.0m) | 10 routes × widths 390/768/1440; Next.js smooth-scroll warning remains (warning, not error); not a visual/a11y acceptance verdict |
| Manual keyboard walk | partial | partial: login, desktop search, mobile menu opening | See [keyboard observations](KEYBOARD-OBSERVATIONS.md); full ten-route walk remains open |

## Test-infrastructure changes and limitations

- Fixed a Back-navigation race in `e2e/auth-routing.spec.ts`: wait for the public history entry, assert protected shell is absent, then check a fresh protected navigation.
- Changed the search smoke test to authenticate and exercise the actual shell search instead of skipping on the public landing page. A browser-closure failure occurred once on `/finance/payouts`; subsequent targeted and full runs passed. Its cause is not established by changing URL matcher syntax.
- Standard Playwright runner now permits 180 seconds for startup and uses bundled Chromium in CI, matching the CI install step. Local runs retain installed Chrome.
- Added separate baseline config with port 3100, explicit fixture opt-in, dedicated `hardening-*.db`, no server reuse, and mock sync disabled.
- Capture attempts uncovered screenshot-induced hydration warnings: Playwright's default caret hiding adds input styles while streamed page hydration is unfinished. The capture test now waits for login splash completion, checks Ctrl+K/Escape interaction, and preserves the caret (`caret: "initial"`). Interrupted diagnostic attempts are not passed runs.
- On Windows, stopping an npm parent left a child Next.js server holding the development lock. Its command line was inspected and the owned child process stopped before restart. Do not run two dev servers from the same workspace concurrently.
- [Manual keyboard observations](KEYBOARD-OBSERVATIONS.md) cover login, desktop search and mobile menu opening only. The full ten-route manual keyboard walk is still open.
- Fixture reruns do not repair a modified/incomplete dataset when both agency IDs already exist. Use a new disposable DB for a pristine baseline; reported counts are whole-table counts. Dedicated PostgreSQL full-suite runs also need isolation because existing suites use fixed IDs.

## Source findings

See [audit evidence](AUDIT-EVIDENCE.md) and [access inventory](ACCESS-INVENTORY.md). Source observations do not establish exploitability or complete tenant isolation. Existing domain tests cover only the cases they execute.

Historical documentation discrepancies:

- `docs/production-readiness.md` §3 says tenant timezone is unused. Current `getAgencyTimezone` and reporting services use `lib/timezone.ts`; DST end-of-day correctness remains A13.
- The same document §8/B4 says PostgreSQL case-insensitive search is pending. Current services use `containsInsensitive` in `lib/services/common.ts`.
- `docs/TESTING.md` describes authenticated fixtures as future work although current Playwright config already seeds an owner. Shared two-tenant business fixtures remain a gap addressed in PR-00.

## PostgreSQL reproduction prerequisite

P0-03 remains open until a real dedicated disposable PostgreSQL instance is available. The following are example commands with a **local** test connection; they are not executed evidence:

```bash
DB_PROVIDER=postgresql DATABASE_URL=postgresql://TEST_USER:TEST_PASSWORD@127.0.0.1:5432/agency-os-test-db DIRECT_URL=postgresql://TEST_USER:TEST_PASSWORD@127.0.0.1:5432/agency-os-test-db npx prisma migrate deploy --schema prisma/schema.prisma
DB_PROVIDER=postgresql DATABASE_URL=postgresql://TEST_USER:TEST_PASSWORD@127.0.0.1:5432/agency-os-test-db DIRECT_URL=postgresql://TEST_USER:TEST_PASSWORD@127.0.0.1:5432/agency-os-test-db npm run build
DB_PROVIDER=postgresql DATABASE_URL=postgresql://TEST_USER:TEST_PASSWORD@127.0.0.1:5432/agency-os-test-db AUTH_SECRET=synthetic-local-pr00-secret-at-least-32-characters npm start
```

Create the dedicated DB with a test-only role first, inspect migration status, then verify login and authenticated routes against it. Build success without a started server and successful queries is insufficient. Existing full suites use fixed IDs and can collide when sharing a provided database; isolate each run/database before interpreting a PostgreSQL test result.

## Rollback and release gates

Revert only PR-00 documentation/test/config changes. Remove only the disposable DB/artifacts created for this run after inspecting their paths. No existing migration or user data requires rollback. Authentic Git history remains intact.

**Gate A: NO-GO — not validated. Gate B: NO-GO — not validated.** Recovery, atomic imports, metric provenance/idempotency, full tenant/role adversarial coverage, staging deployment and verified restore are outstanding. Current baseline evidence cannot waive these gates.

Next bounded change: **PR-01 — GMV/provenance contract and dashboard/report label correctness**, after reviewing PR-00 findings and outstanding baseline blockers.
