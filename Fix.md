You are working inside the existing repository:

`SYTE001/Agency`

Your job is to AUDIT and FIX the current codebase before any new feature development.

IMPORTANT:
Do NOT redesign the UI.
Do NOT change the existing product concept.
Do NOT remove existing modules.
Do NOT add unrelated features.
Do NOT rewrite the application from scratch.
Preserve the current architecture and business workflow.

The goal is to make the existing project technically reliable, secure, maintainable, and ready for continued development and eventual production deployment.

RATE LIMIT SAFETY:

The model provider has a strict request limit of approximately 10 requests per minute.

Work conservatively.

DO NOT issue many model/tool requests in rapid succession.

Batch related file inspections into as few requests as possible.

Before requesting another large group of files, reason about the information already available.

Prefer:
- reading multiple related files together
- analyzing existing results before making another request
- making fewer, larger edits
- running one verification command at a time

Avoid:
- repeatedly opening the same file
- repeatedly searching the same pattern
- unnecessary tool calls
- redundant validation
- unnecessary re-reading of files already inspected

After every major phase, pause and consolidate your findings before continuing.

If a provider rate limit is encountered:
1. stop generating new requests,
2. wait for the rate-limit window to recover,
3. continue from the current state,
4. do not restart the audit from the beginning.

Prioritize correctness over speed.

==================================================
PHASE 1 — FULL REPOSITORY AUDIT
==================================================

First inspect the entire repository before modifying anything.

Inspect:

- package.json
- package-lock.json
- tsconfig.json
- eslint configuration
- Next.js configuration
- Prisma configuration
- prisma/schema.prisma
- database layer
- app/
- components/
- lib/
- hooks/
- services/
- utils/
- middleware
- server actions
- API routes
- authentication
- authorization
- environment variable usage
- seed/demo data
- deployment configuration
- build scripts
- README / documentation

Identify:

- TypeScript errors
- ESLint errors
- Next.js build errors
- Prisma schema problems
- broken relations
- unsafe database queries
- missing authorization
- tenant isolation problems
- financial calculation issues
- client/server boundary problems
- incorrect async/server code
- unnecessary dependencies
- insecure environment handling
- exposed secrets
- dead code
- inconsistent naming
- production-incompatible code

Before editing, understand how the application currently works.

Do not make speculative architectural changes.

==================================================
PHASE 2 — BUILD AND LINT VALIDATION
==================================================

Run:

npm install

Then run:

npm run lint
npm run build

Also run the appropriate Prisma validation/generation commands.

Fix every actual error found.

Do not suppress errors with:

- eslint-disable
- @ts-ignore
- @ts-expect-error
- any
- unsafe casts

unless absolutely necessary and technically justified.

Do not hide problems.

The final repository must successfully pass:

npm run lint
npm run build

and Prisma generation/validation.

==================================================
PHASE 3 — DATABASE FOUNDATION
==================================================

The current project uses Prisma with SQLite/better-sqlite3.

Do not blindly replace the database architecture.

Instead:

1. Centralize database access.
2. Ensure Prisma client creation exists in one reliable server-side layer.
3. Prevent direct database access from client components.
4. Avoid SQLite-specific business logic where possible.
5. Keep the schema migration-friendly for PostgreSQL/Supabase.
6. Document any SQLite-specific limitation that cannot yet be removed.

The long-term production database is PostgreSQL/Supabase, so new business logic must not unnecessarily depend on SQLite-specific behavior.

Do not destroy the current local development workflow.

==================================================
PHASE 4 — FINANCIAL PRECISION
==================================================

This is HIGH PRIORITY.

Audit every financial field and calculation.

Potentially affected fields include:

- price
- budget
- GMV
- targetGmv
- actualGmv
- commission
- creatorCommission
- agencyRevenue
- creatorPayout
- settlement amounts

Do NOT use floating-point arithmetic for financial calculations.

Use Prisma Decimal or another deterministic monetary representation appropriate for the existing database architecture.

Create centralized financial utilities where appropriate.

For example:

calculateCreatorCommission()
calculateAgencyRevenue()
calculateCreatorPayout()

Financial calculations must:

- be deterministic
- use consistent rounding
- avoid floating-point drift
- use the same formula everywhere
- be testable independently

Do not duplicate financial formulas inside React components.

Do not arbitrarily modify demo numbers just to make tests pass.

==================================================
PHASE 5 — MULTI-TENANT SECURITY
==================================================

The application's core tenant boundary is:

agencyId

Every business record must belong to an Agency.

Audit EVERY server-side database query and mutation.

A request for an entity must never trust the client-provided agencyId.

Resolve the authenticated user's agency server-side.

Then scope queries to that agency.

Bad pattern:

findUnique({
  where: { id }
})

when the entity belongs to a tenant and authorization is not separately enforced.

Preferred concept:

authenticated user
→ resolve agency
→ query entity by id + authorized agency

Ensure Agency A cannot access or modify Agency B's:

- users
- brands
- creators
- products
- campaigns
- campaign creators
- content
- live sessions
- tasks
- notes
- activities
- commissions
- payouts
- settlements
- reports
- integrations

Tenant isolation must be enforced on the SERVER.

Never rely on hiding navigation items or UI controls.

==================================================
PHASE 6 — AUTHENTICATION AND RBAC
==================================================

Audit the existing authentication implementation.

Do not replace it unless it is actually broken.

Implement or improve centralized permission handling.

Roles:

- Owner
- Admin
- Account Manager
- Creator Manager
- Campaign Manager
- LIVE Manager
- Finance
- Viewer

Do not scatter role checks throughout the application.

Create a centralized permission system.

Concept:

can(user, "creator.read")
can(user, "creator.write")
can(user, "campaign.read")
can(user, "campaign.write")
can(user, "finance.read")
can(user, "finance.write")

