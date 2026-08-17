import Link from "next/link";

export default function BrandNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
      <p className="text-base font-semibold">Brand tidak ditemukan</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Brand ini tidak ada atau bukan bagian dari agensi Anda.
      </p>
      <Link
        href="/brands"
        className="inline-flex h-9 items-center justify-center rounded-md border border-input px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Kembali ke daftar brand
      </Link>
    </div>
  );
}
