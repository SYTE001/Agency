#!/usr/bin/env node
// One-time production bootstrap: memastikan agency "Kreatif Nusantara" dan
// satu akun Owner produksi (owner@kreatifnusantara.id) ada di database.
//
// Perilaku:
//   - Menolak DATABASE_URL yang bukan postgresql:// (tidak pernah menyentuh
//     SQLite lokal tanpa disadari).
//   - Memastikan agency ada (create jika belum, tidak pernah menimpa).
//   - Membuat user Owner HANYA jika email belum ada — idempoten, tidak akan
//     pernah menimpa password akun yang sudah ada.
//   - Password dibaca dari env OWNER_PASSWORD (atau OWNER_PASSWORD_FILE),
//     di-hash memakai implementasi scrypt milik aplikasi (lib/password.ts),
//     dan TIDAK PERNAH dicetak ke output.
//
// Pakai:
//   OWNER_PASSWORD='…' npx tsx scripts/bootstrap-owner.mjs
// Lihat .env.example / README bagian "Bootstrap akun Owner produksi".
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { hashPassword } from "../lib/password";

const AGENCY_SLUG = "kreatif-nusantara";
const AGENCY_NAME = "Kreatif Nusantara";
const OWNER_EMAIL = "owner@kreatifnusantara.id";
const OWNER_NAME = "Agency Owner";
const OWNER_ROLE = "owner";

function fail(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

// ── 1. DATABASE_URL wajib ada dan harus PostgreSQL ────────────────────
const url = process.env.DATABASE_URL;
if (!url) {
  fail("DATABASE_URL wajib diisi (connection string PostgreSQL produksi).");
}
if (!/^(postgres|postgresql):\/\//.test(url)) {
  fail("DATABASE_URL harus berupa postgres(ql):// — bootstrap produksi menolak target lain.");
}
if (/\/agency-os-test-db(\?|$)/.test(url)) {
  fail("DATABASE_URL menunjuk ke database test — bootstrap produksi dibatalkan.");
}

// ── 2. Password dari env saja; tidak pernah dicetak ───────────────────
const password =
  process.env.OWNER_PASSWORD ??
  (process.env.OWNER_PASSWORD_FILE
    ? readFileSync(process.env.OWNER_PASSWORD_FILE, "utf8").trim()
    : undefined);
if (!password) {
  fail(
    "OWNER_PASSWORD (atau OWNER_PASSWORD_FILE) wajib diisi.\n" +
      "  Contoh: OWNER_PASSWORD='…' npx tsx scripts/bootstrap-owner.mts",
  );
}
if (password.length < 12) {
  fail("OWNER_PASSWORD terlalu pendek — gunakan minimal 12 karakter.");
}

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 15000 });
try {
  await client.connect();
} catch (e) {
  fail(`Tidak dapat terhubung ke database: ${(e as Error).message}`);
}

try {
  // ── 3. Verifikasi target (read-only) ────────────────────────────────
  const ident = (
    await client.query("SELECT current_database() AS db, current_user AS usr")
  ).rows[0];
  console.log(`✔ Terhubung: db=${ident.db} user=${ident.usr}`);

  // ── 4. Pastikan agency ada (tidak pernah menimpa) ───────────────────
  // Kolom @updatedAt tidak punya default di PostgreSQL (Prisma mengisinya di
  // client), jadi INSERT mentah harus memberi nilai eksplisit.
  let agency = (
    await client.query(`SELECT id, name, slug FROM "Agency" WHERE slug = $1`, [AGENCY_SLUG])
  ).rows[0];
  if (!agency) {
    agency = (
      await client.query(
        `INSERT INTO "Agency" (id, name, slug, "updatedAt")
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id, name, slug`,
        [randomUUID(), AGENCY_NAME, AGENCY_SLUG],
      )
    ).rows[0];
    console.log(`✔ Agency dibuat: ${agency.name} (slug=${agency.slug})`);
  } else {
    console.log(`✔ Agency sudah ada: ${agency.name} (slug=${agency.slug})`);
  }

  // ── 5. Buat Owner hanya jika email belum ada ────────────────────────
  const existing = (
    await client.query(`SELECT id, role FROM "User" WHERE email = $1`, [OWNER_EMAIL])
  ).rows[0];
  if (existing) {
    console.log(`✔ Owner sudah ada: ${OWNER_EMAIL} (role=${existing.role}) — tidak ada perubahan.`);
  } else {
    const passwordHash = await hashPassword(password);
    await client.query(
      `INSERT INTO "User" (id, "agencyId", email, name, role, "passwordHash", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [randomUUID(), agency.id, OWNER_EMAIL, OWNER_NAME, OWNER_ROLE, passwordHash],
    );
    console.log(`✔ Owner dibuat: ${OWNER_EMAIL} (role=${OWNER_ROLE})`);
  }
} catch (e) {
  fail(`Bootstrap gagal (tidak ada perubahan partial yang perlu di-rollback, tiap langkah berdiri sendiri): ${(e as Error).message}`);
} finally {
  await client.end();
}
console.log("✔ Bootstrap selesai. Password tidak pernah ditampilkan.");
