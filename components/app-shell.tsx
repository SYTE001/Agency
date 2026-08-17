"use client";

import { useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";

const STORAGE_KEY = "taos-sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // localStorage unavailable — fall back to the default
    return false;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_KEY, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_KEY, callback);
  };
}

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  // useSyncExternalStore reads localStorage as an external store and reconciles
  // the stored preference after hydration without a setState-in-effect (the
  // server snapshot is always "expanded", so SSR never touches localStorage).
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  const toggle = () => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    } catch {
      // localStorage unavailable — sidebar state still works for the session
    }
    window.dispatchEvent(new Event(STORAGE_KEY));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border/70 bg-subtle md:flex",
          collapsed ? "md:w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-border/70 px-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-foreground">
            KN
          </div>
          {!collapsed ? (
            <span className="truncate text-sm font-semibold tracking-tight">
              Kreatif Nusantara
            </span>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto">
          <AppSidebar role={user.role} collapsed={collapsed} />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar
          user={user}
          leading={
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
              title={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          }
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
