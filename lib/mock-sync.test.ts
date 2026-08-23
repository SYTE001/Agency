// Focused tests for the mock-sync hardening (Phase 3, P0 #1).
//
// runMockSync used to write synthetic metrics AND bump real campaign
// actualGmv with Math.random() on every run, in every environment. These
// tests pin the hardened contract:
//   1. refused outright in production — even with the opt-in flag set, and
//      without writing a single row
//   2. refused unless MOCK_SYNC_ENABLED=true (explicit opt-in, strict value)
//   3. when allowed (development/demo): metric generation is deterministic,
//      campaign actualGmv is untouched, and writes stay tenant-scoped
//   4. the RBAC gate runSyncAction enforces rejects every non owner/admin role
//
// Runs against a throwaway database (see lib/test-env.ts), never prisma/dev.db.

import "@/lib/test-env";

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import prisma from "@/lib/prisma";
import { createCreator } from "@/lib/services/creators";
import { createBrand } from "@/lib/services/brands";
import { createCampaign } from "@/lib/services/campaigns";
import {
  computeMockCreatorMetric,
  isMockSyncEnabled,
  runMockSync,
} from "@/lib/services/integrations";
import { can } from "@/lib/authorization";
import { ROLES } from "@/lib/constants";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";

const AGENCY_A = "mock-agency-a";
const AGENCY_B = "mock-agency-b";

// next-env types process.env.NODE_ENV as readonly; the suite flips it per
// case, so all environment juggling goes through this widened view.
const env = process.env as { NODE_ENV?: string; MOCK_SYNC_ENABLED?: string };

// The suite flips NODE_ENV / MOCK_SYNC_ENABLED per case; the ambient values
// are restored afterwards so nothing leaks into a co-hosted suite.
const originalNodeEnv = env.NODE_ENV;
const originalFlag = env.MOCK_SYNC_ENABLED;

async function seedCreator(agencyId: string, username: string, followers: number, externalId: string) {
  const c = await createCreator(agencyId, {
    username,
    displayName: username,
    category: "Tech",
    followers,
    engagementRate: 3.5,
  });
  // createCreator has no externalId input — sync candidates get it afterwards,
  // exactly like the CSV import flow does.
  await prisma.creator.update({ where: { id: c.id }, data: { externalId } });
  return c.id;
}

async function seedActiveCampaign(agencyId: string, brandId: string, name: string, actualGmv: number) {
  const campaign = await createCampaign(agencyId, { name, brandId });
  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "Active", actualGmv } });
  return campaign.id;
}

before(async () => {
  if (!PROVIDED_DATABASE_URL) {
    // Apply the committed SQLite migration history to the throwaway file
    // (same bootstrap as lib/integration.test.ts).
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
      { id: AGENCY_A, name: "Mock Agency A", slug: "mock-agency-a" },
      { id: AGENCY_B, name: "Mock Agency B", slug: "mock-agency-b" },
    ],
  });
});

