import Link from "next/link";
import { ArrowRight, ShieldCheck, Database, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function Hero({ user }: { user: SessionUser | null }) {
  const ctaHref = user ? "/overview" : "/login";

  return (
    <section id="product" className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-24 lg:pb-36">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Subtle status tag */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-subtle px-3.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span>TikTok Shop &amp; LIVE Commerce OS</span>
          </div>

          {/* Core Headline */}
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[4rem] lg:leading-[1.08]">
            Run Your TikTok Commerce Agency{" "}
            <span className="text-brand">From One Workspace.</span>
          </h1>

          {/* Supporting Statement */}
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Creators, brands, campaigns, content, LIVE operations, tasks, and finance — unified in a single high-performance operating system.
          </p>

          {/* Clean Dual CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ctaHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto h-12 gap-2 bg-brand px-7 text-sm font-semibold text-brand-foreground hover:bg-brand/90 shadow-sm",
              )}
            >
              <span>{user ? "Open Dashboard" : "Open Agency OS"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#capabilities"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto h-12 px-7 text-sm font-medium border-border/80 hover:bg-subtle",
              )}
            >
              Explore Capabilities
            </a>
          </div>

          {/* Verifiable Architecture Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-brand" />
              <span>Multi-Tenant Isolated Database</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-brand" />
              <span>Server-Side RBAC (8 Roles)</span>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-brand" />
              <span>Automated Commission Splits</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
