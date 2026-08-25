import {
  TrendingUp,
  Users,
  Megaphone,
  Radio,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ProductShowcase() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Product Showcase
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Designed for the daily realities of TikTok agency operations.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Explore how each core module connects seamlessly to keep your team aligned and your
            creators performing.
          </p>
        </div>

        {/* Showcase Block 1: Overview Cockpit */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              01 — Executive Overview
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              See the entire operation at a glance.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get an instant snapshot of your agency’s total GMV pacing, active campaign progress,
              today’s live studio schedule, and critical operational alerts that require action.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Real-time 30-day GMV growth and revenue metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Actionable alerts filtered by individual role permissions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Timezone-localized dates based on agency settings</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-lg space-y-3.5">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-brand flex items-center justify-center text-xs font-bold text-brand-foreground">
                    AO
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Selamat pagi, Management Team</h4>
                    <p className="text-[10px] text-muted-foreground">Ringkasan operasional agensi</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Jakarta (WIB)</span>
              </div>

              {/* KPI Strip Mini */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border bg-muted/20 p-2.5">
                  <span className="text-[10px] text-muted-foreground">Total GMV (30 hari)</span>
                  <div className="text-sm font-bold text-foreground">Rp 2.458.900.000</div>
                  <span className="text-[9px] font-semibold text-emerald-600">+18.4% growth</span>
                </div>
                <div className="rounded-md border bg-muted/20 p-2.5">
                  <span className="text-[10px] text-muted-foreground">Agency Net Revenue</span>
                  <div className="text-sm font-bold text-foreground">Rp 368.835.000</div>
                  <span className="text-[9px] text-muted-foreground">15% avg agency cut</span>
                </div>
              </div>

              {/* Operational Alert Mini */}
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>2 Campaign milestones requiring approval today</span>
                </div>
                <span className="text-[10px] font-semibold text-brand">View Details →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Showcase Block 2: Creator Management */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-semibold">Creator Roster Directory</h4>
                  <p className="text-[10px] text-muted-foreground">Managed Talent, Niche & Operational Health</p>
                </div>
                <span className="rounded bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                  42 Creators
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: "Sarah Azhari", cat: "Beauty & Skincare", handle: "@sarah.beauty", manager: "Dian Sastrowardoyo", health: "Healthy", gmv: "Rp 340.5M" },
                  { name: "Rizky Pratama", cat: "Gadget & Tech", handle: "@rizky.tech", manager: "Bambang Pamungkas", health: "Healthy", gmv: "Rp 185.2M" },
                  { name: "Dimas Setiawan", cat: "Lifestyle & Food", handle: "@dimas.eats", manager: "Dian Sastrowardoyo", health: "Watch", gmv: "Rp 98.4M" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center justify-between rounded-md border p-2.5 bg-background/50">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} className="h-8 w-8 text-xs" />
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {c.name}
                          <span className="text-[10px] text-muted-foreground font-normal">{c.handle}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {c.cat} · Mgr: {c.manager}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{c.gmv}</div>
                      <span className={cn("text-[9px] font-semibold", c.health === "Healthy" ? "text-emerald-600" : "text-amber-600")}>
                        ● {c.health}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              02 — Creator Operations
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Keep creator operations organized.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Maintain a single source of truth for all creators under your agency management. Track
              performance metrics, assign dedicated talent managers, monitor operational health, and
              link accounts directly to campaigns.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Health scoring (Healthy, Watch, AtRisk) to catch disengagement</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Multi-platform profile linkage (TikTok & Instagram)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Clear manager assignment and accountability tracking</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Showcase Block 3: Campaigns & LIVE Studio */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              03 — Campaign & LIVE Studio
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Coordinate campaigns and LIVE operations.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Schedule live streaming studio rooms, assign dedicated live stream operators, track GMV
              target fulfillment, and coordinate creator video production pipelines without friction.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Live stream studio room scheduling & shift operator logs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Campaign GMV target pacing vs real-time actual sales</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Content production stages with script review workflows</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-lg space-y-3.5">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                  <h4 className="text-xs font-semibold">Studio Shift & Campaign Hub</h4>
                </div>
                <span className="text-[10px] text-muted-foreground">3 Rooms Active</span>
              </div>

              {/* Studio Shift Card */}
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">Studio A — Beauty Stream</span>
                    <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-600">
                      LIVE NOW
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Host: Sarah Azhari · Operator: Budi Santoso · Wardah Ramadan Fest
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">Rp 48.500.000</div>
                  <span className="text-[9px] text-emerald-600 font-semibold">Target Rp 45M (107%)</span>
                </div>
              </div>

              {/* Campaign Milestones Preview */}
              <div className="rounded-md border p-3 bg-background/50 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground">Wardah Ramadan Mega Fest</span>
                  <span className="font-mono text-brand font-semibold">Rp 642M / Rp 750M (85.6%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: "85.6%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Showcase Block 4: Finance & Settlements */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="text-xs font-semibold">Finance, Commissions & Settlements</h4>
                  <p className="text-[10px] text-muted-foreground">Automated calculations with full audit trail</p>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  Ready for Approval
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="rounded-md border p-3 bg-background/50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">Batch Payout #PAY-2026-04</span>
                    <p className="text-[10px] text-muted-foreground">14 Creator Commission Splits</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">Rp 94.600.000</span>
                    <span className="block text-[9px] text-brand font-medium">Ready for Payout</span>
                  </div>
                </div>

                <div className="rounded-md border p-3 bg-background/50 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground">Brand Settlement — Somethinc</span>
                    <p className="text-[10px] text-muted-foreground">Invoice #INV-2026-089 (March Campaign)</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">Rp 84.200.000</span>
                    <span className="block text-[9px] text-amber-600 font-medium">Payment Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              04 — Financial Precision
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Keep the numbers under control.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Say goodbye to manual spreadsheet commission math. Automatically compute creator
              commission splits from verified campaign and live GMVs, generate payout batches, and
              track client brand settlements.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Automated commission split formulas per creator contract</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Structured creator payout approval batches</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                <span>Brand invoice settlement ledger with status tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
