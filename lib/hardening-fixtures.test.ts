// PR-00 tests for the hardening fixture module (tests/fixtures/hardening.ts).
//
// Covers:
//   1. safety guard — invalid inputs rejected BEFORE any database write;
//   2. fixture repeatability — second seed run changes zero rows;
//   3. expected amounts against the literal contract (HARDENING_EXPECTED);
//   4. cross-tenant isolation of detail/list service entry points;
//   5. FK/tenant-ownership denial using the existing service guards.
//
// Runs on the standard throwaway test database via lib/test-env (its temp
// file is named agency-os-test-*.db, which the fixture guard explicitly
// allows). The DB-backed suites below are explicit-opt-in via
// HARDENING_FIXTURES=1 set in the before hook.
import "@/lib/test-env";

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { calculateCommission } from "@/lib/finance";
import prisma from "@/lib/prisma";
import { getCreatorDetail, listCreators } from "@/lib/services/creators";
import {
  createCommission,
  createPayout,
  createSettlement,
  listCommissions,
  listPayouts,
  listSettlements,
} from "@/lib/services/finance";
import { PROVIDED_DATABASE_URL, TEST_DB_FILE } from "@/lib/test-env";
import {
  assertHardeningFixtureSafety,
  HARDENING_CREDENTIALS,
  HARDENING_EXPECTED,
  HARDENING_IDS,
  HARDENING_REF_DATE_ISO,
  seedHardeningFixtures,
} from "@/tests/fixtures/hardening";

const REF = new Date(HARDENING_REF_DATE_ISO);

function daysFrom(ref: Date, days: number): Date {
  return new Date(ref.getTime() + days * 24 * 60 * 60 * 1000);
}

function num(d: unknown): number {
  return Number(String(d));
}

// Valid disposable env used as the baseline for the negative guard tests.
function safeEnv(): Record<string, string> {
  return {
    NODE_ENV: "test",
    HARDENING_FIXTURES: "1",
    DATABASE_URL: "file:./prisma/hardening-unit.db",
  };
}

function migrateTestDatabase(): void {
  if (PROVIDED_DATABASE_URL) return; // dedicated DB must already be migrated
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

const COUNT_MODELS = Object.keys(HARDENING_EXPECTED.counts) as Array<
  keyof typeof HARDENING_EXPECTED.counts
>;

async function fullTableCounts(): Promise<Record<string, number>> {
  return Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Promise.all(
      COUNT_MODELS.map(async (m) => [m, await (prisma as any)[m].count()]),
    ),
  );
}

describe("hardening fixture safety guard", () => {
  // Migrate first so the "no writes" assertion below can query empty tables
  // (an un-migrated throwaway SQLite file has no schema at all).
  before(() => {
    migrateTestDatabase();
  });

  it("rejects NODE_ENV=production", () => {
    assert.throws(
      () =>
        assertHardeningFixtureSafety({ ...safeEnv(), NODE_ENV: "production" }),
      /production/,
    );
  });

  it("rejects without explicit HARDENING_FIXTURES=1 opt-in", () => {
    assert.throws(
      () =>
        assertHardeningFixtureSafety({
          ...safeEnv(),
          HARDENING_FIXTURES: undefined,
        }),
      /HARDENING_FIXTURES/,
    );
  });

  it("rejects TEST_DATABASE_URL that does not match DATABASE_URL", () => {
    assert.throws(
      () =>
        assertHardeningFixtureSafety({
          ...safeEnv(),
          TEST_DATABASE_URL: "file:./prisma/other.db",
        }),
      /TEST_DATABASE_URL/,
    );
  });

  it("rejects TEST_DATABASE_URL set while DATABASE_URL is absent (Prisma would read nothing)", () => {
    assert.throws(
      () =>
        assertHardeningFixtureSafety({
          NODE_ENV: "test",
          HARDENING_FIXTURES: "1",
          TEST_DATABASE_URL: "file:./prisma/hardening-unit.db",
          DATABASE_URL: undefined,
        }),
      /TEST_DATABASE_URL/,
    );
  });

  it("rejects shared/production PostgreSQL URLs", () => {
    assert.throws(
      () =>
        assertHardeningFixtureSafety({
          ...safeEnv(),
          DATABASE_URL: "postgres://user:pass@db.supabase.co:5432/postgres",
        }),
      /agency-os-test-db/,
    );
  });

  it("rejects file databases outside the hardening-/agency-os-test- namespace", () => {
    for (const url of ["file:./prisma/dev.db", "file:./prisma/e2e-test.db"]) {
      assert.throws(
        () => assertHardeningFixtureSafety({ ...safeEnv(), DATABASE_URL: url }),
        /hardening-|agency-os-test-/,
      );
    }
  });

  it("rejects a missing target URL", () => {
    assert.throws(
      () =>
        assertHardeningFixtureSafety({ ...safeEnv(), DATABASE_URL: undefined }),
      /DATABASE_URL/,
    );
  });

  it("accepts the two legal disposable targets", () => {
    assert.doesNotThrow(() =>
      assertHardeningFixtureSafety({
        ...safeEnv(),
        TEST_DATABASE_URL: "file:./prisma/hardening-unit.db",
      }),
    );
    assert.doesNotThrow(() =>
      assertHardeningFixtureSafety({
        ...safeEnv(),
        DATABASE_URL: "postgres://user:pass@localhost:5432/agency-os-test-db",
      }),
    );
  });

  it("invalid inputs never reach the database (no writes before guard passes)", async () => {
    assert.equal(await prisma.agency.count(), 0);
    assert.equal(await prisma.user.count(), 0);
  });
});

