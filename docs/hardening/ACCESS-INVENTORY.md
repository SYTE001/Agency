# Access Inventory — every exported entry point and its permission enforcement (PR-00)

Date: 2026-11-17. Baseline: upstream `main` @ `233dd7f403df10585f2bf6dbf2a81bfb39ccbc6d`
(the extracted source matched this revision before PR-00 edits). Everything below
is **observed from source**. The marker **[TESTED]** means an existing automated
test asserts the behavior; it is a coverage reference, not a claim that this pass
executed it successfully. Current execution results are recorded separately in
[PR-00-BASELINE.md](PR-00-BASELINE.md). Historical audit pass counts are not current
verification.

## 1. Scope and surface counts

Sources read in full: `app/actions/*.ts` (11 files), all `app/**/route.ts` (5
files), `lib/services/*.ts` (16 files), plus `lib/auth.ts`, `lib/authorization.ts`,
`lib/constants.ts`, `lib/redirect.ts`, `lib/finance.ts`, `proxy.ts`, and the
`(app)` layout/pages used to confirm page-level gating.

| Surface | Count |
|---|---|
| Exported server actions (`app/actions/*.ts`) | **33** |
| Exported HTTP route handlers (`app/**/route.ts`) | **5** (all `GET`) |
| Exported service functions (`lib/services/*.ts`) | **73** (+ 2 exported constants) |
| Authorization helpers (`lib/authorization.ts`) | **3** (`hasPermission`, `can`, `readableResources`) |
| Auth/session helpers (`lib/auth.ts`) | **8** value exports (`SESSION_COOKIE`, `createSessionToken`, `verifySessionToken`, `resolveSessionUser`, `getSessionUser`, `requireUser`, re-exported `hashPassword`, re-exported `verifyPassword`) plus type exports `SessionUser`/`TokenPayload` |

Total externally reachable entry surface: **38** (33 actions + 5 handlers). Service
functions are reachable only through those 38 or through server components. The
G-3 orphan export (`updateContentItem`) is **not** an external entry point at all —
it has zero callers in the current tree and is listed only as dead code to remove
or harden.

## 2. Identity, session, and the permission model

### 2.1 Session layer (`lib/auth.ts`)

