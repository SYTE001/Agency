// Prisma config: one codebase, two providers.
//
//  - Production / staging (Supabase PostgreSQL): `prisma/schema.prisma`
//  - Local dev & tests (SQLite file):            `prisma/schema.sqlite.prisma`
//
// The schema (and therefore the generated client directory) is selected from
// DB_PROVIDER / DATABASE_URL.
// Prisma CLI / migrations uses DIRECT_URL (direct PostgreSQL connection) when
// PostgreSQL is selected, falling back to DATABASE_URL if DIRECT_URL is omitted.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export function isSqliteProvider(): boolean {
  if (process.env.DB_PROVIDER === "sqlite") return true;
  if (process.env.DB_PROVIDER === "postgresql") return false;
  const url = process.env.DATABASE_URL ?? "";
  return url.startsWith("file:");
}

const sqlite = isSqliteProvider();

function getCliDatasourceUrl(): string {
  if (sqlite) {
    return process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  }
  const directUrl = process.env.DIRECT_URL;
  const databaseUrl = process.env.DATABASE_URL;
  const url = directUrl || databaseUrl;
  if (!url) {
    throw new Error(
      "DIRECT_URL atau DATABASE_URL wajib diisi untuk operasi Prisma CLI / migrations di PostgreSQL.",
    );
  }
  return url;
}

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
    url: getCliDatasourceUrl(),
  },
});
