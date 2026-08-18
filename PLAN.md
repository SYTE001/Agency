# Agency OS — Production-Safe Development

Kamu bekerja langsung pada repository `SYTE001/Agency`.

Repository ini SUDAH memiliki arsitektur aplikasi yang berjalan. Jangan melakukan rewrite, migrasi framework, atau restrukturisasi besar hanya untuk menyelesaikan task.

## Tujuan

Siapkan repository agar aman untuk:

1. Local development
2. Vercel preview deployment
3. Production deployment
4. Pengembangan fitur/UI berikutnya tanpa merusak auth, database, RBAC, multi-tenancy, atau financial logic.

## HARD CONSTRAINTS

JANGAN:

* mengganti Next.js
* mengganti React
* mengganti Prisma
* mengganti PostgreSQL sebagai database production
* menghapus service layer
* memindahkan database query langsung ke component
* menghapus RBAC
* mengubah mekanisme multi-tenancy `agencyId`
* mengubah formula finance tanpa alasan dan test
* menggunakan SQLite sebagai database production
* memasukkan secret/API key/password ke source code
* menjalankan seed development terhadap production
* membuat mock API sebagai pengganti database/API production
* melakukan rewrite besar terhadap architecture
* menghapus fitur existing hanya karena belum sempurna

Jika sebuah perubahan tidak diperlukan untuk task, JANGAN ubah.

---

# 1. Production Environment

Audit dan pastikan environment production menggunakan:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=<random-secret-minimum-32-chars>
DB_PROVIDER=postgresql
TZ=Asia/Jakarta
```

Jangan pernah commit nilai asli secret.

Pastikan `.env`, credential, database URL production, password, token, API key, dan session secret tetap berada di environment Vercel/local.

Pertahankan `.env.example` sebagai template tanpa credential asli.

---

# 2. Database

Production wajib menggunakan PostgreSQL.

Local development tetap boleh menggunakan SQLite.

Jangan menggabungkan database local dan production.

Pastikan:

```text
Local:
SQLite → better-sqlite3

Production:
PostgreSQL → pg / @prisma/adapter-pg
```

Jangan menggunakan `prisma/dev.db` sebagai persistent production storage.

Sebelum mengubah schema Prisma:

1. inspect schema existing
2. inspect migration existing
3. cek impact terhadap PostgreSQL
4. jangan menghapus migration existing
5. jangan reset production database

Jika membutuhkan perubahan schema, buat migration yang proper.

---

# 3. Timezone — Asia/Jakarta

Perbaiki masalah timezone production.

Agency menggunakan:

```text
Asia/Jakarta
```

Pastikan fungsi seperti:

* daily metrics
* date range
* overdue task
* laporan
* campaign date
* finance date
* dashboard statistics

tidak bergantung secara tidak sengaja pada timezone UTC server.

Jangan hanya mengubah tampilan tanggal.

Perhitungan boundary hari harus konsisten dengan timezone bisnis.

Jika architecture saat ini belum mendukung timezone tenant secara penuh, gunakan `Agency.timezone` sebagai source of truth tanpa melakukan rewrite architecture.

Default:

```text
Asia/Jakarta
```

---

# 4. PostgreSQL Search Compatibility

Audit semua penggunaan Prisma:

```text
contains
startsWith
endsWith
```

Perhatikan perbedaan case sensitivity antara SQLite dan PostgreSQL.

Jika search UI sebelumnya bersifat case-insensitive, pertahankan behavior tersebut di PostgreSQL.

Jangan mengubah UX search.

Jangan melakukan perubahan database yang tidak diperlukan.

---

# 5. Authentication

Pertahankan:

```text
JWT
httpOnly cookie
jose
AUTH_SECRET
```

Pastikan:

* unauthenticated user tidak bisa membuka protected routes
* session diverifikasi server-side
* user tidak bisa mengganti `agencyId` melalui request payload
* role tidak dipercaya dari client
* perubahan role berlaku setelah session/user reload
* password tidak pernah disimpan plaintext
* password production tidak berada di repository

Jangan mengganti auth system.

---

# 6. Multi-Tenancy

Ini adalah bagian CRITICAL.

Semua business data harus tetap terisolasi berdasarkan:

```text
agencyId
```

Jangan pernah mengambil:

```ts
agencyId
```

dari form/client payload sebagai source of truth.

Gunakan agency dari authenticated server session/database.

Audit:

* creators
* brands
* products
* campaigns
* content
* live sessions
* tasks
* finance
* commissions
* payouts
* settlements
* reports
* search

Pastikan tenant A tidak bisa membaca, mengubah, atau menghapus data tenant B.

Jangan menghapus integration tests untuk tenant isolation.

---

# 7. RBAC

Pertahankan role system existing:

```text
owner
admin
account_manager
creator_manager
campaign_manager
live_manager
finance
viewer
```

Semua mutation harus tetap melewati server-side authorization.

Jangan hanya menyembunyikan tombol UI.

Authorization harus tetap dilakukan di server action/service layer.

Jika UI menampilkan tombol berdasarkan permission, itu hanya UX layer; bukan security layer.

---

# 8. Service Layer

Pertahankan prinsip:

```text
UI
 ↓
