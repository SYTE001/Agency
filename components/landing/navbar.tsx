"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function Navbar({ user }: { user: SessionUser | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
    { href: "#platform", label: "Platform" },
    { href: "#capabilities", label: "Features" },
    { href: "#workflow", label: "How it works" },
    { href: "#security", label: "Security" },
  ];

  const ctaHref = user ? "/overview" : "/login";

  return (
    <header className="relative w-full border-b border-[#e2ded6] dark:border-[#282724] bg-[#f7f6f0] dark:bg-[#141412] transition-colors z-40">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:h-20 sm:px-8 lg:px-12">
        {/* Brand Logo & Wordmark */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          aria-label="Agency OS Home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] dark:bg-[#f5f4f0] text-[#f5f4f0] dark:text-[#111111] transition-transform group-hover:scale-105">
            {/* Minimal editorial crescent mark */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 1 12 2z" fill="currentColor" stroke="none" />
              <circle cx="17" cy="7" r="2" fill="#ff5a1f" stroke="none" />
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight text-[#111111] dark:text-[#f5f4f0]">
            Agency<span className="font-light opacity-80">OS</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden items-center gap-8 md:flex lg:gap-10"
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#55534e] dark:text-[#9e9c94] transition-colors hover:text-[#111111] dark:hover:text-[#f5f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action: Pill CTA + Menu Toggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle className="text-[#55534e] dark:text-[#9e9c94] hover:text-[#111111] dark:hover:text-[#f5f4f0]" />

          {/* Desktop Solid Pill Button */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-neutral-800 active:scale-95 dark:bg-[#f5f4f0] dark:text-[#111111] dark:hover:bg-white shadow-xs"
            >
              {user ? "Open Dashboard" : "Log in to Workspace"}
            </Link>
          </div>

          {/* Minimalist Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#111111] dark:text-[#f5f4f0] transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <div className="flex h-3.5 w-4 flex-col justify-between">
                <span className="h-0.5 w-full bg-current rounded-full" />
                <span className="h-0.5 w-full bg-current rounded-full" />
                <span className="h-0.5 w-3/4 bg-current rounded-full" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Modal Drawer with Full Opaque Backdrop */}
      {mobileOpen && (
        <>
          <div 
            className="fixed inset-0 top-16 sm:top-20 z-40 bg-black/40 backdrop-blur-xs md:hidden" 
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 top-16 sm:top-20 z-50 flex flex-col border-b border-[#e2ded6] dark:border-[#282724] bg-[#f7f6f0] dark:bg-[#141412] px-6 py-6 shadow-2xl md:hidden animate-in fade-in slide-in-from-top-2 duration-200"
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
                  className="text-base font-semibold text-[#55534e] dark:text-[#9e9c94] transition-colors hover:text-[#111111] dark:hover:text-[#f5f4f0] py-2 border-b border-[#e2ded6]/50 dark:border-[#282724]/50"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={ctaHref}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full justify-center rounded-full bg-[#111111] text-white hover:bg-neutral-800 font-semibold dark:bg-[#f5f4f0] dark:text-[#111111]",
                )}
              >
                {user ? (
                  <>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    <span>Go to Dashboard</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    <span>Log in to Workspace</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
