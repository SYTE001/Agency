"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function Navbar({ user }: { user: SessionUser | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll and handle Escape key on mobile drawer
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [mobileOpen]);

  const navLinks = [
    { href: "#product", label: "Product" },
    { href: "#problem", label: "Problem" },
    { href: "#capabilities", label: "Capabilities" },
    { href: "#showcase", label: "Showcase" },
    { href: "#workflow", label: "Workflow" },
    { href: "#use-cases", label: "Use Cases" },
    { href: "#faq", label: "FAQ" },
  ];

  const ctaHref = user ? "/overview" : "/login";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border/70 bg-background/85 backdrop-blur-md shadow-xs"
          : "border-b border-transparent bg-background/50 backdrop-blur-xs",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:h-20 sm:px-8">
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          aria-label="Agency OS Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-semibold text-brand-foreground shadow-xs">
            AO
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Agency OS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden items-center gap-6 lg:flex xl:gap-8"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions (Theme Toggle & CTA) */}
        <div className="hidden items-center gap-3 lg:flex shrink-0">
          <ThemeToggle />

          {user ? (
            <Link
              href="/overview"
              className={cn(
                buttonVariants({ size: "sm" }),
                "gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-medium px-4 shadow-xs",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-sm font-medium text-muted-foreground hover:text-foreground",
                )}
              >
                Log in
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 font-medium px-4 shadow-xs whitespace-nowrap",
                )}
              >
                <span>Open Agency OS</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile & Tablet Controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            className="h-9 w-9 text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-x-0 top-16 z-50 flex flex-col border-b border-border bg-background/95 backdrop-blur-md px-6 py-6 shadow-xl lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground py-1.5"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-6 border-t border-border pt-4 flex flex-col gap-3">
            <Link
              href={ctaHref}
              onClick={() => setMobileOpen(false)}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full justify-center gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold",
              )}
            >
              {user ? (
                <>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Open Dashboard</span>
                </>
              ) : (
                <>
                  <span>Open Agency OS</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Link>

            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full justify-center gap-2 font-medium",
                )}
              >
                <LogIn className="h-4 w-4" />
                <span>Log in to Workspace</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
