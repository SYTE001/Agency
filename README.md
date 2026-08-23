# Agency OS — TikTok Agency Management

Sistem operasi internal berbasis web untuk agensi TikTok Shop / Creator / LIVE Commerce:
mengelola creator, brand, campaign, konten, jadwal LIVE, task, hingga keuangan
(komisi, payout creator, settlement brand) dalam satu aplikasi multi-tenant.

## Stack aktual

Berdasarkan `package.json` repository ini:

| Komponen | Versi |
|---|---|
| Next.js (App Router, Server Actions) | 16.3.1 |
| React | 19.2.8 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 (`@tailwindcss/postcss`) |
| Prisma ORM (generator `prisma-client`) | ^7.9.1 |
| Database | **Dual-provider**: PostgreSQL via `pg` + `@prisma/adapter-pg` (production) · SQLite via `better-sqlite3` (local dev & test) |
| Validasi | Zod ^4.4.3 |
| Session/auth | `jose` (JWT HS256 dalam cookie httpOnly) |
| Charts | recharts |
| Test runner | `node:test` via `tsx` |

## Persiapan pertama kali

Prasyarat: Node.js 20+ dan npm.

```bash
npm install          # postinstall: generate client PostgreSQL + SQLite

# buat file env (opsional — ada fallback, lihat bagian Environment Variables)
# DATABASE_URL="file:./prisma/dev.db"
# AUTH_SECRET="<minimal 32 karakter, wajib di production>"

npx prisma migrate deploy   # terapkan migration SQLite ke prisma/dev.db (local dev)

# bootstrap akses: buat agency + satu akun Owner (tanpa data bisnis apa pun)
OWNER_EMAIL="owner@agency.test" OWNER_PASSWORD="minimal-12-karakter" npx prisma db seed

npm run dev                 # http://localhost:3000
```

Seed TIDAK mengisi data contoh — database baru selalu kosong dan setiap modul
menampilkan empty state masing-masing; semua data bisnis (brand, creator,
produk, campaign, dst.) dibuat lewat UI aplikasi. Seed hanya memastikan agency
dan satu akun Owner ada sehingga Anda bisa login:

- idempoten — aman dijalankan berulang; owner yang sudah ada tidak pernah
  ditimpa password-nya;
- kredensial hanya lewat environment variable (`OWNER_EMAIL`, `OWNER_PASSWORD`,
  opsional `AGENCY_NAME`/`AGENCY_SLUG`/`OWNER_NAME`), tidak pernah di-commit;
- `OWNER_PASSWORD` minimal 12 karakter.

## Bootstrap akun Owner produksi

Untuk database PostgreSQL produksi, gunakan script bootstrap khusus produksi
(menolak target selain `postgres://`, jadi tidak pernah menyentuh SQLite lokal):

```bash
OWNER_PASSWORD='password-aman-anda' npx tsx scripts/bootstrap-owner.mts
```

Perilaku script:

- menolak `DATABASE_URL` yang bukan `postgres(ql)://`;
- memastikan agency `Kreatif Nusantara` (slug `kreatif-nusantara`) ada — dibuat
  hanya jika belum ada, tidak pernah menimpa;
- membuat `owner@kreatifnusantara.id` (role `owner`) hanya jika email belum ada —
  idempoten, tidak pernah menimpa password akun yang sudah ada;
- meng-hash password dengan implementasi scrypt aplikasi (`lib/password.ts`)
  dan tidak pernah mencetak password ke output.

> Jangan menaruh password produksi di source code, file env yang ter-commit,
> atau Git — lewatkan hanya via environment variable saat eksekusi.

## Environment variables

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | Tidak (dev) | Connection string Prisma. Skema URL memilih provider: `file:./prisma/dev.db` → SQLite (dev), `postgres://…` → PostgreSQL (production). Tanpa env apa pun: SQLite |
| `DB_PROVIDER` | Tidak | Override eksplisit `sqlite` atau `postgresql` bila skema URL ambigu |
| `AUTH_SECRET` | **Ya (production)** | Kunci penanda-tanganan JWT sesi (HS256), minimal 32 karakter. Di production aplikasi menolak berjalan tanpanya; di dev dipakai kunci lokal sementara |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | Tidak (dev) | Kredensial bootstrap satu kali (`npx prisma db seed`, `scripts/bootstrap-owner.mts`) — hanya dibutuhkan saat eksekusi, tidak disimpan/di-commit |
| `AGENCY_NAME` / `AGENCY_SLUG` / `OWNER_NAME` | Tidak | Override nama agensi/slug/nama owner saat `prisma db seed`; default: Kreatif Nusantara / kreatif-nusantara / Agency Owner |

## Development, build, test

```bash
npm run dev      # server development (http://localhost:3000)
npm run lint     # ESLint
npm run test     # seluruh test (node:test via tsx)
npm run build    # build production
npm run start    # jalankan hasil build
```

`npm run test` menjalankan:

- `lib/finance.test.ts` — kalkulasi komisi/payout/revenue (deterministik, tanpa DB).
- `lib/integration.test.ts` — test DB-backed (tenant isolation, RBAC, uniqueness
  per tenant, CRUD kritis). Test ini memakai **database sekali pakai** di direktori
  temp (bukan `prisma/dev.db`); jalankan `prisma migrate deploy` otomatis saat setup.
  Untuk menjalankan suite yang sama terhadap PostgreSQL, set `DATABASE_URL` ke database
  yang sudah di-migrate sebelum `npm run test`.

