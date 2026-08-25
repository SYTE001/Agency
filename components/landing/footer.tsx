import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-card py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-semibold text-brand-foreground shadow-xs">
                AO
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Agency OS
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Operating system for TikTok Shop and LIVE commerce agencies.
            </p>
          </div>

          {/* Quick Links */}
          <nav
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            aria-label="Footer Navigation"
          >
            <a href="#product" className="transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#problem" className="transition-colors hover:text-foreground">
              Problem
            </a>
            <a href="#capabilities" className="transition-colors hover:text-foreground">
              Capabilities
            </a>
            <a href="#showcase" className="transition-colors hover:text-foreground">
              Showcase
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              Workflow
            </a>
            <a href="#use-cases" className="transition-colors hover:text-foreground">
              Use Cases
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
            <Link href="/login" className="text-foreground hover:text-brand font-medium">
              Log in
            </Link>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>© {currentYear} Agency OS. All rights reserved.</p>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Multi-Tenant PostgreSQL</span>
            <span>·</span>
            <span>Server-Side RBAC</span>
            <span>·</span>
            <span>Prisma Decimal</span>
            <span>·</span>
            <ThemeToggle className="h-8 w-8" />
          </div>
        </div>
      </div>
    </footer>
  );
}
