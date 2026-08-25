"use client";

import { useState } from "react";
import {
  TrendingUp,
  Wallet,
  Users,
  Megaphone,
  Radio,
  Building2,
  CheckCircle2,
  Clock,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Circle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function DashboardMockup() {
  const [activeTab, setActiveTab] = useState<"overview" | "creators" | "live" | "finance">("overview");

  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-xl border border-border/80 bg-card shadow-2xl overflow-hidden transition-all">
      {/* Window Frame Bar */}
      <div className="flex h-10 items-center justify-between border-b border-border/70 bg-muted/60 px-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="h-3 w-3 rounded-full bg-red-400/80" />
            <div className="h-3 w-3 rounded-full bg-amber-400/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
          </div>
          <span className="ml-2 hidden font-mono text-[11px] text-muted-foreground sm:inline-block">
            app.agencyos.internal / overview
          </span>
        </div>

        {/* Tab switcher inside mockup */}
        <div className="flex items-center gap-1 rounded-md bg-background/80 p-0.5 border border-border/50 text-[11px] font-medium">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "creators", label: "Creators (42)" },
              { id: "live", label: "LIVE Studio (2)" },
              { id: "finance", label: "Finance" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded px-2.5 py-0.5 transition-colors",
                activeTab === tab.id
                  ? "bg-brand text-brand-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE Ops Active
          </span>
        </div>
      </div>

      {/* Mockup Internal Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-brand-foreground">
            NC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Nexa Commerce Agency
              </span>
              <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                Jakarta (WIB)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">TikTok Shop & LIVE Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search creators, campaigns, LIVE…</span>
            <kbd className="rounded border bg-background px-1 text-[10px]">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Mockup Body Content according to active tab */}
      <div className="p-4 sm:p-6 bg-background/50 space-y-4">
        {activeTab === "overview" && (
          <>
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card className="border-border/70 bg-card shadow-none">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Total GMV (30d)</span>
                    <span className="flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      +18.4% <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="mt-1 text-lg font-bold tracking-tight tabular-nums">
                    Rp 2.458.900.000
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-brand" />
                    <span>Target pacing 106%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-none">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Agency Revenue</span>
                    <span className="text-[10px] font-medium text-muted-foreground">15% Split</span>
                  </div>
                  <div className="mt-1 text-lg font-bold tracking-tight tabular-nums">
                    Rp 368.835.000
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Wallet className="h-3 w-3 text-emerald-500" />
                    <span>Net agency commission</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-none">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Active Creators</span>
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      100% Healthy
                    </span>
                  </div>
                  <div className="mt-1 text-lg font-bold tracking-tight tabular-nums">42 Creators</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3 text-brand" />
                    <span>Beauty, Fashion, Tech</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-none">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Active Campaigns</span>
                    <span className="text-[10px] font-medium text-muted-foreground">8 Brands</span>
                  </div>
                  <div className="mt-1 text-lg font-bold tracking-tight tabular-nums">12 Campaigns</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Megaphone className="h-3 w-3 text-amber-500" />
                    <span>3 ending this week</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Split Operational Rows */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left Column: Daily GMV Pacing + Campaign Progress */}
              <div className="lg:col-span-7 space-y-4">
                {/* Visual GMV Trend Chart Representation */}
                <Card className="border-border/70 bg-card shadow-none">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">GMV Pacing — Last 30 Days</h4>
                        <p className="text-[10px] text-muted-foreground">Daily creator commerce and live stream revenue</p>
                      </div>
                      <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                        Average Rp 81.9M / day
                      </span>
                    </div>

                    {/* Styled Chart Bars SVG */}
                    <div className="h-28 w-full flex items-end gap-1 sm:gap-1.5 pt-2 pb-1 px-1 border-b border-border/40">
                      {[
                        45, 52, 48, 60, 55, 70, 65, 80, 75, 90, 85, 95, 88, 102, 94, 110, 105, 120,
                        115, 125, 118, 135, 130, 142, 138, 150, 145, 160, 155, 170,
                      ].map((val, idx) => (
                        <div
                          key={idx}
                          className="group relative flex-1 flex flex-col justify-end items-center h-full"
                        >
                          <div
                            className={cn(
                              "w-full rounded-t-xs transition-all duration-200",
                              idx >= 27
                                ? "bg-brand"
                                : idx % 7 === 0
                                  ? "bg-brand/80"
                                  : "bg-brand/40 group-hover:bg-brand/70",
                            )}
                            style={{ height: `${(val / 170) * 100}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Day 01</span>
                      <span>Day 15 (Mid-Month Peak)</span>
                      <span>Today (Rp 138.4M)</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Campaigns Tracker */}
                <Card className="border-border/70 bg-card shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">Active Campaign Progress</h4>
                      <span className="text-[11px] font-medium text-brand">2 Active Milestones</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-foreground">Wardah Ramadan Mega Fest</span>
                            <span className="ml-2 text-[10px] text-muted-foreground">16 Creators</span>
                          </div>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">85.6%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-brand" style={{ width: "85.6%" }} />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>GMV: Rp 642.000.000</span>
                          <span>Target: Rp 750.000.000</span>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-foreground">Skintific Glow Barrier Launch</span>
                            <span className="ml-2 text-[10px] text-muted-foreground">12 Creators</span>
                          </div>
                          <span className="font-mono font-semibold text-brand">77.8%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-brand" style={{ width: "77.8%" }} />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                          <span>GMV: Rp 389.000.000</span>
                          <span>Target: Rp 500.000.000</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Today's LIVE studio + Settlements */}
              <div className="lg:col-span-5 space-y-4">
                {/* LIVE Studio Monitor */}
                <Card className="border-border/70 bg-card shadow-none">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                        <h4 className="text-xs font-semibold text-foreground">LIVE Studio Today</h4>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">Room 1 & 2 Busy</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">Sarah Azhari</span>
                              <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                LIVE NOW
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Studio A · Op: Budi Santoso</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-foreground">Rp 48.5M</div>
                          <div className="text-[9px] text-muted-foreground">Target: 45M (Met)</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/20 p-2.5">
                        <div className="flex items-center gap-2.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">Rizky Pratama</span>
                              <span className="rounded bg-muted px-1 py-0.2 text-[9px] font-medium text-muted-foreground">
                                19:00 WIB
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Studio B · Op: Andi Wijaya</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-foreground">Rp 60.0M</div>
                          <div className="text-[9px] text-muted-foreground">Target Pacing</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Finance & Payout Ledger Snippet */}
                <Card className="border-border/70 bg-card shadow-none">
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">Recent Settlements</h4>
                      <span className="text-[10px] font-medium text-muted-foreground">Auto-calculated</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between rounded border border-border/40 p-2">
                        <div className="flex items-center gap-2">
                          <Avatar name="Amanda Putri" className="h-6 w-6 text-[10px]" />
                          <div>
                            <span className="font-medium text-foreground">Amanda Putri</span>
                            <span className="block text-[10px] text-muted-foreground">Creator Commission Payout</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground">Rp 14.500.000</span>
                          <span className="block text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ Disbursed
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded border border-border/40 p-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px] font-bold">
                            SO
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Somethinc Official</span>
                            <span className="block text-[10px] text-muted-foreground">Campaign Invoice #INV-889</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground">Rp 84.200.000</span>
                          <span className="block text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                            ● Pending
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {activeTab === "creators" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Creator Roster Directory</span>
              <span className="text-[11px] text-muted-foreground">42 Creators Active Across 3 Categories</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Sarah Azhari", cat: "Beauty & Skincare", followers: "1.2M", health: "Healthy", gmv: "Rp 340.5M" },
                { name: "Amanda Putri", cat: "Fashion & Hijab", followers: "850K", health: "Healthy", gmv: "Rp 210.0M" },
                { name: "Rizky Pratama", cat: "Gadget & Tech", followers: "620K", health: "Healthy", gmv: "Rp 185.2M" },
                { name: "Maya Anggraini", cat: "Mom & Baby", followers: "430K", health: "Healthy", gmv: "Rp 142.8M" },
                { name: "Dimas Setiawan", cat: "Lifestyle & Food", followers: "390K", health: "Watch", gmv: "Rp 98.4M" },
                { name: "Clara Tan", cat: "Beauty & Cosmetics", followers: "710K", health: "Healthy", gmv: "Rp 245.0M" },
              ].map((c) => (
                <div key={c.name} className="flex items-center justify-between rounded-lg border border-border/70 bg-card p-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} className="h-8 w-8 text-xs" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">{c.cat} · {c.followers}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-foreground">{c.gmv}</div>
                    <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {c.health}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "live" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">LIVE Studio Shift Schedule</span>
              <span className="text-[11px] text-muted-foreground">3 Studio Rooms Active</span>
            </div>
            <div className="space-y-2">
              {[
                { room: "Studio 1 — Beauty Arena", host: "Sarah Azhari", op: "Budi Santoso", time: "14:00 - 18:00 WIB", status: "LIVE NOW", gmv: "Rp 48.5M / Rp 45M" },
                { room: "Studio 2 — Tech Zone", host: "Rizky Pratama", op: "Andi Wijaya", time: "19:00 - 23:00 WIB", status: "Scheduled", gmv: "Target Rp 60M" },
                { room: "Studio 3 — Lifestyle Room", host: "Maya Anggraini", op: "Rina Marlina", time: "09:00 - 13:00 WIB", status: "Completed", gmv: "Rp 72.4M (120%)" },
              ].map((item) => (
                <div key={item.room} className="flex items-center justify-between rounded-lg border border-border/70 bg-card p-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{item.room}</span>
                      <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-semibold", item.status === "LIVE NOW" ? "bg-red-500/20 text-red-600 dark:text-red-400" : item.status === "Scheduled" ? "bg-blue-500/20 text-blue-600" : "bg-emerald-500/20 text-emerald-600")}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Host: <span className="font-medium text-foreground">{item.host}</span> · Operator: <span className="font-medium text-foreground">{item.op}</span></p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-foreground">{item.gmv}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Financial Ledger & Settlement Engine</span>
              <span className="text-[11px] text-muted-foreground">Automated Split & Batch Payouts</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border/70 bg-card p-3.5 space-y-2">
                <div className="text-xs font-semibold text-foreground">Creator Commission Batches</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span>Batch #PAY-2026-03</span>
                    <span className="font-semibold text-emerald-600">Rp 184.200.000 (Paid)</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Batch #PAY-2026-04</span>
                    <span className="font-semibold text-amber-600">Rp 94.600.000 (Ready for Approval)</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-card p-3.5 space-y-2">
                <div className="text-xs font-semibold text-foreground">Brand Invoice Settlements</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between border-b pb-1">
                    <span>Wardah Beauty (Feb Settlement)</span>
                    <span className="font-semibold text-emerald-600">Rp 112.500.000 (Settled)</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Somethinc Official (March)</span>
                    <span className="font-semibold text-amber-600">Rp 84.200.000 (Awaiting Payment)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