describe("hardening fixtures (DB-backed)", () => {
  before(async () => {
    Object.assign(process.env, {
      NODE_ENV: process.env.NODE_ENV ?? "test",
      HARDENING_FIXTURES: "1",
    });
    migrateTestDatabase();
  });

  after(async () => {
    await prisma.$disconnect();
    if (TEST_DB_FILE) {
      fs.rmSync(TEST_DB_FILE, { force: true });
      fs.rmSync(`${TEST_DB_FILE}-journal`, { force: true });
    }
  });

  it("seeds transactionally with contract row counts, and reruns are idempotent", async () => {
    const first = await seedHardeningFixtures(prisma, { refDate: REF });
    assert.equal(first.created, true);
    assert.equal(first.ids.agencyA, HARDENING_IDS.agencyA);
    assert.equal(first.ids.agencyB, HARDENING_IDS.agencyB);
    assert.deepEqual(first.counts, HARDENING_EXPECTED.counts);

    const snapshot = await fullTableCounts();
    assert.deepEqual(snapshot, HARDENING_EXPECTED.counts);

    const second = await seedHardeningFixtures(prisma);
    assert.equal(second.created, false);
    assert.deepEqual(second.counts, HARDENING_EXPECTED.counts);
    assert.deepEqual(await fullTableCounts(), snapshot);
  });

  it("agency A owner uses the existing e2e credentials with a real scrypt hash", async () => {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { id: HARDENING_IDS.userOwnerA },
    });
    assert.equal(owner.email, HARDENING_CREDENTIALS.ownerEmailA);
    assert.equal(owner.role, "owner");
    assert.equal(owner.agencyId, HARDENING_IDS.agencyA);
    const { verifyPassword } = await import("@/lib/password");
    assert.equal(
      await verifyPassword(
        HARDENING_CREDENTIALS.ownerPasswordA,
        owner.passwordHash,
      ),
      true,
    );
    assert.equal(
      await verifyPassword("wrong-password-attempt", owner.passwordHash),
      false,
    );
    const roles = await prisma.user.findMany({
      where: { agencyId: HARDENING_IDS.agencyA },
      select: { role: true },
    });
    assert.deepEqual(roles.map((r) => r.role).sort(), [
      "admin",
      "owner",
      "viewer",
    ]);
    const bUsers = await prisma.user.findMany({
      where: { agencyId: HARDENING_IDS.agencyB },
      select: { role: true },
    });
    assert.deepEqual(
      bUsers.map((r) => r.role),
      ["owner"],
    );
  });

  it("manual creator metrics, content GMV and commission GMV match the literal contract and stay distinct", async () => {
    // Bucket 1: manual CreatorMetric rows.
    for (const [creatorId, expected] of Object.entries(
      HARDENING_EXPECTED.creatorMetrics,
    )) {
      const metric = await prisma.creatorMetric.findFirstOrThrow({
        where: { creatorId, date: daysFrom(REF, -1) },
      });
      assert.equal(num(metric.gmv), expected.gmv);
      assert.equal(num(metric.liveGmv), expected.liveGmv);
      assert.equal(metric.followers, expected.followers);
    }

    // Bucket 2: ContentItem.gmvGenerated.
    for (const [id, expectedGmv] of Object.entries(
      HARDENING_EXPECTED.contentGmv,
    )) {
      const item = await prisma.contentItem.findUniqueOrThrow({
        where: { id },
      });
      assert.equal(num(item.gmvGenerated), expectedGmv);
      assert.equal(item.status, "Published");
    }

    // LIVE calendar rows (PRD capture surface): Ended with actualGmv + Scheduled upcoming.
    for (const [id, expected] of Object.entries(
      HARDENING_EXPECTED.liveSessions,
    )) {
      const row = await prisma.liveSession.findUniqueOrThrow({ where: { id } });
      assert.equal(row.status, expected.status);
      assert.equal(num(row.targetGmv), expected.targetGmv);
      assert.equal(num(row.actualGmv), expected.actualGmv);
      assert.equal(row.viewers, expected.viewers);
      assert.equal(row.orders, expected.orders);
    }
    const endedLive = await prisma.liveSession.findUniqueOrThrow({
      where: { id: HARDENING_IDS.liveA1 },
    });
    assert.equal(num(endedLive.actualGmv), 800_000);
    assert.notEqual(endedLive.endTime, null);

    // Bucket 3: Commission rows — literals AND calculateCommission agreement.
    for (const [id, expected] of Object.entries(
      HARDENING_EXPECTED.commissions,
    )) {
      const row = await prisma.commission.findUniqueOrThrow({ where: { id } });
      assert.equal(num(row.gmv), expected.gmv);
      assert.equal(row.creatorRate, expected.creatorRate);
      assert.equal(row.agencyShareRate, expected.agencyShareRate);
      assert.equal(num(row.creatorCommission), expected.creatorCommission);
      assert.equal(num(row.agencyRevenue), expected.agencyRevenue);
      assert.equal(row.status, expected.status);
      const computed = calculateCommission({
        gmv: expected.gmv,
        creatorRate: expected.creatorRate,
        agencyShareRate: expected.agencyShareRate,
      });
      assert.equal(computed.creatorCommission, expected.creatorCommission);
      assert.equal(computed.agencyRevenue, expected.agencyRevenue);
    }

    // Payout / settlement pending/paid records with literal amounts.
    const paidPayout = await prisma.creatorPayout.findUniqueOrThrow({
      where: { id: HARDENING_IDS.payoutA1 },
    });
    assert.equal(
      num(paidPayout.amount),
      HARDENING_EXPECTED.payouts[HARDENING_IDS.payoutA1].amount,
    );
    assert.equal(paidPayout.status, "Paid");
    assert.equal(paidPayout.paidAt?.getTime(), daysFrom(REF, -1).getTime());
    const pendingPayout = await prisma.creatorPayout.findUniqueOrThrow({
      where: { id: HARDENING_IDS.payoutA2 },
    });
    assert.equal(
      num(pendingPayout.amount),
      HARDENING_EXPECTED.payouts[HARDENING_IDS.payoutA2].amount,
    );
    assert.equal(pendingPayout.status, "Pending");
    assert.equal(pendingPayout.paidAt, null);

    const paidSettlement = await prisma.settlement.findUniqueOrThrow({
      where: { id: HARDENING_IDS.settlementA1 },
    });
    assert.equal(
      num(paidSettlement.amount),
      HARDENING_EXPECTED.settlements[HARDENING_IDS.settlementA1].amount,
    );
    assert.equal(paidSettlement.status, "Paid");
    assert.equal(paidSettlement.paidAt?.getTime(), daysFrom(REF, -2).getTime());
    const pendingSettlement = await prisma.settlement.findUniqueOrThrow({
      where: { id: HARDENING_IDS.settlementA2 },
    });
    assert.equal(
      num(pendingSettlement.amount),
      HARDENING_EXPECTED.settlements[HARDENING_IDS.settlementA2].amount,
    );
    assert.equal(pendingSettlement.status, "Pending");
    assert.equal(
      pendingSettlement.dueDate?.getTime(),
      daysFrom(REF, 7).getTime(),
    );

    // The GMV buckets are intentionally disjoint — all literal amounts unique.
    const amounts = [
      ...Object.values(HARDENING_EXPECTED.creatorMetrics).map((m) => m.gmv),
      ...Object.values(HARDENING_EXPECTED.contentGmv),
      ...Object.values(HARDENING_EXPECTED.liveSessions)
        .map((l) => l.actualGmv)
        .filter((v) => v > 0), // Scheduled sessions legitimately sit at 0
      ...Object.values(HARDENING_EXPECTED.commissions).map((c) => c.gmv),
    ];
    assert.equal(new Set(amounts).size, amounts.length);
  });

  it("detail/list entry points stay tenant-isolated", async () => {
    assert.equal(
      await getCreatorDetail(HARDENING_IDS.agencyB, HARDENING_IDS.creatorA1),
      null,
    );
    assert.notEqual(
      await getCreatorDetail(HARDENING_IDS.agencyA, HARDENING_IDS.creatorA1),
      null,
    );
    const bCreators = await listCreators(HARDENING_IDS.agencyB);
    assert.equal(bCreators.total, 1);
    assert.deepEqual(
      bCreators.items.map((c) => c.id),
      [HARDENING_IDS.creatorB1],
    );
    const bCommissions = await listCommissions(HARDENING_IDS.agencyB);
    assert.equal(bCommissions.total, 0);
    const bPayouts = await listPayouts(HARDENING_IDS.agencyB);
    assert.equal(bPayouts.total, 0);
    const bSettlements = await listSettlements(HARDENING_IDS.agencyB);
    assert.equal(bSettlements.total, 0);
    const aCommissions = await listCommissions(HARDENING_IDS.agencyA);
    assert.equal(aCommissions.total, 2);
  });

  it("cross-tenant references are denied by the existing service ownership guards (no rows written)", async () => {
    await assert.rejects(
      createCommission(HARDENING_IDS.agencyB, {
        creatorId: HARDENING_IDS.creatorA1,
        sourceType: "Content",
        sourceId: HARDENING_IDS.contentA1,
        gmv: 999_999,
        creatorRate: 10,
        agencyShareRate: 30,
      }),
      /Creator tidak ditemukan/,
    );
    await assert.rejects(
      createPayout(HARDENING_IDS.agencyB, {
        creatorId: HARDENING_IDS.creatorA1,
        amount: 50_000,
      }),
      /Creator tidak ditemukan/,
    );
    await assert.rejects(
      createSettlement(HARDENING_IDS.agencyB, {
        brandId: HARDENING_IDS.brandA1,
        amount: 90_000,
      }),
      /Brand tidak ditemukan/,
    );
    // Denials happened before any write: agency B still owns zero financial rows.
    assert.equal(
      await prisma.commission.count({
        where: { agencyId: HARDENING_IDS.agencyB },
      }),
      0,
    );
    assert.equal(
      await prisma.creatorPayout.count({
        where: { agencyId: HARDENING_IDS.agencyB },
      }),
      0,
    );
    assert.equal(
      await prisma.settlement.count({
        where: { agencyId: HARDENING_IDS.agencyB },
      }),
      0,
    );
  });

  // PR-04 coverage remains open; TODOs do not count as passed security checks.
  it.todo(
    "PR-04: agency-B session cannot read agency-A finance data (fixture-backed e2e)",
  );
  it.todo(
    "PR-04: sourceId references (Content/LiveSession) are tenant-validated on every mutation",
  );
  it.todo(
    "PR-04: viewer cannot reach finance mutations through server actions",
  );
});
