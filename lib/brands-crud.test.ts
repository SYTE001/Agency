// Focused tests for brand master data CRUD (Phase 3, P1 #5B).
//
// Pins the hardened service workflow:
//   - create forces the caller's agencyId and validates status/input
//   - edits resolve cross-tenant rows as not-found before any write
//   - archiving is soft state (Active/Paused/Churned) — contacts, products,
//     and settlements survive
//   - BrandContact ownership derives through the parent brand (cross-tenant
//     brand → contact is rejected) and stays single-primary
//   - brand:write belongs to owner/admin ONLY per the existing matrix;
//     every other role (incl. viewer/finance) is read-only
//
// Runs against a throwaway database (see lib/test-env.ts), never prisma/dev.db.

import "@/lib/test-env";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import prisma from "@/lib/prisma";
import {
  createBrand,
  createBrandContact,
  listBrands,
  updateBrand,
} from "@/lib/services/brands";
import { createProduct } from "@/lib/services/products";
import { createSettlement } from "@/lib/services/finance";
import { can } from "@/lib/authorization";
import { ROLES } from "@/lib/constants";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

const AGENCY_A = "bm-agency-a";
const AGENCY_B = "bm-agency-b";

before(async () => {
  if (!PROVIDED_DATABASE_URL) {
    // Apply the committed SQLite migration history to the throwaway file
    // (same bootstrap as lib/users-service.test.ts).
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

  await prisma.agency.createMany({
    data: [
      { id: AGENCY_A, name: "BM Agency A", slug: AGENCY_A },
      { id: AGENCY_B, name: "BM Agency B", slug: AGENCY_B },
    ],
  });
});

after(async () => {
  await prisma.$disconnect();
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

describe("brand master data CRUD (Phase 3 P1 #5B)", () => {
  let brandId: string;

  it("create forces the caller's agencyId and applies domain defaults", async () => {
    const created = await createBrand(AGENCY_A, {
      name: "  Aksara Apparel  ",
      industry: "Fashion",
      website: "https://aksara.example",
      description: "Brand pakaian",
    });

    brandId = created.id;
    assert.equal(created.agencyId, AGENCY_A, "agencyId must come from the caller's session context");
    assert.equal(created.name, "Aksara Apparel", "name is trimmed");
    assert.equal(created.status, "Active", "default status is Active");
    assert.equal(created.industry, "Fashion");
    assert.equal(created.website, "https://aksara.example");
  });

  it("invalid input is rejected (blank name, bad status)", async () => {
    await assert.rejects(
      createBrand(AGENCY_A, { name: "   " }),
      /Nama brand wajib diisi/,
    );
    await assert.rejects(
      createBrand(AGENCY_A, { name: "Status Salah", status: "Archived" }),
      /Status brand tidak valid/,
    );
    assert.equal(await prisma.brand.count({ where: { agencyId: AGENCY_A } }), 1);
  });

  it("edit persists changes while preserving identity and relations", async () => {
    // Seed real relations through the existing services.
    await createBrandContact(AGENCY_A, brandId, {
      name: "Sari Utami",
      email: "sari@aksara.example",
      role: "Marketing Lead",
      isPrimary: true,
    });
    await createProduct(AGENCY_A, { name: "Kemeja Linen", sku: "SKU-BM-1", brandId, price: 259_000 });
    await createSettlement(AGENCY_A, { brandId, amount: 500_000 });

    const updated = await updateBrand(AGENCY_A, brandId, {
      name: "Aksara Apparel Group",
      industry: "Retail Fashion",
      status: "Churned", // soft archive
    });

    assert.equal(updated.name, "Aksara Apparel Group");
    const row = await prisma.brand.findUnique({ where: { id: brandId } });
    assert.equal(row!.id, brandId, "identity must be preserved");
    assert.equal(row!.agencyId, AGENCY_A);
    assert.equal(row!.status, "Churned");
    assert.equal(row!.industry, "Retail Fashion");
    assert.equal(row!.website, "https://aksara.example", "untouched fields must survive");
    // Archiving is soft state — every relation survives.
    assert.equal(await prisma.brandContact.count({ where: { brandId } }), 1);
    assert.equal(await prisma.product.count({ where: { brandId } }), 1);
    assert.equal(await prisma.settlement.count({ where: { brandId } }), 1);
  });

  it("invalid edit input is rejected before any write", async () => {
    await assert.rejects(
      updateBrand(AGENCY_A, brandId, { status: "Deleted" }),
      /Status brand tidak valid/,
    );
    await assert.rejects(
      updateBrand(AGENCY_A, brandId, { name: " " }),
      /Nama brand wajib diisi/,
    );
    const row = await prisma.brand.findUnique({ where: { id: brandId } });
    assert.equal(row!.name, "Aksara Apparel Group", "rejected edit must be a no-op");
  });

  it("cross-tenant edit is rejected before any write", async () => {
    await assert.rejects(
      updateBrand(AGENCY_A, "does-not-exist", { name: "X Corp" }),
      /Brand tidak ditemukan/,
    );
    const foreign = await createBrand(AGENCY_B, { name: "Foreign Brand" });
    await assert.rejects(
      updateBrand(AGENCY_A, foreign.id, { name: "Hijacked" }),
      /Brand tidak ditemukan/,
    );
    const untouched = await prisma.brand.findUnique({ where: { id: foreign.id } });
    assert.equal(untouched!.name, "Foreign Brand", "cross-tenant edit must not touch the row");
  });

  it("a contact cannot be attached to another tenant's brand", async () => {
    const foreign = await prisma.brand.findFirst({
      where: { agencyId: AGENCY_B, name: "Foreign Brand" },
      select: { id: true },
    });
    assert.ok(foreign);
    await assert.rejects(
      createBrandContact(AGENCY_A, foreign.id, { name: "Penyusup" }),
      /Brand tidak ditemukan/,
    );
    assert.equal(await prisma.brandContact.count({ where: { brandId: foreign.id } }), 0);
  });

  it("adding a primary contact demotes the previous primary", async () => {
    const first = await prisma.brandContact.findFirst({ where: { brandId }, select: { id: true } });
    assert.ok(first);

    await createBrandContact(AGENCY_A, brandId, {
      name: "Budi Baru",
      isPrimary: true,
    });
    const primaries = await prisma.brandContact.findMany({
      where: { brandId, isPrimary: true },
      select: { name: true },
    });
    assert.equal(primaries.length, 1, "a brand keeps exactly one primary contact");
    assert.equal(primaries[0]!.name, "Budi Baru");
  });

  it("listing is tenant-scoped", async () => {
    const listA = await listBrands(AGENCY_A);
    assert.ok(listA.items.length >= 1);
    for (const item of listA.items) {
      const row = await prisma.brand.findUnique({ where: { id: item.id }, select: { agencyId: true } });
      assert.equal(row!.agencyId, AGENCY_A, "list must stay inside the authenticated agency");
    }
    assert.ok(!listA.items.some((b) => b.name === "Foreign Brand"), "Agency B brands must not leak into Agency A's list");
  });

  it("brand:write belongs to owner/admin only (existing matrix)", () => {
    for (const role of ROLES) {
      assert.equal(can(role, "brand", "write"), role === "owner" || role === "admin", `${role} brand:write`);
    }
  });

  it("every role can read brands; viewer/finance are strictly read-only", () => {
    for (const role of [...ROLES]) {
      assert.equal(can(role, "brand", "read"), true, `${role} brand:read`);
    }
    for (const role of ["viewer", "finance"] as const) {
      assert.equal(can(role, "brand", "write"), false, `${role} brand:write`);
    }
  });
});
