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
    <nav className="flex flex-col gap-0.5 p-2.5">
      {NAV_GROUPS.map((group, groupIndex) => {
        const items = group.items.filter(
          (n) => !n.resource || can(role, n.resource, "read"),
        );
        if (items.length === 0) return null;

        return (
          <div key={group.label ?? "overview"} className={cn(groupIndex > 0 && "mt-4")}>
            {!collapsed && group.label ? (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
            ) : null}
            {collapsed && groupIndex > 0 ? (
              <div className="mx-3 mb-1 border-t border-border/70" aria-hidden="true" />
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
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-accent font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-brand" />
                  ) : null}
                  <Icon
                    className={cn("h-4 w-4 shrink-0", active && "text-brand")}
                  />
                  {!collapsed ? item.label : null}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