after(async () => {
  if (originalNodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = originalNodeEnv;
  if (originalFlag === undefined) delete env.MOCK_SYNC_ENABLED;
  else env.MOCK_SYNC_ENABLED = originalFlag;
  await prisma.$disconnect();
  if (TEST_DB_FILE) {
    fs.rmSync(TEST_DB_FILE, { force: true });
    fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
  }
});

describe("mock sync environment gate (Phase 3 P0 #1)", () => {
  let creatorA1: string;
  let brandA: string;
  let brandB: string;
  let campaignA: string;
  let campaignB: string;

  before(async () => {
    creatorA1 = await seedCreator(AGENCY_A, "mock_creator_a1", 10_000, "tt-1001");
    await seedCreator(AGENCY_A, "mock_creator_a2", 55_000, "tt-1002");
    await seedCreator(AGENCY_B, "mock_creator_b1", 8_000, "tt-2001");
    brandA = (await createBrand(AGENCY_A, { name: "Mock Brand A" })).id;
    brandB = (await createBrand(AGENCY_B, { name: "Mock Brand B" })).id;
    campaignA = await seedActiveCampaign(AGENCY_A, brandA, "Mock Campaign A", 7_500_000);
    campaignB = await seedActiveCampaign(AGENCY_B, brandB, "Mock Campaign B", 3_250_000);
  });

  it("is refused in production even with the opt-in flag set, writing nothing", async () => {
    env.MOCK_SYNC_ENABLED = "true";
    env.NODE_ENV = "production";
    try {
      assert.equal(isMockSyncEnabled(), false);
      const jobsBefore = await prisma.syncJob.count();
      const metricsBefore = await prisma.creatorMetric.count();
      await assert.rejects(runMockSync(AGENCY_A), /dinonaktifkan/);
      assert.equal(await prisma.syncJob.count(), jobsBefore, "a blocked run must not create sync jobs");
      assert.equal(await prisma.creatorMetric.count(), metricsBefore, "a blocked run must not write metrics");
    } finally {
      delete env.NODE_ENV;
      delete env.MOCK_SYNC_ENABLED;
    }
  });

  it("is refused without explicit opt-in, even outside production", async () => {
    env.NODE_ENV = "development";
    delete env.MOCK_SYNC_ENABLED;
    try {
      assert.equal(isMockSyncEnabled(), false);
      await assert.rejects(runMockSync(AGENCY_A), /dinonaktifkan/);
    } finally {
      delete env.NODE_ENV;
    }
  });

  it("treats the opt-in flag strictly — any value other than \"true\" is off", async () => {
    env.NODE_ENV = "development";
    env.MOCK_SYNC_ENABLED = "1";
    try {
      assert.equal(isMockSyncEnabled(), false);
    } finally {
      delete env.NODE_ENV;
      delete env.MOCK_SYNC_ENABLED;
    }
  });

  it("runs with explicit opt-in in development and never touches campaign actualGmv", async () => {
    env.NODE_ENV = "development";
    env.MOCK_SYNC_ENABLED = "true";
    try {
      assert.equal(isMockSyncEnabled(), true);
      const beforeA = await prisma.campaign.findUnique({ where: { id: campaignA } });
      const beforeB = await prisma.campaign.findUnique({ where: { id: campaignB } });
      assert.ok(beforeA && beforeB);

      const outcome = await runMockSync(AGENCY_A);
      assert.equal(outcome.status, "Success");
      assert.ok(outcome.logCount > 0);

      const afterA = await prisma.campaign.findUnique({ where: { id: campaignA } });
      const afterB = await prisma.campaign.findUnique({ where: { id: campaignB } });
      assert.equal(
        afterA!.actualGmv.toNumber(),
        beforeA.actualGmv.toNumber(),
        "mock sync must not mutate campaign actualGmv",
      );
      assert.equal(
        afterB!.actualGmv.toNumber(),
        beforeB.actualGmv.toNumber(),
        "another tenant's campaign must stay untouched",
      );

      // Only the invoking agency's syncable creators get simulated rows.
      const metricsA = await prisma.creatorMetric.findMany({
        where: { creator: { agencyId: AGENCY_A } },
      });
      assert.equal(metricsA.length, 2);
      assert.equal(
        await prisma.creatorMetric.count({ where: { creator: { agencyId: AGENCY_B } } }),
        0,
        "mock sync must stay scoped to the invoking agency",
      );

      // Stored values must equal the deterministic generator exactly.
      const creator = await prisma.creator.findUnique({ where: { id: creatorA1 } });
      assert.ok(creator);
      const row = metricsA.find((m) => m.creatorId === creatorA1)!;
      const expected = computeMockCreatorMetric(
        {
          id: creator.id,
          externalId: creator.externalId,
          followers: creator.followers,
          engagementRate: creator.engagementRate,
        },
        row.date,
      );
      assert.equal(row.gmv.toNumber(), expected.gmv);
      assert.equal(row.followers, expected.followers);
      assert.equal(row.engagementRate, expected.engagementRate);
      assert.equal(row.videos, expected.videos);
      assert.equal(row.avgViews, expected.avgViews);
      assert.equal(row.liveGmv.toNumber(), expected.liveGmv);

      // The audit trail marks the run as a simulation and states campaigns
      // were left alone.
      const job = await prisma.syncJob.findUnique({
        where: { id: outcome.jobId },
        include: { logs: true },
      });
      assert.equal(job?.type, "mock_pull");
      assert.ok(job!.logs.some((l) => l.message.includes("tidak pernah menyentuh data bisnis")));
    } finally {
      delete env.NODE_ENV;
      delete env.MOCK_SYNC_ENABLED;
    }
  });

  it("re-running the sync reproduces identical metric values (no random drift)", async () => {
    env.NODE_ENV = "development";
    env.MOCK_SYNC_ENABLED = "true";
    try {
      await runMockSync(AGENCY_A);
      const rows = await prisma.creatorMetric.findMany({
        where: { creator: { agencyId: AGENCY_A } },
        orderBy: { id: "asc" },
      });
      assert.equal(rows.length, 4, "2 creators × 2 runs");
      // Both runs for the same creator must carry byte-identical numbers —
      // the old Math.random() campaign bump is gone and metrics are pure.
      const valueKeys = new Map<string, Set<string>>();
      for (const r of rows) {
        const key = `${r.gmv}|${r.followers}|${r.engagementRate}|${r.videos}|${r.avgViews}|${r.liveGmv}`;
        const set = valueKeys.get(r.creatorId) ?? new Set<string>();
        set.add(key);
        valueKeys.set(r.creatorId, set);
      }
      assert.equal(valueKeys.size, 2);
      for (const [creatorId, set] of valueKeys) {
        assert.equal(set.size, 1, `creator ${creatorId} must get identical values on every re-run`);
      }
    } finally {
      delete env.NODE_ENV;
      delete env.MOCK_SYNC_ENABLED;
    }
  });

  it("metric generation is a pure function — same inputs, identical output", () => {
    const ref = new Date("2026-08-23T04:00:00Z");
    const source = { id: "creator-x", externalId: "tt-42", followers: 12_345, engagementRate: 4.2 };
    const first = computeMockCreatorMetric(source, ref);
    for (let i = 0; i < 5; i++) {
      assert.deepEqual(computeMockCreatorMetric(source, ref), first);
    }
    // A different creator identity yields a different (but equally stable) series.
    const other = computeMockCreatorMetric({ ...source, externalId: "tt-43" }, ref);
    assert.notDeepEqual(other, first);
    assert.deepEqual(computeMockCreatorMetric({ ...source, externalId: "tt-43" }, ref), other);
  });
});

describe("mock sync RBAC gate (runSyncAction's server-side check)", () => {
  it("only owner/admin hold integration:manage", () => {
    for (const role of ROLES) {
      const allowed = role === "owner" || role === "admin";
      assert.equal(can(role, "integration", "manage"), allowed, `${role} integration:manage`);
    }
  });

  it("viewer and scoped roles can never invoke the mutation", () => {
    for (const role of ["viewer", "finance", "creator_manager", "campaign_manager", "live_manager", "account_manager"] as const) {
      assert.equal(can(role, "integration", "manage"), false, `${role} must not run mock sync`);
    }
  });
});
