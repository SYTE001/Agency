# Dependency maintenance — 2026-11-17

Branch: `maintenance/dependency-stabilization-20261117`, created from latest `main` at `e9293619ac538341ed2235bd668d48fd7a03ef24`. No Dependabot PR is merged or closed by this work.

## Review of outstanding PRs

All twelve Dependabot branches were re-inspected on 2026-11-17 through authenticated GitHub pull/file/check/run APIs, isolated tip-commit patches, mergeability state and failed Actions logs. All are open, unmergeable (`mergeable=false`, `mergeable_state=dirty`) and each current PR comparison contains 194 files from an obsolete base, although the latest Dependabot update commit changes only dependency manifests/lockfiles or one workflow file. Recreate compatible updates on current main; do not force-merge or rebase these stale trees.

| PR | Proposal | Decision / evidence |
| --- | --- | --- |
| #1 | setup-node v4 → v7 | Separate Actions major compatibility change; leave open. Isolated tip changes two workflow references. Old Node20/22 jobs failed during `npm ci` because Prisma CLI DB env was absent, so they do not validate or disprove v7. v7 migrates to ESM, changes cache outputs/behavior and removes the dummy `NODE_AUTH_TOKEN`. |
| #2 | checkout v4 → v7 | Separate Actions major compatibility change; leave open. Isolated tip changes two workflow references. Old Node22 job reached `tsc` and failed because generated `PageProps` was absent; current main runs `next typegen` first. v7 migrates to ESM and blocks fork checkout for `pull_request_target`/`workflow_run`; test separately. |
| #3 | SQLite adapter 7.9.1 → 7.10.0 | Superseded after maintenance merge by synchronized Prisma family 7.10.1. Isolated tip changes only manifests/lockfile; old Node20/22 install failure was missing Prisma DB env, not adapter incompatibility. |
| #4 | React DOM types 19.2.4 → 19.2.7 | Include exact 19.2.7. Its peer `@types/react ^19.2.0` is satisfied by the resolved tree. Dependabot only needed a lockfile change; old install failure was missing Prisma DB env. |
| #5 | jest-dom 6.9.1 → 7.0.1 | Separate major; leave open. Node >=22 and `@testing-library/dom >=10 <11` are required. It is not exercised by the current Node-environment Vitest file, so a dedicated compatibility change is required rather than a blind major update. |
| #6 | jsdom 26.1.0 → 30.0.1 | Separate major; leave open. Requires Node ^22.22.2/^24.15/>=26 and newer transitive engines, incompatible with the aligned Node22.14.0 baseline. Retain 26.1.0. |
| #7 | Vitest 3.2.4 → 5.0.0 | Separate major; leave open. Both historical CI jobs failed `npm ci` with a real ERESOLVE: Vitest5 requires `@types/node ^22 || >=24`, while the repo pins v20 types. Vitest5 also requires Node ^22.12 and Vite >=6.4 and changes mock clearing/assertions/config behavior. Apply compatible 3.2.7 security backport here; it does not supersede the v5 migration. |
| #8 | Zod 4.4.3 → 4.5.4 | Superseded after merge by 4.6.6; 4.5.4 remains below the patched boundary for GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404 (`<4.6.6`). Old install failure was missing Prisma DB env. |
| #9 | Prisma client 7.9.1 → 7.10.0 | Superseded after merge by synchronized 7.10.1. Old install failure was missing Prisma DB env. |
| #10 | Prisma CLI 7.9.1 → 7.10.0 | Superseded after merge by synchronized 7.10.1; 7.10.1 updates advisory-affected dependencies, protects shadow/main URL equality and fixes transaction-option reuse. Old install failure was missing Prisma DB env. |
| #11 | tsx 4.23.12 → 4.23.13 | Include exact proposed patch; it limits shared transform-cache memory. Old install failure was missing Prisma DB env. |
| #12 | Next 16.3.1 → 16.3.4 | Superseded after merge by aligned Next/eslint-config-next 16.4.6. Proposed 16.3.4 remains affected by current Next advisory ranges (including GHSA-mfr8-8qww-v76h through 16.4.4 and GHSA-h694-7cp9-m8p3 below 16.3.8). Old install failure was missing Prisma DB env. |

