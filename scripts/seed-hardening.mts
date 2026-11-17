#!/usr/bin/env node
// CLI seeder for PR-00 hardening fixtures.
//
// SAFETY ORDER: the disposable-database guard runs BEFORE any Prisma module
// is imported (dynamic import below). `tests/fixtures/hardening.ts` keeps
// its runtime import graph free of lib/prisma so this ordering is real, not
// cosmetic.
//
// Usage (disposable database only — every guard below must pass):
//   NODE_ENV=test HARDENING_FIXTURES=1 \
//   DATABASE_URL="file:./prisma/hardening-e2e.db" \
//   TEST_DATABASE_URL="file:./prisma/hardening-e2e.db" \
//   npx tsx scripts/seed-hardening.mts
//
// Allowed targets:
//   file:hardening-*.db            — dedicated fixture database
//   file:agency-os-test-*.db       — lib/test-env throwaway temp database
//   postgres://…/agency-os-test-db — dedicated PostgreSQL test database
// Production seed (prisma/seed.ts) is untouched by this script.
import { assertHardeningFixtureSafety, HARDENING_EXPECTED } from "../tests/fixtures/hardening";

function fail(msg: string): never {
  console.error(`✖ [seed-hardening] ${msg}`);
  process.exit(1);
}

try {
  assertHardeningFixtureSafety();
} catch (e) {
  fail(
    `${(e as Error).message}\n` +
      "  Contoh penggunaan aman:\n" +
      "    NODE_ENV=test HARDENING_FIXTURES=1 \\\n" +
      '    DATABASE_URL="file:./prisma/hardening-e2e.db" \\\n' +
      '    TEST_DATABASE_URL="file:./prisma/hardening-e2e.db" \\\n' +
      "    npx tsx scripts/seed-hardening.mts",
  );
}

// Guard passed — only now touch Prisma (dynamic import keeps the guard first).
const { default: prisma } = await import("../lib/prisma");
const { seedHardeningFixtures } = await import("../tests/fixtures/hardening");

let failure: string | null = null;
try {
  const summary = await seedHardeningFixtures(prisma);
  const expected = HARDENING_EXPECTED.counts;
  if (summary.created) {
    console.log("✔ [seed-hardening] Fixture dibuat (transaksional):");
  } else {
    console.log("✔ [seed-hardening] Fixture sudah ada — rerun idempoten, tidak ada perubahan:");
  }
  const drift = (Object.entries(expected) as Array<[keyof typeof expected, number]>).filter(
    ([model, n]) => summary.counts[model] !== n,
  );
  if (drift.length > 0) {
    console.warn(
      `⚠ Jumlah baris menyimpang dari kontrak fixture: ${drift
        .map(([model, n]) => `${model}=${summary.counts[model]} (harapan ${n})`)
        .join(", ")}`,
    );
  }
  console.log(
    `  Agency A=${summary.ids.agencyA} B=${summary.ids.agencyB}; owner A=${summary.ids.userOwnerA} (owner@agency.test).`,
  );
} catch (e) {
  failure = `Seed gagal (transaksi di-rollback, database tidak berubah): ${(e as Error).message}`;
} finally {
  await prisma.$disconnect();
}
if (failure) fail(failure);
