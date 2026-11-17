# Pre-publication secret review

Scope: PR-00 change set on `hardening/pr-00-baseline`, based on upstream `main` at `233dd7f403df10585f2bf6dbf2a81bfb39ccbc6d`. Review requested before committing/pushing. This is a focused source/secret review, not a complete penetration test or dependency remediation.

## Method and results

- Used Gitleaks **8.30.1**, downloaded from its official GitHub release and checked against the release SHA-256 manifest. Scans ran locally, with secret values redacted. No source, credentials, or reports were uploaded to a scanning service.
- Scanned a snapshot of all 300 publishable tracked/non-ignored files before this review note was added. No real credential was identified in the current files. One generic-key match was manually classified as the existing synthetic session-signing constant in `lib/integration.test.ts:38`; it is a test fixture, not an external API credential.
- Scanned all available Git history (`--all --full-history`). Three matches: two occurrences of that same synthetic test constant, and one credential-looking API key in historical `opencode.json` at commit `8302c138e6726b59ea44e75df8e1532d76e12329`, line 10, under `provider.tokenrouter.options.apiKey`. The surrounding provider URL identifies TokenRouter. The key value is deliberately omitted.
- The historical commit is already an ancestor of upstream `main`. `opencode.json` is absent from the current tracked tree and is ignored. This change set does not reintroduce the file or key. Ignoring/deleting it does not remove the historical exposure.
- Synthetic passwords and signing secrets in test fixtures/configuration were reviewed as local-only values. They must never be reused in production. The separate hardening fixture seeder refuses production mode and ordinary development database filenames; it runs its guard before loading Prisma.
- Reviewed the Git publishing file set: environment files (apart from the placeholder `.env.example`), database files, generated clients, session/tool configuration, local screenshots, scanner reports, and browser reports are excluded from the new commit. Existing tracked baseline artifacts are unchanged.

## Required owner action

**Revoke or rotate the historical TokenRouter key and check provider usage.** No attempt was made to authenticate with it, check whether it remains active, inspect provider usage, or rotate credentials. Until revocation is verified, treat the historical value as exposed.

History cleanup requires a separately coordinated decision because rewriting shared history changes commit IDs and requires a force push plus collaborator cleanup. No history rewrite is performed by this PR-00 push, and rewriting would not substitute for revocation.

## Limits

Pattern-based secret scans can miss unknown formats, encoded/custom secrets and credentials stored outside the reviewed files/history. A clean current-tree result is not a claim that the repository has never exposed a secret. Known application security/production-readiness gaps remain documented in the hardening checklist and access inventory. The previously measured dependency advisories are not addressed by this review.
