// Validasi environment variables kritis (production hardening, Revisi §P2).
//
// Fail-fast dengan pesan yang jelas alih-alih gagal di tengah request dengan
// error samar. Dipanggil dari createPrismaClient() sehingga validasi terjadi
// saat client pertama kali dibuat (awal startup), bukan saat query pertama.
import { isSqliteProvider } from "@/lib/dbProvider";

export function validateRuntimeEnv(): void {
  // Saat `next build` (NEXT_PHASE terisi) env production belum tentu ada dan
  // halaman tidak di-render terhadap data live — validasi hanya untuk runtime.
  if (process.env.NEXT_PHASE) return;

  const production = process.env.NODE_ENV === "production";
  const dbProvider = process.env.DB_PROVIDER;
  if (dbProvider !== undefined && dbProvider !== "sqlite" && dbProvider !== "postgresql") {
    throw new Error(
      `DB_PROVIDER tidak valid: "${dbProvider}" — hanya "sqlite" atau "postgresql" yang didukung.`,
    );
  }

  if (isSqliteProvider()) {
    // Serverless (Vercel) tidak punya filesystem persisten — SQLite di
    // production akan gagal secara diam-diam, jadi tolak sejak awal.
    if (production) {
      throw new Error(
        "SQLite tidak didukung di production (serverless tanpa filesystem persisten). " +
          "Set DATABASE_URL ke koneksi PostgreSQL (contoh: Supabase) — jangan set DB_PROVIDER=sqlite.",
      );
    }
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL wajib diisi untuk PostgreSQL runtime (contoh: postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres).",
    );
  }
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error(
      "DATABASE_URL harus berawalan postgres:// atau postgresql:// saat provider PostgreSQL aktif.",
    );
  }

  if (production && !process.env.AUTH_SECRET) {
    throw new Error(
      "AUTH_SECRET wajib diisi di production (minimal 32 karakter; generate via: openssl rand -base64 48).",
    );
  }
}
