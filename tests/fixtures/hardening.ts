// PR-00 hardening fixtures — deterministic synthetic two-agency dataset.
//
// Runtime import graph is deliberately free of lib/prisma and lib/test-env:
// the Prisma client (constructed from the guarded DATABASE_URL) is injected
// by the caller, and the `PrismaClient` import below is type-only. That lets
// scripts/seed-hardening.mts run the safety guard BEFORE loading Prisma.
//
// Rules: every ID uses the `hardening-` namespace; the seeder is
// transactional and idempotent (rerun returns existing state, never deletes
// or updates settled/paid records); unique-key conflicts with records
// outside the namespace are rejected. The guard only permits disposable
// targets (hardening-*.db | agency-os-test-*.db | /agency-os-test-db), and
// when TEST_DATABASE_URL is set, DATABASE_URL must exist and be identical.

import { calculateCommission } from "@/lib/finance";
import { hashPassword } from "@/lib/password";
import type { PrismaClient } from "@/lib/prismaClient";

// ---------------------------------------------------------------------------
// Reference date & deterministic IDs
// ---------------------------------------------------------------------------

/** Fixed reference date (2026-11-17). Overridable via seedHardeningFixtures({ refDate }). */
export const HARDENING_REF_DATE_ISO = "2026-11-17T00:00:00.000Z";

export const HARDENING_FIXTURE_PREFIX = "hardening-";

export const HARDENING_IDS = {
  agencyA: "hardening-agency-a",
  agencyB: "hardening-agency-b",
  userOwnerA: "hardening-user-owner-a",
  userAdminA: "hardening-user-admin-a",
  userViewerA: "hardening-user-viewer-a",
  userOwnerB: "hardening-user-owner-b",
  brandA1: "hardening-brand-a1",
  brandA2: "hardening-brand-a2",
  brandB1: "hardening-brand-b1",
  brandContactA1: "hardening-brand-contact-a1",
  brandContactA2: "hardening-brand-contact-a2",
  brandContactB1: "hardening-brand-contact-b1",
  creatorA1: "hardening-creator-a1",
  creatorA2: "hardening-creator-a2",
  creatorB1: "hardening-creator-b1",
  platformAccountA1: "hardening-platform-a1",
  platformAccountA2: "hardening-platform-a2",
  platformAccountB1: "hardening-platform-b1",
  creatorMetricA1: "hardening-creator-metric-a1",
  creatorMetricA2: "hardening-creator-metric-a2",
  productA1: "hardening-product-a1",
  productA2: "hardening-product-a2",
  productB1: "hardening-product-b1",
  campaignA1: "hardening-campaign-a1",
  campaignA2: "hardening-campaign-a2",
  campaignB1: "hardening-campaign-b1",
  linkA1CreatorA1: "hardening-link-a1-c1",
  linkA1CreatorA2: "hardening-link-a1-c2",
  linkA2CreatorA2: "hardening-link-a2-c2",
  linkB1CreatorB1: "hardening-link-b1-c1",
  linkA1ProductA1: "hardening-link-a1-p1",
  linkA2ProductA2: "hardening-link-a2-p2",
  linkB1ProductB1: "hardening-link-b1-p1",
  contentA1: "hardening-content-a1",
  contentA2: "hardening-content-a2",
  liveA1: "hardening-live-a1",
  liveA2: "hardening-live-a2",
  liveB1: "hardening-live-b1",
  commissionA1: "hardening-commission-a1",
  commissionA2: "hardening-commission-a2",
  payoutA1: "hardening-payout-a1",
  payoutA2: "hardening-payout-a2",
  settlementA1: "hardening-settlement-a1",
  settlementA2: "hardening-settlement-a2",
} as const;

// ---------------------------------------------------------------------------
// Fixture credentials (synthetic, local-only; agency A owner reuses the
// existing e2e credentials so Playwright auth flows keep working against a
// fixture-seeded database).
// ---------------------------------------------------------------------------

