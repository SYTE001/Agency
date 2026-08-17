import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Server-side pagination: links that preserve current searchParams. */
export function Pagination({
  page,
  totalPages,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const params = new URLSearchParams(Object.entries(searchParams).filter(([k]) => k !== "page"));
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Compact window around current page
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <div className="flex items-center justify-between px-1 pt-3">
      <p className="text-xs text-muted-foreground">
        {total} data · halaman {page} dari {totalPages}
      </p>
      <nav className="flex items-center gap-1">
        <Link
          href={href(page - 1)}
          aria-label="Halaman sebelumnya"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors",
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-accent hover:text-foreground",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        {start > 1 ? (
          <>
            <PageLink href={href(1)} active={false} label="1" />
            {start > 2 ? <span className="px-1 text-xs text-muted-foreground">…</span> : null}
          </>
        ) : null}
        {pages.map((p) => (
          <PageLink key={p} href={href(p)} active={p === page} label={String(p)} />
        ))}
        {end < totalPages ? (
          <>
            {end < totalPages - 1 ? <span className="px-1 text-xs text-muted-foreground">…</span> : null}
            <PageLink href={href(totalPages)} active={false} label={String(totalPages)} />
          </>
        ) : null}
        <Link
          href={href(page + 1)}
          aria-label="Halaman berikutnya"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors",
            page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-accent hover:text-foreground",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </nav>
    </div>
  );
}

function PageLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