## Arsitektur

```
app/
  layout.tsx, globals.css        # root app
  login/                         # halaman login
  (app)/                         # grup route terautentikasi
    page.tsx                     # dashboard/overview
    creators/ brands/ products/  # master data
    campaigns/ content/ live/    # operasional (live: schedule/new/[id])
    tasks/ search/ reports/      # kolaborasi & pelaporan
    finance/                     # + commissions/ payouts/ settlements
    settings/                    # agency, roles, integrations
  actions/                       # server actions (mutasi form)
components/                      # UI components (shadcn-style primitives)
lib/
  auth.ts                        # sesi JWT (jose), cookie httpOnly
  authorization.ts, constants.ts # RBAC: matriks role → permission
  finance.ts                     # formula komisi (Rupiah bulat, integer-safe)
  format.ts                      # formatter IDR/angka
  dbProvider.ts                  # pemilihan provider (sqlite vs postgresql)
  prismaClient.ts                # createPrismaClient + schema-drift guard
  prisma.ts                      # singleton PrismaClient (provider-agnostic)
  services/                      # satu-satunya layer query DB
  *.test.ts                      # test (node:test)
prisma/
  schema.prisma                  # skema multi-tenant PostgreSQL (production)
  schema.sqlite.prisma           # twin skema SQLite (local dev & test)
  migrations/                    # riwayat migration SQLite
  migrations-pg/                 # riwayat migration PostgreSQL (baseline)
  seed.ts                        # bootstrap sistem: agency + akun Owner saja (tanpa data bisnis)
generated/prisma-pg/             # client PostgreSQL hasil generate (jangan diedit)
generated/prisma-sqlite/         # client SQLite hasil generate (jangan diedit)
docs/
  production-readiness.md        # audit + status migration PostgreSQL/Supabase
PLAN.md                          # spesifikasi produk lengkap (bahasa Indonesia)
Fix.md                           # brief audit/hardening awal
Revisi.md                        # spesifikasi production hardening (revision list)
```

Prinsip arsitektur:

1. **Server Components + Server Actions** — mutasi lewat form action di `app/actions/`,
   validasi Zod di server. Tidak ada client yang menulis langsung ke database.
2. **Service layer tunggal** — semua query Prisma hanya ada di `lib/services/*`;
   halaman UI tidak query langsung.
3. **Multi-tenancy by `agencyId`** — setiap business record memiliki kolom `agencyId`.
   `agencyId` selalu diambil dari sesi server (JWT diverifikasi ulang dari database),
   tidak pernah dari payload client. Semua query list/detail/mutasi memfilter
   `id + agencyId`.
4. **RBAC di server** — matriks permission di `lib/constants.ts`
   (`ROLE_PERMISSIONS`), dicek via `can(role, resource, action)` di setiap server
   action. Role: `owner`, `admin`, `account_manager`, `creator_manager`,
   `campaign_manager`, `live_manager`, `finance`, `viewer`.
5. **Keuangan presisi** — seluruh field moneter bertipe `Decimal` di schema;
   kalkulasi komisi memakai Rupiah bulat (integer-safe) di `lib/finance.ts`
   sesuai formula PLAN §12:
   - `creatorCommission = GMV × creatorRate%`
   - `agencyRevenue = creatorCommission × agencyShareRate%` (dari komisi, bukan GMV)
   - `creatorPayout = creatorCommission − agencyRevenue`

## Keamanan & multi-tenancy

- Session: JWT HS256 (jose) dalam cookie httpOnly; role & `agencyId` di-load ulang
  dari database per request (perubahan role langsung berlaku).
- `AUTH_SECRET` wajib diisi di production (aplikasi menolak start tanpa ini).
- Cross-tenant access ditolak di semua service (dibuktikan oleh
  `lib/integration.test.ts`): detail/update/delete membutuhkan `id + agencyId`;
  mutasi finance menolak creator/brand milik tenant lain.
- Unique constraints tenant-scoped: `Creator.username` dan `Product.sku` unik
  per agency (`@@unique([agencyId, ...])`), bukan global.
- Status/role divalidasi dengan type guard terhadap `lib/constants.ts`
  (sumber kebenaran tunggal) di setiap server action.

## Catatan production

- **Dual-provider sudah diimplementasikan**: production memakai PostgreSQL
  (Supabase/Vercel) lewat `@prisma/adapter-pg`; local dev & test tetap memakai
  SQLite (`better-sqlite3`). Provider dipilih dari `DATABASE_URL`/`DB_PROVIDER`
  — tidak ada kode yang di-hardcode per environment. Import DB di app hanya
  lewat `@/lib/prisma`. Lihat `docs/production-readiness.md` §13 untuk detail
  implementasi dan env production yang wajib diset.
- Integrasi TikTok (halaman `settings/integrations`, modul sync) adalah modul
  internal dengan simulasi sync — bukan koneksi API TikTok resmi. Simulasi
  (mock sync) hanya jalan bila diaktifkan eksplisit via `MOCK_SYNC_ENABLED=true`
  di development/demo; production selalu menolaknya, dan sync tidak pernah
  mengubah `actualGmv` campaign atau data bisnis lain.
- Laporan (client/internal) dihasilkan dari data yang sudah ada dan dapat
  diekspor sebagai CSV (pemisah `;` sesuai locale id-ID untuk Excel).
