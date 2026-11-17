# PR-00 local review notes

## Problem and resulting behavior

The extracted source had no Git history, current hardening evidence register, shared two-agency dataset or reproducible ten-route responsive capture. It now has an authentic upstream baseline, a feature branch, source-linked audit/access inventories, guarded deterministic fixtures, and an automated screenshot/keyboard/console baseline. Product features and business schemas are unchanged.

## Files changed

- Documentation: `docs/HARDENING-CHECKLIST.md`, `docs/CHANGELOG-HARDENING.md`, `docs/TESTING.md`, and `docs/hardening/{PR-00-BASELINE,ACCESS-INVENTORY,AUDIT-EVIDENCE,KEYBOARD-OBSERVATIONS,PR-00-REVIEW}.md`.
- Test fixtures: `tests/fixtures/hardening.ts`, `scripts/seed-hardening.mts`, `lib/hardening-fixtures.test.ts`.
- Browser verification: `playwright.hardening.config.ts`, `e2e/hardening-baseline.spec.ts`, existing `playwright.config.ts`, `e2e/auth-routing.spec.ts`, `e2e/smoke.spec.ts`.
- Artifact hygiene: `.gitignore` adds local test/report/session directories. Existing tracked artifacts remain tracked.

## Verification

- `npm ci`: passed; both Prisma provider clients generated. npm reported 24 dependency advisories (8 moderate, 13 high, 3 critical); dependency remediation is outstanding under P4-07.
- Formatting, ESLint, route type generation and TypeScript: passed.
- Vitest: 2 passed.
- Node service/integration suites: 211 passed, 0 failed, 3 TODO, 0 skipped (214 registered tests, 47 suites). The TODOs are missing PR-04 security coverage, not acceptance passes.
- Complete auth/navigation/smoke Playwright suite: 15 passed, 0 skipped, using the prepared isolated SQLite app.
- Baseline matrix: 3 viewport tests passed, 30 screenshot PNGs, zero captured console errors. A Next.js smooth-scroll configuration warning remains.
- Production build: passed with PostgreSQL build configuration. No PostgreSQL runtime/server was available, so P0-03 remains blocked.
- CLI fixture smoke: created and reran idempotently against a disposable database.

Original failures, interrupted diagnostic capture attempts, and verification limits are recorded in [PR-00-BASELINE.md](PR-00-BASELINE.md). No skipped or blocked check is counted as passed.

## Review focus / remaining risks

1. Confirm test-only fixture safety and synthetic credentials; production bootstrap seed and migration histories are untouched.
2. Inspect source-observed campaign-update and task-owner reference gaps (access inventory G-1/G-2). These are not fixed by baseline tests. Reproduce and repair in PR-04 before Gate A.
3. Do not treat the screenshots as visual approval. Full ten-route manual keyboard traversal and layout review remain open.
4. PostgreSQL migration/start, staging restore, recovery, atomic CSV imports, metric provenance/idempotency and role visibility remain release blockers.
5. Fixture reruns preserve existing records rather than repairing a mutated dataset; use a fresh dedicated DB for an uncontaminated baseline.

## Local artifacts

HTML report: `playwright-report/hardening/index.html`.

PNG pattern: `test-results/hardening-baseline/hardening-baseline-capture-ten-baseline-routes-at-{390,768,1440}px-baseline-chrome/{login,overview,creators,brands,campaign-detail,content,live-calendar,finance,reports,integrations}.png`.

These artifacts are local and ignored by Git; no data was uploaded. Recreate them with `npx playwright test --config playwright.hardening.config.ts`.

## Pre-publication secret review

See [SECRET-REVIEW.md](SECRET-REVIEW.md). No real credential was identified in the current publishable files. A credential-looking TokenRouter API key exists in already-published `opencode.json` history at `8302c13`; owner revocation/rotation remains required. The value is omitted and no live validation or history rewrite was performed.

## Migration / rollback / decision

No business schema or historical data migration. Revert the listed documentation/test/config changes to roll back this change set; remove only inspected disposable artifacts created for testing. No existing data or migration reset is needed.

**Gate A: NO-GO. Gate B: NO-GO.** Phase 0 is partially complete: P0-03 and the full P0-04 manual review remain open. Next bounded change is PR-01 metrics/provenance contract and label correctness. No commit, push, PR publication, deployment, payment processing, email delivery or TikTok API authorization occurred.
