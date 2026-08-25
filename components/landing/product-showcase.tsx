"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Radio,
  Users,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<"overview" | "live" | "creators" | "finance">("overview");

  return (
    <section id="showcase" className="border-b border-border/70 bg-subtle/40 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Product In Action
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A single workspace built for the entire team.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Switch between high-level GMV pacing, live stream studio schedules, creator directories, and finance ledgers in seconds.
          </p>

          {/* Tab Switcher */}
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-card p-1.5 shadow-2xs">
            {[
              { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
              { id: "live", label: "Studio LIVE Scheduling", icon: Radio },
              { id: "creators", label: "Creator Roster", icon: Users },
              { id: "finance", label: "Commissions & Settlements", icon: Wallet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-brand text-brand-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-subtle",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product UI Frame */}
        <div className="mt-12 overflow-hidden rounded-xl border border-border/80 bg-card shadow-lg">
          {/* App Window Chrome */}
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="h-3 w-3 rounded-full bg-border" />
              <span className="h-3 w-3 rounded-full bg-border" />
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span>Agency OS — Kreatif Nusantara (Jakarta, WIB)</span>
            </div>
            <div className="text-[11px] font-mono text-muted-foreground">
              Role: Owner
            </div>
          </div>

          {/* Dynamic Content Panel */}
          <div className="p-6 sm:p-8">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/70 bg-subtle p-4">
                    <div className="text-xs text-muted-foreground font-medium">30-Day Total GMV</div>
                    <div className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      Rp 1.482.500.000
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      +18.4% vs prev period
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-subtle p-4">
                    <div className="text-xs text-muted-foreground font-medium">Agency Net Revenue</div>
                    <div className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      Rp 148.250.000
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                      10% avg agency split
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-subtle p-4">
                    <div className="text-xs text-muted-foreground font-medium">Active Creators</div>
                    <div className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      42 Roster
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                      38 Healthy · 4 Watch
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-subtle p-4">
                    <div className="text-xs text-muted-foreground font-medium">Today&apos;s LIVE Shifts</div>
                    <div className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      6 Broadcasts
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-brand">
                      3 Active Now in Studios
                    </div>
                  </div>
                </div>

                {/* Split Row: Campaigns & Alerts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="lg:col-span-8 rounded-lg border border-border/70 bg-card p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <h4 className="text-sm font-semibold text-foreground">Active Campaign GMV Pacing</h4>
                      <span className="text-xs text-muted-foreground">March 2026</span>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground">Wardah Ramadan Mega Fest</span>
                          <span className="font-mono text-muted-foreground">Rp 642M / Rp 750M (85.6%)</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: "85.6%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground">Somethinc Skin Barrier Launch</span>
                          <span className="font-mono text-muted-foreground">Rp 480M / Rp 500M (96.0%)</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: "96%" }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground">Erigo Streetwear Drop 04</span>
                          <span className="font-mono text-muted-foreground">Rp 210M / Rp 350M (60.0%)</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: "60%" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 rounded-lg border border-border/70 bg-card p-5 space-y-3">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <AlertCircle className="h-4 w-4 text-brand" />
                      <h4 className="text-sm font-semibold text-foreground">Operational Alerts</h4>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="rounded border border-border/60 bg-subtle p-2.5">
                        <div className="font-medium text-foreground">Batch Payout Ready</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          14 Creator commissions waiting for Owner approval (Rp 94.6M).
                        </div>
                      </div>
                      <div className="rounded border border-border/60 bg-subtle p-2.5">
                        <div className="font-medium text-foreground">Script Review Overdue</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Somethinc Brief #03 for Amanda Putri requires approval.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "live" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Today&apos;s Studio Shift Schedule</h4>
                    <p className="text-xs text-muted-foreground">Live operations across 3 physical studio rooms</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    3 Sessions Active
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      room: "Studio 1 — Beauty Arena",
                      host: "Sarah Azhari",
                      op: "Budi Santoso",
                      campaign: "Wardah Ramadan Mega Fest",
                      time: "14:00 - 18:00 WIB",
                      status: "LIVE NOW",
                      gmv: "Rp 48.500.000 / Rp 45.000.000 (107%)",
                      active: true,
                    },
                    {
                      room: "Studio 2 — Tech & Gadget Zone",
                      host: "Rizky Pratama",
                      op: "Andi Wijaya",
                      campaign: "Baseus Flagship Flash Sale",
                      time: "19:00 - 23:00 WIB",
                      status: "Scheduled",
                      gmv: "Target: Rp 60.000.000",
                      active: false,
                    },
                    {
                      room: "Studio 3 — Lifestyle & Fashion",
                      host: "Maya Anggraini",
                      op: "Rina Marlina",
                      campaign: "Erigo Eid Collection",
                      time: "09:00 - 13:00 WIB",
                      status: "Completed",
                      gmv: "Rp 72.400.000 (120% target)",
                      active: false,
                    },
                  ].map((s) => (
                    <div
                      key={s.room}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 transition-colors",
                        s.active
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-border/70 bg-card",
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{s.room}</span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                              s.status === "LIVE NOW"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : s.status === "Scheduled"
                                ? "bg-brand/10 text-brand"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {s.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Host: <span className="font-medium text-foreground">{s.host}</span> · Operator:{" "}
                          <span className="font-medium text-foreground">{s.op}</span> · Campaign:{" "}
                          <span className="text-foreground">{s.campaign}</span>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-xs font-semibold text-foreground">{s.gmv}</div>
                        <span className="text-[11px] font-mono text-muted-foreground">{s.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "creators" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Talent & Creator Directory</h4>
                    <p className="text-xs text-muted-foreground">42 Managed creators across Beauty, Fashion, and Tech</p>
                  </div>
                  <span className="text-xs text-muted-foreground">All contracts active</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { name: "Sarah Azhari", niche: "Beauty & Skincare", followers: "1.2M", manager: "Dian S.", health: "Healthy", gmv: "Rp 340.5M" },
                    { name: "Amanda Putri", niche: "Fashion & Hijab", followers: "850K", manager: "Dian S.", health: "Healthy", gmv: "Rp 210.0M" },
                    { name: "Rizky Pratama", niche: "Gadget & Tech", followers: "620K", manager: "Bambang H.", health: "Healthy", gmv: "Rp 185.2M" },
                    { name: "Maya Anggraini", niche: "Mom & Baby", followers: "430K", manager: "Bambang H.", health: "Healthy", gmv: "Rp 142.8M" },
                    { name: "Dimas Setiawan", niche: "Food & Beverage", followers: "390K", manager: "Rina P.", health: "Watch", gmv: "Rp 98.4M" },
                    { name: "Clara Tan", niche: "Beauty & Cosmetics", followers: "710K", manager: "Dian S.", health: "Healthy", gmv: "Rp 245.0M" },
                  ].map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between rounded-lg border border-border/70 bg-card p-3.5"
                    >
                      <div>
                        <div className="text-xs font-semibold text-foreground">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {c.niche} · {c.followers}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Mgr: {c.manager}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-foreground">{c.gmv}</div>
                        <span
                          className={cn(
                            "inline-block mt-1 rounded px-1.5 py-0.5 text-[9px] font-semibold",
                            c.health === "Healthy"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {c.health}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "finance" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Commissions & Brand Settlements</h4>
                    <p className="text-xs text-muted-foreground">Automated splits, batch payouts, and invoice reconciliation</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">Prisma Decimal Engine</span>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-border/70 bg-card p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Creator Payout Batches
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between rounded border border-border/60 bg-subtle p-3">
                        <div>
                          <div className="font-semibold text-foreground">Batch #PAY-2026-04</div>
                          <div className="text-[11px] text-muted-foreground">14 Creator Commission Splits</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">Rp 94.600.000</div>
                          <span className="text-[10px] font-semibold text-brand">Ready for Approval</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded border border-border/60 bg-subtle p-3">
                        <div>
                          <div className="font-semibold text-foreground">Batch #PAY-2026-03</div>
                          <div className="text-[11px] text-muted-foreground">12 Creator Commission Splits</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">Rp 184.200.000</div>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Disbursed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-card p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Brand Client Settlements
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between rounded border border-border/60 bg-subtle p-3">
                        <div>
                          <div className="font-semibold text-foreground">Somethinc Official</div>
                          <div className="text-[11px] text-muted-foreground">Invoice #INV-2026-089 (March)</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">Rp 84.200.000</div>
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Payment Pending</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded border border-border/60 bg-subtle p-3">
                        <div>
                          <div className="font-semibold text-foreground">Wardah Beauty Official</div>
                          <div className="text-[11px] text-muted-foreground">Invoice #INV-2026-074 (Feb)</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">Rp 112.500.000</div>
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Settled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
