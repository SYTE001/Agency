# Production Readiness Audit — SQLite → PostgreSQL/Supabase

Status: **AUDIT SELESAI — migration PostgreSQL SUDAH diimplementasikan (2026-08-17)**.
Migration dilakukan sebagai **dual-provider**: SQLite tetap dipakai untuk local
dev & test, PostgreSQL adalah path production. Lihat bagian "Implementation
Status" di bawah untuk detail arsitekturnya.

Dokumen ini adalah hasil audit compatibility repository `SYTE001/Agency` untuk target
production PostgreSQL/Supabase, sesuai checklist Revisi §5:
Prisma schema, DateTime, Decimal, indexes, unique constraints, cascade/relation,
asumsi spesifik SQLite, raw SQL, filesystem, dan serverless compatibility.

- Tanggal audit: 2026-08-17
- Versi terkait: Prisma 7.9.1 (`prisma-client` generator), Next.js 16.3.1, adapter `@prisma/adapter-better-sqlite3`
- Kesimpulan singkat: **schema dan code sudah kompatibel untuk pindah ke PostgreSQL hampir tanpa perubahan aplikasi.** Blocker utamanya ada di infrastruktur (driver SQLite native yang tidak cocok untuk serverless), bukan di kode.

---

## 1. Ringkasan hasil audit

| Area | Status | Catatan |
|---|---|---|
| Prisma schema compatibility | ✅ Siap | Cukup ganti `provider = "sqlite"` → `"postgresql"` |
| Raw SQL | ✅ Tidak ada | Verifikasi grep: `$queryRaw` / `$executeRaw` / `$transaction(raw)` tidak dipakai |
| Decimal behavior | ✅ Siap, lebih baik di PG | SQLite menyimpan Decimal sebagai REAL; PostgreSQL NUMERIC asli (lihat §4) |
| DateTime behavior | ⚠️ Siap dengan catatan | Boundary hari dihitung dengan jam lokal server (lihat §3) |
| Indexes | ✅ Siap | Semua `@@index` valid di kedua provider |
| Unique constraints | ⚠️ Siap dengan catatan | Compound unique nullable (`Product_agencyId_sku_key`) perlu dipahami (lihat §5) |
| Cascade / relation | ✅ Siap | `onDelete: Cascade` disupport kedua provider; tidak ada cycle |
| Asumsi SQLite-specific | ⚠️ Ada 3 item | Case-sensitivity `contains`, tipe Boolean, `String` JSON column (lihat §8) |
| Filesystem | ✅ Bersih | Tidak ada `fs` di app code; DB adalah satu-satunya state |
| Serverless compatibility | ❌ Blocker infra | `better-sqlite3` native + file-based + synchronous tidak cocok untuk serverless/horizontal scale (lihat §9) |

---

## 2. Prisma schema compatibility

`prisma/schema.prisma` memakai tipe-tipe yang disupport penuh oleh provider PostgreSQL:

- `String`, `Int`, `Float`, `Boolean`, `DateTime`, `Decimal` — semua native di PG.
- `@id @default(cuid())` — id dihasilkan di sisi aplikasi (bukan autoincrement DB), jadi tidak ada perbedaan perilaku antar provider.
- Tidak ada fitur spesifik-SQLite yang harus dibongkar.
- `datasource db` tidak menghardcode URL — URL datang dari env `DATABASE_URL` via `prisma.config.ts`, jadi schema tidak perlu diubah saat pindah selain provider flag.

**Yang perlu diubah saat migration (hanya ini):**

```prisma
datasource db {
  provider = "postgresql"
}
```

Catatan: SQLite tidak punya native enum, sehingga status/role disimpan sebagai `String`
dengan allowed values di `lib/constants.ts` (pola ini dipertahankan sesuai prinsip no-rewrite).
Di PostgreSQL, string enum asli (`enum Status { ... }`) tersedia sebagai *opsi optimasi*,
tetapi **tidak diperlukan** dan tidak disarankan sekarang — mengubahnya berarti mengubah
validasi Zod, seed, dan semua data existing. Pola `String` + type guard tetap valid dan
consistency-nya sudah dijamin oleh `lib/constants.ts` (Revisi §4).

---

## 3. DateTime behavior

**Perilaku saat ini:**