PR #14 independently groups routine Dependabot updates, modifies only `.github/dependabot.yml`, is clean and had successful CI at inspection. It is not merged, closed, or silently incorporated here. Its grouping policy can be reviewed separately; Prisma and Next alignment still require explicit review.

Candidates for closure **only after this maintenance PR merges and explicit approval**: #3, #4, #8, #9, #10, #11, #12. Keep #1, #2, #5, #6, #7 open for separate compatibility work. None are closed prematurely.

## Selected versions

- Next.js and eslint-config-next: 16.3.1 → **16.4.6**, aligned exact versions. Next 16.4.6 is the current stable registry release and clears the known 16.3.x/16.4.0–16.4.4 advisory ranges reviewed for this work.
- Prisma CLI, client, PostgreSQL adapter and SQLite adapter: 7.9.1 → **7.10.1**, aligned exact versions; Prisma 8 is currently an RC tag, not selected. The v7.10.1 client/adapters publish provenance attestations; the CLI package is signed but its registry metadata does not expose provenance.
- Zod: 4.4.3 → **4.6.6**, patched boundary for GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404.
- tsx: 4.23.12 → **4.23.13**, matching the Dependabot patch and limiting transform-cache memory.
- React DOM types: resolved 19.2.4 → **19.2.7**, matching Dependabot and compatible with React types 19.2+.
- Playwright test/playwright/playwright-core: 1.51.1 → **1.55.1**, the patched boundary for GHSA-7mvr-c777-76hp in the transitive `playwright` package, while retaining the tested Ubuntu24 runner.
- Vitest: 3.2.4 → **3.2.7**, the final v3 maintenance patch and a security backport; major5 remains separate.
- Node baseline: **20.19.0 → 22.14.0**, aligned across `package.json`, `.nvmrc` and `.node-version`. This is required by the already-direct `better-sqlite3@13` package and Prisma development tooling, and matches the previously established CI baseline.
- jsdom **26.1.0**, jest-dom **6.9.1**, `@types/node` 20 and Actions v4 remain unchanged pending separate compatibility decisions.
- Transitive dependencies are refreshed from a deterministic npm lockfile within compatible parent ranges, with no `--force`, `--legacy-peer-deps` or arbitrary overrides.

Versions were selected from registry engine/peer metadata, audit fix boundaries and official release notes, not installed blindly from latest tags. jsdom, jest-dom and GitHub Actions majors remain unchanged.

## CI failure classification

1. **Stale workflow environment:** PRs #1 and #3–#6/#8–#12 reached `npm ci` but postinstall could not load `prisma.config.ts` because the historical workflow omitted both `DATABASE_URL` and `DIRECT_URL`. This failure is independent of the proposed package in those PRs. Current CI supplies dedicated dummy PostgreSQL URLs before install; E2E supplies its isolated SQLite URL.
2. **Stale route-type workflow:** PR #2 installed successfully and failed `tsc` on missing generated `PageProps` across App Router pages. Current CI runs `npx next typegen` before `tsc`.
3. **Real Vitest5 incompatibility:** PR #7 failed `npm ci` on both Node jobs with ERESOLVE: root `@types/node@20.19.43` does not satisfy Vitest5's optional peer `^22 || >=24`. Vitest5 also requires Node ^22.12 and Vite >=6.4 and has documented behavior/configuration changes; defer it as an explicit migration.
4. **Node20 warnings identify an unsupported declared floor:** historical logs and the clean maintenance install show the already-direct `better-sqlite3@13` package plus Prisma development transitive tooling require Node22. Current CI already selects `.nvmrc` Node22.14.0. This change aligns `.node-version` and `package.json` engines to `>=22.14.0` instead of continuing to advertise an unverified Node20 floor.
5. **Major runtime/tool constraints:** jest-dom7 requires Node22; jsdom30 requires Node22.22.2+, which is still newer than the aligned 22.14 baseline. Both remain separate.
6. **Playwright runner:** PR #13 established that Ubuntu26 cannot install browsers for Playwright1.51.1 and pinned E2E to Ubuntu24.04. This branch keeps Ubuntu24 and updates Playwright to1.55.1. GitHub CI must verify `npx playwright install --with-deps chromium` and the full browser suite for the published head.
7. **Actions majors:** setup-node7 and checkout7 both migrate to ESM; setup-node changes cache/token behavior, while checkout7 changes fork checkout behavior. Their stale CI failures do not test those changes. Keep Actions v4 here and evaluate #1/#2 separately.