Server Action
 ↓
Authorization
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

Jangan membuat component seperti:

```ts
prisma.creator.findMany(...)
```

langsung dari UI/page/component.

Semua database access tetap melalui service layer yang sudah ada.

---

# 9. Financial Logic

Jangan mengubah formula existing tanpa alasan.

Pertahankan:

```text
creatorCommission
= GMV × creatorRate%

agencyRevenue
= creatorCommission × agencyShareRate%

creatorPayout
= creatorCommission − agencyRevenue
```

Money tetap menggunakan Decimal/integer-safe calculation sesuai implementation existing.

Jangan menggunakan floating-point arithmetic baru untuk financial calculation.

Setiap perubahan finance wajib memiliki/update test.

---

# 10. API / Integration

Jangan menganggap halaman:

```text
settings/integrations
```

sebagai official TikTok API integration jika implementation existing masih berupa internal simulation.

Jangan mengklaim:

```text
TikTok API connected
```

jika sebenarnya belum ada official API integration.

Jika nanti membuat integration nyata, buat abstraction terpisah tanpa merusak existing internal workflow.

---

# 11. Error Handling

Audit production error handling.

User harus mendapatkan error yang jelas seperti:

```text
Something went wrong.
Please try again.
```

Jangan expose:

* database connection string
* stack trace
* Prisma internal error
* JWT secret
* API key
* SQL query
* server filesystem path

ke browser.

Server log boleh memiliki detail debugging yang diperlukan, tetapi jangan log secret/password/token.

---

# 12. Loading & Performance

Pertahankan architecture server-first.

Jangan menambahkan:

* unnecessary polling
* `setInterval`
* massive client-side fetching
* duplicate API requests
* giant client components
* unnecessary global state

Audit halaman dashboard dan tab yang sebelumnya terasa lambat.

Jika data yang sama diminta berkali-kali saat navigation, identifikasi penyebabnya sebelum menambahkan cache.

Jangan menambahkan artificial loading animation sebagai solusi terhadap query lambat.

Jika query lambat:

```text
inspect query
→ inspect indexes
→ inspect duplicated requests
→ inspect server/client boundary
→ optimize actual bottleneck
```

---

# 13. UI Development Rule

Mulai sekarang repository dianggap sebagai:

```text
FUNCTIONAL BASELINE
```

UI boleh di-enhance secara agresif selama functionality tidak rusak.

Gunakan prinsip:

```text
Apple-inspired
minimal
clean
high information density
subtle borders
clear hierarchy
responsive
fast
```

Tetapi:

JANGAN:

* rewrite architecture hanya demi UI
* mengganti data flow
* menghapus existing functionality
* mengganti route structure tanpa alasan
* memindahkan business logic ke client
* membuat dummy data untuk menggantikan real data

---

# 14. Before Every Change

Sebelum mengubah file:

1. inspect existing implementation
2. identify dependencies
3. identify data flow
4. identify server/client boundary
5. identify auth/RBAC impact
6. identify database impact
7. make the smallest safe change

Jangan langsung overwrite file besar.

---

# 15. Validation

Setelah perubahan jalankan:

```bash
npm run lint
npm run test
npm run build
```

Jika tersedia environment PostgreSQL test, jalankan test terhadap PostgreSQL juga.

Pastikan tidak ada:

```text
TypeScript errors
ESLint errors
Prisma errors
build errors
missing environment variable errors
auth regression
tenant isolation regression
```

Jika build gagal karena environment variable lokal tidak tersedia, bedakan:

```text
real code error
```

dengan:

```text
missing local configuration
```

Jangan membuat fake secret untuk menyembunyikan error.

---

# 16. Git Safety

Sebelum perubahan besar:

```bash
git status
git branch
git log -5 --oneline
```

Jangan melakukan:

```bash
git reset --hard
git clean -fd
```

kecuali secara eksplisit diminta.

Jangan menghapus perubahan user yang belum committed.

Setiap perubahan harus mudah di-review dan di-revert.

---

# 17. Definition of Done

Task dianggap selesai hanya jika:

* existing functionality tetap bekerja
* authentication tetap bekerja
* RBAC tetap bekerja
* tenant isolation tetap bekerja
* PostgreSQL production path tetap bekerja
* SQLite local development tetap bekerja
* finance calculation tidak berubah secara tidak sengaja
* no secrets committed
* lint passed
* tests passed
* production build passed
* UI responsive
* tidak ada console error yang berasal dari perubahan
* tidak ada unnecessary architecture rewrite

---

# PRIORITY

Jika menemukan konflik antara:

```text
visual improvement
```

dan:

```text
security / data integrity / architecture
```

selalu prioritaskan:

```text
Security
>
Data integrity
>
Authentication
>
Multi-tenancy
>
RBAC
>
Database integrity
>
Performance
>
UX
>
Visual polish
```

Kerjakan perubahan secara incremental.

Sebelum coding, jelaskan singkat:

```text
Current state
Risk
Files affected
Plan
```

Setelah coding, laporkan:

```text
Changed
Test result
Build result
Remaining issue
```

Jangan mengarang hasil test. Jika sebuah test tidak dapat dijalankan, nyatakan alasannya secara eksplisit.
