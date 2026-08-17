// Unit + DB-backed tests for session token hardening (Revisi §4).
//
// Covers the verifier's pinning (HS256 + issuer + audience), rejection of
// tampered / wrong-secret / expired / wrong-iss / wrong-aud tokens, the
// AUTH_SECRET policy (no hardcoded fallback in production, minimum length),
// and the full session resolution path: a valid token must re-resolve the
// user row server-side, and an invalid DB role must never surface as a Role.
// Uses a throwaway database (lib/test-env.ts), never prisma/dev.db.

import "@/lib/test-env";

import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { SignJWT } from "jose";
import prisma from "@/lib/prisma";
import { createSessionToken, verifySessionToken, resolveSessionUser } from "./auth";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

const SECRET = "unit-test-secret-that-is-long-enough-32";
const enc = new TextEncoder();

const sampleUser = {
  id: "user-1",
  agencyId: "agency-auth",
  role: "owner",
  email: "owner@example.com",
  name: "Test Owner",
};

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
  await prisma.agency.create({
    data: { id: sampleUser.agencyId, name: "Auth Agency", slug: "auth-agency" },
  });
  await prisma.user.createMany({
    data: [
      { ...sampleUser, passwordHash: "unused" },
      {
        id: "user-badrole",
        agencyId: sampleUser.agencyId,
        email: "badrole@example.com",
        name: "Bad Role",
        role: "SUPER_ADMIN", // bukan role yang dikenal sistem
        passwordHash: "unused",
      },
    ],
  });
});

after(async () => {
  await prisma.$disconnect();
  delete process.env.AUTH_SECRET;
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

describe("session token", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = SECRET;
    Object.assign(process.env, { NODE_ENV: "test" });
  });

  afterEach(() => {
    process.env.AUTH_SECRET = SECRET;
    Object.assign(process.env, { NODE_ENV: "test" });
  });

  it("round-trips: tokens issued by createSessionToken verify", async () => {
    const token = await createSessionToken(sampleUser);
    const payload = await verifySessionToken(token);
    assert.ok(payload);
    assert.equal(payload.sub, sampleUser.id);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const forged = await new SignJWT({ agencyId: sampleUser.agencyId, role: "owner" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(sampleUser.id)
      .setIssuer("agency-os")
      .setAudience("agency-os-app")
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(enc.encode("a-completely-different-secret-32chars!"));
    assert.equal(await verifySessionToken(forged), null);
  });

  it("rejects a tampered payload (signature mismatch)", async () => {
    const token = await createSessionToken(sampleUser);
    const [header, , signature] = token.split(".");
    // Swap in a payload claiming a different user id, keep the original signature.
    const fake = Buffer.from(JSON.stringify({ sub: "admin-of-another-agency" })).toString("base64url");
    const tampered = [header, fake, signature].join(".");
    assert.equal(await verifySessionToken(tampered), null);
  });

  it("rejects an expired token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const expired = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(sampleUser.id)
      .setIssuer("agency-os")
      .setAudience("agency-os-app")
      .setIssuedAt(now - 3600)
      .setExpirationTime(now - 60)
      .sign(enc.encode(SECRET));
    assert.equal(await verifySessionToken(expired), null);
  });

  it("rejects a wrong issuer", async () => {
    const wrongIss = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(sampleUser.id)
      .setIssuer("another-service")
      .setAudience("agency-os-app")
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(enc.encode(SECRET));
    assert.equal(await verifySessionToken(wrongIss), null);
  });

  it("rejects a wrong audience", async () => {
    const wrongAud = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(sampleUser.id)
      .setIssuer("agency-os")
      .setAudience("another-app")
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(enc.encode(SECRET));
    assert.equal(await verifySessionToken(wrongAud), null);
  });

  it("rejects a swapped algorithm header (alg: none)", async () => {
    // jose itself refuses to SIGN alg:none — a downgrade attack arrives as a
    // hand-crafted token, so build one the same way an attacker would.
    const b64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
    const header = b64url({ alg: "none", typ: "JWT" });
    const payload = b64url({
      sub: sampleUser.id,
      iss: "agency-os",
      aud: "agency-os-app",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
    });
    assert.equal(await verifySessionToken(`${header}.${payload}.`), null);
  });

  it("rejects garbage input", async () => {
    assert.equal(await verifySessionToken("not-a-jwt"), null);
    assert.equal(await verifySessionToken(""), null);
  });
});

describe("AUTH_SECRET policy", () => {
  afterEach(() => {
    process.env.AUTH_SECRET = SECRET;
    Object.assign(process.env, { NODE_ENV: "test" });
  });

  it("a short AUTH_SECRET (< 32 chars) is rejected", async () => {
    process.env.AUTH_SECRET = "too-short";
    await assert.rejects(createSessionToken(sampleUser), /terlalu pendek/);
  });

  it("production without AUTH_SECRET refuses to sign (no hardcoded fallback)", async () => {
    delete process.env.AUTH_SECRET;
    Object.assign(process.env, { NODE_ENV: "production" });
    await assert.rejects(createSessionToken(sampleUser), /AUTH_SECRET wajib/);
  });

  it("dev without AUTH_SECRET falls back to a local-only key", async () => {
    delete process.env.AUTH_SECRET;
    Object.assign(process.env, { NODE_ENV: "development" });
    const token = await createSessionToken(sampleUser);
    process.env.AUTH_SECRET = SECRET; // restore so the verifier uses SECRET
    // The dev fallback token must not verify with a different secret.
    assert.equal(await verifySessionToken(token), null);
  });
});

describe("session resolution (DB re-resolve, Revisi §4.6)", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = SECRET;
    Object.assign(process.env, { NODE_ENV: "test" });
  });

  it("re-resolves the user row from the token's subject", async () => {
    const token = await createSessionToken(sampleUser);
    const user = await resolveSessionUser(token);
    assert.ok(user);
    assert.equal(user.id, sampleUser.id);
    assert.equal(user.agencyId, sampleUser.agencyId);
    assert.equal(user.role, "owner");
  });

  it("returns null when the user no longer exists", async () => {
    const token = await createSessionToken({ ...sampleUser, id: "user-deleted" });
    assert.equal(await resolveSessionUser(token), null);
  });

  it("returns null for an invalid role stored in the DB (never trusted as-is)", async () => {
    const token = await createSessionToken({
      id: "user-badrole",
      agencyId: sampleUser.agencyId,
      role: "SUPER_ADMIN",
      email: "badrole@example.com",
      name: "Bad Role",
    });
    assert.equal(await resolveSessionUser(token), null);
  });

  it("returns null for an invalid token", async () => {
    assert.equal(await resolveSessionUser("not-a-token"), null);
  });

  it("agency/role come from the DB row, not the token claims", async () => {
    // Claims lie about agency/role; resolution must still return the DB row.
    const token = await createSessionToken({
      ...sampleUser,
      agencyId: "another-agency",
      role: "admin",
    });
    const user = await resolveSessionUser(token);
    assert.ok(user);
    assert.equal(user.agencyId, sampleUser.agencyId);
    assert.equal(user.role, "owner");
  });
});
