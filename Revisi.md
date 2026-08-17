# Agency OS — Production Hardening Revision

## Tujuan

Lakukan production-hardening pada repository `SYTE001/Agency` tanpa mengubah arsitektur aplikasi, route structure, business flow, atau visual UI.

PRINSIP UTAMA:
- Preserve existing architecture.
- No rewrite.
- No visual redesign.
- No unnecessary dependency changes.
- Jangan menghapus fitur yang sudah bekerja.
- Jangan membuat mock/dummy implementation baru.
- Semua perubahan harus backward-compatible dengan logic yang sudah ada.
- Jika menemukan masalah yang membutuhkan architectural migration besar, dokumentasikan terlebih dahulu dan jangan melakukan rewrite otomatis.

## 1. Audit Tenant Isolation — PRIORITAS P0

Audit seluruh query database, server actions, API handlers, loaders, mutations, dan service layer.

Pastikan setiap business record selalu dibatasi oleh `agencyId` dari authenticated session/server context.

Audit terutama:
- Creator
- Brand
- Product
- Campaign
- ContentItem
- LiveSession
- Task
- Activity
- Note
- Commission
- CreatorPayout
- Settlement
- Report
- Integration
- seluruh entity tambahan yang memiliki `agencyId`

Rules:
1. Jangan pernah mengambil record hanya berdasarkan `id` jika record tersebut tenant-scoped.
2. Gunakan kombinasi `id + agencyId` atau equivalent relation check.
3. Jangan mempercayai `agencyId` yang dikirim client.
4. `agencyId` harus berasal dari authenticated server context.
5. Pastikan detail pages `[id]`, edit, delete, update, dan mutation semuanya melakukan tenant check.
6. Pastikan RBAC tetap enforced di server-side.
7. Audit indirect relations agar user dari Agency A tidak dapat mengakses entity Agency B melalui relation ID.

Buat test untuk membuktikan cross-tenant access ditolak.

## 2. Finance Precision — PRIORITAS P0

Audit semua field finansial.

Saat ini schema menggunakan `Float` untuk:
- price
- budget
- GMV
- commission
- agency revenue
- payout
- settlement
- fee
- rate yang berkaitan dengan perhitungan finansial

Ganti monetary values dari `Float` ke `Decimal` menggunakan Prisma Decimal.

Rules:
- Jangan mengubah business formula.
- Jangan mengubah output UI kecuali diperlukan untuk formatting.
- Gunakan satu standar currency formatting.
- Pastikan calculation tidak menghasilkan floating-point artifacts.
- Audit seluruh arithmetic operation setelah migration.
- Tambahkan tests untuk nominal:
  - 0
  - 1
  - 0.1
  - 999.99
  - nominal besar
  - commission percentage
  - creator payout
  - agency revenue
- Pastikan hasil settlement konsisten.

Untuk percentage/rate, tentukan secara konsisten apakah tetap `Float` atau ikut Decimal berdasarkan cara calculation saat ini. Jangan asal mengubah semua numeric field.

## 3. Multi-Tenant Unique Constraints — PRIORITAS P0/P1

Audit semua `@unique`.

Contoh yang sudah ditemukan:

`Creator.username @unique`

Untuk multi-tenant architecture, evaluasi apakah uniqueness harus global atau per agency.

Jika business meaning-nya tenant-scoped, ubah menjadi pola seperti:

`@@unique([agencyId, username])`

Audit juga:
- externalId
- SKU
- platform account handle
- slug
- integration identifiers
- entity-specific identifiers lainnya

Jangan mengubah field yang memang harus globally unique.

## 4. Validation Consistency — PRIORITAS P1

Audit mutation/input layer.

Project menggunakan Zod. Pastikan:
- semua user input divalidasi server-side
- status menggunakan allowed values yang konsisten
- role menggunakan allowed values yang konsisten
- numeric input divalidasi
- dates divalidasi
- IDs divalidasi sebelum query
- financial input divalidasi
- tidak ada trust terhadap client-side validation

Jika `lib/constants.ts` sudah menjadi source of truth untuk status/role, pertahankan pola tersebut dan jangan membuat duplicate enum definitions tanpa alasan.

## 5. Database / Production Readiness — PRIORITAS P1

