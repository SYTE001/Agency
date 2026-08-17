import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Halaman 404 root. Karena root layout memuat ThemeProvider, styles global
// dan tema tetap berlaku tanpa perlu markup tambahan.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Halaman tidak ditemukan
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Halaman yang Anda cari tidak ada atau sudah dipindahkan.
      </p>
      <Link href="/" className={buttonVariants()}>
        Kembali ke beranda
      </Link>
    </div>
  );
}
