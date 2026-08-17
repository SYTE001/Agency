import Link from "next/link";
import { cn } from "@/lib/utils";

// Finance sub-navigation (PLAN §4 IA: Revenue / Commission / Settlements /
// Creator Payout). Sidebar holds a single /finance entry; this tabs inside.
const TABS = [
  { key: "overview", label: "Ringkasan", href: "/finance" },
  { key: "commissions", label: "Komisi", href: "/finance/commissions" },
  { key: "payouts", label: "Payout Creator", href: "/finance/payouts" },
  { key: "settlements", label: "Settlement", href: "/finance/settlements" },
] as const;

export type FinanceTab = (typeof TABS)[number]["key"];

export function FinanceNav({ active }: { active: FinanceTab }) {
  return (
    <div className="flex w-fit items-center gap-1 rounded-lg border bg-muted/40 p-1">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