Saat ini project menggunakan:
- Prisma
- SQLite
- better-sqlite3

Jangan langsung rewrite seluruh database.

Lakukan audit compatibility untuk target production PostgreSQL/Supabase.

Periksa:
- Prisma schema compatibility
- DateTime behavior
- Decimal behavior
- indexes
- unique constraints
- cascade behavior
- relation behavior
- SQLite-specific assumptions
- raw SQL jika ada
- filesystem/database assumptions
- serverless compatibility

Jika migration SQLite → PostgreSQL belum aman dilakukan sekarang:
1. Jangan memaksakan migration.
2. Dokumentasikan semua blocker.
3. Siapkan schema/code agar migration berikutnya predictable.

## 6. Documentation Consistency — PRIORITAS P2

Update README agar mencerminkan repository aktual.

Jangan lagi menyebut stack lama jika tidak sesuai.

Verifikasi berdasarkan `package.json` aktual:
- Next.js version
- React version
- TypeScript
- Tailwind
- Prisma
- database
- scripts

README harus menjelaskan:
- project purpose
- first-time setup
- environment variables
- database setup
- development
- build
- test
- architecture overview
- security/multi-tenancy principles
- production notes

Jangan membuat klaim fitur yang belum benar-benar tersedia.

Jika `PLAN.md` dan `Fix.md` masih diperlukan, jangan hapus. Evaluasi apakah lebih rapi dipindahkan ke `docs/` tanpa merusak reference yang ada.

## 7. Testing — PRIORITAS P1

Sebelum selesai:

Jalankan:
- `npm run lint`
- `npm run test`
- `npm run build`

Jika ada error:
- perbaiki root cause
- jangan bypass error
- jangan mematikan lint/type checking
- jangan menghapus test

Tambahkan test minimal untuk:
1. cross-tenant isolation
2. unauthorized access
3. RBAC restriction
4. financial Decimal calculation
5. tenant-scoped uniqueness
6. critical CRUD mutations

## 8. Git Safety

Sebelum mengubah file:
- inspect current repository state
- inspect existing implementation
- jangan overwrite working changes
- jangan reset/revert perubahan user
- jangan menghapus file tanpa alasan teknis

Setelah selesai:
- tampilkan daftar file yang berubah
- jelaskan perubahan per file
- jelaskan migration/schema impact
- jelaskan test/build result
- jelaskan issue yang sengaja tidak disentuh

## HARD CONSTRAINTS

JANGAN:
- redesign UI
- mengganti design system
- membuat animasi baru
- mengubah layout
- mengganti route architecture
- memindahkan business logic secara besar-besaran
- mengganti Prisma tanpa alasan
- mengganti authentication flow
- menghapus fitur existing
- membuat fake data untuk menutupi error
- menambahkan dependency hanya untuk menyelesaikan masalah sederhana
- melakukan SQLite → PostgreSQL migration besar tanpa audit dan approval

FOKUS:
`Security → Data Integrity → Financial Accuracy → Tenant Isolation → Validation → Production Readiness → Documentation`

## Definition of Done

Task selesai hanya jika:

- Tidak ada cross-tenant data leak yang ditemukan pada audited paths.
- Financial calculations tidak lagi bergantung pada Float untuk monetary values.
- Unique constraints sudah masuk akal untuk multi-tenant architecture.
- Server-side validation konsisten.
- README sesuai stack aktual.
- `npm run lint` berhasil.
- `npm run test` berhasil.
- `npm run build` berhasil.
- Tidak ada architectural rewrite.
- Tidak ada UI redesign.
- Semua perubahan terdokumentasi.

Setelah audit dan implementasi selesai, berikan laporan akhir dengan format:

### Changed
Daftar perubahan.

### Security
Temuan dan perbaikan tenant isolation/RBAC.

### Database
Perubahan schema, Decimal, indexes, constraints.

### Tests
Hasil lint/test/build.

### Migration Notes
Hal yang perlu dilakukan sebelum production PostgreSQL/Supabase.

### Not Changed
Bagian yang sengaja tidak disentuh untuk menjaga architecture stability.

### Remaining Risks
Masalah yang masih tersisa dan alasan kenapa belum diubah.
