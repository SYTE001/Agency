# Hardening changelog

This file records Commercial Readiness & Product Hardening PRD change sets. Entries describe actual local changes and distinguish verification gaps from shipped behavior. No entry implies a reviewed/merged PR or deployed release unless explicitly stated.

## PR-00 — local baseline delivered with open acceptance checks (2026-11-17)

Source: upstream `main` at `233dd7f403df10585f2bf6dbf2a81bfb39ccbc6d`; branch `hardening/pr-00-baseline`.

- Established authentic Git provenance for the extracted workspace; no tracked-file differences before implementation.
- Added the complete audit/task/release-gate register in [HARDENING-CHECKLIST.md](HARDENING-CHECKLIST.md).
- Added current baseline/environment/reproduction evidence in [PR-00-BASELINE.md](hardening/PR-00-BASELINE.md).
- Current-source A01–A18 observations and full route/action/service access boundaries are documented separately from executed security verification.

- Added deterministic two-agency fixtures and a guard-first CLI, separately from `prisma/seed.ts`. Known amounts distinguish creator metrics, content, LIVE and commission GMV. Seeding is transactional and reruns preserve existing records.
- Added fixture guard, idempotency, amount, credentials and limited tenant-reference tests. Final service suite: 211 passed, zero failed, three explicit PR-04 TODOs (not passed coverage).
- Repaired the logout Back-navigation test race and moved the skipped search smoke test into the authenticated shell. Complete browser suite: 15 passed, zero skipped against the prepared isolated app.
- Aligned CI browser selection with its installed Chromium and allowed 180 seconds for cold E2E startup. Added separate guarded capture configuration for 390/768/1440 screenshots and keyboard/console observations.
- Added local report/test/session artifact ignores; existing tracked artifacts are preserved.

- Final capture matrix passed all three viewport tests and produced 30 PNGs with zero captured console errors. Screenshot timing waits for interactive pages and preserves input caret styling to avoid capture-induced hydration warnings.
- Final production bundle and TypeScript build passed. This is compilation evidence, not PostgreSQL runtime verification.

- Added a [pre-publication secret review](hardening/SECRET-REVIEW.md): no real credential identified in current publishable files; a credential-looking TokenRouter key exists in already-published history and requires owner revocation/rotation. Its value is not included in the report. Shared history is not rewritten.

- CI follow-up for PR #13: the pre-commit formatter moved the test helper's ESLint suppression away from its `any` cast, causing remote lint failure. Replaced generic count casts with the narrow `count(): Promise<number>` interface in fixture/test helpers; no runtime behavior or permission change.

Product behavior and business schema are unchanged. PostgreSQL runtime/migration verification is blocked by missing local tooling. No production database, credentials, external API, deployment, or customer data was used.

Remaining capture/build evidence is recorded in the baseline document. Gates A/B/C and live TikTok integration are not approved by this change set.
