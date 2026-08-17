// Test environment bootstrap for DB-backed integration tests.
// MUST be imported before any module that touches lib/prisma (ES imports are
// evaluated in order) so DATABASE_URL points at a disposable database.
//
// ISOLATION RULE — ambient DATABASE_URL is ALWAYS IGNORED. The test database
// is exactly one of:
//   1. an explicit TEST_DATABASE_URL env var — a DEDICATED, isolated test
//      database (for PostgreSQL it must be the /agency-os-test-db database),
//      already migrated; or
//   2. the default: a throwaway SQLite file in the OS temp dir, created fresh
//      per run and deleted afterwards.
//
// This guarantees `npm test` can never write into a shared/production
// database (e.g. Supabase) regardless of what .env.local or the shell
// contains. scripts/test-guard.mjs (preloaded by the npm test script)
// enforces the same rule at process start and aborts loudly if a non-test
// PostgreSQL URL is present.

import os from "node:os";
import path from "node:path";

const EXTERNAL_DATABASE_URL = process.env.TEST_DATABASE_URL;

const dbFile = path
  .join(os.tmpdir(), `agency-os-test-${process.pid}-${Date.now()}.db`)
  .replace(/\\/g, "/");

export const TEST_DATABASE_URL = EXTERNAL_DATABASE_URL ?? `file:${dbFile}`;

/** Absolute path of the throwaway file, or null when an external URL is used. */
export const TEST_DB_FILE = EXTERNAL_DATABASE_URL ? null : dbFile;

/** True when the suite runs against a caller-provided dedicated database
 *  (TEST_DATABASE_URL) instead of the throwaway SQLite file. Callers use this
 *  to skip `migrate deploy` (the dedicated DB must already be migrated). */
export const PROVIDED_DATABASE_URL = EXTERNAL_DATABASE_URL;

// Safety net (mirrors scripts/test-guard.mjs): even an explicitly provided
// URL may never point at a shared PostgreSQL database — only the dedicated
// agency-os-test-db is allowed.
if (
  !TEST_DATABASE_URL.startsWith("file:") &&
  !/\/agency-os-test-db(\?|$)/.test(TEST_DATABASE_URL)
) {
  throw new Error(
    "TEST_DATABASE_URL menunjuk ke database PostgreSQL bersama/production. " +
      "Gunakan database test khusus dengan path /agency-os-test-db, " +
      "atau kosongkan TEST_DATABASE_URL agar SQLite sekali-pakai dipakai.",
  );
}

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.DB_PROVIDER = TEST_DATABASE_URL.startsWith("file:") ? "sqlite" : "postgresql";
