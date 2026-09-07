import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export function CtaSection({ user }: { user: SessionUser | null }) {
  const ctaHref = user ? "/overview" : "/login";

  return (
    <section className="border-t border-border py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span>Ready for Deployment</span>
          </div>

          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your agency workspace is ready.
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-base sm:text-lg leading-relaxed text-muted-foreground">
            Manage creator rosters, execute brand campaigns, schedule LIVE studio rooms, and automate commissions in one central operating system.
          </p>

          <div className="mt-10 flex items-center justify-center">
            <Link
              href={ctaHref}
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 shadow-xs"
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
