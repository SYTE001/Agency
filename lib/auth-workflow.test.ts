import "@/lib/test-env";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import {
  createSessionToken,
  verifySessionToken,
  resolveSessionUser,
  hashPassword,
} from "./auth";
import { isSafeInternalRedirect, getSafeRedirectUrl } from "./redirect";
import { entityBelongsToAgency } from "./services/activity";
import { createBrand, updateBrand } from "./services/brands";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

const SECRET = "auth-workflow-test-secret-at-least-32-chars!";
const enc = new TextEncoder();

const agency1 = { id: "agency-alpha", name: "Alpha Agency", slug: "alpha-agency" };
const agency2 = { id: "agency-beta", name: "Beta Agency", slug: "beta-agency" };

const userAlpha = {
  id: "user-alpha",
  agencyId: agency1.id,
  role: "owner",
  email: "alpha@example.com",
  name: "Alpha Owner",
};

const userBeta = {
  id: "user-beta",
  agencyId: agency2.id,
  role: "owner",
  email: "beta@example.com",
  name: "Beta Owner",
};

let brandAlphaId: string;
let brandBetaId: string;

before(async () => {
  process.env.AUTH_SECRET = SECRET;
  if (!PROVIDED_DATABASE_URL) {
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
    data: [agency1, agency2],
  });

  const pwHash = await hashPassword("validPassword123");
  await prisma.user.createMany({
    data: [
      { ...userAlpha, passwordHash: pwHash },
      { ...userBeta, passwordHash: pwHash },
    ],
  });

  const b1 = await createBrand(agency1.id, { name: "Alpha Brand", status: "Active" });
  brandAlphaId = b1.id;

  const b2 = await createBrand(agency2.id, { name: "Beta Brand", status: "Active" });
  brandBetaId = b2.id;
});

after(async () => {
  await prisma.$disconnect();
  delete process.env.AUTH_SECRET;
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

describe("session verification and expiration lifecycle", () => {
  it("resolves active user session against database", async () => {
    const token = await createSessionToken(userAlpha);
    const resolved = await resolveSessionUser(token);
    assert.ok(resolved);
    assert.equal(resolved.id, userAlpha.id);
    assert.equal(resolved.agencyId, userAlpha.agencyId);
    assert.equal(resolved.agencyName, agency1.name);
  });

  it("rejects expired session tokens and denies access", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userAlpha.id)
      .setIssuer("agency-os")
      .setAudience("agency-os-app")
      .setIssuedAt(now - 3600)
      .setExpirationTime(now - 60)
      .sign(enc.encode(SECRET));

    const payload = await verifySessionToken(expiredToken);
    assert.equal(payload, null);

    const user = await resolveSessionUser(expiredToken);
    assert.equal(user, null);
  });

  it("rejects tokens for non-existent users", async () => {
    const token = await createSessionToken({ ...userAlpha, id: "user-ghost" });
    const user = await resolveSessionUser(token);
    assert.equal(user, null);
  });
});

describe("redirect rules, destination preservation, and open-redirect defense", () => {
  it("preserves safe deep-link destinations with query and hash", () => {
    assert.equal(getSafeRedirectUrl("/campaigns/camp-1?tab=creators#target"), "/campaigns/camp-1?tab=creators#target");
    assert.equal(getSafeRedirectUrl("/finance/payouts?status=Pending"), "/finance/payouts?status=Pending");
    assert.equal(getSafeRedirectUrl("/overview"), "/overview");
  });

  it("blocks open-redirect attempts to external sites and falls back safely", () => {
    assert.equal(getSafeRedirectUrl("https://evil.com/phishing"), "/overview");
    assert.equal(getSafeRedirectUrl("//evil.com"), "/overview");
    assert.equal(getSafeRedirectUrl("/\\evil.com"), "/overview");
    assert.equal(getSafeRedirectUrl("javascript:alert(1)"), "/overview");
  });

  it("prevents infinite redirect loops on login route", () => {
    assert.equal(getSafeRedirectUrl("/login"), "/overview");
    assert.equal(getSafeRedirectUrl("/login?next=/overview"), "/overview");
    assert.equal(isSafeInternalRedirect("/login"), false);
  });
});

describe("multi-tenant authorization and ID manipulation defense", () => {
  it("prevents User A (Agency Alpha) from mutating User B's brand (Agency Beta)", async () => {
    // Check that brandBeta belongs to agency2, NOT agency1
    const belongsToAlpha = await entityBelongsToAgency("Brand", brandBetaId, agency1.id);
    assert.equal(belongsToAlpha, false);

    // Attempting to update Beta's brand with Alpha's agencyId must fail
    await assert.rejects(
      updateBrand(agency1.id, brandBetaId, { name: "Hacked by Alpha" }),
      /Brand tidak ditemukan/,
    );

    // Verify Beta's brand was NOT modified
    const brandBeta = await prisma.brand.findUnique({ where: { id: brandBetaId } });
    assert.equal(brandBeta?.name, "Beta Brand");
  });

  it("allows tenant to mutate their own resources", async () => {
    const belongsToAlpha = await entityBelongsToAgency("Brand", brandAlphaId, agency1.id);
    assert.equal(belongsToAlpha, true);

    const updated = await updateBrand(agency1.id, brandAlphaId, { name: "Alpha Brand Renamed" });
    assert.equal(updated.name, "Alpha Brand Renamed");
  });
});
