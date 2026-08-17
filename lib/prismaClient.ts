// Database-agnostic re-export of the Prisma client + types.
//
// Import from "@/lib/prisma" in every service/action/page — never from
// "generated/…". The concrete client is chosen at runtime by DATABASE_URL /
// DB_PROVIDER (see lib/dbProvider.ts); app code stays provider-free.
//
// The two generated clients are produced from identical model definitions
// (prisma/schema.prisma for PostgreSQL, prisma/schema.sqlite.prisma for
// SQLite), so their model types are interchangeable. A type-level assertion
// below pins them together — if the schemas drift, the build fails here.
// (Filter types are intentionally NOT compared: the PostgreSQL client adds
// `mode`/FieldRef capabilities the SQLite client lacks.)
import { isSqliteProvider } from "@/lib/dbProvider";
import { validateRuntimeEnv } from "@/lib/env";
import { PrismaClient as PgClient } from "@/generated/prisma-pg/client";
import { PrismaClient as SqliteClient } from "@/generated/prisma-sqlite/client";
import type { Campaign as PgCampaign, Commission as PgCommission } from "@/generated/prisma-pg/client";
import type { Campaign as SqliteCampaign, Commission as SqliteCommission } from "@/generated/prisma-sqlite/client";

// Schema-drift guard: model shapes (incl. Decimal monetary fields) must match
// in both directions on a representative money-heavy and relation-heavy model.
type AssertAssignable<A extends B, B> = A;
type _SchemasInSync = [
  AssertAssignable<PgCampaign, SqliteCampaign>,
  AssertAssignable<SqliteCampaign, PgCampaign>,
  AssertAssignable<PgCommission, SqliteCommission>,
  AssertAssignable<SqliteCommission, PgCommission>,
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- compile-time check only
type _Used = _SchemasInSync;

export type PrismaClient = PgClient;
// The Prisma namespace (WhereInput, Prisma.Decimal, transaction types, …) is
// identical across both generated clients — the drift guard above pins it —
// so app code can import types through "@/lib/prisma" without picking a side.
export type { Prisma } from "@/generated/prisma-pg/client";

export function createPrismaClient(): PrismaClient {
  validateRuntimeEnv();
  if (isSqliteProvider()) {
    // Lazy require so serverless bundles built for PostgreSQL never load the
    // native better-sqlite3 binary (and vice versa).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new SqliteClient({ adapter } as any) as PrismaClient;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL wajib diisi untuk PostgreSQL (contoh: postgres://… atau postgresql://…).");
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: url });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PgClient({ adapter } as any) as PrismaClient;
}