- Prisma menyimpan `DateTime` sebagai UTC di kedua provider.
- Boundary "hari" dihitung di server lewat helper `startOfDay`/`endOfDay`/`daysAgoDate`
  (`lib/services/common.ts`) yang memakai **jam lokal proses Node** (`setHours(0,0,0,0)`).
- `Agency.timezone` ada di schema (`@default("Asia/Jakarta")`) tetapi saat ini hanya
  metadata — belum dipakai dalam kalkulasi window laporan.

**Dampak di PostgreSQL:** tidak ada perbedaan storage (sama-sama UTC). Yang harus
diperhatikan adalah *lingkungan server*, bukan database:

1. Jika server/container production berjalan di UTC sedangkan bisnis mengasumsikan
   WIB (Asia/Jakarta), maka window "30 hari terakhir", daily metrics, dan task overdue
   bergeser 7 jam. Ini berlaku sama di SQLite maupun PG — tetapi saat deploy production
   (Vercel/Supabase region UTC) inilah pertama kalinya asumsi tersebut benar-benar kena.
2. Rekomendasi sebelum/saat migration: set `TZ=Asia/Jakarta` di environment, atau ganti
   helper `startOfDay`/`endOfDay` menjadi kalkulasi berbasis timezone tenant (pakai
   `Agency.timezone`). Perubahan helper ini kecil dan bisa dilakukan tanpa menyentuh
   arsitektur, tetapi disisakan sebagai follow-up karena mengubah perilaku angka laporan
   (perlu keputusan product).

**Tidak ada blocker** — hanya keputusan konfigurasi yang harus diambil saat deploy.

---

## 4. Decimal behavior

**Di SQLite (saat ini):** Prisma memetakan `Decimal` ke kolom affinity REAL/TEXT dan
mengembalikan nilai sebagai objek `decimal.js` (Presisi dipertahankan di layer aplikasi).
Seluruh field moneter sudah `Decimal` sejak migration
`20260817010000_finance_decimal` (Revisi §2).

**Di PostgreSQL:** `Decimal` dipetakan ke `NUMERIC` asli — storage dan aritmetika DB
exact. Ini strictly lebih baik:

- Nilai saat ini adalah Rupiah bulat (IDR tidak punya subunit), jadi konversi
  SQLite-REAL → PG-NUMERIC **lossless**.
- Aggregate (`_sum`) tetap mengembalikan `Decimal`; semua service sudah mengonversi
  dengan `.toNumber()` di read boundary (pola yang dibangun di Revisi §2), sehingga
  tidak ada kode aplikasi yang perlu diubah.
- Kalkulasi komisi tetap di `lib/finance.ts` (integer Rupiah, `Math.round`, aman jauh
  di bawah 2^53) — tidak bergantung pada engine DB.

**Catatan minor:** `product.price` di SQLite REAL secara teori bisa menyimpan artefak
binary (mis. 19.990000000000002) jika pernah ditulis lewat path lama. Saat migrasi data,
jalankan sanity check: semua nilai moneter harus bulat (`value = ROUND(value)`); jika ada
pecahan, tetapkan aturan pembulatan dulu sebelum memindahkan (lihat §11 langkah 6).

---

## 5. Indexes & unique constraints

**Indexes:** semua `@@index` (agencyId, status, creatorId, date, dsb.) adalah B-tree
standar yang didukung kedua provider. Tidak ada index parsial/full-text spesifik SQLite.
`prisma migrate` akan membuat ulang semuanya di PG secara otomatis.

**Unique constraints (hasil Revisi §3):**

| Constraint | Sifat | Catatan PG |
|---|---|---|
| `Agency_slug_key` | global | Sama di PG |
| `User_email_key` | global | Sama di PG |
| `Creator_agencyId_username_key` | compound | Sama di PG |
| `Creator_agencyId_externalId_key` | compound, **nullable** | Lihat bawah |
| `CreatorPlatformAccount_creatorId_platform_handle_key` | compound | Sama di PG |
| `Product_agencyId_sku_key` | compound, **nullable** | Lihat bawah |

**Perilaku penting di PostgreSQL:** pada unique index, `NULL` dianggap **distinct** —
dua baris `(agencyId=X, sku=NULL)` TIDAK melanggar uniqueness. Perilaku ini **sama dengan
SQLite** (SQLite juga mengizinkan multiple NULL pada unique index), jadi **tidak ada
perubahan perilaku aplikasi** setelah migration. Yang perlu diketahui:

