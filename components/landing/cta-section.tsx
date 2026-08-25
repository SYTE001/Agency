import Link from "next/link";
import { ArrowRight, LogIn, LayoutDashboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function CtaSection({ user }: { user: SessionUser | null }) {
  const primaryHref = user ? "/overview" : "/login";

  return (
    <section className="py-20 sm:py-28 bg-subtle/50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-border/80 bg-card p-8 sm:p-12 lg:p-16 text-center shadow-xl overflow-hidden">
          {/* Subtle background glow */}
          <div
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-brand/10 blur-3xl dark:bg-brand/20"
            aria-hidden="true"
          />

          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Ready to bring your agency operation into one workspace?
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Access Agency OS and manage your creators, campaigns, live streams, and agency
              finances from a single unified system.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href={primaryHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold px-8 shadow-sm",
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
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto px-8 font-medium",
                  )}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Log in to Workspace
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
