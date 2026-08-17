// DB-backed integration tests (Revisi §7).
//
// Proves the security properties the audit relies on, against a real database:
//   1. cross-tenant isolation     — Agency A can never read/mutate Agency B rows
//   2. unauthorized access / RBAC — the role→permission matrix rejects writes
//                                   outside a role's scope
//   3. tenant-scoped uniqueness   — Creator.username & Product.sku are unique per
//                                   agency, NOT globally
//   4. critical CRUD mutations    — create/update flows persist tenant-scoped rows
//
// Runs against a throwaway database (see lib/test-env.ts), never prisma/dev.db.
// Set DATABASE_URL to a prepared PostgreSQL to run the same suite against the
// production target (docs/production-readiness.md §11 step 7).

import "@/lib/test-env";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import prisma from "@/lib/prisma";
import {
  createCreator,
  getCreatorDetail,
  listCreators,
  updateCreator,
} from "@/lib/services/creators";
import { createBrand } from "@/lib/services/brands";
import { createProduct } from "@/lib/services/products";
import { createCampaign } from "@/lib/services/campaigns";
import { createContentItem } from "@/lib/services/content";
import { createLiveSession, listLiveSessions } from "@/lib/services/live";
import {
  createCommission,
  createPayout,
  createSettlement,
  getFinanceSummary,
  markPayoutPaid,
  markSettlementPaid,
} from "@/lib/services/finance";
import { can } from "@/lib/authorization";
import { createSessionToken, resolveSessionUser } from "@/lib/auth";
import { RESOURCES, ROLES } from "@/lib/constants";
import type { Resource } from "@/lib/constants";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

// Jam tetap untuk test boundary timezone — test tidak boleh bergantung pada
// jam dinding agar deterministik (lib/services/* menerima ref: Date).
const SECRET = "integration-secret-that-is-long-enough-32";

const AGENCY_A = "test-agency-a";
const AGENCY_B = "test-agency-b";

async function seed() {
  await prisma.agency.createMany({
    data: [
      { id: AGENCY_A, name: "Test Agency A", slug: "test-agency-a" },
      { id: AGENCY_B, name: "Test Agency B", slug: "test-agency-b" },
    ],
  });
  // One user per role in Agency A so the RBAC layer can resolve any session
  // role from the database (agencyId/role are always read server-side, never
  // trusted from the client).
  await prisma.user.createMany({
    data: ROLES.map((role) => ({
      id: `user-${role}`,
      agencyId: AGENCY_A,
      email: `${role}@test-a.example`,
      name: `Test ${role}`,
      role,
      passwordHash: "unused-in-tests",
    })),
  });
}

before(async () => {
  process.env.AUTH_SECRET = SECRET;
  if (!PROVIDED_DATABASE_URL) {
    // Apply the committed SQLite migration history to the throwaway file.
    // --schema is passed explicitly so the CLI cannot fall back to the
    // PostgreSQL schema regardless of the ambient .env.
    execFileSync(
      process.execPath,
      [
        path.join("node_modules", "prisma", "build", "index.js"),
        "migrate",
        "deploy",
        "--schema",
        path.join("prisma", "schema.sqlite.prisma"),
      ],
      { cwd: path.resolve(__dirname, ".."), stdio: "pipe" },
    );
  }
  // When an external DATABASE_URL is provided it must already be migrated
  // (docs/production-readiness.md §11).
  await seed();
});