- Jika kelak bisnis menginginkan "hanya satu produk tanpa SKU per agency", dibutuhkan
  partial unique index PG (`WHERE sku IS NULL`) — saat ini tidak bisa diekspresikan
  portabel di Prisma. Bukan blocker; didokumentasikan sebagai keputusan masa depan.
- `Creator.externalId` yang nullable dengan unique compound berarti satu agency boleh
  punya banyak creator tanpa externalId — sesuai intent (creator yang belum terhubung
  platform eksternal).

---

## 6. Cascade & relation behavior

Relasi dengan `onDelete: Cascade` di schema:

- `BrandContact → Brand`
- `CreatorMetric`, `CreatorPlatformAccount → Creator`
- `ProductMetric → Product`
- `CampaignCreator`, `CampaignProduct → Campaign/Creator/Product`
- `ContentRevision → ContentItem`
- `LiveMetric → LiveSession`
- `SyncJob → Integration`, `SyncLog → SyncJob`

Kedua provider mendukung cascade FK. **Perhatian khusus PostgreSQL:** Prisma membuat
FK constraint di PG, sehingga **order penghapusan menjadi strict** — SQLite lebih
permisif (default `foreign_keys` bisa off di beberapa driver). Efeknya:

- Menghapus entitas parent yang masih punya relasi *non-cascade* (mis. `Agency`,
  `Creator` yang masih punya `Commission`/`CreatorPayout`, `Campaign` yang masih punya
  `ContentItem`) akan **ditolak DB** di PG, bukan silently lolos.
- Ini sebenarnya *lebih aman* untuk integritas data finansial, tetapi aplikasi saat ini
  belum menyediakan alur delete untuk sebagian besar entitas inti (create/update/read yang
  dominan), jadi tidak ada fitur existing yang rusak.
- **Tidak ada multi-path cascade yang membentuk cycle** — Prisma sudah menolak skema
  seperti itu saat generate, dan skema saat ini lolos.

Rekomendasi: pertahankan semua `onDelete: Cascade` yang ada; jangan menambah delete-flow
baru tanpa meninjau ulang graph FK di PG.

---

## 7. Raw SQL

**Tidak ditemukan.** Verifikasi dengan pencarian `$queryRaw`, `$executeRaw`, dan
`Prisma.sql` di seluruh `app/`, `lib/`, `components/` — nol hasil.
Seluruh akses data lewat Prisma query builder, sehingga portabilitas query antar
provider terjamin oleh Prisma sendiri.

---

## 8. Asumsi spesifik SQLite yang berubah di PostgreSQL

1. **Case-sensitivity `contains`.** Pencarian memakai `{ contains: q }` (tanpa
   `mode: "insensitive"`) di: `lib/services/creators.ts`, `brands.ts`, `campaigns.ts`,
   `products.ts`, `tasks.ts`, `content.ts`, `search.ts`.
   - SQLite `LIKE` default **case-insensitive** untuk ASCII; PostgreSQL `LIKE`
     **case-sensitive**.
   - Dampak setelah migration: pencarian "acme" tidak lagi menemukan "Acme".
   - Status: **bukan blocker** (fitur tidak rusak, hanya berbeda), tetapi sangat
     disarankan menambahkan `mode: "insensitive"` pada semua `contains` saat migration
     agar UX pencarian tidak berubah. Ini perubahan mekanis 1 baris per lokasi.
2. **Tipe `Boolean`.** SQLite menyimpan sebagai integer 0/1; PG memakai boolean asli.
   Prisma menangani transparan — tidak ada kode yang membandingkan boolean dengan angka
   (sudah diverifikasi pada audit Revisi §2).
3. **`Report.data` = `String` berisi JSON.** Portabel, tetapi di PG tersedia tipe
   `Json` asli. Tidak perlu diubah sekarang — parsing tetap di aplikasi dan sudah jalan.
4. **Transaksi write.** SQLite single-writer; PG concurrency penuh. Ini **keuntungan**,
   bukan risiko. Kode belum membutuhkan interactive transaction; `Promise.all` read-only
   yang ada tidak terpengaruh.
