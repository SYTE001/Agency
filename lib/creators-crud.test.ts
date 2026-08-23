// Focused tests for creator master data CRUD (Phase 3, P1 #5A).
//
// Pins the hardened service workflow:
//   - create forces the caller's agencyId and validates status/metrics
//   - the manager FK must resolve inside the same agency (create AND edit)
//   - tenant-scoped uniqueness: username unique per agency, free across agencies
//   - edits resolve cross-tenant rows as not-found before any write
//   - archiving is soft state (Active/Inactive/Paused) — relations survive
//   - creator:write is limited to owner/admin/account_manager/creator_manager
//
// Authorization itself lives in the server actions (can(role,"creator","write"));
// at service level these tests pin the tenancy + domain rules and the RBAC
// matrix the actions gate with.
//
// Runs against a throwaway database (see lib/test-env.ts), never prisma/dev.db.

import "@/lib/test-env";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import prisma from "@/lib/prisma";
import { createCreator, listCreators, updateCreator } from "@/lib/services/creators";
import { can } from "@/lib/authorization";
import { ROLES } from "@/lib/constants";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

const AGENCY_A = "crud-agency-a";
const AGENCY_B = "crud-agency-b";

let managerAId: string;
let viewerAId: string;
let managerBId: string;

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
      { id: AGENCY_A, name: "CRUD Agency A", slug: AGENCY_A },
      { id: AGENCY_B, name: "CRUD Agency B", slug: AGENCY_B },
    ],
  });
  const passwordHash = "unused-in-tests";
  const [managerA, viewerA, managerB] = await Promise.all([
    prisma.user.create({ data: { agencyId: AGENCY_A, email: "manager-a@crud.test", name: "Manager A", role: "creator_manager", passwordHash } }),
    prisma.user.create({ data: { agencyId: AGENCY_A, email: "viewer-a@crud.test", name: "Viewer A", role: "viewer", passwordHash } }),
    prisma.user.create({ data: { agencyId: AGENCY_B, email: "manager-b@crud.test", name: "Manager B", role: "creator_manager", passwordHash } }),
  ]);
  managerAId = managerA.id;
  viewerAId = viewerA.id;
  managerBId = managerB.id;
});

