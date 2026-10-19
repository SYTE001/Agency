"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";
import { useLoginTransition } from "@/components/login-transition-provider";
import { BrandLogo } from "@/components/brand-logo";

const navLinks = [
  { href: "#workspace", label: "Workspace" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#workflow", label: "Workflow" },
  { href: "#security", label: "Security" },
];

export function Navbar({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const headRef = useRef<HTMLElement>(null);
  const { startTransitionToLogin } = useLoginTransition();

  // Session-aware CTA: signed-in users jump straight into the app.
  const ctaHref = user ? "/overview" : "/login";
  const ctaLabel = user ? "Dashboard" : "Masuk";

  // Frosted/shrunk header state once the page starts scrolling.
  useEffect(() => {
    const onScroll = () => headRef.current?.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll and allow Escape to dismiss the mobile drawer.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="site-head" id="siteHead" ref={headRef}>
      <div className="container head-inner">
        <Link className="brand" href="#top" aria-label="Agency OS">
          <BrandLogo variant="full" theme="light" className="h-[27px] w-auto" priority />
        </Link>

        <nav className={cn("main-nav", open && "is-open")} id="mainNav" aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link
            className="btn btn--primary btn--sm"
            href={ctaHref}
            onClick={(e) => {
              setOpen(false);
              if (!user) {
                e.preventDefault();
                startTransitionToLogin(e.currentTarget);
              }
            }}
          >
            {ctaLabel}
          </Link>
        </nav>

        <button
          type="button"
          className={cn("burger", open && "is-open")}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
