import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export function CtaSection({ user }: { user: SessionUser | null }) {
  const ctaHref = user ? "/overview" : "/login";

  return (
    <section className="border-t border-[#e2ded6] dark:border-[#2f2e2a] py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#706e66] dark:text-[#9e9c94]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a1f]" />
            <span>Ready for Deployment</span>
          </div>

          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[#111111] dark:text-[#f5f4f0] sm:text-5xl lg:text-6xl">
            Your agency workspace is ready.
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-base sm:text-lg leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
            Manage creator rosters, execute brand campaigns, schedule LIVE studio rooms, and automate commissions in one central operating system.
          </p>

          <div className="mt-10 flex items-center justify-center">
            <Link
              href={ctaHref}
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#111111] px-8 text-sm font-semibold text-white transition-all hover:bg-neutral-800 active:scale-95 dark:bg-[#f5f4f0] dark:text-[#111111] dark:hover:bg-white shadow-xs"
            >
              {user ? (
                <>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Open Dashboard</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Log in to Workspace</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
