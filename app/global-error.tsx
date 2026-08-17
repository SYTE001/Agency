"use client";

// Fallback terakhir saat root layout sendiri gagal render. Menggantikan root
// layout sepenuhnya, jadi WAJIB mendefinisikan <html> + <body> dan
// mengimport global styles sendiri (docs: file-conventions/error#global-error).
// `error.message` sengaja tidak dirender untuk menghindari kebocoran detail.

import "./globals.css";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">500</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Terjadi kesalahan
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Aplikasi tidak dapat dimuat. Coba lagi — jika masalah berlanjut,
            hubungi administrator Anda.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
          ) : null}
          <Button onClick={() => retry()}>Coba lagi</Button>
        </div>
      </body>
    </html>
  );
}
