import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-subtle py-14 sm:py-16 transition-colors">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 1 12 2z" fill="currentColor" stroke="none" />
                  <circle cx="17" cy="7" r="2" className="fill-brand" stroke="none" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-foreground">
                Agency OS
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Operating system for TikTok Shop and LIVE commerce agencies.
            </p>
          </div>

          {/* Nav Links */}
          <nav
            className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-medium text-muted-foreground"
            aria-label="Footer Navigation"
          >
            <a href="#platform" className="transition-colors hover:text-foreground">
              Platform
            </a>
            <a href="#capabilities" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#security" className="transition-colors hover:text-foreground">
              Security
            </a>
            <Link href="/login" className="text-foreground font-semibold hover:underline">
              Log in
            </Link>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>© {currentYear} Agency OS. All rights reserved.</p>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Multi-Tenant PostgreSQL</span>
            <span>·</span>
            <span>Server-Side RBAC</span>
            <span>·</span>
            <span>Prisma Decimal</span>
            <span>·</span>
            <ThemeToggle className="h-7 w-7 text-muted-foreground" />
          </div>
        </div>
      </div>
    </footer>
  );
}
