import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowDownRight, Radio, Sparkles, SlidersHorizontal, ArrowDown } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export function Hero({ user }: { user: SessionUser | null }) {
  const ctaHref = user ? "/overview" : "/login";

  return (
    <section id="platform" className="relative overflow-hidden pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Main Split Grid */}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          {/* LEFT COLUMN: Editorial Typography & Actions */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center">
            {/* Fine Eyebrow Line Marker */}
            <div className="inline-flex items-center gap-3">
              <div className="h-[1px] w-6 bg-border" />
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-foreground text-foreground">
                <ArrowRight className="h-3 w-3" />
              </div>
              <span className="text-xs font-medium text-foreground tracking-wide">
                TikTok Shop Agency Management
              </span>
            </div>

            {/* Massive Geometric Dominant Headline */}
            <h1 className="mt-5 sm:mt-6 text-5xl font-extrabold tracking-[-0.04em] text-foreground sm:text-6xl md:text-7xl lg:text-[4.6rem] xl:text-[5.2rem] leading-[0.96]">
              Run Your<br />
              TikTok Shop<br />
              Agency
            </h1>

            {/* Understated Supporting Copy */}
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              TikTok Shop agency management for creator rosters, brand briefs, campaign execution, LIVE studio schedules, and commission payouts in one operational system.
            </p>

            {/* Single Login Action Button */}
            <div className="mt-7 flex items-center">
              <Link
                href={ctaHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95 shadow-xs"
              >
                <span>{user ? "Open Dashboard" : "Log in to Workspace"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Editorial Visual Composition */}
          <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center lg:justify-end overflow-visible">
            <div className="relative w-full max-w-[440px] sm:max-w-[500px] py-6 px-1 sm:px-4">
              
              {/* Background Warm Silhouette Card */}
              <div 
                className="absolute right-0 sm:right-4 top-10 -z-0 h-[360px] sm:h-[420px] w-[260px] sm:w-[320px] rounded-[36px] bg-muted opacity-85" 
                aria-hidden="true" 
              />

              {/* Main Visual Anchor Card: Creator Studio Portrait */}
              <div className="relative z-10 mx-auto lg:mr-8 w-[260px] sm:w-[320px] lg:w-[340px] aspect-[4/5] rounded-[32px] overflow-hidden border border-border bg-card shadow-md flex items-end justify-center">
                {/* Visual Image */}
                <div className="relative h-full w-full overflow-hidden bg-card">
                  <Image
                    src="/images/image1.jpeg"
                    alt="Creator operating from a LIVE commerce studio"
                    fill
                    priority
                    sizes="(max-width: 768px) 320px, 340px"
                    className="object-cover object-center"
                  />
                  {/* Subtle ambient lighting vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                </div>
              </div>

              {/* OVERLAY 1: Top-Left Metallic Floating Card */}
              <div className="absolute -left-1 sm:-left-6 top-6 z-20 w-40 sm:w-48 rounded-2xl bg-card/95 backdrop-blur-xs p-3 sm:p-4 border border-border shadow-xs">
                {/* Geometric Mini Pixel Matrix Icon */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="grid grid-cols-4 gap-0.5 text-foreground">
                    <div className="w-1.5 h-1.5 bg-current" />
                    <div className="w-1.5 h-1.5 bg-transparent" />
                    <div className="w-1.5 h-1.5 bg-current" />
                    <div className="w-1.5 h-1.5 bg-current" />
                    <div className="w-1.5 h-1.5 bg-current" />
                    <div className="w-1.5 h-1.5 bg-current" />
                    <div className="w-1.5 h-1.5 bg-current" />
                    <div className="w-1.5 h-1.5 bg-transparent" />
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs font-semibold leading-tight text-card-foreground">
                  Campaigns, creators, LIVE rooms, and finance stay connected
                </p>
              </div>

              {/* OVERLAY 2: Swiss Radial Starburst Graphic */}
              <div 
                className="absolute -left-1 sm:-left-4 top-44 sm:top-48 z-10 w-14 h-14 sm:w-20 sm:h-20 text-foreground opacity-70 select-none pointer-events-none"
                aria-hidden="true"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const angle = (i * 360) / 24;
                    return (
                      <line
                        key={i}
                        x1="50"
                        y1="10"
                        x2="50"
                        y2="28"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        transform={`rotate(${angle} 50 50)`}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* OVERLAY 3: Coral Circular Accent Marker Badge */}
              <div 
                className="absolute left-16 sm:left-24 -top-3 sm:-top-4 z-30 flex h-13 w-13 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Agency OS Fast Pipeline"
              >
                <ArrowDownRight className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.5]" />
              </div>

              {/* OVERLAY 4: Top-Right Metric Block */}
              <div className="absolute right-0 sm:right-2 top-0 z-20 text-right">
                <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  LIVE
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                  Studio Ops
                </div>
                {/* Hairline Bracket Drop */}
                <div className="mt-2 flex flex-col items-end">
                  <div className="w-6 sm:w-8 h-[1px] bg-border" />
                  <div className="w-[1px] h-6 sm:h-8 bg-border" />
                </div>
              </div>

              {/* Hairline Circuit Line with Node */}
              <div 
                className="absolute -left-1 sm:-left-2 top-64 sm:top-68 z-10 hidden sm:flex flex-col items-center"
                aria-hidden="true"
              >
                <div className="w-[1px] h-12 sm:h-14 bg-border" />
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                  <ArrowDown className="h-2.5 w-2.5" />
                </div>
                <div className="w-[1px] h-10 sm:h-12 bg-border" />
              </div>

            </div>
          </div>
        </div>

        {/* LOWER HERO / PROOF STRIP */}
        <div className="mt-14 sm:mt-20 border-t border-border pt-10 sm:pt-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 items-stretch">
            
            {/* Left capability strip */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div className="rounded-2xl bg-muted p-5 sm:p-6 text-foreground">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  One Workspace
                </div>
                <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                  Creator management, campaign management, LIVE operations, and commission workflows
                </p>
              </div>

              {/* Connected Lower Waveform Strip */}
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-card px-4 py-3 border border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand" />
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                  </div>
                </div>

                {/* Sine Harmonic Waveform Line */}
                <div className="w-28 sm:w-32 h-5 text-foreground">
                  <svg viewBox="0 0 100 20" className="w-full h-full" fill="none">
                    <path
                      d="M0 10 Q 12.5 2, 25 10 T 50 10 T 75 10 T 100 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Center Capability Block: LIVE Commerce Scheduling */}
            <div className="lg:col-span-4 flex flex-col justify-start border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-transparent text-foreground">
                  <Radio className="h-4 w-4" />
                </div>
                <p className="text-base font-bold text-foreground">
                  LIVE Studio Scheduling
                </p>
              </div>
              <p className="mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Coordinate physical rooms, stream host shifts, and real-time TikTok LIVE GMV fulfillment across all creator shifts.
              </p>
            </div>

            {/* Right Capability Block: Automated Settlements */}
            <div className="lg:col-span-4 flex flex-col justify-start border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-transparent text-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <p className="text-base font-bold text-foreground">
                  Automated Settlements
                </p>
              </div>
              <p className="mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Automate creator commission splits, multi-tier formulas, batch payout approval queues, and client brand reconciliations.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
