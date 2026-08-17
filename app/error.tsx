"use client";

// Error boundary terdekat untuk seluruh segmen di bawah root layout.
// Sesuai konvensi Next.js (docs: file-conventions/error), file ini harus
// Client Component. `error.message` sengaja TIDAK dirender — di production
// Next.js hanya meneruskan digest agar detail sensitif tidak bocor ke klien.

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">500</p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Terjadi kesalahan
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Permintaan tidak dapat diproses. Coba lagi — jika masalah berlanjut,
        hubungi administrator Anda.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button onClick={() => retry()}>Coba lagi</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
