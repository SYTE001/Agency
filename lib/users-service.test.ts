// Focused tests for user management + role assignment (Phase 3, P1 #4).
//
// Members were previously bootstrap/seed-only. These tests pin the new
// service-level workflow:
//   - creation forces the caller's agencyId and stores only hashed passwords
//   - setting:write (held by owner/admin only) is the authorization gate
//   - cross-tenant edits resolve as not-found before any write
//   - admins manage regular members but never owner accounts
//   - self-role-change and last-owner demotion are blocked
//   - reads are agency-scoped and exclude auth-sensitive columns
//
// Deactivation is intentionally absent — the User model has no inactive
// state, and inventing one is out of scope.
//
// Runs against a throwaway database (see lib/test-env.ts), never prisma/dev.db.

import "@/lib/test-env";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  createAgencyUser,
  listAgencyUsers,
  updateAgencyUser,
  type ActorContext,
} from "@/lib/services/users";
import { can } from "@/lib/authorization";
import { ROLES } from "@/lib/constants";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

const AGENCY_A = "um-agency-a";
const AGENCY_B = "um-agency-b";
const AGENCY_C = "um-agency-c-single-owner";
const BOOTSTRAP_PW = "bootstrap-pass";

let ownerA1: ActorContext;
let adminA1: ActorContext;
let ownerB1: ActorContext;

async function userIds(agencyId: string): Promise<Set<string>> {
  const rows = await prisma.user.findMany({ where: { agencyId }, select: { id: true } });
  return new Set(rows.map((r) => r.id));
}

