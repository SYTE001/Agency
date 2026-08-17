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

const NAV: { href: string; label: string; icon: typeof Users; resource: Resource | null }[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, resource: null },
  { href: "/creators", label: "Creators", icon: Users, resource: "creator" },
  { href: "/brands", label: "Brands", icon: Building2, resource: "brand" },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone, resource: "campaign" },
  { href: "/content", label: "Content", icon: FileText, resource: "content" },
  { href: "/live", label: "LIVE", icon: Radio, resource: "live" },
  { href: "/products", label: "Products", icon: Package, resource: "product" },
  { href: "/finance", label: "Finance", icon: Wallet, resource: "finance" },
  { href: "/reports", label: "Reports", icon: BarChart3, resource: "report" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, resource: "task" },
  { href: "/settings", label: "Settings", icon: Settings, resource: "setting" },
];

export function AppSidebar({ role, collapsed }: { role: Role; collapsed?: boolean }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => !n.resource || can(role, n.resource, "read"));

  return (
    <nav className="flex flex-col gap-0.5 p-2.5">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
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
    </nav>
  );
}
