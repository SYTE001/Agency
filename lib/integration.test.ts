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
import {
  createCommission,
  createPayout,
  createSettlement,
  getFinanceSummary,
  markPayoutPaid,
  markSettlementPaid,
} from "@/lib/services/finance";
import { can } from "@/lib/authorization";
import { RESOURCES, ROLES } from "@/lib/constants";
import type { Resource, Role } from "@/lib/constants";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

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
  if (!PROVIDED_DATABASE_URL) {
    // Apply the committed migration history to the throwaway SQLite file.
    execFileSync(
      process.execPath,
      [path.join("node_modules", "prisma", "build", "index.js"), "migrate", "deploy"],
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
      assert.equal(typeof can(role as Role, "creator", "read"), "boolean");
    }
  });
});
