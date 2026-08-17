import Link from "next/link";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "client", label: "Laporan Client", href: "/reports" },
  { key: "internal", label: "Laporan Internal", href: "/reports/internal" },
] as const;

export type ReportTab = (typeof TABS)[number]["key"];

export function ReportsNav({ active }: { active: ReportTab }) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-lg border bg-muted/40 p-1">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "inline-flex h-7 items-center rounded-md px-3 text-sm font-medium transition-colors",
            active === t.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function ExportLink({
  href,
  label = "Unduh CSV",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
    >
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}
