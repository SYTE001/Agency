// Test environment bootstrap for DB-backed integration tests.
// MUST be imported before any module that touches lib/prisma (ES imports are
// evaluated in order) so DATABASE_URL points at a disposable database.
//
// If the runner provides DATABASE_URL (e.g. a PostgreSQL URL to verify the
// migration path), it is used as-is; otherwise a throwaway SQLite file in the
// OS temp dir is created and deleted after the run. DB_PROVIDER is pinned to
// match so the runtime client (lib/dbProvider.ts) and any Prisma CLI calls
// agree with the URL.

import os from "node:os";
import path from "node:path";

export const PROVIDED_DATABASE_URL = process.env.DATABASE_URL;

const dbFile = path
  .join(os.tmpdir(), `agency-os-test-${process.pid}-${Date.now()}.db`)
  .replace(/\\/g, "/");

export const TEST_DATABASE_URL = PROVIDED_DATABASE_URL ?? `file:${dbFile}`;

/** Absolute path of the throwaway file, or null when an external URL is used. */
export const TEST_DB_FILE = PROVIDED_DATABASE_URL ? null : dbFile;

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.DB_PROVIDER = TEST_DATABASE_URL.startsWith("file:") ? "sqlite" : "postgresql";
