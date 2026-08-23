// Focused tests for product master data CRUD (Phase 3A, P1 #5C).
//
// Pins the hardened service workflow:
//   - create forces the caller's agencyId and validates name/status/price
//   - the optional brand FK must point at a brand of the SAME agency
//   - SKU is tenant-scoped unique (@@unique([agencyId, sku])) with a friendly
//     duplicate message; the same SKU stays legal across agencies
//   - archiving is soft state (Active/Inactive) — daily metrics, campaign
//     links, and content history survive an Inactive product
//   - edits resolve cross-tenant rows as not-found before any write
//   - prices stay Decimal-safe end to end
//   - product:write belongs to owner/admin ONLY per the existing matrix;
//     every other role is read-only
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
  createProduct,
  listProducts,
  updateProduct,
} from "@/lib/services/products";
import { createBrand } from "@/lib/services/brands";
import { can } from "@/lib/authorization";
import { ROLES } from "@/lib/constants";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

const AGENCY_A = "pm-agency-a";
const AGENCY_B = "pm-agency-b";

before(async () => {
  if (!PROVIDED_DATABASE_URL) {
    // Apply the committed SQLite migration history to the throwaway file
    // (same bootstrap as lib/brands-crud.test.ts).
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
      { id: AGENCY_A, name: "PM Agency A", slug: AGENCY_A },
      { id: AGENCY_B, name: "PM Agency B", slug: AGENCY_B },
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

describe("product master data CRUD (Phase 3A P1 #5C)", () => {
  let productId: string;
  let ownBrandId: string;
  let foreignBrandId: string;

  it("create forces the caller's agencyId and applies domain defaults", async () => {
    const created = await createProduct(AGENCY_A, {
      name: "  Serum Vitamin C  ",
      category: "Skincare",
      price: 259_000,
    });

    productId = created.id;
    assert.equal(created.agencyId, AGENCY_A, "agencyId must come from the caller's session context");
    assert.equal(created.name, "Serum Vitamin C", "name is trimmed");
    assert.equal(created.status, "Active", "default status is Active");
    assert.equal(created.brandId, null, "brand is optional");
    assert.equal(created.sku, null, "sku is optional");
    assert.equal(created.price.toNumber(), 259_000, "price keeps its decimal value");
  });

  it("invalid input is rejected (blank name, bad status, negative price)", async () => {
    await assert.rejects(
      createProduct(AGENCY_A, { name: "   " }),
      /Nama produk wajib diisi/,
    );
    await assert.rejects(
      createProduct(AGENCY_A, { name: "Status Salah", status: "Archived" }),
      /Status produk tidak valid/,
    );
    await assert.rejects(
      createProduct(AGENCY_A, { name: "Harga Negatif", price: -1 }),
      /Harga tidak boleh negatif/,
    );
    assert.equal(await prisma.product.count({ where: { agencyId: AGENCY_A } }), 1);
  });

  it("the brand FK must point at a brand of the same agency", async () => {
    const ownBrand = await createBrand(AGENCY_A, { name: "Glow Labs" });
    ownBrandId = ownBrand.id;
    const foreignBrand = await createBrand(AGENCY_B, { name: "Foreign Labs" });
    foreignBrandId = foreignBrand.id;

    const linked = await createProduct(AGENCY_A, {
      name: "Sunscreen SPF 50",
      brandId: ownBrand.id,
      sku: "GLW-002",
    });
    assert.equal(linked.brandId, ownBrand.id);

    await assert.rejects(
      createProduct(AGENCY_A, { name: "Penyusup", brandId: foreignBrand.id }),
      /Brand tidak ditemukan/,
    );
    const leaked = await prisma.product.findFirst({ where: { name: "Penyusup" } });
    assert.equal(leaked, null, "cross-tenant brand link must not be written");
  });

  it("SKU uniqueness is scoped per agency", async () => {
    await createProduct(AGENCY_A, { name: "Produk SKU", sku: "GLW-001" });

    // The same SKU is legal in another agency…
    const otherTenant = await createProduct(AGENCY_B, { name: "Produk Lain", sku: "GLW-001" });
    assert.equal(otherTenant.agencyId, AGENCY_B);

    // …but a duplicate inside the same agency fails with a friendly message.
    await assert.rejects(
      createProduct(AGENCY_A, { name: "Duplikat", sku: "GLW-001" }),
      /SKU sudah dipakai/,
    );

    // Whitespace-only SKUs normalize to null instead of colliding with each other.
    const blankA = await createProduct(AGENCY_A, { name: "Tanpa SKU A", sku: "   " });
    const blankB = await createProduct(AGENCY_A, { name: "Tanpa SKU B", sku: "" });
    assert.equal(blankA.sku, null);
    assert.equal(blankB.sku, null);
  });

  it("soft archive (Inactive) preserves metrics, campaign links, and content history", async () => {
    // Seed real relations: one day of sales metrics + one campaign featuring the product.
    await prisma.productMetric.create({
      data: { productId, date: new Date(), gmv: 1_250_000, orders: 12, units: 15 },
    });
    const campaign = await prisma.campaign.create({
      data: { agencyId: AGENCY_A, brandId: ownBrandId, name: "Campaign Glow", status: "Active" },
    });
    await prisma.campaignProduct.create({ data: { campaignId: campaign.id, productId } });

    const updated = await updateProduct(AGENCY_A, productId, {
      name: "Serum Vitamin C+",
      status: "Inactive", // soft archive
    });

    assert.equal(updated.status, "Inactive");
    const row = await prisma.product.findUnique({ where: { id: productId } });
    assert.equal(row!.id, productId, "identity must be preserved");
    assert.equal(row!.agencyId, AGENCY_A);
    assert.equal(row!.name, "Serum Vitamin C+");
    // Archiving is soft state — every relation survives.
    assert.equal(await prisma.productMetric.count({ where: { productId } }), 1);
    assert.equal(await prisma.campaignProduct.count({ where: { productId } }), 1);
  });

  it("invalid edit input is rejected before any write", async () => {
    await assert.rejects(
      updateProduct(AGENCY_A, productId, { name: " " }),
      /Nama produk wajib diisi/,
    );
    await assert.rejects(
      updateProduct(AGENCY_A, productId, { status: "Deleted" }),
      /Status produk tidak valid/,
    );
    await assert.rejects(
      updateProduct(AGENCY_A, productId, { price: -5 }),
      /Harga tidak boleh negatif/,
    );
    const row = await prisma.product.findUnique({ where: { id: productId } });
    assert.equal(row!.name, "Serum Vitamin C+", "rejected edit must be a no-op");
  });

  it("edit validates brand ownership and keeps prices Decimal-safe", async () => {
    // Clearing the brand is legal; pointing at ANOTHER agency's brand is not.
    const cleared = await updateProduct(AGENCY_A, productId, { brandId: null });
    assert.equal(cleared.brandId, null);

    await assert.rejects(
      updateProduct(AGENCY_A, productId, { brandId: foreignBrandId }),
      /Brand tidak ditemukan/,
    );

    const repriced = await updateProduct(AGENCY_A, productId, { price: 259_500.75 });
    assert.equal(repriced.price.toNumber(), 259_500.75, "fractional rupiah must survive the round-trip");
  });

  it("cross-tenant edit is rejected before any write", async () => {
    await assert.rejects(
      updateProduct(AGENCY_A, "does-not-exist", { name: "X Corp" }),
      /Produk tidak ditemukan/,
    );
    const foreign = await createProduct(AGENCY_B, { name: "Foreign Product" });
    await assert.rejects(
      updateProduct(AGENCY_A, foreign.id, { name: "Hijacked" }),
      /Produk tidak ditemukan/,
    );
    const untouched = await prisma.product.findUnique({ where: { id: foreign.id } });
    assert.equal(untouched!.name, "Foreign Product", "cross-tenant edit must not touch the row");
  });

  it("listing is tenant-scoped and supports search and derived GMV sort", async () => {
    const listA = await listProducts(AGENCY_A);
    assert.ok(listA.items.length >= 4);
    for (const item of listA.items) {
      const row = await prisma.product.findUnique({ where: { id: item.id }, select: { agencyId: true } });
      assert.equal(row!.agencyId, AGENCY_A, "list must stay inside the authenticated agency");
    }
    assert.ok(!listA.items.some((p) => p.name === "Foreign Product"), "Agency B products must not leak into Agency A's list");

    // Only productId carries metrics so far — it must lead a GMV-descending sort.
    const byGmv = await listProducts(AGENCY_A, { sortBy: "gmv", sortDir: "desc" });
    assert.equal(byGmv.items[0]!.id, productId);
    assert.equal(byGmv.items[0]!.gmv30, 1_250_000);

    const searched = await listProducts(AGENCY_A, { q: "serum" });
    assert.equal(searched.items.length, 1);
    assert.equal(searched.items[0]!.id, productId);
  });

  it("product:write belongs to owner/admin only (existing matrix)", () => {
    for (const role of ROLES) {
      assert.equal(can(role, "product", "write"), role === "owner" || role === "admin", `${role} product:write`);
    }
  });

  it("every role can read products", () => {
    for (const role of [...ROLES]) {
      assert.equal(can(role, "product", "read"), true, `${role} product:read`);
    }
  });
});