5. **LIKE/ORDER BY collation.** PG default memakai collation libc; urutan sort string
   bisa sedikit berbeda dari SQLite binary order untuk karakter non-ASCII. Semua
   `orderBy` saat ini pada field angka/tanggal atau nama dengan data ASCII/Indonesia —
   dampak diabaikan.

---

## 9. Serverless compatibility (blocker utama)

`better-sqlite3` adalah addon **native (C++)** dan **synchronous**, dengan DB berupa
**file lokal** (`prisma/dev.db`):

- ❌ **Native module**: harus di-bundle khusus; di beberapa platform serverless tidak
  bisa dipakai sama sekali.
- ❌ **Synchronous API**: memblokir event loop per query — anti-pattern di serverless
  yang mengandalkan concurrency per instance.
- ❌ **File-based storage**: tidak bisa di-share antar instance/region; filesystem di
  platform seperti Vercel bersifat ephemeral → data hilang setiap redeploy/scale.
- ❌ **Tidak kompatibel Supabase** (Supabase = PostgreSQL).

**Konsekuensi:** production di PostgreSQL (Vercel/Supabase/Neon/RDS) **mengharuskan**
ganti driver adapter. Karena Prisma 7 memakai arsitektur driver adapter, gantinya
terlokalisasi di **satu file** (`lib/prisma.ts`):

```ts
// dari:
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// menjadi (Supabase/PG apa pun):
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
```

Tidak ada file lain yang menyentuh adapter atau engine DB.

Catatan arsitektur: aplikasi **tidak** memakai in-memory state, `setInterval` timer,
maupun filesystem (diverifikasi: nol pemakaian `fs`/`setInterval`/`setTimeout` di app
code) — sehingga secara struktur aplikasi sudah siap serverless begitu DB dipindah.

---

## 10. Blocker yang terdokumentasi

| # | Blocker | Jenis | Solusi |
|---|---|---|---|
| B1 | `better-sqlite3` native+synchronous+file tidak cocok serverless | Infrastruktur | Ganti adapter ke `@prisma/adapter-pg` di `lib/prisma.ts` (1 file) |
| B2 | File `prisma/dev.db` tidak bisa ikut dipindahkan apa adanya | Data | Export/import atau `pgloader` (lihat §11 langkah 6) |
| B3 | Riwayat migration Prisma adalah DDL SQLite; PG butuh baseline baru | Tooling | `prisma migrate resolve` + baseline (lihat §11 langkah 4) |
| B4 | `contains` jadi case-sensitive di PG | UX | Tambah `mode: "insensitive"` (7 file, mekanis) |
| B5 | Jam lokal server untuk window harian | Konfigurasi | Set `TZ=Asia/Jakarta` atau ubah helper timezone (keputusan product) |

Tidak ada blocker di level arsitektur aplikasi.

---

## 11. Langkah migration yang direkomendasikan (setelah approval)

> Sesuai Revisi §5 dan HARD CONSTRAINTS: langkah-langkah ini **didokumentasikan, bukan
> dijalankan**. Eksekusi menunggu approval.

1. **Provision PostgreSQL** (Supabase/Neon/RDS) dan siapkan `DATABASE_URL` baru.
2. **Ganti provider schema**: `provider = "postgresql"` di `prisma/schema.prisma`.
   Jalankan `npx prisma validate` — diharapkan lolos tanpa perubahan model lain.
3. **Generate baseline DDL**: `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > baseline.sql`, review manual (terutama Decimal→NUMERIC dan unique indexes), terapkan ke DB baru, lalu `npx prisma migrate resolve --applied <baseline>`.
   *Jangan* menjalankan ulang folder `prisma/migrations` lama (itu DDL SQLite).
4. **Ganti adapter** di `lib/prisma.ts` ke `@prisma/adapter-pg`; hapus dependency
   `better-sqlite3` + `@prisma/adapter-better-sqlite3`; `npm i @prisma/adapter-pg pg`.
5. **Tambah `mode: "insensitive"`** pada semua `contains` (daftar di §8.1) agar perilaku
   pencarian setara SQLite.
6. **Migrasi data**: jika `dev.db` berisi data nyata — dump via script export
   (Prisma read → PG write) atau `pgloader prisma/dev.db postgresql://...`.
   Jalankan sanity check moneter: semua `Decimal` bulat (`value = ROUND(value)`);
   bulatkan/klarifikasi jika ada pecahan (artefak REAL lama).
