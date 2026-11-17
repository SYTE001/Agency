# Product hardening checklist

Source of requirements: **Agency OS — Commercial Readiness & Product Hardening PRD**, version 1.0, 2026-11-17. Initial source: upstream `main` at `233dd7f403df10585f2bf6dbf2a81bfb39ccbc6d`. Work branch: `hardening/pr-00-baseline`.

Status vocabulary: **pending** = not implemented/verified; **source-observed** = current code supports the finding but runtime reproduction is outstanding; **reproduced** = an executed check demonstrates it; **blocked** = named prerequisite absent; **complete** = acceptance evidence linked. Historical audit results are not current test results. A local change set is not a reviewed or merged PR.

## Evidence and review boundaries

- [PR-00 baseline and command results](hardening/PR-00-BASELINE.md)
- [Current-source audit observations](hardening/AUDIT-EVIDENCE.md)
- [HTTP, action, and service access inventory](hardening/ACCESS-INVENTORY.md)
- [Hardening changelog](CHANGELOG-HARDENING.md)
- [Testing and reproduction](TESTING.md)

## Audit register

The source register below is a starting point. Reproduction and final resolution evidence must be recorded in the assigned change set before closing a finding.

| Audit | Priority | Issue / current starting point | Planned change set | Test / proof required | Status |
| --- | --- | --- | --- | --- | --- |
| A01 | P0 | Operator bootstrap and manual user creation: `prisma/seed.ts`, `scripts/bootstrap-owner.mts`, `app/actions/users.ts` | PR-06 | Two isolated pilot agencies activate; invitations bind tenant and role | pending |
| A02 | P0 | No self-service password reset: `app/actions/auth.ts`, `app/login/page.tsx` | PR-06 | Generic request response; expiry, replay, rate limit and session invalidation | pending |
| A03 | P0 | Different GMV sources: `lib/services/{overview,campaigns,finance,reports}.ts` | PR-01 | Source-specific contract, windows and labels; independent known-value fixtures | pending |
| A04 | P0 | CSV batch writes: `lib/services/integrations.ts` | PR-03 | Inject late write failure; no partial rows; deterministic retry | pending |
| A05 | P0 | Repeated mock metric inserts and missing source/grain uniqueness: `lib/services/integrations.ts`, `prisma/schema*.prisma` | PR-02 | Same daily ingest twice; duplicate reconciliation and production exclusion | pending |
| A06 | P1 | Integration capability copy: `app/(app)/settings/integrations/page.tsx` | PR-08 | UI labels match actual CSV/demo/disconnected capabilities | pending |
| A07 | P0 | Tenant reference ownership: both Prisma schemas and all mutation services | PR-04 | Adversarial two-tenant read/write/attach/export/search tests for every resource | pending |
| A08 | P1 | Content board cap: `lib/services/content.ts` | PR-08 | More than 1,000 items, accurate count, pagination/filter persistence and keyboard use | pending |
| A09 | P1 | Visitor acquisition path: `components/landing/{hero,cta-section}.tsx` | PR-10 | Secure request-pilot submission, validation, consent and error handling | pending |
| A10 | P1 | Sample landing numbers and unsupported login claims: `components/landing/hero.tsx`, `components/login-form.tsx` | PR-10 | Clearly illustrative labels and substantiated claims at desktop/tablet/mobile widths | source-observed; login visibility also checked in browser |
| A11 | P1 | Overview metric visibility: `app/(app)/overview/page.tsx` | PR-04 | Owner/admin/finance/viewer/limited-role responses and snapshots | pending |
| A12 | P1 | JWT expiry and revocation: `lib/auth.ts`, `app/actions/auth.ts` | PR-07 | Disabled/reset accounts and revoked sessions immediately rejected | pending |
| A13 | P1 | Local-day end boundaries: `lib/timezone.ts` | PR-05 | Jakarta and New York spring/fall half-open UTC interval tests | pending |
| A14 | P1 | Spreadsheet formula injection: report CSV exports | PR-03 | Formula prefixes including whitespace, quotes, multiline, line endings and re-import | pending |
| A15 | P1 | Production operations and live integration evidence gaps | PR-09 / conditional PR-12 | Isolated PostgreSQL rehearsal, restore, telemetry, measured load; API approval separately | pending |
| A16 | P2 | Commercial lifecycle/support gap | PR-10 / conditional PR-11 | Pilot support evidence and repeated usage before automated subscriptions | pending |
| A17 | P2 | Read-time integration creation/race: `getOrCreateIntegration` | PR-02 | Concurrent first requests, tenant/provider uniqueness and migration safety | pending |
| A18 | P1 | Import identity and amount parsing: `lib/services/integrations.ts` | PR-03 | Non-unique names, stable external IDs, IDR formats, conflict diagnostics | pending |

## Ordered task register

