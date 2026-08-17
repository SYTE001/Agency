import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "team", label: "Team", href: "/settings" },
  { key: "roles", label: "Roles", href: "/settings/roles" },
  { key: "integrations", label: "Integrations", href: "/settings/integrations" },
  { key: "agency", label: "Agency Settings", href: "/settings/agency" },
] as const;

export type SettingsTab = (typeof TABS)[number]["key"];

export function SettingsNav({ active }: { active: SettingsTab }) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-1">
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