7. **Verifikasi**: `npm run lint && npm run test && npm run build`, lalu jalankan
   integration test §7 (tenant isolation, RBAC, uniqueness, CRUD) terhadap DB PG.
8. **Putuskan timezone** (B5) sebelum traffic produksi pertama.

---

## 12. Hal yang sudah disiapkan agar migration predictable

- ✅ Semua field moneter sudah `Decimal` (bukan Float) — tidak ada konversi tipe susulan.
- ✅ Unique constraints sudah tenant-scoped (`agencyId` compound) — semantics sama di PG.
- ✅ Tidak ada raw SQL — tidak ada query yang perlu ditulis ulang.
- ✅ Konstruksi tanggal/angka tidak bergantung dialect DB.
- ✅ Akses DB terisolasi di `lib/prisma.ts` (adapter swap 1 file) dan `lib/services/*`
  (satu-satunya layer query).
- ✅ Integration test DB-backed (Revisi §7) dapat dijalankan terhadap provider mana pun
  hanya dengan mengganti `DATABASE_URL`.

---

## 13. Implementation status — dual-provider (dilaksanakan 2026-08-17)

Migration dilaksanakan sebagai **dual-provider** (bukan SQLite→PG yang membuang
SQLite). SQLite tetap dipakai untuk local dev & test; PostgreSQL adalah satu-satunya
path production. Pemilihan provider **berasal dari `DATABASE_URL`/`DB_PROVIDER`**,
bukan dari kode yang di-hardcode per environment.

**Struktur:**

| File | Peran |
|---|---|
| `prisma/schema.prisma` | Schema **PostgreSQL** (production). Generator output → `generated/prisma-pg`. |
| `prisma/schema.sqlite.prisma` | Twin schema **SQLite** (local dev & test), model identik. Output → `generated/prisma-sqlite`. |
| `prisma.config.ts` | Memilih schema + folder migration dari `DB_PROVIDER`/`DATABASE_URL` (`file:` → sqlite, `postgres://` → pg). |
| `prisma/migrations/` | Riwayat migration **SQLite** (dipertahankan). |
| `prisma/migrations-pg/` | Riwayat migration **PostgreSQL**, dimulai dari baseline `20260817100000_pg_baseline`. |
| `lib/dbProvider.ts` | Fungsi `useSqliteSchema()` — satu sumber kebenaran pemilihan provider. |
| `lib/prismaClient.ts` | `createPrismaClient()` memilih adapter (PG vs better-sqlite3) + re-export `Prisma` namespace + schema-drift guard. |
| `lib/prisma.ts` | Singleton client provider-agnostic; satu-satunya titik import DB di app. |
| `.env.example` | Contoh `DATABASE_URL` SQLite (dev) dan PostgreSQL (prod) + `DB_PROVIDER`. |

**Aturan penting:**

1. **Import DB hanya lewat `@/lib/prisma`** — baik runtime client maupun tipe
   (`import type { Prisma } from "@/lib/prisma"`). Jangan import langsung dari
   `@/generated/…` kecuali di `lib/prismaClient.ts`.
2. **Drift guard:** `lib/prismaClient.ts` membandingkan tipe model
   (`Campaign`, `Commission`) antara kedua generated client. Jika kedua schema
   melenceng, `tsc --noEmit` gagal.
3. **Case-sensitivity `contains` (dari §8.1)** tetap jadi pekerjaan P1: pencarian
   string harus konsisten case-insensitive di kedua provider lewat helper di
   `lib/services/common.ts` (bukan raw SQL).
4. **PostgreSQL production env:** `DATABASE_URL=postgres://…` (Supabase/Vercel)
   + `AUTH_SECRET` (≥32 char, wajib). `DB_PROVIDER` opsional — hanya perlu bila
   skema URL ambigu.

**Perintah verifikasi yang dijalankan (hasil hijau):**

- `npm install` → postinstall men-generate **kedua** client secara eksplisit:
  `prisma generate --schema prisma/schema.prisma` (PG) dan
  `prisma generate --schema prisma/schema.sqlite.prisma` (SQLite).
- `npx tsc --noEmit` ✅
- `npm test` (39 test, SQLite throwaway DB) ✅