export const HARDENING_CREDENTIALS = {
  ownerEmailA: "owner@agency.test",
  ownerPasswordA: "localdev-owner-pass-1",
  adminEmailA: "hardening-admin@agency-a.test",
  viewerEmailA: "hardening-viewer@agency-a.test",
  ownerEmailB: "hardening-owner@agency-b.test",
  fixturePassword: "localdev-fixture-pass-2",
} as const;

// ---------------------------------------------------------------------------
// Literal expected values (the contract)
// ---------------------------------------------------------------------------

const COMMISSION_A1 = calculateCommission({
  gmv: 500_000,
  creatorRate: 10,
  agencyShareRate: 30,
});
const COMMISSION_A2 = calculateCommission({
  gmv: 750_000,
  creatorRate: 15,
  agencyShareRate: 40,
});

export const HARDENING_EXPECTED = {
  refDateIso: HARDENING_REF_DATE_ISO,
  /** Manual CreatorMetric rows — bucket 1. */
  creatorMetrics: {
    [HARDENING_IDS.creatorA1]: {
      followers: 152_500,
      gmv: 1_000_000,
      liveGmv: 250_000,
    },
    [HARDENING_IDS.creatorA2]: {
      followers: 98_000,
      gmv: 2_000_000,
      liveGmv: 400_000,
    },
  },
  /** ContentItem.gmvGenerated — bucket 2. */
  contentGmv: {
    [HARDENING_IDS.contentA1]: 150_000,
    [HARDENING_IDS.contentA2]: 250_000,
  },
  /** LIVE sessions populating the /live calendar. */
  liveSessions: {
    [HARDENING_IDS.liveA1]: {
      status: "Ended",
      targetGmv: 1_000_000,
      actualGmv: 800_000,
      viewers: 4_200,
      orders: 95,
    },
    [HARDENING_IDS.liveA2]: {
      status: "Scheduled",
      targetGmv: 2_000_000,
      actualGmv: 0,
      viewers: 0,
      orders: 0,
    },
    [HARDENING_IDS.liveB1]: {
      status: "Scheduled",
      targetGmv: 500_000,
      actualGmv: 0,
      viewers: 0,
      orders: 0,
    },
  },
  /** Commission rows — bucket 3. Literal amounts (must equal calculateCommission). */
  commissions: {
    [HARDENING_IDS.commissionA1]: {
      gmv: 500_000,
      creatorRate: 10,
      agencyShareRate: 30,
      creatorCommission: 50_000,
      agencyRevenue: 15_000,
      status: "Pending",
    },
    [HARDENING_IDS.commissionA2]: {
      gmv: 750_000,
      creatorRate: 15,
      agencyShareRate: 40,
      creatorCommission: 112_500,
      agencyRevenue: 45_000,
      status: "Settled",
    },
  },
  payouts: {
    [HARDENING_IDS.payoutA1]: { amount: 50_000, status: "Paid" },
    [HARDENING_IDS.payoutA2]: { amount: 112_500, status: "Pending" },
  },
  settlements: {
    [HARDENING_IDS.settlementA1]: { amount: 65_000, status: "Paid" },
    [HARDENING_IDS.settlementA2]: { amount: 165_000, status: "Pending" },
  },
  counts: {
    agency: 2,
    user: 4,
    brand: 3,
    brandContact: 3,
    creator: 3,
    creatorPlatformAccount: 3,
    creatorMetric: 2,
    product: 3,
    campaign: 3,
    campaignCreator: 4,
    campaignProduct: 3,
    contentItem: 2,
    liveSession: 3,
    commission: 2,
    creatorPayout: 2,
    settlement: 2,
  },
} as const;

// ---------------------------------------------------------------------------
// Safety guard
// ---------------------------------------------------------------------------

export type FixtureEnv = Partial<
  Record<
    "NODE_ENV" | "HARDENING_FIXTURES" | "DATABASE_URL" | "TEST_DATABASE_URL",
    string | undefined
  >
>;

function fileBasename(url: string): string {
  const withoutQuery = url.split("?")[0] ?? "";
  const parts = withoutQuery.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] ?? "";
}

