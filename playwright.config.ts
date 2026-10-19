import { defineConfig, devices } from "@playwright/test";

const rawDatabaseUrl = process.env.DATABASE_URL ?? "";
if (
  /^(postgres|postgresql):\/\//.test(rawDatabaseUrl) &&
  !/\/agency-os-test-db(\?|$)/.test(rawDatabaseUrl)
) {
  throw new Error(
    "DATABASE_URL menunjuk ke database PostgreSQL bersama/production. " +
      "Gunakan database test khusus (/agency-os-test-db) atau hapus DATABASE_URL dari environment saat menjalankan E2E.",
  );
}

const e2eDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? "file:./prisma/e2e-test.db";

if (
  !e2eDatabaseUrl.startsWith("file:") &&
  !/\/agency-os-test-db(\?|$)/.test(e2eDatabaseUrl)
) {
  throw new Error(
    "TEST_DATABASE_URL menunjuk ke database PostgreSQL bersama/production. " +
      "Gunakan database test khusus (/agency-os-test-db) atau kosongkan TEST_DATABASE_URL agar SQLite khusus E2E dipakai.",
  );
}

const e2eDbProvider = e2eDatabaseUrl.startsWith("file:")
  ? "sqlite"
  : "postgresql";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      e2eDbProvider === "sqlite"
        ? "npx prisma migrate deploy --schema prisma/schema.sqlite.prisma && npx tsx prisma/seed.ts && npm run dev"
        : "npx tsx prisma/seed.ts && npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DB_PROVIDER: e2eDbProvider,
      DATABASE_URL: e2eDatabaseUrl,
      DIRECT_URL: e2eDatabaseUrl,
      OWNER_EMAIL: process.env.OWNER_EMAIL ?? "owner@agency.test",
      OWNER_PASSWORD: process.env.OWNER_PASSWORD ?? "localdev-owner-pass-1",
      AUTH_SECRET:
        process.env.AUTH_SECRET ?? "taos-e2e-test-secret-local-only-32chars",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
});
