import Link from "next/link";
import { Radio } from "lucide-react";

export default function LiveNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Radio className="h-6 w-6 text-muted-foreground" />
      </div>
      <h1 className="text-lg font-semibold">Sesi LIVE tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Sesi LIVE ini tidak ada atau sudah dihapus dari jadwal agensi Anda.
      </p>
      <Link
        href="/live"
        className="mt-2 inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        Kembali ke LIVE
      </Link>
    </div>
  );
}
