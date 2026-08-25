import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function CtaSection({ user }: { user: SessionUser | null }) {
  const ctaHref = user ? "/overview" : "/login";

  return (
    <section className="py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Your agency workspace is ready.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Manage creator rosters, execute brand campaigns, schedule LIVE studio rooms, and automate commissions in one central operating system.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ctaHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto h-12 gap-2 bg-brand px-8 text-sm font-semibold text-brand-foreground hover:bg-brand/90 shadow-sm",
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
                  "w-full sm:w-auto h-12 px-7 text-sm font-medium border-border/80 hover:bg-subtle",
                )}
              >
                <LogIn className="h-4 w-4 mr-2" />
                <span>Log in to Workspace</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
