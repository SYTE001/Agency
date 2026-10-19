"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Megaphone,
  FileText,
  Radio,
  Package,
  Wallet,
  BarChart3,
  CheckSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { can } from "@/lib/authorization";
import type { Role, Resource } from "@/lib/constants";

type NavItem = { href: string; label: string; icon: typeof Users; resource: Resource | null };

// Grouped so the order matches the work: master data first, then execution,
// then money, then system. `label: null` renders the group without a heading.
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ href: "/overview", label: "Overview", icon: LayoutDashboard, resource: null }],
  },
  {
    label: "Data Induk",
    items: [
      { href: "/creators", label: "Creators", icon: Users, resource: "creator" },
      { href: "/brands", label: "Brands", icon: Building2, resource: "brand" },
      { href: "/products", label: "Products", icon: Package, resource: "product" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: Megaphone, resource: "campaign" },
      { href: "/content", label: "Content", icon: FileText, resource: "content" },
      { href: "/live", label: "LIVE", icon: Radio, resource: "live" },
      { href: "/tasks", label: "Tasks", icon: CheckSquare, resource: "task" },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { href: "/finance", label: "Finance", icon: Wallet, resource: "finance" },
      { href: "/reports", label: "Reports", icon: BarChart3, resource: "report" },
    ],
  },
  {
    label: "Sistem",
    items: [{ href: "/settings", label: "Settings", icon: Settings, resource: "setting" }],
  },
];

export function AppSidebar({
  role,
  collapsed,
  onNavigate,
}: {
  role: Role;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-2.5">
      {NAV_GROUPS.map((group, groupIndex) => {
        const items = group.items.filter(
          (n) => !n.resource || can(role, n.resource, "read"),
        );
        if (items.length === 0) return null;

        return (
          <div key={group.label ?? "overview"} className={cn(groupIndex > 0 && "mt-3")}>
            {group.label ? (
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  collapsed ? "max-h-0 opacity-0 pointer-events-none" : "max-h-6 opacity-100 pb-1",
                )}
              >
                <p className="whitespace-nowrap px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
              </div>
            ) : null}
            {groupIndex > 0 ? (
              <div
                className={cn(
                  "mx-2 border-t border-border transition-all duration-300 ease-in-out",
                  collapsed ? "my-1.5 opacity-100 max-h-4" : "my-0 opacity-0 max-h-0 border-transparent pointer-events-none",
                )}
                aria-hidden="true"
              />
            ) : null}
            {items.map((item) => {
              const active =
                item.href === "/overview"
                  ? pathname === "/overview"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex h-9 items-center rounded-md text-sm transition-[padding,background-color,color] duration-300 ease-in-out overflow-hidden",
                    collapsed ? "px-3.5" : "px-2.5 gap-3",
                    active
                      ? "bg-accent font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-foreground transition-all duration-300" />
                  ) : null}
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    <Icon
                      className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-foreground" : "text-muted-foreground")}
                    />
                  </span>
                  <span
                    className={cn(
                      "truncate whitespace-nowrap transition-all duration-300 ease-in-out",
                      collapsed
                        ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                        : "max-w-[160px] opacity-100 translate-x-0",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
