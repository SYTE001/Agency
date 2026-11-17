import { defineConfig, devices } from "@playwright/test";

const databaseUrl =
  process.env.TEST_DATABASE_URL ?? "file:./prisma/hardening-baseline.db";
if (!/^file:.*[/\\]hardening-[^/\\]+\.db$/.test(databaseUrl)) {
  throw new Error(
    "Baseline captures require a dedicated SQLite hardening-*.db file.",
  );
}
if (process.env.NODE_ENV === "production") {
  throw new Error("Baseline fixtures cannot run in production.");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "hardening-baseline.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  outputDir: "test-results/hardening-baseline",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/hardening", open: "never" }],
  ],
  use: {
    baseURL: "http://localhost:3100",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "npx prisma migrate deploy --schema prisma/schema.sqlite.prisma && npx tsx scripts/seed-hardening.mts && npm run dev -- --port 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DB_PROVIDER: "sqlite",
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
      TEST_DATABASE_URL: databaseUrl,
      HARDENING_FIXTURES: "1",
      AUTH_SECRET: "hardening-baseline-local-only-secret-32chars",
      MOCK_SYNC_ENABLED: "false",
    },
  },
  projects: [
    {
      name: "baseline-chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