| Task | Deliverable | Change set | Status / evidence |
| --- | --- | --- | --- |
| P0-01 | Audit-to-evidence/PR/test/status register | PR-00 | complete locally; this document and linked source/evidence registers |
| P0-02 | Reproducible versions and full original test/lint/build output | PR-00 | complete evidence: final lint/typecheck/unit/service/browser/build pass; original failures and three TODOs retained |
| P0-03 | Disposable PostgreSQL migrations/build/start; dual-provider checks | PR-00 | blocked: no local PostgreSQL/Docker tools found; no remote DB used |
| P0-04 | Ten-route screenshots and keyboard walk at 390/768/1440 | PR-00 | 30 PNGs captured; 3 viewport tests passed with zero captured console errors. Full manual keyboard/layout review remains open ([observations](hardening/KEYBOARD-OBSERVATIONS.md)) |
| P0-05 | Two-tenant role/business/known-money fixtures | PR-00 | complete locally: `tests/fixtures/hardening.ts`; 14 fixture checks passed; three PR-04 TODOs are not passed coverage |
| P0-06 | All routes/actions/services access and ownership inventory | PR-00 | complete source inventory: 33 actions, 5 handlers, 73 service functions; [exceptions G-1–G-10](hardening/ACCESS-INVENTORY.md) |
| P1-01 | Metrics contract | PR-01 | pending |
| P1-02 | Coherent metric labels, provenance, windows and timestamps | PR-01 | pending |
| P1-03 | Source-aware idempotent metrics and safe reconciliation | PR-02 | pending |
| P1-04 | Transactional CSV preview/import, diagnostics and matching | PR-03 | pending |
| P1-05 | All foreign reference tenant guards and abuse tests | PR-04 | pending |
| P1-06 | Audited, repeat-safe finance record transitions | PR-04 | pending |
| P1-07 | Role-based overview/report metric visibility | PR-04 | pending |
| P1-08 | Tenant calendar boundaries and DST | PR-05 | pending |
| P1-09 | Safe CSV export/re-import | PR-03 | pending |
| P2-01 | Controlled invite-only pilot provisioning | PR-06 | blocked by Gate A |
| P2-02 | Hashed, expiring, single-use invitations | PR-06 | blocked by Gate A |
| P2-03 | Anti-enumeration password recovery | PR-06 | blocked by Gate A |
| P2-04 | Disabled accounts and session revocation | PR-07 | blocked by Gate A |
| P2-05 | Tenant onboarding checklist and empty states | PR-07 | blocked by Gate A |
| P2-06 | Explicit email provider/budget, sender authentication and templates | PR-06 | provider decision pending; blocked by Gate A |
| P2-07 | Abuse-sensitive auth/invite rate limits | PR-07 | blocked by Gate A |
| P3-01 | Operator-validated role navigation | PR-08 | pending operator research |
| P3-02 | Content board pagination/counts/filters | PR-08 | pending |
| P3-03 | Table states, sorting, formatting and overflow | PR-08 | pending |
| P3-04 | End-to-end campaign workflow and responsibility | PR-08 | pending |
| P3-05 | Clear status/overdue/approval/payment-record alerts | PR-08 | pending |
| P3-06 | Consistent restrained visual tokens | PR-08 | pending |
| P3-07 | Accessibility automation and keyboard verification | PR-08 | pending |
| P3-08 | Honest CSV/demo/disconnected integration states | PR-08 | pending |
| P3-09 | Report provenance, period and definitions | PR-08 | pending |
| P4-01 | Separated staging/production PostgreSQL and fail-fast env | PR-09 | pending |
| P4-02 | Sanitized monitoring, operation IDs and alerts | PR-09 | pending |
| P4-03 | Verified isolated backup/restore with RPO/RTO | PR-09 | pending |
| P4-04 | Deploy/migration/rollback/support runbook | PR-09 | pending |
| P4-05 | Measured representative load and Web Vitals | PR-09 | pending |
| P4-06 | Auth/tenant/CRUD/finance/import E2E | PR-09 | pending |
| P4-07 | Dependencies, headers, privacy, retention and support review | PR-09 | pending |
| P5-01 | Secure pilot/demo request funnel | PR-10 | blocked by Gate B |
| P5-02 | Accurate manual/CSV/sample marketing claims | PR-10 | pending |
| P5-03 | Pilot onboarding/support runbook and SLA | PR-10 | pending |
| P5-04 | Two willingness-to-pay offers | PR-10 | pending customer validation |
| P5-05 | Privacy-conscious activation/repeated-use events | PR-10 | pending |
| P5-06 | Subscription lifecycle only after repeated pilot usage | PR-11 | blocked by Gate C |
| Phase 6 | Endpoint feasibility and approved TikTok Partner integration specification | PR-12 | blocked by API approval and separate approved specification |

## Release gates

| Gate | Decision | Required evidence |
| --- | --- | --- |
| A — correctness and tenant isolation | **NO-GO: not validated** | PR-01–05 acceptance, atomic imports, repeat-safe metrics, role visibility, finance audit, all-resource tenant negative tests |
| B — staging pilot readiness | **NO-GO: not validated** | Recovery/onboarding, complete workflow/a11y acceptance, PostgreSQL deployment/restore rehearsal, operations runbook and sign-off |
| C — subscription automation | **NO-GO: not validated** | Two design partners demonstrating repeated product use and documented commercial findings |
| TikTok API | **NO-GO: not authorized** | Approved partner access/scopes, per-endpoint feasibility and separate approved implementation specification |

Production data must never be reset. No check marked blocked, skipped, or source-observed counts as passed acceptance. Interviews, consent, payment willingness, live deployment, restore, and API permissions require real evidence; generated fixtures do not satisfy them.
