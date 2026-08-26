import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e2ded6] dark:border-[#2f2e2a] bg-[#f2efe8] dark:bg-[#111110] py-14 sm:py-16 transition-colors">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111111] dark:bg-[#f5f4f0] text-[#f5f4f0] dark:text-[#111111]">
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
                  <circle cx="17" cy="7" r="2" fill="#ff5a1f" stroke="none" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-[#111111] dark:text-[#f5f4f0]">
                Agency OS
              </span>
            </div>
            <p className="mt-2 text-xs text-[#706e66] dark:text-[#9e9c94]">
              Operating system for TikTok Shop and LIVE commerce agencies.
            </p>
          </div>

          {/* Nav Links */}
          <nav
            className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-medium text-[#55534e] dark:text-[#9e9c94]"
            aria-label="Footer Navigation"
          >
            <a href="#platform" className="transition-colors hover:text-[#111111] dark:hover:text-[#f5f4f0]">
              Platform
            </a>
            <a href="#capabilities" className="transition-colors hover:text-[#111111] dark:hover:text-[#f5f4f0]">
              Features
            </a>
            <a href="#workflow" className="transition-colors hover:text-[#111111] dark:hover:text-[#f5f4f0]">
              How it works
            </a>
            <a href="#security" className="transition-colors hover:text-[#111111] dark:hover:text-[#f5f4f0]">
              Security
            </a>
            <Link href="/login" className="text-[#111111] dark:text-[#f5f4f0] font-semibold hover:underline">
              Log in
            </Link>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#e2ded6] dark:border-[#262522] pt-6 text-xs text-[#706e66] dark:text-[#9e9c94]">
          <p>© {currentYear} Agency OS. All rights reserved.</p>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Multi-Tenant PostgreSQL</span>
            <span>·</span>
            <span>Server-Side RBAC</span>
            <span>·</span>
            <span>Prisma Decimal</span>
            <span>·</span>
            <ThemeToggle className="h-7 w-7 text-[#706e66] dark:text-[#9e9c94]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