- JWT (HS256, issuer `agency-os`, audience `agency-os-app`, 7-day fixed expiry)
  signed with `AUTH_SECRET`; in non-production a **hard-coded dev secret**
  `"taos-dev-secret-local-only"` is used when `AUTH_SECRET` is absent (see G-8).
  **[TESTED]** expiry rejection (`lib/auth-workflow.test.ts` "rejects expired
  session tokens").
- `resolveSessionUser` re-reads the user row from the DB on every request —
  agencyId and role come from the DB, **not** the token claims. **[TESTED]**
  (`lib/integration.test.ts` "agency/role come from the DB row, not the token
  claims"; "returns null for a deleted user's token"; "returns null for an
  invalid role stored in the DB").
- `requireUser()` redirects to `/login?next=…` when unauthenticated; the `next`
  value is validated by `getSafeRedirectUrl` (`lib/redirect.ts`) which rejects
  external/scheme/`//`/`\`/CR-LF targets and only allows the whitelisted
  internal prefixes. **[TESTED]** open-redirect suite in `lib/auth-workflow.test.ts`.
- Cookie `taos-session`: `httpOnly`, `sameSite=lax`, `secure` in production,
  `path=/` (`app/actions/auth.ts:60`). There is **no server-side session
  revocation**: `logout()` only clears the cookie; a stolen token remains valid
  until the 7-day expiry (see G-7).
- `proxy.ts` (middleware) does **not** authenticate anything. It injects
  `x-pathname`/`x-search` headers and sets `Cache-Control: no-store` on the
  protected route prefixes (including `/search`). Authentication is enforced by
  `app/(app)/layout.tsx` (`requireUser()`, `dynamic = "force-dynamic"`) and by
  each route handler / action individually. There is no `/api/*` tree.

### 2.2 Permission matrix (`lib/constants.ts`, `lib/authorization.ts`)

Roles: `owner`, `admin` hold `["*"]`; all other roles hold explicit resource lists.
Two implications verified by reading the matrix (`lib/constants.ts:47-124`):

- `setting:write` and `integration:manage`/`integration:read` are held by **no
  scoped role** — member administration and integrations are owner/admin-only
  through the wildcard. **[TESTED]** (`lib/integration.test.ts` "no scoped role
  can write settings or integrations").
- `hasPermission` / `can` / `readableResources` fail closed: unknown role →
  `[]` → no permission. **[TESTED]** role-matrix assertions in
  `lib/integration.test.ts` ("owner and admin hold full access", "viewer cannot
  write anything", etc.).

### 2.3 Enforcement model observed across the codebase

1. **Action layer**: every mutating action calls `requireUser()` then
   `can(user.role, resource, action)` before parsing input.
2. **Service layer**: writes generally take `agencyId` and scope the target query
   or update to that tenant. Reference validation exists on many create paths
   (e.g. campaigns and LIVE), but is incomplete on campaign updates and task
   ownership, with further latent generic-update gaps. See G-1 through G-4; a
   scoped target update does not establish that supplied foreign keys are safe.
3. **Page layer**: 42 files under `app/(app)` call `can(...)`; write pages
   `redirect()`/`notFound()` on missing permission (e.g.
   `app/(app)/brands/new/page.tsx:11`); list pages compute `canWrite` to hide
   forms. Read data is always fetched with `user.agencyId`.
4. **Route layer**: each of the 5 handlers calls `getSessionUser()` + `can()`
   (except `/search`, see §5).

## 3. Server actions inventory (33)

Legend: **Gate** = permission check location; **FK** = how foreign IDs in input
are handled; "silent void" = returns without error/feedback on permission denial
(UI hides the control; noted in G-6).

### 3.1 `app/actions/auth.ts` (2)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `login` | Public by design (credentials are the gate) | n/a | No rate limiting / lockout / CAPTCHA (G-7). Errors are neutral ("Email atau password salah."). DB/token errors caught and neutralized. Cookie flags OK. |
| `logout` | none (safe: only clears own cookie) | n/a | `revalidatePath("/", "layout")` then redirect. |

### 3.2 `app/actions/brands.ts` (4)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createBrandAction` | `requireUser` + `can(brand, write)` (brands.ts:46-49) | `createBrand(user.agencyId, …)` — agency forced server-side | Zod validates all fields; service re-checks status. Errors mapped to neutral Indonesian messages. |
| `updateBrandAction` | same (brands.ts:90-93) | `updateBrand(agencyId, brandId, …)`; service does tenant-scoped existence check then scoped update **[TESTED]** cross-tenant edit rejected (`lib/brands-crud.test.ts:134`) | — |
| `addBrandContactAction` | same (brands.ts:156-159) | `brandId` is a bound action arg (client-visible); `createBrandContact` re-checks brand ownership via `findFirst` **[TESTED]** (`lib/brands-crud.test.ts:149`) | — |
| `addBrandNoteAction` | `can(brand, write)` — write required for notes, read not sufficient (brands.ts:207) | explicit `entityBelongsToAgency("Brand", brandId, agencyId)` pre-check; `addNote` carries `agencyId` | `addNote` itself is not in try/catch — a note-write failure raises an unhandled server-action error (G-5). |

### 3.3 `app/actions/campaigns.ts` (5)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createCampaignAction` | `can(campaign, write)` (campaigns.ts:60) | `createCampaign(agencyId, …)`; service validates brandId **and** ownerId against `agencyId` before create (campaigns.ts:225-231) | Create is wrapped in try/catch (campaigns.ts:100); failure mapped to a neutral "brand not found" message. |
| `updateCampaignAction` | same (campaigns.ts:139) | row scoped via `update({ where: { id: campaignId, agencyId } })`; **but the incoming `brandId` and `ownerId` are NOT re-validated against the agency on the update path** (service `updateCampaign`, campaigns.ts:252-273, passes `data` straight through) → **G-1 (notable gap)** | Service also does not validate `status` on update; the action schema does (defense holds at action layer only). |
| `addCampaignCreatorAction` | same (campaigns.ts:209) | `addCampaignCreator` validates both campaignId and creatorId against `agencyId` (campaigns.ts:280-283) | — |
| `removeCampaignCreatorAction` | same; **silent void** on denial (campaigns.ts:249) | link scoped via `findFirst({ where: { id: linkId, campaign: { agencyId } } })` (campaigns.ts:295) | `campaignId` arg used only for logging/revalidate; the actual scope is the linkId row. G-6. |
| `addCampaignNoteAction` | `can(campaign, write)` (campaigns.ts:277) | explicit `entityBelongsToAgency("Campaign", …)` pre-check | `addNote` unguarded (G-5). |

### 3.4 `app/actions/content.ts` (3)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createContentAction` | `can(content, write)` (content.ts:39) | pre-validates campaignId, creatorId, productId, reviewerId via `entityBelongsToAgency`; service re-validates all four (content.ts:124-136) | Create wrapped in try/catch. |
| `moveContentAction` | `can(content, write)`; **silent void** (content.ts:96) | `updateContentStatus` does scoped findFirst + scoped update; status validated against `CONTENT_STATUS` in action and service | Feedback/revision record only created for `Revision`+feedback. G-6. |
| `addContentNoteAction` | `can(content, write)` (content.ts:129) | `entityBelongsToAgency("Content", …)` pre-check | `addNote` unguarded (G-5). |

### 3.5 `app/actions/creators.ts` (2)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createCreatorAction` | `can(creator, write)` (creators.ts:49) | agency forced; `resolveManager` requires manager user of the SAME agency (creators.ts:290-298) **[TESTED]** foreign manager rejected (`lib/creators-crud.test.ts:186`) | Tenant-scoped unique `username` violation mapped to friendly error. |
| `updateCreatorAction` | same (creators.ts:95) | scoped existence check + scoped update; `managerId: null` clears, value must be same-agency **[TESTED]** (`lib/creators-crud.test.ts:198`, `lib/integration.test.ts` cross-tenant FK suite) | `health` is updatable via the partial data (validated against `CREATOR_HEALTH`) — health is derived elsewhere by `computeHealth`; no action exposes it today. |

### 3.6 `app/actions/finance.ts` (5)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createCommissionAction` | `can(finance, write)` (finance.ts:52) | pre-checks creator (+campaign if set) via `entityBelongsToAgency`; `createCommission` re-validates both (finance.ts:145-151) | Preview mode (`submit` absent) returns the calculation without persisting — still gated by permission. Commission amounts computed server-side by `calculateCommission` (`lib/finance.ts`); client cannot set them. |
| `createPayoutAction` | same (finance.ts:130) | pre-check + service re-validation of creator/campaign | — |
| `markPayoutPaidAction` | same; **silent void** (finance.ts:180) | scoped findFirst + `update({ where: { id, agencyId } })` **[TESTED]** (`lib/integration.test.ts` "status mutations cannot touch another tenant's payout/settlement") | G-6. |
| `createSettlementAction` | same (finance.ts:220) | service additionally requires campaign to belong to the **same brand** (`where: { id, agencyId, brandId }`, finance.ts:268-274) — strongest FK check in the codebase | — |
| `markSettlementPaidAction` | same; **silent void** (finance.ts:272) | scoped, **[TESTED]** (same suite as above) | G-6. |

### 3.7 `app/actions/integrations.ts` (2)

Owner/admin only: `integration:manage` exists in no scoped role (comment at
integrations.ts:15-17).

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `importCsvAction` | `requireIntegrationManager()` = `requireUser` + `can(integration, manage)` (integrations.ts:20-24) | `importCreatorsCsv`/`importProductsCsv` always match/create within `agencyId`; product updates scoped `where: { id: existing.id, agencyId }` | Import matches existing rows by `externalId` OR `username`/`name` — an owner importing a colliding username overwrites the existing creator (by design, owner-only). `importProductsCsv` auto-creates unknown brands. File limit 2 MB, `.csv` extension check only (no content-type/MIME hardening — CSV parser is hand-rolled, no formula-injection risk on import since values are stored, not re-exported verbatim; exports escape, see §4). |
| `runSyncAction` | same | `runMockSync(agencyId)` — all queries agency-scoped; gated again inside the service by `isMockSyncEnabled()` (`MOCK_SYNC_ENABLED=true` **and** `NODE_ENV !== "production"`), thrown before any DB access **[TESTED]** (`lib/mock-sync.test.ts`) | Double permission + env gate; no gap. |

### 3.8 `app/actions/live.ts` (4)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createLiveAction` | `can(live, write)` (live.ts:45) | pre-validates creatorId, campaignId, brandId, productId, operatorId via `entityBelongsToAgency`; service re-validates all five (live.ts:185-202) | **No try/catch around `createLiveSession`** — a service throw (e.g. race between pre-check and create) surfaces as an unhandled server-action error (G-5). |
| `moveLiveStatusAction` | `can(live, write)`; **silent void** (live.ts:101) | `updateLiveSession` scoped findFirst + scoped update; status validated | G-6; also G-4 (service accepts FK fields unvalidated — current caller sends only `status`). |
| `recordLiveResultsAction` | `can(live, write)` (live.ts:143) | `entityBelongsToAgency("LiveSession", …)` pre-check; `recordLiveResults` scoped findFirst + scoped update; sets `status: "Ended"` server-side | No try/catch around `recordLiveResults` (G-5). Conversion rate computed server-side. |
| `addLiveNoteAction` | `can(live, write)` (live.ts:185) | pre-check + `addNote` with agencyId | `addNote` unguarded (G-5). |

### 3.9 `app/actions/products.ts` (2)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createProductAction` | `can(product, write)` (products.ts:43) | agency forced; `resolveBrand` requires same-agency brand **[TESTED]** (`lib/integration.test.ts` "createProduct validates the brand belongs to the same tenant") | Tenant-scoped unique SKU mapped to friendly error. |
| `updateProductAction` | same (products.ts:87) | scoped existence check + scoped update; brandId undefined/null/value semantics same as creators **[TESTED]** (`lib/products-crud.test.ts`) | — |

### 3.10 `app/actions/tasks.ts` (2)

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createTaskAction` | `can(task, write)` (tasks.ts:50) | related entity (Creator/Brand/Campaign/Content/LiveSession) pre-validated via `entityBelongsToAgency`; `createTask` scopes the row. **But `ownerId` is NOT validated against the agency at either layer** (tasks.ts:71-78 action; `lib/services/tasks.ts:64-91` service) → **G-2 (notable gap)** | Service coerces invalid priority to `"Medium"` (fail-safe). |
| `updateTaskStatusAction` | `can(task, write)`; **silent void** (tasks.ts:98) | scoped findFirst + scoped update; status validated; cancel/reopen/completion bookkeeping enforced in service (`lib/services/tasks.ts:106-131`) **[TESTED]** (`lib/tasks-cancel.test.ts`, `lib/tasks-overdue.test.ts`) | G-6. Underlying `updateTask` also accepts an unvalidated `ownerId` (latent G-2) — not reachable through this caller, which sends only `{ status }`. |

### 3.11 `app/actions/users.ts` (2)

Owner/admin only (`setting:write` is wildcard-only; comment users.ts:13-16).

| Action | Gate | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|
| `createUserAction` | `can(setting, write)` (users.ts:51) | `createAgencyUser(agencyId, actor, data)` — agency forced from session; owner-grant restricted to owners; email uniqueness checked **[TESTED]** (`lib/users-service.test.ts`: "only owners can grant the owner role", "cross-tenant access is blocked", "listing is agency-scoped and never exposes password hashes") | Password policy: min 8 chars only; no complexity/max-attempt rules (G-7 adjacent). |
| `updateUserAction` | same (users.ts:96) | `updateAgencyUser` scopes the member row; admin can never modify an owner; owner grant restricted; self-role-change blocked; last-owner protection **[TESTED]** (`lib/users-service.test.ts`: "self-protection", "last-owner protection") | Action reads `before.role` via a separately scoped `prisma.user.findFirst` for the audit entry only — authorization does not depend on it (comment users.ts:112-114). |

## 4. HTTP route handlers (5, all `GET`)

| Handler | Auth | Permission | Tenant scoping / FK | Exceptions & gaps |
|---|---|---|---|---|
| `app/(app)/reports/export/client/route.ts` GET | `getSessionUser()`; redirect to `/login?next=<self>` when null | `can(report, read)` → 403 | `getClientReport(agencyId, campaignId, period)`; unknown campaign → 404; `period` whitelisted via `PERIODS` | `periodParam` not in `PERIODS` falls back to `"30d"` (fail-safe). CSV escaped against spreadsheet formula injection (`csvEscape`, reports.ts:258-274) — includes the campaign name, which comes from brand-owned data. |
| `app/(app)/reports/export/internal/route.ts` GET | same | `can(report, read)` → 403 | `getInternalReport(agencyId, period)` | Internal financial aggregates gated only by `report:read`, which **every role including `viewer` holds** — viewer can export internal finance CSV. This matches the matrix but is worth a product decision (G-9/observation). |
| `app/(app)/search/route.ts` GET | `getSessionUser()`; 401 JSON when null | **No `can()` at the route**; enforcement is inside `globalSearch`, which filters result groups by `readableResources(role)` (search.ts:158-160) | every Prisma query includes `agencyId` | Verified from source: all seven resource queries run unconditionally (single `Promise.all`, search.ts:31-83) regardless of role; non-readable groups are discarded before the response — performance/observation only, no data returned (G-9). **[TESTED]** permission-filter behavior partially covered by `lib/integration.test.ts` readableResources assertions; the route itself has no test. |
| `app/(app)/settings/integrations/template/creators/route.ts` GET | redirect when null | `can(integration, read)` → 403 | static CSV, no data | No scoped role holds `integration:read` → owner/admin only via `*`. |
| `app/(app)/settings/integrations/template/products/route.ts` GET | same | same | static CSV | same. |

## 5. Service layer inventory (73 exported functions)

All functions take `agencyId` as first (or early) parameter unless noted.
"Detail returns null" = cross-tenant/missing row yields `null`, callers render 404.

### `lib/services/activity.ts` (5)

| Export | Scope | Notes |
|---|---|---|
| `logActivity(args)` | writes with caller-supplied `agencyId` — trusted because callers derive it from session | audit sink for every mutation |
| `getActivity(entityType, entityId, agencyId, limit)` | `where: { agencyId, entityType, entityId }` | used by all 6 detail pages |
| `getNotes(entityType, entityId, agencyId)` | same | same |
| `addNote(args)` | writes with caller-supplied agencyId; **entity ownership is the caller's responsibility** — actions pre-check with `entityBelongsToAgency` | unguarded in 4 note actions (G-5) |
| `entityBelongsToAgency(entityType, entityId, agencyId)` | whitelist of 7 entity types; unknown type → `null` (fail closed) | shared FK validator |

### `lib/services/brands.ts` (5)

| Export | Scope | Notes |
|---|---|---|
| `listBrands(agencyId, filters)` | `where: { agencyId }` + scoped aggregates | **[TESTED]** list scoping (`lib/integration.test.ts` "list queries return only the tenant's own rows") |
| `getBrandDetail(agencyId, brandId)` | scoped findFirst → null; all sub-queries include `agencyId` | **[TESTED]** "detail queries on another tenant's record return null" |
| `createBrand(agencyId, data)` | agency forced; status validated | **[TESTED]** |
| `updateBrand(agencyId, brandId, data)` | scoped existence check + scoped update | **[TESTED]** cross-tenant rejection |
| `createBrandContact(agencyId, brandId, data)` | parent brand validated per agency; primary-contact demotion inside transaction | **[TESTED]** |

### `lib/services/campaigns.ts` (6)

| Export | Scope | Notes |
|---|---|---|
| `listCampaigns(agencyId, filters)` | `where: { agencyId }` + scoped aggregates | **[TESTED]** |
| `getCampaignDetail(agencyId, campaignId)` | scoped findFirst → null; most sub-queries include `agencyId`; `campaignCreator`/`campaignProduct` sub-queries key on the validated `campaignId` only (G-10 note) | **[TESTED]** detail null |
| `createCampaign(agencyId, data)` | validates brandId + ownerId per agency | **[TESTED]** FK suite |
| `updateCampaign(agencyId, campaignId, data)` | scoped update only — **does not validate `brandId`/`ownerId`/`status` on the update path** | **G-1** |
| `addCampaignCreator(agencyId, campaignId, data)` | validates campaign + creator per agency | **[TESTED]** FK suite |
| `removeCampaignCreator(agencyId, linkId)` | link scoped via `campaign: { agencyId }` | **[TESTED]** |

### `lib/services/content.ts` (5 + constant `KANBAN_COLUMNS`)

| Export | Scope | Notes |
|---|---|---|
| `getContentBoard(agencyId, filters)` | `where: { agencyId }`, take 500 | filters are equality/contains only |
| `getContentDetail(agencyId, contentId)` | scoped findFirst → null; activity/tasks sub-queries include `agencyId` | **[TESTED]** detail null |
| `createContentItem(agencyId, data)` | validates campaign, creator, product, reviewer per agency | **[TESTED]** FK suite |
| `updateContentStatus(agencyId, contentId, status, opts)` | scoped findFirst + scoped update; status whitelist; revision counter server-side | **[TESTED]** status mutation suite |
| `updateContentItem(agencyId, contentId, data)` | scoped existence check + scoped update; accepts `gmvGenerated`, `viewsGenerated`, `status`, `publishDate` with **no validation of the values** | **G-3: orphan export — zero callers in app/components (verified by grep); dead code that would bypass status validation if ever wired up** |

### `lib/services/creators.ts` (5)

| Export | Scope | Notes |
|---|---|---|
| `listCreators(agencyId, filters)` | `where: { agencyId }` + scoped aggregates | **[TESTED]** |
| `getCreatorDetail(agencyId, creatorId)` | scoped findFirst → null; sub-queries key on validated creatorId (G-10 note); payouts aggregate includes `agencyId` | **[TESTED]** detail null |
| `computeHealth(args)` | pure function, no data access | used by seed/scripts, not by any action |
| `createCreator(agencyId, data)` | agency forced; manager same-agency; tenant-scoped unique username **[TESTED]** | |
| `updateCreator(agencyId, creatorId, data)` | scoped existence check + scoped update; manager re-resolved | **[TESTED]** cross-tenant rejection |

### `lib/services/finance.ts` (10)

| Export | Scope | Notes |
|---|---|---|
| `getFinanceSummary(agencyId, days, ref)` | every aggregate `where: { agencyId }` | **[TESTED]** tz boundary |
| `listCommissions(agencyId, filters)` | `where: { agencyId }` | **[TESTED]** |
| `createCommission(agencyId, data)` | creator + campaign validated per agency; amounts recomputed server-side | **[TESTED]** |
| `listPayouts(agencyId, filters)` | scoped | |
| `createPayout(agencyId, data)` | creator + campaign validated | **[TESTED]** |
| `markPayoutPaid(agencyId, payoutId)` | scoped findFirst + scoped update | **[TESTED]** status mutation suite |
| `listSettlements(agencyId, filters)` | scoped | |
| `createSettlement(agencyId, data)` | brand validated; campaign must match brand AND agency | strongest FK check |
| `markSettlementPaid(agencyId, settlementId)` | scoped | **[TESTED]** |
| `refreshOverdueSettlements(agencyId)` | scoped `updateMany`; called from `app/(app)/finance/settlements/page.tsx:44` after `can(finance, read)` gate | write performed on a read-gated page — status flip Pending→Overdue is benign bookkeeping, but note the asymmetry |

### `lib/services/integrations.ts` (8)

| Export | Scope | Notes |
|---|---|---|
| `parseCsv(text)` | pure | hand-rolled parser; handles quotes/BOM/`;` |
| `importCreatorsCsv(agencyId, text)` | all finds/creates/updates agency-scoped; rows validated before any write | **[TESTED]** (`lib/integration.test.ts`) |
| `importProductsCsv(agencyId, text)` | scoped; auto-creates missing brands within the agency | |
| `getOrCreateIntegration(agencyId)` | scoped find/create | |
| `isMockSyncEnabled()` | env-gated (`MOCK_SYNC_ENABLED=true` and non-production) | **[TESTED]** |
| `computeMockCreatorMetric(c, ref)` | pure | |
| `runMockSync(agencyId)` | env gate re-checked inside, throws before DB access; all writes scoped via the agency's integration | **[TESTED]** |
| `listSyncJobs(agencyId, take)` | scoped via the agency's integration | |

### `lib/services/live.ts` (6)

| Export | Scope | Notes |
|---|---|---|
| `listLiveSessions(agencyId, filters)` | scoped, take 200 | **[TESTED]** tz day filter |
| `getLiveDashboard(agencyId)` | all queries scoped | |
| `getLiveDetail(agencyId, sessionId)` | scoped findFirst → null; activity scoped; `liveMetric` keyed on validated sessionId | |
| `createLiveSession(agencyId, data)` | validates all five FKs per agency | **[TESTED]** FK suite |
| `updateLiveSession(agencyId, sessionId, data)` | status whitelisted; scoped findFirst + scoped update; **FK fields (`campaignId`, `brandId`, `productId`, `operatorId`) accepted without tenant validation** — defense comment says the action layer validates, but the only current caller sends `{ status }` | **G-4 (latent)** |
| `recordLiveResults(agencyId, sessionId, results)` | scoped; forces `status: "Ended"` and endTime server-side | |

### `lib/services/overview.ts` (1)

| Export | Scope | Notes |
|---|---|---|
| `getOverview(agencyId)` | every query scoped | called from `app/(app)/overview/page.tsx` after `requireUser` |

### `lib/services/products.ts` (4)

| Export | Scope | Notes |
|---|---|---|
| `listProducts(agencyId, filters)` | scoped | **[TESTED]** |
| `getProductDetail(agencyId, productId)` | scoped findFirst → null; `productMetric`/`campaignProduct` keyed on validated productId | |
| `createProduct(agencyId, data)` | brand same-agency; unique SKU | **[TESTED]** |
| `updateProduct(agencyId, productId, data)` | scoped existence check + scoped update; brand re-resolved | **[TESTED]** |

### `lib/services/reports.ts` (5 + constant `PERIODS`)

| Export | Scope | Notes |
|---|---|---|
| `resolvePeriod(period, timeZone, now)` | pure | |
| `getClientReport(agencyId, campaignId, period)` | campaign scoped findFirst → null; aggregates scoped | **[TESTED]** aggregates-never-mix-tenants |
| `getInternalReport(agencyId, period)` | all aggregates scoped | |
| `clientReportCsv(r)` / `internalReportCsv(r)` | pure formatters; formula-injection escape | |

### `lib/services/search.ts` (1)

| Export | Scope | Notes |
|---|---|---|
| `globalSearch(agencyId, role, query)` | every query includes `agencyId`; groups filtered by `readableResources(role)` — **permission enforcement lives here, not at the route** | min 2 chars; fail-closed for unknown roles |

### `lib/services/tasks.ts` (4)

| Export | Scope | Notes |
|---|---|---|
| `listTasks(agencyId, filters)` | scoped | |
| `getTaskCounts(agencyId)` | scoped | |
| `createTask(agencyId, actorId, data)` | row scoped; priority coerced; **`ownerId` not validated against agency** | **G-2** |
| `updateTask(agencyId, taskId, actorId, data)` | scoped findFirst + scoped update; terminal-state rules; completion attribution server-side; **`ownerId` accepted in the partial without same-agency validation** (latent — sole caller sends only `{ status }`) | **[TESTED]** cancel/overdue suites; owner-FK gap covered by G-2, untested |

### `lib/services/users.ts` (3)

| Export | Scope | Notes |
|---|---|---|
| `listAgencyUsers(agencyId, …)` | scoped; `USER_LIST_FIELDS` excludes `passwordHash` | **[TESTED]** "never exposes password hashes" |
| `createAgencyUser(agencyId, actor, data)` | agency forced; role whitelisted; owner-grant owner-only; email unique | **[TESTED]** |
| `updateAgencyUser(agencyId, actor, userId, data)` | scoped; admin cannot touch owners; owner grant owner-only; self-role-change blocked; last-owner protected | **[TESTED]** |

### `lib/services/alerts.ts` (1) and `lib/services/common.ts` (4)

- `getOperationalAlerts(agencyId, limit)` — all queries include `agencyId` (observed; no dedicated tenant-isolation test covers this service). Returns entity ids + hrefs for alert links. Called from `getOverview` and the app shell.
- `paginate`, `totalPages`, `getAgencyTimezone(agencyId)`, `containsInsensitive(q)` — pure/derived helpers; `paginate` clamps pageSize to 1–100 (DoS-safe).

## 6. Gap & exception register

Rated by security relevance. **All entries are observed from source; none are
demonstrated by an exploit.** Where a test exists it is cited; G-1 and G-2 have
**no** covering test.

| ID | Severity | Finding | Evidence (path:symbol) | Tested? |
|---|---|---|---|---|
| **G-1** | **High** | Campaign **update** accepts cross-tenant `brandId` and `ownerId`: the action passes form-provided FKs straight to the service, which performs a scoped update without re-validating the FKs (create validates them; update does not). A crafted server-action request could re-point a campaign at another agency's brand/owner. | `lib/services/campaigns.ts` `updateCampaign` (lines 252-273) vs `createCampaign` (225-231); `app/actions/campaigns.ts` `updateCampaignAction` | No — not covered |
| **G-2** | Medium | Task **create** and the task **update** service path accept an `ownerId` belonging to any agency: neither the create action nor `createTask` validates the user FK (unlike campaign owner, content reviewer, live operator, which are all validated), and `updateTask` likewise accepts `ownerId` in its partial data with no same-agency resolution. The update half is latent today — the sole caller `updateTaskStatusAction` sends only `{ status }`. Impact is limited to assignment/display, but both are foreign-ID writes. | `app/actions/tasks.ts` `createTaskAction` (71-78); `lib/services/tasks.ts` `createTask` (64-91); `lib/services/tasks.ts` `updateTask` (93-132, `ownerId` in partial at line 99); sole update caller `app/actions/tasks.ts:104` | No — not covered |
| **G-3** | Medium (latent) | `updateContentItem` is an orphan export with **zero callers** (grep over `app/`, `components/`, `lib/` excluding tests) that permits unvalidated writes to `status`, `gmvGenerated`, `viewsGenerated`, `publishDate`. It is **not an external entry point** in the current tree — nothing reaches it — but it is dead code sitting one import away from bypassing `updateContentStatus`'s validation. | `lib/services/content.ts:185-204` | No — not covered |
| **G-4** | Low (latent) | `updateLiveSession` accepts FK fields (`campaignId`, `brandId`, `productId`, `operatorId`) without service-level tenant validation; currently safe because the only caller sends `{ status }`, but the "action layer validates" assumption (`lib/services/live.ts:183-185` comment) breaks if a new caller passes FKs. | `lib/services/live.ts:221-245`; sole caller `app/actions/live.ts:107` | No — not covered |
| **G-5** | Low | Several actions have no try/catch around the final service call, so a service throw (incl. the fail-closed "not found" errors) becomes an unhandled server-action error instead of a friendly message: `createLiveAction` (live.ts:84), `recordLiveResultsAction` (live.ts:163), and `addNote` in `addBrandNoteAction` / `addCampaignNoteAction` / `addContentNoteAction` / `addLiveNoteAction`. Availability/UX, not authorization. | paths above | No |
| **G-6** | Info (by design) | Six void-returning actions deny permission **silently** (`return;` with no feedback): `removeCampaignCreatorAction`, `moveContentAction`, `moveLiveStatusAction`, `updateTaskStatusAction`, `markPayoutPaidAction`, `markSettlementPaidAction`. UI hides the controls for unauthorized roles; a direct caller just observes nothing happen. | each action's gate line (see §3) | No |
| **G-7** | Medium (hardening) | No brute-force protection on `login` (no rate limit / lockout / delay), and no server-side session revocation: `logout()` clears the cookie but the JWT stays valid until its fixed 7-day expiry; changing a user's role takes effect immediately (role read from DB) but there is no way to invalidate a stolen token. | `app/actions/auth.ts` `login`/`logout`; `lib/auth.ts` `verifySessionToken` | Expiry **[TESTED]**; revocation absence observed |
| **G-8** | Info (dev-only) | `AUTH_SECRET` falls back to a hard-coded constant in non-production; production throws if absent/short (<32). | `lib/auth.ts:17-29` | No |
| **G-9** | Info | `/search` route has no route-level `can()` (enforcement inside `globalSearch`). Verified against source: the seven resource queries are **not** conditional on role — they all run in a single `Promise.all` (`lib/services/search.ts:31-83`) for every request, and only the assembled groups are filtered by `readableResources(role)` afterward (search.ts:158-160). Effect is performance only, since non-readable results are discarded before the response; no data is returned. Also `report:read` is held by every role including `viewer`, so the **internal** finance CSV export is viewer-readable — consistent with the matrix, but a product-level question. | `app/(app)/search/route.ts`; `lib/services/search.ts:31-83` (unconditional queries), `158-160` (filter); `lib/constants.ts:113-123` | Filter **[TESTED]** (readableResources); route itself untested |
| **G-10** | Info (defense in depth) | Some detail/read services scope sub-queries only by the already-validated parent id and omit `agencyId` (e.g. `getCampaignDetail`'s `campaignCreator`/`campaignProduct` lookups; `getCreatorDetail`'s metrics/campaign lookups). Not exploitable while parents are validated, but a future change to a parent check would silently widen these reads. | `lib/services/campaigns.ts:136-146`; `lib/services/creators.ts:189-222` | No |

**Exact counts:** 10 distinct findings (G-1 … G-10); 1 High, 3 Medium (G-2, G-3,
G-7), 2 Low (G-4, G-5), 4 Info (G-6, G-8, G-9, G-10). Entry surface: 33 actions +
5 handlers = 38; 73 exported service functions + 2 constants.

## 7. What is tested vs. merely observed

**[TESTED]** — meaning an existing automated test asserts the behavior (coverage
present; not a claim that this pass executed the suites), per `lib/*.test.ts` and
the cited cases:

- Tenant isolation for: brand create/update/contacts, creator create/update +
  manager FK, product create/update + brand FK, all finance mutations and
  status transitions, campaign create FKs, list/detail/aggregate scoping
  (`lib/integration.test.ts` §"list queries…", §"create mutations reject
  foreign-tenant references in every FK", `lib/brands-crud.test.ts`,
  `lib/creators-crud.test.ts`, `lib/products-crud.test.ts`, `lib/finance.test.ts`).
- Session: expiry, deleted user, invalid stored role, DB-derived agency/role;
  open-redirect suite (`lib/auth-workflow.test.ts`, `lib/redirect.test.ts`).
- User management: owner-grant, admin-vs-owner, self-role-change, last-owner,
  password-hash non-exposure (`lib/users-service.test.ts`).
- Permission matrix shape for all 8 roles, incl. wildcard-only setting/integration
  (`lib/integration.test.ts`).
- Mock-sync env gate; task cancel/overdue rules; per-user password salt; DB-level
  `(agencyId, username)` / `(agencyId, sku)` uniqueness.
- E2E (`e2e/auth-routing.spec.ts`, `e2e/login-navigation.spec.ts`,
  `e2e/smoke.spec.ts`): login routing and smoke only — **no E2E covers permission
  denial or cross-tenant access through the UI/actions**.

**Observed only** (read from source, no test): the action-layer `can()` gates
themselves (no test drives a server action end-to-end), G-1/G-2/G-4 (unvalidated
FK paths), the `/search` route, CSV export routes, page-level `can()` gating,
proxy cache headers, and every error-mapping branch in actions.

## 8. Change-comparison note

Baseline is upstream `main` @ `233dd7f403df10585f2bf6dbf2a81bfb39ccbc6d`. The
working tree matched this upstream revision before the PR-00 documentation edits;
this inventory describes the code as of 2026-11-17. Symbols and paths are
authoritative for the current tree.
