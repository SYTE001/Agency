"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, ShieldCheck, LogIn, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function LandingNavbar({ user }: { user: SessionUser | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileMenuOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "#product", label: "Product" },
    { href: "#features", label: "Features" },
    { href: "#workflow", label: "Workflow" },
    { href: "#use-cases", label: "Use Cases" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        scrolled
          ? "border-b border-border/70 bg-background/85 backdrop-blur-md shadow-xs"
          : "border-b border-transparent bg-background/50 backdrop-blur-xs",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground shadow-xs transition-transform group-hover:scale-105">
            AO
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold tracking-tight text-foreground">
              Agency OS
            </span>
            <span className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
              TikTok Commerce OS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />

          {user ? (
            <Link
              href="/overview"
              className={cn(
                buttonVariants({ variant: "default" }),
                "gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-medium shadow-xs",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Open Agency OS</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "text-sm font-medium text-foreground hover:bg-muted",
                )}
              >
                <LogIn className="h-4 w-4 mr-1.5 text-muted-foreground" />
                Log in
              </Link>

              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90 font-medium shadow-xs",
                )}
              >
                <span>Open Agency OS</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-50 flex flex-col bg-background/95 backdrop-blur-md px-6 py-8 md:hidden border-b border-border shadow-xl animate-in fade-in-20 duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-foreground py-2 border-b border-border/50 transition-colors hover:text-brand"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            {user ? (
              <Link
                href="/overview"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full justify-center gap-2 bg-brand text-brand-foreground hover:bg-brand/90",
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Open Dashboard ({user.name})
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full justify-center gap-2 bg-brand text-brand-foreground hover:bg-brand/90",
                  )}
                >
                  <span>Open Agency OS</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full justify-center gap-2",
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
