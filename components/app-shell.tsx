"use client";

import Link from "next/link";
import { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
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
          "hidden shrink-0 flex-col border-r border-border bg-subtle md:flex transition-[width] duration-300 ease-in-out overflow-hidden will-change-[width]",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-14 items-center border-b border-border px-3 overflow-hidden">
          <Link
            href="/overview"
            className="relative flex h-7 w-full items-center overflow-hidden transition-opacity hover:opacity-90"
            aria-label="Agency OS"
          >
            <div
              className={cn(
                "absolute left-0 flex items-center transition-all duration-300 ease-in-out",
                collapsed ? "opacity-0 pointer-events-none -translate-x-2" : "opacity-100 translate-x-0",
              )}
            >
              <BrandLogo variant="full" theme="auto" className="h-6 w-auto" priority />
            </div>
            <div
              className={cn(
                "flex w-full items-center justify-center transition-all duration-300 ease-in-out",
                collapsed ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-75",
              )}
            >
              <BrandMark className="h-6 w-auto" priority />
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AppSidebar role={user.role} collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile sidebar drawer & backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out",
          mobileOpen ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none delay-150",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
      >
        {/* Backdrop overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Slide-over panel */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link
              href="/overview"
              className="flex items-center gap-2.5 overflow-hidden transition-opacity hover:opacity-90"
              aria-label="Agency OS"
              onClick={() => setMobileOpen(false)}
            >
              <BrandLogo variant="full" theme="auto" className="h-6 w-auto" priority />
            </Link>
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
                className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
                onClick={toggleDesktop}
                aria-label={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
                title={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <PanelLeftClose
                    className={cn(
                      "absolute h-4 w-4 transition-all duration-300 ease-in-out",
                      collapsed ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100",
                    )}
                  />
                  <PanelLeftOpen
                    className={cn(
                      "absolute h-4 w-4 transition-all duration-300 ease-in-out",
                      collapsed ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75",
                    )}
                  />
                </span>
              </Button>
            </>
          }
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