## Verification

Local verification completed on 2026-11-17 unless noted otherwise:

| Check | Result |
| --- | --- |
| Clean `npm ci` with safe dummy PostgreSQL env | PASS on host runtime; 707 packages installed, both Prisma 7.10.1 clients generated; lockfile SHA-256 unchanged |
| Exact Node baseline smoke (`v22.14.0`, npm10.9.2) | PASS: checksum-verified official runtime, clean `npm ci --ignore-scripts`, explicit generation of both Prisma clients, and Vitest2/2; no EBADENGINE warnings |
| Family dependency tree (`npm ls` scoped) | PASS; Next/config, all Prisma packages, Playwright trio and Vitest/jsdom families resolve without invalid peers/duplicates |
| Full top-level `npm ls` | Platform note: npm 11 on Windows leaves six lockfile-declared optional WASM packages marked extraneous; the scoped changed-package tree is valid and Linux CI remains authoritative |
| Production audit (`npm audit --omit=dev`) | PASS: 0 vulnerabilities |
| Full audit | 3 dev-only findings remain: 1 moderate and 2 critical through Vitest3/@vitest/mocker/tinypool; npm offers only a Vitest5.1.0 major fix |
| PostgreSQL + SQLite `prisma validate` | PASS |
| Explicit generation of both Prisma clients | PASS at 7.10.1 |
| Migration integrity | PASS: all 6 committed migration files/locks retained identical SHA-256 hashes |
| `npm run format:check` | PASS |
| `npm run lint` | PASS |
| `npx next typegen` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:unit` | PASS: 2/2 on Vitest3.2.7 |
| `npm test` | PASS: 211 passed, 0 failed, 3 explicit TODOs, 0 skipped across 47 suites |
| Playwright local browser install | Chromium140 build1193 downloaded; headless-shell mirrors reset/stalled locally before executable extraction. GitHub CI subsequently installed the bundled Chromium/dependencies successfully on Ubuntu24.04. |
| `npm run test:e2e -- --workers=1` | PASS: 15/15 via configured local Chrome channel and fresh isolated SQLite DB; interrupted bundled run failed before tests because headless-shell was incomplete and is not counted; intermittent dev-server ECONNRESET logs did not fail tests |
| `npm run build` | PASS: Next16.4.6 production compile, TypeScript, static generation and route manifest |
| GitHub Quality + Playwright jobs | PASS on run `44057915444`: Quality and Playwright smoke tests both completed successfully; Vercel Preview Comments also passed |

No skipped, TODO, interrupted browser download, blocked PostgreSQL runtime, or unrun CI check counts as passed acceptance. Full PostgreSQL runtime testing remains an existing environment limitation; this change validates PostgreSQL client generation/schema/build but does not claim a live DB connection.

## Residual risk and follow-up

- Vitest3 dev-only advisories remain. The secure path is a separately reviewed Vitest5.1 migration together with Node types/Vite/config behavior and existing tests; do not use `--force` or `--legacy-peer-deps`.
- jsdom30 and jest-dom7 stay deferred; jsdom30 requires Node22.22.2+, above this repo's aligned Node22.14 baseline.
- Actions setup-node7/checkout7 remain separate ESM/behavior changes. Existing v4 deprecation warnings should be handled in that dedicated update, not hidden here.
- npm 11/Windows optional-WASM extraneous reporting is documented; clean Ubuntu CI and the scoped package tree decide release readiness.
- The historical TokenRouter key exposure in `docs/hardening/SECRET-REVIEW.md` is unchanged and still requires owner revocation/rotation.

## Safety and rollback

No application rewrite, schema change, migration edit or production DB access. Existing tests remain intact; test data is disposable and synthetic. Rollback is to revert the maintenance commits and reinstall from the restored lockfile; no database rollback is required. Do not force-merge conflicting PRs or close superseded PRs before maintenance merge plus explicit approval.
