// Shared provider selection for the runtime client (lib/prisma.ts) and the
// test harness (lib/test-env.ts). Mirrors the logic in prisma.config.ts so
// the CLI and the app always resolve to the same provider:
//
//  - DB_PROVIDER=sqlite      → SQLite twin (prisma/schema.sqlite.prisma)
//  - DB_PROVIDER=postgresql  → PostgreSQL (prisma/schema.prisma)
//  - otherwise: DATABASE_URL decides (file:… → sqlite, anything else → pg)
//
// Default without any env: SQLite — local development keeps working with zero
// configuration, while production (Vercel + Supabase) always sets a
// postgres:// DATABASE_URL.
export function isSqliteProvider(): boolean {
  if (process.env.DB_PROVIDER === "sqlite") return true;
  if (process.env.DB_PROVIDER === "postgresql") return false;
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("file:") || url === "";
}
