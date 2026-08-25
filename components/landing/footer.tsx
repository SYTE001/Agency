import Link from "next/link";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/70 bg-card py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-brand-foreground shadow-xs">
                AO
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">
                Agency OS
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Agency operations, centralized. Built for TikTok Shop & LIVE Commerce agencies.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
            <a href="#product" className="transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
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
            <Link href="/login" className="text-foreground hover:text-brand font-semibold">
              Log in
            </Link>
          </nav>
        </div>

        {/* Copyright notice */}
        <div className="mt-10 border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© {currentYear} Agency OS. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Multi-Tenant Architecture</span>
            <span>·</span>
            <span>Role-Based Access Control</span>
            <span>·</span>
            <span>Production PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
