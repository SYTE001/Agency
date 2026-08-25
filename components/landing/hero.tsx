import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

export function LandingHero({ user }: { user: SessionUser | null }) {
  const ctaHref = user ? "/overview" : "/login";

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32">
      {/* Background subtle radial illumination */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl dark:bg-brand/15"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Hero Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.12]">
          Run Your TikTok Commerce Agency{" "}
          <span className="text-brand">From One Workspace.</span>
        </h1>

        {/* Supporting text */}
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Manage creators, brands, campaigns, content, LIVE operations, tasks, and finances in one
          centralized operating system.
        </p>

        {/* Call to action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href={ctaHref}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full sm:w-auto gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold px-6 shadow-sm",
            )}
          >
            <span>{user ? "Open Dashboard" : "Open Agency OS"}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#features"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full sm:w-auto px-6 font-medium",
            )}
          >
            Explore Features
          </a>
        </div>

        {/* Honest Architecture highlights */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
            Multi-Tenant Isolated Data
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
            Role-Based Access Control
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
            Automated Commission Engine
          </span>
        </div>

        {/* Live Hero UI Mockup */}
        <div id="product" className="mt-12 sm:mt-16 pt-2">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