/**
 * Throws unless it is safe to write hardening fixtures to the current target
 * database. Pure function over the given env (defaults to process.env) — no
 * I/O, no Prisma, safe to call before anything else is imported.
 *
 * Checks, in order:
 *  1. NODE_ENV !== "production"
 *  2. explicit opt-in HARDENING_FIXTURES === "1"
 *  3. TEST_DATABASE_URL (if set) must equal DATABASE_URL
 *  4. target URL is disposable:
 *     - file: whose basename starts with `hardening-` or `agency-os-test-`, or
 *     - postgres(ql):// pointing at the dedicated /agency-os-test-db database.
 */
export function assertHardeningFixtureSafety(
  env: FixtureEnv = process.env,
): void {
  if (env.NODE_ENV === "production") {
    throw new Error(
      "[hardening-fixtures] NODE_ENV=production — fixture seeding ditolak. " +
        "Fixture hanya boleh ditulis ke database sekali-pakai.",
    );
  }
  if (env.HARDENING_FIXTURES !== "1") {
    throw new Error(
      "[hardening-fixtures] Opt-in eksplisit dibutuhkan: set HARDENING_FIXTURES=1 " +
        "(fixture menulis data bisnis sintetis; tanpa opt-in ini ditolak).",
    );
  }
  const testUrl = env.TEST_DATABASE_URL;
  if (testUrl && env.DATABASE_URL !== testUrl) {
    throw new Error(
      "[hardening-fixtures] Saat TEST_DATABASE_URL di-set, DATABASE_URL wajib ada dan " +
        "identik karakter-per-karakter (Prisma membaca DATABASE_URL — guard menolak " +
        "jika salah satu hilang atau keduanya berbeda).",
    );
  }
  const target = testUrl ?? env.DATABASE_URL;
  if (!target) {
    throw new Error(
      "[hardening-fixtures] DATABASE_URL kosong — tidak ada target database sekali-pakai.",
    );
  }
  if (/^(postgres|postgresql):\/\//.test(target)) {
    if (!/\/agency-os-test-db(\?|$)/.test(target)) {
      throw new Error(
        "[hardening-fixtures] PostgreSQL target harus database test khusus " +
          "/agency-os-test-db (dilarang menulis fixture ke database bersama/production).",
      );
    }
    return;
  }
  if (target.startsWith("file:")) {
    const base = fileBasename(target);
    if (!base.startsWith("hardening-") && !base.startsWith("agency-os-test-")) {
      throw new Error(
        "[hardening-fixtures] File database fixture harus dinamai `hardening-*.db` " +
          "(database khusus fixture) atau `agency-os-test-*.db` (temp test lib/test-env); " +
          `dapat: "${base}". Dilarang menulis ke dev.db/e2e-test.db/production.`,
      );
    }
    return;
  }
  throw new Error(
    "[hardening-fixtures] DATABASE_URL tidak dikenali sebagai target sekali-pakai " +
      "(harus file:hardening-*.db | file:agency-os-test-*.db | postgres://…/agency-os-test-db).",
  );
}

/**
 * Input validation for the fixture spec itself — runs BEFORE any write so
 * invalid data (bad ids/emails/short passwords/invalid ref date) can never
 * reach the database.
 */
