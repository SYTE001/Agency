#!/usr/bin/env node
// Test isolation guard — preloaded by `npm test` (node --import) before any
// project module runs, including lib/test-env.ts.
//
// Rule: the ambient DATABASE_URL is NEVER the test database. If the
// environment carries a PostgreSQL DATABASE_URL it must point at the
// dedicated test database (/agency-os-test-db); anything else — including a
// shared/production Supabase URL coming from .env.local or the shell —
// aborts the run immediately, before a single query executes.
//
// Default (no TEST_DATABASE_URL): lib/test-env.ts creates a throwaway SQLite
// file in the OS temp dir and deletes it after the run. No production data is
// ever touched.

const rawUrl = process.env.DATABASE_URL ?? "";
const isPg = /^(postgres|postgresql):\/\//.test(rawUrl);

if (isPg && !/\/agency-os-test-db(\?|$)/.test(rawUrl)) {
  const masked = rawUrl.replace(/\/\/([^:@/]+):([^@/]*)@/, "//$1:***@");
  console.error(
    [
      "",
      "✖ [test-guard] DATABASE_URL menunjuk ke database PostgreSQL bersama/production:",
      `    ${masked}`,
      "",
      "  Menjalankan test terhadap database ini DILARANG — data test akan",
      "  mencemari database dan gagal pada run berikutnya (unique constraint).",
      "",
      "  Perbaikan:",
      "  1. Hapus/unset variabel DATABASE_URL dari shell session, ATAU",
      "  2. Jalankan test terhadap database PostgreSQL khusus:",
      '       set "TEST_DATABASE_URL=postgres://…/agency-os-test-db" && npm test',
      "     (buat + migrate database itu lebih dulu:)",
      '       set "DATABASE_URL=postgres://…" && npx prisma db execute --stdin',
      '         <<< "CREATE DATABASE \\"agency-os-test-db\\";"',
      '       set "DATABASE_URL=postgres://…/agency-os-test-db" && npx prisma migrate deploy --schema prisma/schema.prisma',
      "",
      "  Default tanpa TEST_DATABASE_URL: SQLite sekali-pakai di temp dir.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