after(async () => {
  await prisma.$disconnect();
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

// ---------------------------------------------------------------------------
// 1. Cross-tenant isolation
// ---------------------------------------------------------------------------

describe("cross-tenant isolation (Revisi §7.1)", () => {
  let creatorB: string;
  let brandB: string;
  let payoutB: string;
  let settlementB: string;

  before(async () => {
    const b = await createCreator(AGENCY_B, {
      username: "tenant_b_creator",
      displayName: "Tenant B Creator",
      category: "Beauty",
    });
    creatorB = b.id;
    const bb = await createBrand(AGENCY_B, { name: "Tenant B Brand" });
    brandB = bb.id;
    payoutB = (await createPayout(AGENCY_B, { creatorId: creatorB, amount: 50_000 })).id;
    settlementB = (await createSettlement(AGENCY_B, { brandId: brandB, amount: 90_000 })).id;
    // A decoy creator for Agency A so list results are non-empty.
    await createCreator(AGENCY_A, {
      username: "tenant_a_creator",
      displayName: "Tenant A Creator",
      category: "Tech",
    });
  });

  it("list queries return only the tenant's own rows", async () => {
    const listA = await listCreators(AGENCY_A);
    assert.ok(listA.items.length > 0, "Agency A should see its own creators");
    assert.ok(
      listA.items.every((c) => c.username !== "tenant_b_creator"),
      "Agency A list must not contain Agency B creators",
    );
  });

  it("detail queries on another tenant's record return null", async () => {
    const detail = await getCreatorDetail(AGENCY_A, creatorB);
    assert.equal(detail, null, "Agency A must not read Agency B creator detail");
  });

  it("updates on another tenant's record are rejected", async () => {
    await assert.rejects(
      updateCreator(AGENCY_A, creatorB, { displayName: "Hijacked" }),
      "cross-tenant update must throw",
    );
    const untouched = await prisma.creator.findUnique({ where: { id: creatorB } });
    assert.equal(untouched?.displayName, "Tenant B Creator");
  });

  it("finance mutations reject another tenant's related records", async () => {
    await assert.rejects(
      createCommission(AGENCY_A, { creatorId: creatorB, sourceType: "LiveSession", gmv: 1_000, creatorRate: 10, agencyShareRate: 30 }),
      /tidak ditemukan/,
    );
    await assert.rejects(
      createPayout(AGENCY_A, { creatorId: creatorB, amount: 1_000 }),
      /tidak ditemukan/,
    );
    await assert.rejects(
      createSettlement(AGENCY_A, { brandId: brandB, amount: 1_000 }),
      /tidak ditemukan/,
    );
  });

  it("status mutations cannot touch another tenant's payout/settlement", async () => {
    await assert.rejects(markPayoutPaid(AGENCY_A, payoutB), /tidak ditemukan/);
    await assert.rejects(markSettlementPaid(AGENCY_A, settlementB), /tidak ditemukan/);
    const payout = await prisma.creatorPayout.findUnique({ where: { id: payoutB } });
    const settlement = await prisma.settlement.findUnique({ where: { id: settlementB } });
    assert.equal(payout?.status, "Pending");
    assert.equal(settlement?.status, "Pending");
  });

  it("aggregates never mix tenants", async () => {
    // Commission in B only; A's finance summary must stay zero.
    await createCommission(AGENCY_B, {
      creatorId: creatorB,
      sourceType: "LiveSession",
      gmv: 5_000_000,
      creatorRate: 10,
      agencyShareRate: 30,
    });
    const summaryA = await getFinanceSummary(AGENCY_A);
    assert.equal(summaryA.gmv, 0);
    assert.equal(summaryA.agencyRevenue, 0);
    const summaryB = await getFinanceSummary(AGENCY_B);
    assert.equal(summaryB.gmv, 5_000_000);
  });

  it("create mutations reject foreign-tenant references in every FK", async () => {
    const campaignB = await createCampaign(AGENCY_B, { name: "Foreign Campaign", brandId: brandB });
    const brandA = await createBrand(AGENCY_A, { name: "Home Brand" });
    const productA = await createProduct(AGENCY_A, { name: "Home Product" });
    const campaignA = await createCampaign(AGENCY_A, { name: "Home Campaign", brandId: brandA.id });

    // A second agency's user used as a cross-tenant FK (Agency B has no users,
    // so "user-owner" below is guaranteed to belong to Agency A).
    const foreignUser = "user-owner";
    const homeCreator = (
      await createCreator(AGENCY_B, { username: "link_home_creator", displayName: "Linker", category: "Tech" })
    ).id;

    await assert.rejects(
      createCampaign(AGENCY_B, { name: "X", brandId: brandB, ownerId: foreignUser }),
      /Owner tidak ditemukan/,
    );
    await assert.rejects(
      createLiveSession(AGENCY_B, { creatorId: homeCreator, campaignId: campaignA.id, startTime: new Date() }),
      /Campaign tidak ditemukan/,
    );
    await assert.rejects(
      createLiveSession(AGENCY_B, { creatorId: homeCreator, brandId: brandA.id, startTime: new Date() }),
      /Brand tidak ditemukan/,
    );
    await assert.rejects(
      createLiveSession(AGENCY_B, { creatorId: homeCreator, operatorId: foreignUser, startTime: new Date() }),
      /Operator tidak ditemukan/,
    );
    await assert.rejects(
      createContentItem(AGENCY_B, { campaignId: campaignB.id, creatorId: homeCreator, productId: productA.id, title: "Link test" }),
      /Product tidak ditemukan/,
    );
    await assert.rejects(
      createContentItem(AGENCY_B, { campaignId: campaignB.id, creatorId: homeCreator, reviewerId: foreignUser, title: "Link test" }),
      /Reviewer tidak ditemukan/,
    );
    await assert.rejects(
      createCommission(AGENCY_B, { creatorId: homeCreator, campaignId: campaignA.id, sourceType: "Campaign", gmv: 1_000, creatorRate: 10, agencyShareRate: 30 }),
      /Campaign tidak ditemukan/,
    );
    await assert.rejects(
      createPayout(AGENCY_B, { creatorId: homeCreator, campaignId: campaignA.id, amount: 1_000 }),
      /Campaign tidak ditemukan/,
    );
    await assert.rejects(
      createSettlement(AGENCY_B, { brandId: brandB, campaignId: campaignA.id, amount: 1_000 }),
      /Campaign tidak ditemukan/,
    );
  });

  it("same-tenant references are accepted (validation is scoping, not blocking)", async () => {
    const campaignB = (
      await prisma.campaign.findFirst({ where: { agencyId: AGENCY_B }, select: { id: true } })
    )?.id;
    assert.ok(campaignB);
    const session = await createLiveSession(AGENCY_B, {
      creatorId: (await prisma.creator.findFirst({ where: { agencyId: AGENCY_B, username: "link_home_creator" } }))!.id,
      campaignId: campaignB,
      startTime: new Date(),
    });
    assert.equal(session.agencyId, AGENCY_B);
    assert.equal(session.campaignId, campaignB);
  });
});

// ---------------------------------------------------------------------------
// 1b. Session security — token resolution against the database
// ---------------------------------------------------------------------------

describe("session security (Revisi §4)", () => {
  it("a valid token re-resolves the user row from the database", async () => {
    const token = await createSessionToken({
      id: "user-owner",
      agencyId: AGENCY_A,
      role: "owner",
      email: "owner@test-a.example",
      name: "Test owner",
    });
    const user = await resolveSessionUser(token);
    assert.ok(user);
    assert.equal(user.id, "user-owner");
    assert.equal(user.agencyId, AGENCY_A);
    assert.equal(user.role, "owner");
  });

  it("agency/role come from the DB row, not the token claims", async () => {
    // Klaim di token bisa kedaluwarsa atau dipalsukan — resolusi sesi harus
    // selalu membaca ulang baris user (Revisi §4: "DB re-resolve per request").
    const token = await createSessionToken({
      id: "user-viewer",
      agencyId: AGENCY_B, // klaim palsu
      role: "owner", // klaim palsu
      email: "viewer@test-a.example",
      name: "Test viewer",
    });
    const user = await resolveSessionUser(token);
    assert.ok(user);
    assert.equal(user.agencyId, AGENCY_A);
    assert.equal(user.role, "viewer");
  });

  it("returns null for a deleted user's token", async () => {
    const token = await createSessionToken({
      id: "user-gone",
      agencyId: AGENCY_A,
      role: "owner",
      email: "gone@test-a.example",
      name: "Gone",
    });
    assert.equal(await resolveSessionUser(token), null);
  });

  it("returns null for an invalid role stored in the DB", async () => {
    await prisma.user.createMany({
      data: [
        {
          id: "user-badrole",
          agencyId: AGENCY_A,
          email: "badrole@test-a.example",
          name: "Bad Role",
          role: "SUPER_ADMIN", // bukan role yang dikenal sistem
          passwordHash: "unused",
        },
      ],
    });
    const token = await createSessionToken({
      id: "user-badrole",
      agencyId: AGENCY_A,
      role: "SUPER_ADMIN",
      email: "badrole@test-a.example",
      name: "Bad Role",
    });
    assert.equal(await resolveSessionUser(token), null);
  });
});

// ---------------------------------------------------------------------------
// 2. Tenant-scoped uniqueness
// ---------------------------------------------------------------------------

describe("tenant-scoped uniqueness (Revisi §7.5)", () => {
  it("allows the same creator username in two different agencies", async () => {
    await createCreator(AGENCY_A, { username: "shared_handle", displayName: "A", category: "Beauty" });
    await assert.doesNotReject(
      createCreator(AGENCY_B, { username: "shared_handle", displayName: "B", category: "Beauty" }),
    );
  });

  it("rejects a duplicate creator username within one agency", async () => {
    await assert.rejects(
      createCreator(AGENCY_A, { username: "shared_handle", displayName: "Dup", category: "Beauty" }),
    );
  });

  it("allows the same product SKU in two different agencies", async () => {
    await createProduct(AGENCY_A, { name: "Produk A", sku: "SKU-001", price: 10_000 });
    await assert.doesNotReject(
      createProduct(AGENCY_B, { name: "Produk B", sku: "SKU-001", price: 10_000 }),
    );
  });

  it("rejects a duplicate SKU within one agency", async () => {
    await assert.rejects(
      createProduct(AGENCY_A, { name: "Produk Dup", sku: "SKU-001", price: 10_000 }),
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Critical CRUD mutations
// ---------------------------------------------------------------------------

describe("critical CRUD mutations (Revisi §7.6)", () => {
  let creatorId: string;
  let brandId: string;

  before(async () => {
    const c = await createCreator(AGENCY_A, {
      username: "crud_creator",
      displayName: "CRUD Creator",
      category: "Gaming",
      followers: 1_200,
      engagementRate: 4.5,
    });
    creatorId = c.id;
    brandId = (await createBrand(AGENCY_A, { name: "CRUD Brand", industry: "FMCG" })).id;
  });

  it("createCreator persists a tenant-scoped row", async () => {
    const row = await prisma.creator.findUnique({ where: { id: creatorId } });
    assert.equal(row?.agencyId, AGENCY_A);
    assert.equal(row?.followers, 1_200);
    assert.equal(row?.status, "Active");
  });

  it("updateCreator persists changes", async () => {
    await updateCreator(AGENCY_A, creatorId, { status: "Paused", followers: 1_500 });
    const row = await prisma.creator.findUnique({ where: { id: creatorId } });
    assert.equal(row?.status, "Paused");
    assert.equal(row?.followers, 1_500);
  });

  it("createProduct validates the brand belongs to the same tenant", async () => {
    const otherBrand = await createBrand(AGENCY_B, { name: "Foreign Brand" });
    await assert.rejects(
      createProduct(AGENCY_A, { name: "X", brandId: otherBrand.id, price: 1 }),
      /tidak ditemukan/,
      "linking a product to another tenant's brand must be rejected",
    );
    const ok = await createProduct(AGENCY_A, { name: "Produk CRUD", sku: "SKU-CRUD", brandId, price: 25_500 });
    const row = await prisma.product.findUnique({ where: { id: ok.id } });
    assert.equal(row?.brandId, brandId);
    assert.equal(row?.price.toNumber(), 25_500);
  });

  it("createCommission stores a balanced Decimal breakdown", async () => {
    const commission = await createCommission(AGENCY_A, {
      creatorId,
      sourceType: "Content",
      gmv: 1_000_000,
      creatorRate: 10,
      agencyShareRate: 30,
    });
    const row = await prisma.commission.findUnique({ where: { id: commission.id } });
    assert.equal(row?.gmv.toNumber(), 1_000_000);
    assert.equal(row?.creatorCommission.toNumber(), 100_000);
    assert.equal(row?.agencyRevenue.toNumber(), 30_000);
    assert.equal(
      row!.agencyRevenue.toNumber() + (row!.creatorCommission.toNumber() - row!.agencyRevenue.toNumber()),
      row!.creatorCommission.toNumber(),
      "breakdown must balance (creator payout = commission - agency revenue)",
    );
    assert.equal(row?.status, "Calculated");
  });

  it("payout lifecycle: Pending → Paid with paidAt", async () => {
    const payout = await createPayout(AGENCY_A, { creatorId, amount: 70_000 });
    assert.equal(payout.status, "Pending");
    const paid = await markPayoutPaid(AGENCY_A, payout.id);
    assert.equal(paid.status, "Paid");
    assert.ok(paid.paidAt instanceof Date);
  });

  it("settlement lifecycle: Pending → Paid with paidAt", async () => {
    const settlement = await createSettlement(AGENCY_A, { brandId, amount: 120_000 });
    assert.equal(settlement.status, "Pending");
    const paid = await markSettlementPaid(AGENCY_A, settlement.id);
    assert.equal(paid.status, "Paid");
    assert.ok(paid.paidAt instanceof Date);
  });
});

// ---------------------------------------------------------------------------
// 4. RBAC matrix — unauthorized access is rejected (Revisi §7.2/§7.3)
// ---------------------------------------------------------------------------

describe("RBAC restrictions (Revisi §7.3)", () => {
  it("owner and admin hold full access", () => {
    for (const resource of RESOURCES) {
      assert.ok(can("owner", resource, "write"), `owner must write ${resource}`);
      assert.ok(can("admin", resource, "write"), `admin must write ${resource}`);
    }
  });

  it("viewer cannot write anything", () => {
    for (const resource of RESOURCES) {
      assert.equal(can("viewer", resource, "write"), false, `viewer must not write ${resource}`);
    }
  });

  it("finance cannot manage creators (Revisi §16 example)", () => {
    assert.ok(can("finance", "finance", "write"));
    assert.equal(can("finance", "creator", "write"), false);
  });

  it("creator_manager cannot touch finance", () => {
    assert.ok(can("creator_manager", "creator", "write"));
    assert.equal(can("creator_manager", "finance", "write"), false);
  });

  it("live_manager scope is limited to live + tasks", () => {
    assert.ok(can("live_manager", "live", "write"));
    assert.ok(can("live_manager", "task", "write"));
    assert.equal(can("live_manager", "creator", "write"), false);
    assert.equal(can("live_manager", "finance", "write"), false);
    assert.equal(can("live_manager", "campaign", "write"), false);
  });

  it("campaign_manager can write campaigns but not creators/finance", () => {
    assert.ok(can("campaign_manager", "campaign", "write"));
    assert.equal(can("campaign_manager", "creator", "write"), false);
    assert.equal(can("campaign_manager", "finance", "write"), false);
  });

  it("account_manager can manage creators/content but not finance", () => {
    assert.ok(can("account_manager", "creator", "write"));
    assert.ok(can("account_manager", "content", "write"));
    assert.equal(can("account_manager", "finance", "write"), false);
    assert.equal(can("account_manager", "campaign", "write"), false);
  });

  it("no scoped role can write settings or integrations", () => {
    for (const role of ROLES) {
      if (role === "owner" || role === "admin") continue;
      for (const resource of ["setting", "integration"] as Resource[]) {
        assert.equal(can(role, resource, "write"), false, `${role} must not write ${resource}`);
      }
    }
  });

  it("notes require write on the resource — read-only roles cannot add them", () => {
    // Server actions gate addBrandNoteAction/addCampaignNoteAction/
    // addContentNoteAction/addLiveNoteAction on this exact check.
    const noteResources = ["brand", "campaign", "content", "live"] as const;
    for (const resource of noteResources) {
      assert.equal(can("viewer", resource, "write"), false, `viewer must not add notes on ${resource}`);
      assert.equal(can("finance", resource, "write"), false, `finance must not add notes on ${resource}`);
    }
    assert.ok(can("live_manager", "live", "write"), "live_manager adds LIVE notes");
    assert.ok(can("account_manager", "content", "write"), "account_manager adds content notes");
    assert.ok(can("campaign_manager", "campaign", "write"), "campaign_manager adds campaign notes");
  });
});

// Role constants sanity — guards used by Zod schemas derive from these.
describe("role constants", () => {
  it("exposes exactly the documented roles", () => {
    assert.deepEqual(
      [...ROLES].sort(),
      [
        "account_manager",
        "admin",
        "campaign_manager",
        "creator_manager",
        "finance",
        "live_manager",
        "owner",
        "viewer",
      ],
    );
  });

  it("each role is resolvable by can()", () => {
    for (const role of ROLES) {
      assert.equal(typeof can(role, "creator", "read"), "boolean");
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Timezone tenant-aware date filtering (Revisi §6)
// ---------------------------------------------------------------------------

describe("timezone tenant-aware day filtering (Revisi §6)", () => {
  // DB tetap UTC; interpretasi "hari" memakai Agency.timezone. Dengan ref
  // tetap 2026-08-17T04:00:00Z (= 2026-08-17T11:00 WIB), jendela hari WIB
  // adalah [2026-08-16T17:00:00Z, 2026-08-17T16:59:59.999Z]. Dua agensi
  // khusus dipakai agar fixture boundary tidak tercampur test lain.
  const REF = new Date("2026-08-17T04:00:00Z");
  const WIB = "test-agency-tz";
  const UTC = "test-agency-utc";
  let wibCreator: string;
  let utcCreator: string;

  before(async () => {
    await prisma.agency.createMany({
      data: [
        { id: WIB, name: "TZ WIB Agency", slug: "test-agency-tz", timezone: "Asia/Jakarta" },
        { id: UTC, name: "TZ UTC Agency", slug: "test-agency-utc", timezone: "UTC" },
      ],
    });
    wibCreator = (await createCreator(WIB, { username: "tz_wib", displayName: "WIB", category: "Tech" })).id;
    utcCreator = (await createCreator(UTC, { username: "tz_utc", displayName: "UTC", category: "Tech" })).id;
    // Komisi dengan createdAt eksak di kedua sisi boundary hari WIB untuk
    // window getFinanceSummary(days=1, REF): since = 2026-08-15T17:00:00Z.
    // (Dibuat langsung via Prisma agar createdAt bisa dikontrol; yang diuji
    // adalah jendelanya, bukan createCommission.)
    for (const [createdAt, gmv] of [
      ["2026-08-15T16:59:59Z", 1000], // 1 detik sebelum boundary → window sebelumnya
      ["2026-08-15T17:00:00Z", 2000], // tepat di boundary → masuk window
      ["2026-08-16T16:59:59Z", 3000], // di dalam hari WIB REF
    ] as const) {
      await prisma.commission.create({
        data: {
          agencyId: WIB,
          creatorId: wibCreator,
          sourceType: "LiveSession",
          gmv,
          creatorRate: 10,
          creatorCommission: gmv * 0.1,
          agencyShareRate: 30,
          agencyRevenue: gmv * 0.03,
          status: "Calculated",
          createdAt: new Date(createdAt),
        },
      });
    }
  });

  it("getFinanceSummary window boundary follows the tenant tz (23:59→00:00 WIB)", async () => {
    const summary = await getFinanceSummary(WIB, 1, REF);
    assert.equal(summary.gmv, 5000, "hanya komisi sejak 2026-08-15T17:00:00Z yang dihitung");
    assert.equal(summary.creatorCommission, 500);
    assert.equal(summary.agencyRevenue, 150);
  });

  it("an invalid stored timezone falls back to the default", async () => {
    await prisma.agency.update({ where: { id: WIB }, data: { timezone: "Not/AZone" } });
    try {
      const summary = await getFinanceSummary(WIB, 1, REF);
      assert.equal(summary.gmv, 5000, "fallback Asia/Jakarta menghasilkan jendela yang sama");
    } finally {
      await prisma.agency.update({ where: { id: WIB }, data: { timezone: "Asia/Jakarta" } });
    }
  });

  it("listLiveSessions date filter interprets the day in the tenant's tz", async () => {
    await createLiveSession(WIB, {
      creatorId: wibCreator,
      startTime: new Date("2026-08-16T16:59:59Z"), // 2026-08-16T23:59:59 WIB — kemarin
    });
    await createLiveSession(WIB, {
      creatorId: wibCreator,
      startTime: new Date("2026-08-16T18:00:00Z"), // 2026-08-17T01:00 WIB — hari ini
    });
    const res = await listLiveSessions(WIB, { date: REF, ref: REF });
    const times = res.sessions.map((s) => s.startTime.toISOString());
    assert.ok(times.includes("2026-08-16T18:00:00.000Z"), "sesi 01:00 WIB masuk filter hari ini");
    assert.ok(!times.includes("2026-08-16T16:59:59.000Z"), "sesi 23:59:59 WIB hari sebelumnya tidak masuk");
  });

  it("the same UTC instants land on different days for a UTC tenant", async () => {
    await createLiveSession(UTC, {
      creatorId: utcCreator,
      startTime: new Date("2026-08-16T18:00:00Z"), // 16 Aug UTC — kemarin
    });
    await createLiveSession(UTC, {
      creatorId: utcCreator,
      startTime: new Date("2026-08-17T03:00:00Z"), // 17 Aug UTC — hari ini
    });
    const res = await listLiveSessions(UTC, { date: REF, ref: REF });
    const times = res.sessions.map((s) => s.startTime.toISOString());
    assert.ok(times.includes("2026-08-17T03:00:00.000Z"));
    assert.ok(!times.includes("2026-08-16T18:00:00.000Z"));
  });
});

// ---------------------------------------------------------------------------
// 6. Database constraints & Decimal precision (Revisi §2/§8)
// ---------------------------------------------------------------------------

describe("database constraints & Decimal precision", () => {
  // onDelete: Cascade dideklarasikan di schema dan dipaksakan oleh engine DB
  // (foreign_keys ON). Catatan (Note) tidak ikut terhapus karena polimorfik
  // (entityType/entityId tanpa FK) — yang dijamin schema hanya child ber-FK.
  it("cascade: deleting a brand removes its contacts", async () => {
    const brand = await createBrand(AGENCY_A, { name: "Cascade Brand" });
    await prisma.brandContact.create({
      data: { brandId: brand.id, name: "Kontak Utama", email: "kontak@cascade.example" },
    });
    assert.equal(await prisma.brandContact.count({ where: { brandId: brand.id } }), 1);
    await prisma.brand.delete({ where: { id: brand.id } });
    assert.equal(await prisma.brand.count({ where: { id: brand.id } }), 0);
    assert.equal(await prisma.brandContact.count({ where: { brandId: brand.id } }), 0);
  });

  it("cascade: deleting a live session removes its metrics", async () => {
    const creator = await prisma.creator.findFirst({ where: { agencyId: AGENCY_A } });
    const session = await createLiveSession(AGENCY_A, {
      creatorId: creator!.id,
      startTime: new Date("2026-09-01T10:00:00Z"),
    });
    await prisma.liveMetric.create({
      data: {
        liveSessionId: session.id,
        timestamp: new Date("2026-09-01T10:05:00Z"),
        viewers: 120,
        gmv: 250_000,
        orders: 12,
      },
    });
    assert.equal(await prisma.liveMetric.count({ where: { liveSessionId: session.id } }), 1);
    await prisma.liveSession.delete({ where: { id: session.id } });
    assert.equal(await prisma.liveSession.count({ where: { id: session.id } }), 0);
    assert.equal(await prisma.liveMetric.count({ where: { liveSessionId: session.id } }), 0);
  });

  it("Decimal columns store exact Rupiah amounts without float drift", async () => {
    const creator = await prisma.creator.findFirst({ where: { agencyId: AGENCY_A } });
    const commission = await createCommission(AGENCY_A, {
      creatorId: creator!.id,
      sourceType: "Content",
      gmv: 12_345_678,
      creatorRate: 12.5,
      agencyShareRate: 33,
    });
    const row = await prisma.commission.findUnique({ where: { id: commission.id } });
    assert.equal(row!.gmv.toNumber(), 12_345_678, "gmv tersimpan eksak");
    assert.equal(row!.creatorCommission.toNumber(), 1_543_210, "12.5% dari 12.345.678 dibulatkan ke rupiah utuh");
    assert.equal(row!.agencyRevenue.toNumber(), 509_259, "33% dari komisi creator, dibulatkan");
    assert.ok(Number.isInteger(row!.creatorCommission.toNumber()));
    assert.ok(Number.isInteger(row!.agencyRevenue.toNumber()));
  });

  it("unique (agencyId, username) is enforced at the database level", async () => {
    await prisma.creator.create({
      data: { agencyId: AGENCY_A, username: "dup_constraint_probe", displayName: "Probe", category: "Tech" },
    });
    await assert.rejects(
      prisma.creator.create({
        data: { agencyId: AGENCY_A, username: "dup_constraint_probe", displayName: "Duplikat", category: "Tech" },
      }),
      "duplicate username dalam satu agensi harus ditolak DB",
    );
  });
});