export function validateFixtureData(refDate: Date): void {
  for (const [key, id] of Object.entries(HARDENING_IDS)) {
    if (!id.startsWith(HARDENING_FIXTURE_PREFIX)) {
      throw new Error(
        `[hardening-fixtures] ID "${key}" tidak memakai namespace "${HARDENING_FIXTURE_PREFIX}".`,
      );
    }
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emails: Array<[string, string]> = [
    ["ownerEmailA", HARDENING_CREDENTIALS.ownerEmailA],
    ["adminEmailA", HARDENING_CREDENTIALS.adminEmailA],
    ["viewerEmailA", HARDENING_CREDENTIALS.viewerEmailA],
    ["ownerEmailB", HARDENING_CREDENTIALS.ownerEmailB],
  ];
  for (const [key, email] of emails) {
    if (!emailRe.test(email)) {
      throw new Error(
        `[hardening-fixtures] Email fixture tidak valid: ${key}="${email}".`,
      );
    }
  }
  for (const password of [
    HARDENING_CREDENTIALS.ownerPasswordA,
    HARDENING_CREDENTIALS.fixturePassword,
  ]) {
    if (password.length < 12) {
      throw new Error(
        "[hardening-fixtures] Password fixture harus minimal 12 karakter.",
      );
    }
  }
  if (Number.isNaN(refDate.getTime())) {
    throw new Error("[hardening-fixtures] refDate bukan Date yang valid.");
  }
}

// ---------------------------------------------------------------------------
// Seeder
// ---------------------------------------------------------------------------

function daysFrom(ref: Date, days: number): Date {
  return new Date(ref.getTime() + days * 24 * 60 * 60 * 1000);
}

export type FixtureCounts = Record<
  keyof typeof HARDENING_EXPECTED.counts,
  number
>;

export type SeedHardeningResult = {
  /** true when the fixtures were created by this call; false when they already existed (idempotent rerun). */
  created: boolean;
  /** Row counts of every fixture-owned model after the call. */
  counts: FixtureCounts;
  /** Deterministic ids of the two agencies and the agency A users. */
  ids: {
    agencyA: string;
    agencyB: string;
    userOwnerA: string;
    userAdminA: string;
    userViewerA: string;
    userOwnerB: string;
  };
};

const COUNT_MODELS = [
  "agency",
  "user",
  "brand",
  "brandContact",
  "creator",
  "creatorPlatformAccount",
  "creatorMetric",
  "product",
  "campaign",
  "campaignCreator",
  "campaignProduct",
  "contentItem",
  "liveSession",
  "commission",
  "creatorPayout",
  "settlement",
] as const;

async function countFixtureRows(prisma: PrismaClient): Promise<FixtureCounts> {
  const counts: Record<string, number> = {};
  for (const model of COUNT_MODELS) {
    counts[model] = await (
      prisma[model] as { count(): Promise<number> }
    ).count();
  }
  return counts as FixtureCounts;
}

/**
 * Seeds the deterministic two-agency fixture set inside a single transaction.
 * The injected client must be constructed from the same DATABASE_URL the
 * guard validated (guard is re-run here against process.env before writing).
 *
 * Idempotent: on rerun (agency ids already present) nothing is written and the
 * existing state is returned. Conflicts: if a global-unique key (agency slug,
 * user email) is already claimed by a record OUTSIDE the `hardening-`
 * namespace — e.g. an existing e2e/prod seed — the run is rejected loudly
 * instead of overwriting or silently diverging. Settled/paid records are
 * never updated or deleted.
 */
export async function seedHardeningFixtures(
  prisma: PrismaClient,
  opts: { refDate?: Date } = {},
): Promise<SeedHardeningResult> {
  assertHardeningFixtureSafety();
  const ref = opts.refDate ?? new Date(HARDENING_REF_DATE_ISO);
  validateFixtureData(ref);

  const ids = HARDENING_IDS;
  const cred = HARDENING_CREDENTIALS;
  const userIds = [
    ids.userOwnerA,
    ids.userAdminA,
    ids.userViewerA,
    ids.userOwnerB,
  ];

  const existingA = await prisma.agency.findUnique({
    where: { id: ids.agencyA },
  });
  const existingB = await prisma.agency.findUnique({
    where: { id: ids.agencyB },
  });
  if (existingA || existingB) {
    if (!existingA || !existingB) {
      throw new Error(
        "[hardening-fixtures] Namespace parsial terdeteksi (satu agency ada, satu tidak) — " +
          "state tidak konsisten; perbaiki database test secara manual.",
      );
    }
    return {
      created: false,
      counts: await countFixtureRows(prisma),
      ids: idsSummary(),
    };
  }

  const [ownerHashA, staffHash, ownerHashB] = await Promise.all([
    hashPassword(cred.ownerPasswordA),
    hashPassword(cred.fixturePassword),
    hashPassword(cred.fixturePassword),
  ]);

  await prisma.$transaction(async (tx) => {
    // Conflict rejection: unique keys claimed by records outside our namespace.
    const slugClash = await tx.agency.findFirst({
      where: {
        slug: { in: [ids.agencyA, ids.agencyB] },
        id: { notIn: [ids.agencyA, ids.agencyB] },
      },
      select: { id: true, slug: true },
    });
    if (slugClash) {
      throw new Error(
        `[hardening-fixtures] Slug "${slugClash.slug}" sudah dipakai agency lain (${slugClash.id}) — konflik, tidak ada perubahan.`,
      );
    }
    const emailClash = await tx.user.findFirst({
      where: {
        email: { in: Object.values(cred).filter((v) => v.includes("@")) },
        id: { notIn: userIds },
      },
      select: { id: true, email: true },
    });
    if (emailClash) {
      throw new Error(
        `[hardening-fixtures] Email "${emailClash.email}" sudah dipakai user di luar namespace fixture (${emailClash.id}) — konflik, tidak ada perubahan.`,
      );
    }

    await tx.agency.createMany({
      data: [
        {
          id: ids.agencyA,
          name: "Hardening Agency A (Fixture)",
          slug: ids.agencyA,
        },
        {
          id: ids.agencyB,
          name: "Hardening Agency B (Fixture)",
          slug: ids.agencyB,
        },
      ],
    });

    await tx.user.createMany({
      data: [
        {
          id: ids.userOwnerA,
          agencyId: ids.agencyA,
          email: cred.ownerEmailA,
          name: "Hardening Owner A",
          role: "owner",
          title: "Agency Owner",
          passwordHash: ownerHashA,
        },
        {
          id: ids.userAdminA,
          agencyId: ids.agencyA,
          email: cred.adminEmailA,
          name: "Hardening Admin A",
          role: "admin",
          passwordHash: staffHash,
        },
        {
          id: ids.userViewerA,
          agencyId: ids.agencyA,
          email: cred.viewerEmailA,
          name: "Hardening Viewer A",
          role: "viewer",
          passwordHash: staffHash,
        },
        {
          id: ids.userOwnerB,
          agencyId: ids.agencyB,
          email: cred.ownerEmailB,
          name: "Hardening Owner B",
          role: "owner",
          passwordHash: ownerHashB,
        },
      ],
    });

    await tx.brand.createMany({
      data: [
        {
          id: ids.brandA1,
          agencyId: ids.agencyA,
          name: "Nusantara Beauty",
          industry: "Beauty",
          status: "Active",
        },
        {
          id: ids.brandA2,
          agencyId: ids.agencyA,
          name: "TeknoGadget",
          industry: "Electronics",
          status: "Active",
        },
        {
          id: ids.brandB1,
          agencyId: ids.agencyB,
          name: "Isolated Brand B",
          industry: "Fashion",
          status: "Active",
        },
      ],
    });
    await tx.brandContact.createMany({
      data: [
        {
          id: ids.brandContactA1,
          brandId: ids.brandA1,
          name: "Kontak Brand A1",
          email: "contact-a1@brand.test",
          isPrimary: true,
        },
        {
          id: ids.brandContactA2,
          brandId: ids.brandA2,
          name: "Kontak Brand A2",
          email: "contact-a2@brand.test",
          isPrimary: true,
        },
        {
          id: ids.brandContactB1,
          brandId: ids.brandB1,
          name: "Kontak Brand B1",
          email: "contact-b1@brand.test",
          isPrimary: true,
        },
      ],
    });

    await tx.creator.createMany({
      data: [
        {
          id: ids.creatorA1,
          agencyId: ids.agencyA,
          username: "hardening-creator-a1",
          displayName: "Ratih Beauty (Fixture)",
          category: "Beauty",
          followers: 152_500,
          engagementRate: 4.8,
          health: "Healthy",
          status: "Active",
          managerId: ids.userAdminA,
        },
        {
          id: ids.creatorA2,
          agencyId: ids.agencyA,
          username: "hardening-creator-a2",
          displayName: "Bang Todo (Fixture)",
          category: "Tech",
          followers: 98_000,
          engagementRate: 3.9,
          health: "Watch",
          status: "Active",
        },
        {
          id: ids.creatorB1,
          agencyId: ids.agencyB,
          username: "hardening-creator-b1",
          displayName: "Isolated Creator B",
          category: "Fashion",
          followers: 12_000,
          status: "Active",
        },
      ],
    });
    await tx.creatorPlatformAccount.createMany({
      data: [
        {
          id: ids.platformAccountA1,
          creatorId: ids.creatorA1,
          platform: "TikTok",
          handle: "@hardening-a1",
          externalId: "hardening-ext-a1",
        },
        {
          id: ids.platformAccountA2,
          creatorId: ids.creatorA2,
          platform: "TikTok",
          handle: "@hardening-a2",
          externalId: "hardening-ext-a2",
        },
        {
          id: ids.platformAccountB1,
          creatorId: ids.creatorB1,
          platform: "TikTok",
          handle: "@hardening-b1",
        },
      ],
    });
    // Manual creator metrics — intentionally DIFFERENT amounts from content
    // GMV and commission GMV (see HARDENING_EXPECTED).
    await tx.creatorMetric.createMany({
      data: [
        {
          id: ids.creatorMetricA1,
          creatorId: ids.creatorA1,
          date: daysFrom(ref, -1),
          followers: 152_500,
          engagementRate: 4.8,
          gmv: HARDENING_EXPECTED.creatorMetrics[ids.creatorA1].gmv,
          videos: 14,
          avgViews: 32_500,
          liveGmv: HARDENING_EXPECTED.creatorMetrics[ids.creatorA1].liveGmv,
        },
        {
          id: ids.creatorMetricA2,
          creatorId: ids.creatorA2,
          date: daysFrom(ref, -1),
          followers: 98_000,
          engagementRate: 3.9,
          gmv: HARDENING_EXPECTED.creatorMetrics[ids.creatorA2].gmv,
          videos: 9,
          avgViews: 21_000,
          liveGmv: HARDENING_EXPECTED.creatorMetrics[ids.creatorA2].liveGmv,
        },
      ],
    });

    await tx.product.createMany({
      data: [
        {
          id: ids.productA1,
          agencyId: ids.agencyA,
          brandId: ids.brandA1,
          name: "Serum Glowing A1",
          sku: "HARD-SKU-001",
          price: 189_000,
          status: "Active",
        },
        {
          id: ids.productA2,
          agencyId: ids.agencyA,
          brandId: ids.brandA2,
          name: "Powerbank 20K A2",
          sku: "HARD-SKU-002",
          price: 349_000,
          status: "Active",
        },
        {
          id: ids.productB1,
          agencyId: ids.agencyB,
          brandId: ids.brandB1,
          name: "Tote Bag B1",
          sku: "HARD-SKU-B1",
          price: 79_000,
          status: "Active",
        },
      ],
    });

    await tx.campaign.createMany({
      data: [
        {
          id: ids.campaignA1,
          agencyId: ids.agencyA,
          brandId: ids.brandA1,
          name: "Hardening Baseline A1",
          ownerId: ids.userOwnerA,
          startDate: daysFrom(ref, -30),
          endDate: daysFrom(ref, 30),
          budget: 25_000_000,
          creatorTarget: 2,
          contentTarget: 2,
          gmvTarget: 50_000_000,
          commissionRate: 10,
          status: "Active",
        },
        {
          id: ids.campaignA2,
          agencyId: ids.agencyA,
          brandId: ids.brandA2,
          name: "Hardening Baseline A2",
          ownerId: ids.userOwnerA,
          startDate: daysFrom(ref, -14),
          endDate: daysFrom(ref, 45),
          budget: 40_000_000,
          creatorTarget: 1,
          contentTarget: 1,
          gmvTarget: 80_000_000,
          commissionRate: 15,
          status: "Active",
        },
        {
          id: ids.campaignB1,
          agencyId: ids.agencyB,
          brandId: ids.brandB1,
          name: "Hardening Baseline B1",
          ownerId: ids.userOwnerB,
          startDate: daysFrom(ref, -7),
          budget: 5_000_000,
          commissionRate: 5,
          status: "Recruiting",
        },
      ],
    });
    await tx.campaignCreator.createMany({
      data: [
        {
          id: ids.linkA1CreatorA1,
          campaignId: ids.campaignA1,
          creatorId: ids.creatorA1,
          gmvContribution: 0,
          status: "Active",
        },
        {
          id: ids.linkA1CreatorA2,
          campaignId: ids.campaignA1,
          creatorId: ids.creatorA2,
          gmvContribution: 0,
          status: "Active",
        },
        {
          id: ids.linkA2CreatorA2,
          campaignId: ids.campaignA2,
          creatorId: ids.creatorA2,
          gmvContribution: 0,
          status: "Active",
        },
        {
          id: ids.linkB1CreatorB1,
          campaignId: ids.campaignB1,
          creatorId: ids.creatorB1,
          status: "Active",
        },
      ],
    });
    await tx.campaignProduct.createMany({
      data: [
        {
          id: ids.linkA1ProductA1,
          campaignId: ids.campaignA1,
          productId: ids.productA1,
        },
        {
          id: ids.linkA2ProductA2,
          campaignId: ids.campaignA2,
          productId: ids.productA2,
        },
        {
          id: ids.linkB1ProductB1,
          campaignId: ids.campaignB1,
          productId: ids.productB1,
        },
      ],
    });

    await tx.contentItem.createMany({
      data: [
        {
          id: ids.contentA1,
          agencyId: ids.agencyA,
          campaignId: ids.campaignA1,
          creatorId: ids.creatorA1,
          productId: ids.productA1,
          title: "Hardening Content A1 (Published)",
          brief: "Review serum A1",
          dueDate: daysFrom(ref, -10),
          publishDate: daysFrom(ref, -7),
          contentUrl: "https://example.test/hardening-a1",
          status: "Published",
          reviewerId: ids.userAdminA,
          gmvGenerated: HARDENING_EXPECTED.contentGmv[ids.contentA1],
          viewsGenerated: 12_500,
        },
        {
          id: ids.contentA2,
          agencyId: ids.agencyA,
          campaignId: ids.campaignA2,
          creatorId: ids.creatorA2,
          productId: ids.productA2,
          title: "Hardening Content A2 (Published)",
          brief: "Review powerbank A2",
          dueDate: daysFrom(ref, -5),
          publishDate: daysFrom(ref, -3),
          status: "Published",
          reviewerId: ids.userAdminA,
          gmvGenerated: HARDENING_EXPECTED.contentGmv[ids.contentA2],
          viewsGenerated: 8_750,
        },
      ],
    });

    await tx.liveSession.createMany({
      data: [
        {
          id: ids.liveA1,
          agencyId: ids.agencyA,
          campaignId: ids.campaignA1,
          creatorId: ids.creatorA1,
          brandId: ids.brandA1,
          productId: ids.productA1,
          room: "Hardening Room A1",
          operatorId: ids.userAdminA,
          startTime: daysFrom(ref, -1),
          endTime: new Date(daysFrom(ref, -1).getTime() + 4 * 60 * 60 * 1000),
          targetGmv: HARDENING_EXPECTED.liveSessions[ids.liveA1].targetGmv,
          actualGmv: HARDENING_EXPECTED.liveSessions[ids.liveA1].actualGmv,
          viewers: HARDENING_EXPECTED.liveSessions[ids.liveA1].viewers,
          orders: HARDENING_EXPECTED.liveSessions[ids.liveA1].orders,
          status: "Ended",
        },
        {
          id: ids.liveA2,
          agencyId: ids.agencyA,
          campaignId: ids.campaignA2,
          creatorId: ids.creatorA2,
          brandId: ids.brandA2,
          productId: ids.productA2,
          room: "Hardening Room A2",
          operatorId: ids.userAdminA,
          startTime: daysFrom(ref, 3),
          targetGmv: HARDENING_EXPECTED.liveSessions[ids.liveA2].targetGmv,
          status: "Scheduled",
        },
        {
          id: ids.liveB1,
          agencyId: ids.agencyB,
          campaignId: ids.campaignB1,
          creatorId: ids.creatorB1,
          brandId: ids.brandB1,
          productId: ids.productB1,
          room: "Hardening Room B1",
          operatorId: ids.userOwnerB,
          startTime: daysFrom(ref, 5),
          targetGmv: HARDENING_EXPECTED.liveSessions[ids.liveB1].targetGmv,
          status: "Scheduled",
        },
      ],
    });

    await tx.commission.createMany({
      data: [
        {
          id: ids.commissionA1,
          agencyId: ids.agencyA,
          campaignId: ids.campaignA1,
          creatorId: ids.creatorA1,
          sourceType: "Content",
          sourceId: ids.contentA1,
          gmv: COMMISSION_A1.gmv,
          creatorRate: COMMISSION_A1.creatorRate,
          creatorCommission: COMMISSION_A1.creatorCommission,
          agencyShareRate: COMMISSION_A1.agencyShareRate,
          agencyRevenue: COMMISSION_A1.agencyRevenue,
          status: "Pending",
        },
        {
          id: ids.commissionA2,
          agencyId: ids.agencyA,
          campaignId: ids.campaignA2,
          creatorId: ids.creatorA2,
          sourceType: "Campaign",
          sourceId: ids.campaignA2,
          gmv: COMMISSION_A2.gmv,
          creatorRate: COMMISSION_A2.creatorRate,
          creatorCommission: COMMISSION_A2.creatorCommission,
          agencyShareRate: COMMISSION_A2.agencyShareRate,
          agencyRevenue: COMMISSION_A2.agencyRevenue,
          status: "Settled",
        },
      ],
    });

    await tx.creatorPayout.createMany({
      data: [
        {
          id: ids.payoutA1,
          agencyId: ids.agencyA,
          creatorId: ids.creatorA1,
          campaignId: ids.campaignA1,
          amount: HARDENING_EXPECTED.payouts[ids.payoutA1].amount,
          status: "Paid",
          paidAt: daysFrom(ref, -1),
        },
        {
          id: ids.payoutA2,
          agencyId: ids.agencyA,
          creatorId: ids.creatorA2,
          campaignId: ids.campaignA2,
          amount: HARDENING_EXPECTED.payouts[ids.payoutA2].amount,
          status: "Pending",
        },
      ],
    });

    await tx.settlement.createMany({
      data: [
        {
          id: ids.settlementA1,
          agencyId: ids.agencyA,
          brandId: ids.brandA1,
          campaignId: ids.campaignA1,
          amount: HARDENING_EXPECTED.settlements[ids.settlementA1].amount,
          status: "Paid",
          paidAt: daysFrom(ref, -2),
        },
        {
          id: ids.settlementA2,
          agencyId: ids.agencyA,
          brandId: ids.brandA2,
          campaignId: ids.campaignA2,
          amount: HARDENING_EXPECTED.settlements[ids.settlementA2].amount,
          status: "Pending",
          dueDate: daysFrom(ref, 7),
        },
      ],
    });
  });

  return {
    created: true,
    counts: await countFixtureRows(prisma),
    ids: idsSummary(),
  };
}

function idsSummary(): SeedHardeningResult["ids"] {
  return {
    agencyA: HARDENING_IDS.agencyA,
    agencyB: HARDENING_IDS.agencyB,
    userOwnerA: HARDENING_IDS.userOwnerA,
    userAdminA: HARDENING_IDS.userAdminA,
    userViewerA: HARDENING_IDS.userViewerA,
    userOwnerB: HARDENING_IDS.userOwnerB,
  };
}