Every sensitive server action/API route must validate authorization.

Viewer must truly be read-only.

Finance permissions must not automatically grant creator-management write access.

Do not rely on client-side role checks for security.

==================================================
PHASE 7 — USER / CREATOR IDENTITY
==================================================

Audit current uniqueness constraints, especially:

User.email
Creator.username
CreatorPlatformAccount

Determine whether uniqueness is:

- global
or
- tenant scoped
or
- platform scoped

Do not remove unique constraints blindly.

Internal Creator identity should be separate from external platform identity.

A TikTok username/handle should not become the internal primary identity of the creator.

==================================================
PHASE 8 — DATABASE RELATION INTEGRITY
==================================================

Audit all Prisma relationships.

Especially:

Agency
User
Brand
BrandContact
Creator
CreatorMetric
CreatorPlatformAccount
Product
ProductMetric
Campaign
CampaignCreator
CampaignProduct
ContentItem
ContentRevision
LiveSession
LiveMetric
Task
Activity
Note
Commission
CreatorPayout
Settlement
Report
Integration
SyncJob
SyncLog

Verify:

- foreign keys
- required vs optional relations
- cascade behavior
- deletion behavior
- indexes
- unique constraints
- orphan record prevention

Be especially careful with financial and historical records.

Do NOT use destructive cascade deletion for financial/audit data where that would destroy historical information.

==================================================
PHASE 9 — API / SERVER ACTION SECURITY
==================================================

Inspect all:

- route handlers
- server actions
- mutations
- forms
- database helper functions

Ensure:

- input validation exists
- authorization happens before mutation
- tenant ownership is verified
- IDs are validated
- user-controlled values are sanitized/validated
- errors do not expose secrets or internal database details

Use Zod where it already fits the project.

Do not expose raw Prisma errors to users.

==================================================
PHASE 10 — NEXT.JS CLIENT/SERVER BOUNDARIES
==================================================

Audit every component using:

"use client"

Ensure server-only modules are never imported into client components.

Database access must stay server-side.

Secrets must never reach the browser.

Do not expose private environment variables through NEXT_PUBLIC_*.

Check:

- server components
- client components
- server actions
- route handlers
- hooks
- data fetching

Fix incorrect boundaries without changing the UI behavior.

==================================================
PHASE 11 — ENVIRONMENT VARIABLES AND SECRETS
==================================================

Audit all environment variables.

Verify:

- no hardcoded passwords
- no API keys
- no JWT secrets
- no database credentials
- no service-role keys
- no private tokens
- no production secrets committed to Git

Check .gitignore.

Do not commit `.env`
or other secret files.

Create/update a safe `.env.example` containing variable names only.

==================================================
PHASE 12 — PRISMA GENERATION AND DEPLOYMENT
==================================================

The Prisma client is generated into:

`generated/prisma`

Ensure the project can reliably generate the Prisma client during installation/build.

Verify the build process does not depend on a locally generated ignored directory.

Update package scripts ONLY when necessary.

The final flow must work from a clean clone.

Simulate a clean environment as much as practical.

==================================================
PHASE 13 — DATA VALIDATION
==================================================

Audit forms and mutation inputs.

Prevent:

- invalid dates
- negative monetary values where prohibited
- invalid percentages
- impossible status transitions
- missing required relationships
- malformed URLs
- invalid IDs

Do not overvalidate fields where the business model intentionally permits zero/null values.

==================================================
PHASE 14 — TESTS
==================================================

Add focused tests ONLY where they materially protect critical logic.

Prioritize:

1. financial calculations
2. tenant isolation
3. authorization
4. important database/business utilities

Do not build a huge test suite.

Tests should target real risks discovered during the audit.

==================================================
PHASE 15 — CLEANUP
==================================================

Clean up obvious technical debt that directly affects reliability:

- unused imports
- broken imports
- duplicate utilities
- dead code
- inconsistent server/client patterns
- incorrect types
- dangerous `any`
- duplicated financial formulas
- unnecessary dependency usage

Do not perform cosmetic refactoring unrelated to correctness.

==================================================
PHASE 16 — FINAL VERIFICATION
==================================================

After all fixes, run:

npm run lint
npm run build

Also run Prisma validation/generation and relevant tests.

If possible, verify that a clean install can reproduce the build.

Do not claim success unless the commands actually pass.

==================================================
IMPORTANT CONSTRAINTS
==================================================

1. Preserve existing UI and UX.
2. Preserve existing routes unless a route is genuinely broken.
3. Preserve existing business logic unless it is incorrect or insecure.
4. Do not migrate SQLite → Supabase/PostgreSQL unless the repository already contains a proper migration path and the change is necessary.
5. Do not introduce unnecessary dependencies.
6. Do not invent functionality.
7. Do not disable security checks to make the build pass.
8. Do not hide TypeScript/ESLint errors.
9. Do not expose secrets.
10. Do not rewrite working code without a concrete reason.

==================================================
OUTPUT REQUIREMENT
==================================================

At the end, provide a concise technical report containing:

A. Problems found
B. Problems fixed
C. Files changed
D. Database/schema changes
E. Security changes
F. Financial calculation changes
G. Commands executed
H. Exact result of lint
I. Exact result of build
J. Remaining issues, if any

Use this status format:

BUILD: PASS / FAIL
LINT: PASS / FAIL
PRISMA: PASS / FAIL
SECURITY AUDIT: PASS / FAIL
FINANCIAL AUDIT: PASS / FAIL
TENANT ISOLATION: PASS / FAIL

Only mark PASS when actually verified.

Finally, show:

git status
git diff --stat
git diff

Do not commit or push automatically.

STOP after verification and report the result.