before(async () => {
  if (!PROVIDED_DATABASE_URL) {
    // Apply the committed SQLite migration history to the throwaway file
    // (same bootstrap as lib/mock-sync.test.ts).
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

  const passwordHash = await hashPassword(BOOTSTRAP_PW);
  await prisma.agency.createMany({
    data: [
      { id: AGENCY_A, name: "UM Agency A", slug: AGENCY_A },
      { id: AGENCY_B, name: "UM Agency B", slug: AGENCY_B },
      { id: AGENCY_C, name: "UM Agency C", slug: AGENCY_C },
    ],
  });
  // Real DB rows back every actor so owner-count protections behave exactly
  // as they do behind an authenticated session.
  const [oA, aA, oB, oC, aC] = await Promise.all([
    prisma.user.create({ data: { agencyId: AGENCY_A, email: "owner-a@um.test", name: "Owner A1", role: "owner", passwordHash } }),
    prisma.user.create({ data: { agencyId: AGENCY_A, email: "admin-a@um.test", name: "Admin A1", role: "admin", passwordHash } }),
    prisma.user.create({ data: { agencyId: AGENCY_B, email: "owner-b@um.test", name: "Owner B1", role: "owner", passwordHash } }),
    prisma.user.create({ data: { agencyId: AGENCY_C, email: "owner-c@um.test", name: "Owner C1", role: "owner", passwordHash } }),
    prisma.user.create({ data: { agencyId: AGENCY_C, email: "admin-c@um.test", name: "Admin C1", role: "admin", passwordHash } }),
  ]);
  ownerA1 = { id: oA.id, role: "owner" };
  adminA1 = { id: aA.id, role: "admin" };
  ownerB1 = { id: oB.id, role: "owner" };
  void oC;
  void aC;
});

after(async () => {
  await prisma.$disconnect();
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

describe("user management service (Phase 3 P1 #4)", () => {
  let member1Id: string;

  it("an owner creates a member — tenant forced from context, password stored hashed", async () => {
    const created = await createAgencyUser(AGENCY_A, ownerA1, {
      name: "Member Satu",
      email: "member-1@um.test",
      title: "LIVE Operator",
      role: "viewer",
      password: "rahasia-123",
    });
    member1Id = created.id;

    assert.equal(created.agencyId, AGENCY_A, "agencyId must come from the authenticated context");
    assert.equal(created.role, "viewer");
    assert.ok(created.passwordHash.length > 0);
    assert.ok(!created.passwordHash.includes("rahasia"), "plaintext must never be stored");

    const stored = await prisma.user.findUnique({ where: { id: created.id } });
    assert.ok(stored);
    assert.equal(await verifyPassword("rahasia-123", stored.passwordHash), true);
    assert.equal(await verifyPassword("salah-password", stored.passwordHash), false);
  });

  it("identical passwords yield different hashes (per-user salt)", async () => {
    const second = await createAgencyUser(AGENCY_A, ownerA1, {
      name: "Member Dua",
      email: "member-2@um.test",
      role: "viewer",
      password: "rahasia-123",
    });
    const first = await prisma.user.findUnique({ where: { id: member1Id } });
    const secondRow = await prisma.user.findUnique({ where: { id: second.id } });
    assert.notEqual(first!.passwordHash, secondRow!.passwordHash);
  });

  it("an admin can create non-owner members", async () => {
    const created = await createAgencyUser(AGENCY_A, adminA1, {
      name: "Member Tiga",
      email: "member-3@um.test",
      role: "campaign_manager",
      password: "password-abc",
    });
    assert.equal(created.role, "campaign_manager");
    assert.equal(created.agencyId, AGENCY_A);
  });

  it("duplicate emails are rejected with a friendly error", async () => {
    await assert.rejects(
      createAgencyUser(AGENCY_B, ownerB1, {
        name: "Duplikat",
        email: "member-1@um.test", // already registered under agency A
        role: "viewer",
        password: "password-xyz",
      }),
      /Email sudah terdaftar/,
    );
  });

  it("only owners can grant the owner role on creation", async () => {
    const ownersBefore = await prisma.user.count({ where: { agencyId: AGENCY_A, role: "owner" } });
    await assert.rejects(
      createAgencyUser(AGENCY_A, adminA1, {
        name: "Owner Liar",
        email: "rogue-owner@um.test",
        role: "owner",
        password: "password-abc",
      }),
      /Hanya Owner/,
    );
    assert.equal(
      await prisma.user.count({ where: { agencyId: AGENCY_A, role: "owner" } }),
      ownersBefore,
      "a rejected creation must not leave an owner row behind",
    );
  });

  it("setting:write — the management gate — belongs to owner/admin only", () => {
    for (const role of ROLES) {
      assert.equal(can(role, "setting", "write"), role === "owner" || role === "admin", `${role} setting:write`);
    }
  });

  it("cross-tenant access is blocked before any write", async () => {
    await assert.rejects(
      updateAgencyUser(AGENCY_B, ownerB1, member1Id, { name: "Diretas" }),
      /tidak ditemukan/,
    );
    const untouched = await prisma.user.findUnique({ where: { id: member1Id } });
    assert.equal(untouched!.name, "Member Satu");
  });

  it("role assignment works and persists", async () => {
    const updated = await updateAgencyUser(AGENCY_A, ownerA1, member1Id, { role: "finance" });
    assert.equal(updated.role, "finance");
    const reread = await prisma.user.findUnique({ where: { id: member1Id } });
    assert.equal(reread!.role, "finance");
  });

  it("self-protection blocks changing your own role (but not your own profile)", async () => {
    await assert.rejects(
      updateAgencyUser(AGENCY_A, ownerA1, ownerA1.id, { role: "admin" }),
      /sendiri/,
    );
    const renamed = await updateAgencyUser(AGENCY_A, ownerA1, ownerA1.id, { name: "Owner A Satu" });
    assert.equal(renamed.name, "Owner A Satu");
    assert.equal(
      await prisma.user.findUnique({ where: { id: ownerA1.id } }).then((u) => u!.role),
      "owner",
      "the self-role attempt must have been a no-op",
    );
  });

  it("last-owner protection holds", async () => {
    // Agency C has exactly one owner. Admins may never modify that account…
    const cAdmin = await prisma.user.findUnique({ where: { email: "admin-c@um.test" } });
    const cOwner = await prisma.user.findUnique({ where: { email: "owner-c@um.test" } });
    await assert.rejects(
      updateAgencyUser(AGENCY_C, { id: cAdmin!.id, role: "admin" }, cOwner!.id, { role: "viewer" }),
      /Hanya Owner/,
    );
    // …and the owner cannot demote themselves out of existence either.
    await assert.rejects(
      updateAgencyUser(AGENCY_C, { id: cOwner!.id, role: "owner" }, cOwner!.id, { role: "viewer" }),
      /sendiri/,
    );

    // Positive path: with two owners in agency A, demoting one is allowed and
    // still leaves a functioning owner behind.
    const second = await createAgencyUser(AGENCY_A, ownerA1, {
      name: "Owner A2",
      email: "owner-a2@um.test",
      role: "owner",
      password: "password-abc",
    });
    assert.equal(await prisma.user.count({ where: { agencyId: AGENCY_A, role: "owner" } }), 2);
    await updateAgencyUser(AGENCY_A, ownerA1, second.id, { role: "viewer" });
    assert.equal(await prisma.user.count({ where: { agencyId: AGENCY_A, role: "owner" } }), 1);
  });

  it("listing is agency-scoped and never exposes password hashes", async () => {
    await createAgencyUser(AGENCY_B, ownerB1, {
      name: "Member B",
      email: "member-b@um.test",
      role: "viewer",
      password: "password-b1",
    });

    const idsA = await userIds(AGENCY_A);
    const listed = await listAgencyUsers(AGENCY_A);
    assert.ok(listed.length >= 3);
    for (const row of listed) {
      assert.ok(idsA.has(row.id), "list must stay inside the authenticated agency");
      assert.ok(!("passwordHash" in row), "password hashes must not appear in listings");
    }
  });

  it("admins cannot modify an owner account", async () => {
    await assert.rejects(
      updateAgencyUser(AGENCY_A, adminA1, ownerA1.id, { name: "Diubah Admin" }),
      /Hanya Owner/,
    );
    const unchanged = await prisma.user.findUnique({ where: { id: ownerA1.id } });
    assert.equal(unchanged!.name, "Owner A Satu");
  });
});
