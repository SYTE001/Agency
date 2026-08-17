// Prisma config: one codebase, two providers.
//
//  - Production / staging (Supabase PostgreSQL): `prisma/schema.prisma`
//  - Local dev & tests (SQLite file):            `prisma/schema.sqlite.prisma`
//
// The schema (and therefore the generated client directory) is selected from
// DATABASE_URL unless DB_PROVIDER=sqlite forces the SQLite twin. The runtime
// client in `lib/prisma.ts` and `lib/prismaClient.ts` makes the same choice,
// so the CLI and the app always agree on the provider.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export function isSqliteProvider(): boolean {
  if (process.env.DB_PROVIDER === "sqlite") return true;
  if (process.env.DB_PROVIDER === "postgresql") return false;
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("file:");
}

const sqlite = isSqliteProvider();

// One migration history per provider (Prisma stores a provider lock in
// migration_lock.toml): prisma/migrations (SQLite dev history) and
// prisma/migrations-pg (PostgreSQL production history, starts with the
// 20260817100000_pg_baseline baseline generated from this schema).
export default defineConfig({
  schema: sqlite ? "prisma/schema.sqlite.prisma" : "prisma/schema.prisma",
  migrations: {
    path: sqlite ? "prisma/migrations" : "prisma/migrations-pg",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
