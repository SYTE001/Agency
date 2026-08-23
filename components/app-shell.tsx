"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Menu, X } from "lucide-react";
import { cn, initials } from "@/lib/utils";
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Handle Escape key and lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleDesktop = () => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    } catch {
      // localStorage unavailable — sidebar state still works for the session
    }
    window.dispatchEvent(new Event(STORAGE_KEY));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border/70 bg-subtle md:flex",
          collapsed ? "md:w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-border/70 px-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-foreground">
            {initials(user.agencyName)}
          </div>
          {!collapsed ? (
            <span className="truncate text-sm font-semibold tracking-tight">
              {user.agencyName}
            </span>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto">
          <AppSidebar role={user.role} collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile sidebar drawer & backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border/70 bg-card shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-border/70 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-foreground">
                  {initials(user.agencyName)}
                </div>
                <span className="truncate text-sm font-semibold tracking-tight">
                  {user.agencyName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AppSidebar
                role={user.role}
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar
          user={user}
          leading={
            <>
              {/* Mobile menu trigger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
                title={mobileOpen ? "Tutup menu" : "Buka menu"}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Desktop sidebar collapse trigger */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={toggleDesktop}
                aria-label={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
                title={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
              >
                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </Button>
            </>
          }
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
