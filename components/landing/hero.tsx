import Link from "next/link";
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
              <div className="h-[1px] w-6 bg-[#9e9c94] dark:bg-[#52504a]" />
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#111111] dark:border-[#f5f4f0] text-[#111111] dark:text-[#f5f4f0]">
                <ArrowRight className="h-3 w-3" />
              </div>
              <span className="text-xs font-medium text-[#111111] dark:text-[#f5f4f0] tracking-wide">
                Agency Commerce Operations OS
              </span>
            </div>

            {/* Massive Geometric Dominant Headline */}
            <h1 className="mt-5 sm:mt-6 text-5xl font-extrabold tracking-[-0.04em] text-[#111111] dark:text-[#f5f4f0] sm:text-6xl md:text-7xl lg:text-[4.6rem] xl:text-[5.2rem] leading-[0.96]">
              Creator<br />
              Commerce<br />
              Platform
            </h1>

            {/* Understated Supporting Copy */}
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#5a5852] dark:text-[#9e9c94] sm:text-lg">
              Centralize creator rosters, brand briefs, LIVE studio schedules, and automated commission payouts in one operational system.
            </p>

            {/* Single Login Action Button */}
            <div className="mt-7 flex items-center">
              <Link
                href={ctaHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#111111] px-8 text-sm font-semibold text-white transition-all hover:bg-neutral-800 active:scale-95 dark:bg-[#f5f4f0] dark:text-[#111111] dark:hover:bg-white shadow-xs"
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
                className="absolute right-0 sm:right-4 top-10 -z-0 h-[360px] sm:h-[420px] w-[260px] sm:w-[320px] rounded-[36px] bg-gradient-to-b from-[#e4dfd7] to-[#cdc6bb] dark:from-[#2a2926] dark:to-[#1c1b18] opacity-85" 
                aria-hidden="true" 
              />

              {/* Main Visual Anchor Card: Creator Studio Portrait */}
              <div className="relative z-10 mx-auto lg:mr-8 w-[260px] sm:w-[320px] lg:w-[340px] aspect-[4/5] rounded-[32px] overflow-hidden border border-[#dedad0] dark:border-[#33322e] bg-[#eae5dc] dark:bg-[#201f1c] shadow-md flex items-end justify-center">
                {/* Stylized High-Fidelity Creator Artwork / Visual */}
                <div className="relative h-full w-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#e8e3d8] via-[#e2ddd1] to-[#d6cfc2] dark:from-[#262522] dark:via-[#1e1d1b] dark:to-[#171614]">
                  {/* Studio Lighting Ambient Glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.4),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)] pointer-events-none" />
                  
                  {/* Creator Portrait Illustration with Swiss Aesthetic */}
                  <svg 
                    className="w-full h-full object-cover select-none" 
                    viewBox="0 0 340 425" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label="Agency creator portrait illustration"
                  >
                    <defs>
                      <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7a4931" />
                        <stop offset="50%" stopColor="#693c26" />
                        <stop offset="100%" stopColor="#542f1c" />
                      </linearGradient>
                      <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#c5ba9d" />
                        <stop offset="100%" stopColor="#aba082" />
                      </linearGradient>
                      <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1a1816" />
                        <stop offset="100%" stopColor="#0d0c0b" />
                      </linearGradient>
                    </defs>

                    {/* Afro Curls Volume Silhouette */}
                    <circle cx="170" cy="180" r="105" fill="url(#hairGrad)" />
                    <circle cx="110" cy="160" r="45" fill="url(#hairGrad)" />
                    <circle cx="230" cy="160" r="45" fill="url(#hairGrad)" />
                    <circle cx="125" cy="115" r="40" fill="url(#hairGrad)" />
                    <circle cx="215" cy="115" r="40" fill="url(#hairGrad)" />
                    <circle cx="170" cy="95" r="42" fill="url(#hairGrad)" />

                    {/* Neck and Shoulders */}
                    <path d="M142 220 L142 285 Q142 300 170 300 Q198 300 198 285 L198 220 Z" fill="url(#skinGrad)" />
                    {/* T-shirt */}
                    <path d="M70 425 L70 335 Q100 300 140 295 Q170 310 200 295 Q240 300 270 335 L270 425 Z" fill="url(#shirtGrad)" />
                    <path d="M140 295 Q170 312 200 295" stroke="#948a6f" strokeWidth="2.5" fill="none" />

                    {/* Face Oval */}
                    <ellipse cx="170" cy="190" rx="55" ry="68" fill="url(#skinGrad)" />

                    {/* Joyful Eyes with Subtle Lashes */}
                    <path d="M136 175 Q146 170 156 175" stroke="#2b1408" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M184 175 Q194 170 204 175" stroke="#2b1408" strokeWidth="3" strokeLinecap="round" fill="none" />

                    {/* Metallic Wire Round Glasses */}
                    <circle cx="145" cy="176" r="23" stroke="#2c2822" strokeWidth="2.5" fill="rgba(255,255,255,0.12)" />
                    <circle cx="195" cy="176" r="23" stroke="#2c2822" strokeWidth="2.5" fill="rgba(255,255,255,0.12)" />
                    <path d="M168 174 Q170 172 172 174" stroke="#2c2822" strokeWidth="2.5" fill="none" />
                    <path d="M122 174 L110 170" stroke="#2c2822" strokeWidth="2" strokeLinecap="round" />
                    <path d="M218 174 L230 170" stroke="#2c2822" strokeWidth="2" strokeLinecap="round" />

                    {/* Nose */}
                    <path d="M167 195 Q170 202 173 195" stroke="#4a2614" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                    {/* Big Radiant Smile */}
                    <path d="M142 215 Q170 248 198 215 Z" fill="#ffffff" />
                    <path d="M140 215 Q170 252 200 215" stroke="#361709" strokeWidth="2" fill="none" />
                    <path d="M146 221 Q170 235 194 221" stroke="#dc2626" strokeWidth="1.5" fill="none" opacity="0.4" />

                    {/* Hand softly touching neck like reference */}
                    <path d="M208 265 Q225 240 235 260 Q240 280 220 295 Z" fill="url(#skinGrad)" />
                  </svg>

                  {/* Soft bottom vignette overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* OVERLAY 1: Top-Left Metallic Floating Card */}
              <div className="absolute -left-1 sm:-left-6 top-6 z-20 w-40 sm:w-48 rounded-2xl bg-[#d7d1c6]/95 dark:bg-[#2d2c28]/95 backdrop-blur-xs p-3 sm:p-4 border border-[#c4be8f]/30 dark:border-white/10 shadow-xs">
                {/* Geometric Mini Pixel Matrix Icon */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="grid grid-cols-4 gap-0.5 text-[#111111] dark:text-[#f5f4f0]">
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
                <p className="text-[11px] sm:text-xs font-semibold leading-tight text-[#1c1b18] dark:text-[#f0efe9]">
                  Take your campaigns &amp; ops under control
                </p>
              </div>

              {/* OVERLAY 2: Swiss Radial Starburst Graphic */}
              <div 
                className="absolute -left-1 sm:-left-4 top-44 sm:top-48 z-10 w-14 h-14 sm:w-20 sm:h-20 text-[#111111] dark:text-[#f5f4f0] opacity-90 select-none pointer-events-none"
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
                className="absolute left-16 sm:left-24 -top-3 sm:-top-4 z-30 flex h-13 w-13 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#ff5a1f] text-white shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                title="Agency OS Fast Pipeline"
              >
                <ArrowDownRight className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.5]" />
              </div>

              {/* OVERLAY 4: Top-Right Metric Block */}
              <div className="absolute right-0 sm:right-2 top-0 z-20 text-right">
                <div className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-[#f5f4f0]">
                  70k+
                </div>
                <div className="text-[10px] sm:text-[11px] font-medium tracking-wide uppercase text-[#706e66] dark:text-[#9e9c94]">
                  Live Streams
                </div>
                {/* Hairline Bracket Drop */}
                <div className="mt-2 flex flex-col items-end">
                  <div className="w-6 sm:w-8 h-[1px] bg-[#c8c4ba] dark:bg-[#3d3b36]" />
                  <div className="w-[1px] h-6 sm:h-8 bg-[#c8c4ba] dark:bg-[#3d3b36]" />
                </div>
              </div>

              {/* Hairline Circuit Line with Node */}
              <div 
                className="absolute -left-1 sm:-left-2 top-64 sm:top-68 z-10 hidden sm:flex flex-col items-center"
                aria-hidden="true"
              >
                <div className="w-[1px] h-12 sm:h-14 bg-[#c8c4ba] dark:bg-[#3d3b36]" />
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#c8c4ba] dark:border-[#3d3b36] bg-[#f7f6f0] dark:bg-[#141412] text-[#55534e] dark:text-[#9e9c94]">
                  <ArrowDown className="h-2.5 w-2.5" />
                </div>
                <div className="w-[1px] h-10 sm:h-12 bg-[#c8c4ba] dark:bg-[#3d3b36]" />
              </div>

            </div>
          </div>
        </div>

        {/* LOWER HERO / PROOF STRIP */}
        <div className="mt-14 sm:mt-20 border-t border-[#e2ded6] dark:border-[#282724] pt-10 sm:pt-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-8 items-stretch">
            
            {/* Left Metric Strip (1.4 million +) */}
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div className="rounded-2xl bg-[#cfc8bc] dark:bg-[#2b2a26] p-5 sm:p-6 text-[#141412] dark:text-[#f5f4ef]">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  1.4 million +
                </div>
                <p className="mt-1.5 text-xs font-medium text-[#4f4d47] dark:text-[#a19f97]">
                  Monthly GMV tracked across campaigns
                </p>
              </div>

              {/* Connected Lower Waveform Strip */}
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white dark:bg-[#1c1b18] px-4 py-3 border border-[#e4e0d7] dark:border-[#33322e]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#ff5a1f]" />
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#111111] dark:bg-[#f5f4f0]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#111111] dark:bg-[#f5f4f0]" />
                  </div>
                </div>

                {/* Sine Harmonic Waveform Line */}
                <div className="w-28 sm:w-32 h-5 text-[#111111] dark:text-[#f5f4f0]">
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
            <div className="lg:col-span-4 flex flex-col justify-start border-t lg:border-t-0 lg:border-l border-[#e2ded6] dark:border-[#282724] pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cfc9bf] dark:border-[#383733] bg-transparent text-[#111111] dark:text-[#f5f4f0]">
                  <Radio className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-[#111111] dark:text-[#f5f4f0]">
                  LIVE Studio Scheduling
                </h2>
              </div>
              <p className="mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
                Coordinate physical rooms, stream host shifts, and real-time TikTok LIVE GMV fulfillment across all creator shifts.
              </p>
            </div>

            {/* Right Capability Block: Automated Settlements */}
            <div className="lg:col-span-4 flex flex-col justify-start border-t lg:border-t-0 lg:border-l border-[#e2ded6] dark:border-[#282724] pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cfc9bf] dark:border-[#383733] bg-transparent text-[#111111] dark:text-[#f5f4f0]">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-[#111111] dark:text-[#f5f4f0]">
                  Automated Settlements
                </h2>
              </div>
              <p className="mt-3 max-w-sm text-xs sm:text-sm leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
                Automate creator commission splits, multi-tier formulas, batch payout approval queues, and client brand reconciliations.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