after(async () => {
  await prisma.$disconnect();
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

describe("creator master data CRUD (Phase 3 P1 #5A)", () => {
  let creatorId: string;

  it("create forces the caller's agencyId and applies domain defaults", async () => {
    const created = await createCreator(AGENCY_A, {
      username: "crud_putri",
      displayName: "Putri CRUD",
      category: "Beauty",
      followers: 1_000,
      engagementRate: 3.5,
      managerId: managerAId,
      bio: "  Halo  ",
    });

    creatorId = created.id;
    assert.equal(created.agencyId, AGENCY_A, "agencyId must come from the caller's session context");
    assert.equal(created.username, "crud_putri");
    assert.equal(created.status, "Active", "default status is Active");
    assert.equal(created.health, "Healthy", "default health is Healthy");
    assert.equal(created.managerId, managerAId);
    assert.equal(created.bio, "Halo", "bio is trimmed");
  });

  it("duplicate username within the same agency is rejected with a friendly error", async () => {
    await assert.rejects(
      createCreator(AGENCY_A, {
        username: "crud_putri",
        displayName: "Duplikat",
        category: "Beauty",
      }),
      /Username sudah dipakai/,
    );
    assert.equal(
      await prisma.creator.count({ where: { agencyId: AGENCY_A, username: "crud_putri" } }),
      1,
      "the rejected creation must not leave a row behind",
    );
  });

  it("the same username is allowed in another agency (tenant-scoped uniqueness)", async () => {
    const other = await createCreator(AGENCY_B, {
      username: "crud_putri",
      displayName: "Putri Agency B",
      category: "Fashion",
    });
    assert.equal(other.agencyId, AGENCY_B);
  });

  it("a manager from another agency cannot be attached on create", async () => {
    await assert.rejects(
      createCreator(AGENCY_A, {
        username: "crud_foreign_mgr",
        displayName: "Foreign Manager",
        category: "Tech",
        managerId: managerBId,
      }),
      /Manager tidak ditemukan/,
    );
  });

  it("invalid status and metric input is rejected", async () => {
    await assert.rejects(
      createCreator(AGENCY_A, { username: "crud_bad_status", displayName: "Bad Status", category: "Tech", status: "Archived" }),
      /Status creator tidak valid/,
    );
    await assert.rejects(
      createCreator(AGENCY_A, { username: "crud_bad_followers", displayName: "Bad Followers", category: "Tech", followers: -5 }),
      /followers tidak valid/i,
    );
    await assert.rejects(
      createCreator(AGENCY_A, { username: "crud_bad_er", displayName: "Bad ER", category: "Tech", engagementRate: 150 }),
      /Engagement rate/,
    );
    await assert.rejects(
      createCreator(AGENCY_A, { username: "   ", displayName: "Blank Username", category: "Tech" }),
      /wajib diisi/,
    );
  });

  it("edit persists changes while preserving identity and relations", async () => {
    await prisma.creatorPlatformAccount.create({
      data: { creatorId, platform: "TikTok", handle: "@crud_putri" },
    });

    const updated = await updateCreator(AGENCY_A, creatorId, {
      displayName: "Putri CRUD Baru",
      category: "Skincare",
      followers: 4_200,
      engagementRate: 4.2,
      bio: "Bio baru",
      status: "Inactive", // soft archive
    });

    assert.equal(updated.displayName, "Putri CRUD Baru");
    const row = await prisma.creator.findUnique({ where: { id: creatorId } });
    assert.equal(row!.username, "crud_putri", "username (identity) must be immutable");
    assert.equal(row!.agencyId, AGENCY_A, "agencyId must never change on edit");
    assert.equal(row!.status, "Inactive");
    assert.equal(row!.followers, 4_200);
    assert.equal(row!.engagementRate, 4.2);
    // Archiving is soft state — the platform account relation must survive.
    assert.equal(await prisma.creatorPlatformAccount.count({ where: { creatorId } }), 1);
  });

  it("invalid edit input is rejected (status, health, metrics, manager)", async () => {
    await assert.rejects(
      updateCreator(AGENCY_A, creatorId, { status: "Deleted" }),
      /Status creator tidak valid/,
    );
    await assert.rejects(
      updateCreator(AGENCY_A, creatorId, { health: "Perfect" }),
      /Health creator tidak valid/,
    );
    await assert.rejects(
      updateCreator(AGENCY_A, creatorId, { followers: -1 }),
      /followers tidak valid/i,
    );
    await assert.rejects(
      updateCreator(AGENCY_A, creatorId, { managerId: managerBId }),
      /Manager tidak ditemukan/,
      "reassigning a cross-tenant manager must fail",
    );
    const row = await prisma.creator.findUnique({ where: { id: creatorId } });
    assert.equal(row!.managerId, managerAId, "rejected manager reassignment must be a no-op");
  });

  it("clearing the manager is allowed", async () => {
    const updated = await updateCreator(AGENCY_A, creatorId, { managerId: null });
    assert.equal(updated.managerId, null);
    await updateCreator(AGENCY_A, creatorId, { managerId: managerAId });
  });

  it("cross-tenant edit is rejected before any write", async () => {
    await assert.rejects(
      updateCreator(AGENCY_A, "does-not-exist", { displayName: "X" }),
      /Creator tidak ditemukan/,
    );
    const foreign = await prisma.creator.findFirst({
      where: { agencyId: AGENCY_B, username: "crud_putri" },
      select: { id: true, displayName: true },
    });
    assert.ok(foreign);
    await assert.rejects(
      updateCreator(AGENCY_A, foreign.id, { displayName: "Hijacked" }),
      /Creator tidak ditemukan/,
    );
    const untouched = await prisma.creator.findUnique({ where: { id: foreign.id } });
    assert.equal(untouched!.displayName, foreign.displayName, "cross-tenant edit must not touch the row");
  });

  it("listing is tenant-scoped", async () => {
    const listA = await listCreators(AGENCY_A);
    assert.ok(listA.items.length >= 1);
    for (const item of listA.items) {
      const row = await prisma.creator.findUnique({ where: { id: item.id }, select: { agencyId: true } });
      assert.equal(row!.agencyId, AGENCY_A, "list must stay inside the authenticated agency");
    }
    assert.ok(!listA.items.some((c) => c.username === "crud_putri" && c.displayName === "Putri Agency B"));
  });

  it("creator:write belongs to owner/admin/account_manager/creator_manager only", () => {
    const writers = ["owner", "admin", "account_manager", "creator_manager"];
    for (const role of ROLES) {
      assert.equal(can(role, "creator", "write"), writers.includes(role), `${role} creator:write`);
    }
  });

  it("viewer and finance are read-only on creators", () => {
    for (const role of ["viewer", "finance"] as const) {
      assert.equal(can(role, "creator", "read"), true, `${role} creator:read`);
      assert.equal(can(role, "creator", "write"), false, `${role} creator:write`);
    }
  });

  it("any same-agency user is a valid manager candidate (scoping is by agency)", async () => {
    // A same-agency non-manager user IS a valid managerId candidate — scoping
    // is by agency, not by role (matches the existing manager select UI).
    const updated = await updateCreator(AGENCY_A, creatorId, { managerId: viewerAId });
    assert.equal(updated.managerId, viewerAId);
  });
});
