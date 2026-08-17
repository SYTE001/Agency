import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Building2,
  Megaphone,
  Radio,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Resource, Role } from "@/lib/constants";
import { getOverview } from "@/lib/services/overview";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { GmvChart } from "@/components/overview/gmv-chart";
import { formatCompactIDR, formatDelta, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const idTime = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
const idHour = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "numeric", hour12: false });

function greetingFor(hour: number): string {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

// Where each activity entity lives, for the "Lihat" links in the feed.
const ACTIVITY_HREF: Record<string, (id: string) => string> = {
  Creator: (id) => `/creators/${id}`,
  Brand: (id) => `/brands/${id}`,
  Product: (id) => `/products/${id}`,
  Campaign: (id) => `/campaigns/${id}`,
  ContentItem: (id) => `/content/${id}`,
  LiveSession: (id) => `/live/${id}`,
  Commission: () => `/finance/commissions`,
  CreatorPayout: () => `/finance/payouts`,
  Settlement: () => `/finance/settlements`,
};
const ACTIVITY_LABEL: Record<string, string> = {
  Creator: "Creator",
  Brand: "Brand",
  Product: "Produk",
  Campaign: "Campaign",
  ContentItem: "Konten",
  LiveSession: "LIVE",
  Commission: "Komisi",
  CreatorPayout: "Payout",
  Settlement: "Settlement",
  Task: "Task",
  Agency: "Agensi",
  User: "Anggota",
};

export default async function OverviewPage() {
  const user = await requireUser();
  const overview = await getOverview(user.agencyId);
  const { kpis } = overview;

  // Only surface alerts the user can actually act on (their target module may
  // be off-limits for their role — a dead link is not actionable, PLAN §5).
  const alertResource: Record<string, Resource | undefined> = {
    Creator: "creator",
    Content: "content",
    Campaign: "campaign",
    LiveSession: "live",
    Settlement: "finance",
    Task: "task",
  };
  const alerts = overview.alerts.filter((a) => {
    const res = alertResource[a.entityType];
    return !res || can(user.role as Role, res, "read");
  });

  const now = new Date();
  const hour = Number(idHour.format(now)) % 24;
  const dateLine = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  const r = (res: Resource) => can(user.role as Role, res, "read");
  const kpisRow = [
    {
      label: "Total GMV (30 hari)",
      value: formatCompactIDR(kpis.totalGmv),
      delta: kpis.gmvGrowth,
      icon: TrendingUp,
      href: r("report") ? "/reports" : undefined,
    },
    {
      label: "Revenue Agensi (30 hari)",
      value: formatCompactIDR(kpis.agencyRevenue),
      icon: Wallet,
      href: r("finance") ? "/finance" : undefined,
    },
    {
      label: "Creator Aktif",
      value: String(kpis.activeCreators),
      icon: Users,
      href: r("creator") ? "/creators" : undefined,
    },
    {
      label: "Campaign Aktif",
      value: String(kpis.activeCampaigns),
      icon: Megaphone,
      href: r("campaign") ? "/campaigns" : undefined,
    },
  ];

  return (
    <div className="space-y-5 p-6">
      {/* Greeting / date */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{greetingFor(hour)}, {user.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{dateLine} · Ringkasan operasional agensi Anda</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpisRow.map((k) => {
          const Icon = k.icon;
          const body = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">{k.label}</span>
                <span className="block text-base font-semibold">{k.value}</span>
              </span>
              {k.delta !== undefined ? (
                <span
                  className={cn(
                    "ml-auto text-xs font-medium",
                    k.delta > 0 ? "text-success" : k.delta < 0 ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {formatDelta(k.delta)}
                </span>
              ) : null}
            </>
          );
          const cls = "flex items-center gap-3 transition-colors";
          return k.href ? (
            <Link key={k.label} href={k.href} className={cls}>
              <Card className="w-full hover:bg-accent/50">
                <CardContent className="flex items-center gap-3 p-4">{body}</CardContent>
              </Card>
            </Link>
          ) : (
            <Card key={k.label}>
              <CardContent className={cn(cls, "p-4")}>{body}</CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Brand Aktif</span>
            </div>
            <span className="text-base font-semibold">{kpis.activeBrands}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">LIVE Hari Ini</span>
            </div>
            <span className="text-base font-semibold">{overview.liveToday.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">GMV dari LIVE (30h)</span>
            </div>
            <span className="text-base font-semibold">{formatCompactIDR(kpis.liveGmv30)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Settlement Menunggu</span>
            </div>
            <div className="text-right">
              {r("finance") ? (
                <Link
                  href="/finance/settlements"
                  className="text-base font-semibold text-brand hover:underline"
                >
                  {formatCompactIDR(kpis.pendingSettlements)}
                </Link>
              ) : (
                <span className="text-base font-semibold">{formatCompactIDR(kpis.pendingSettlements)}</span>
              )}
              <span className="block text-xs text-muted-foreground">
                {kpis.pendingSettlementCount} settlement
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance chart */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">GMV Harian — 30 hari terakhir</p>
            <span className="text-xs text-muted-foreground">
              Total {formatCompactIDR(kpis.totalGmv)}
            </span>
          </div>
          <GmvChart data={overview.gmvDaily} />
        </CardContent>
      </Card>

      {/* Operational alerts — every alert is actionable (PLAN §15) */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <BellRing className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Peringatan Operasional</p>
            {alerts.length > 0 ? (
              <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                {alerts.length}
              </span>
            ) : null}
          </div>
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tidak ada peringatan. Semua indikator operasional dalam kondisi baik.
            </p>
          ) : (
            <ul className="divide-y">
              {alerts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        a.severity === "critical" ? "bg-destructive" : a.severity === "warning" ? "bg-warning" : "bg-success",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">{a.message}</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">{a.entityType}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand">
                      Lihat
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Campaign progress */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Progres Campaign Aktif</p>
              {r("campaign") ? (
                <Link href="/campaigns?view=active" className="text-xs font-medium text-brand hover:underline">
                  Lihat semua
                </Link>
              ) : null}
            </div>
            {overview.campaignProgress.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada campaign aktif.</p>
            ) : (
              <ul className="space-y-3">
                {overview.campaignProgress.map((c) => {
                  const pct = c.gmvTarget > 0 ? Math.min(100, Math.round((c.actualGmv / c.gmvTarget) * 100)) : 0;
                  return (
                    <li key={c.id}>
                      {r("campaign") ? (
                        <Link
                          href={`/campaigns/${c.id}`}
                          className="block rounded-md border p-3 transition-colors hover:bg-accent"
                        >
                          <CampaignRow c={c} pct={pct} />
                        </Link>
                      ) : (
                        <div className="rounded-md border p-3">
                          <CampaignRow c={c} pct={pct} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* LIVE today */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">LIVE Hari Ini</p>
              {r("live") ? (
                <Link href="/live" className="text-xs font-medium text-brand hover:underline">
                  Jadwal lengkap
                </Link>
              ) : null}
            </div>
            {overview.liveToday.length === 0 ? (
              <EmptyState
                icon={Radio}
                title="Tidak ada sesi LIVE hari ini"
                description="Jadwalkan sesi LIVE dari modul LIVE."
                className="py-8"
              />
            ) : (
              <ul className="space-y-2">
                {overview.liveToday.map((l) => {
                  const row = (
                    <div className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                        {idTime.format(l.startTime)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{l.creator.displayName}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {l.room ?? `Sesi ${l.id.slice(0, 6)}`}
                          {l.operator ? ` · Op: ${l.operator.name}` : " · Tanpa operator"}
                        </span>
                      </span>
                      {l.status === "Ended" && l.targetGmv > 0 ? (
                        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                          {formatCompactIDR(l.actualGmv)} / {formatCompactIDR(l.targetGmv)}
                        </span>
                      ) : null}
                      <StatusBadge status={l.status} />
                    </div>
                  );
                  return (
                    <li key={l.id}>
                      {r("live") ? (
                        <Link href={`/live/${l.id}`} className="block rounded-md border px-3 py-2 transition-colors hover:bg-accent">
                          {row}
                        </Link>
                      ) : (
                        <div className="rounded-md border px-3 py-2">{row}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top creators */}
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Top Creator (GMV 30 hari)</p>
              {r("creator") ? (
                <Link href="/creators" className="text-xs font-medium text-brand hover:underline">
                  Semua creator
                </Link>
              ) : null}
            </div>
            {overview.topCreators.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data GMV creator.</p>
            ) : (
              <ul className="space-y-2">
                {overview.topCreators.map((c, i) => {
                  const row = (
                    <div className="flex items-center gap-3">
                      <span className="w-4 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <Avatar name={c.displayName ?? "?"} src={c.avatarUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.displayName}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.category}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatCompactIDR(c.gmv)}
                      </span>
                    </div>
                  );
                  return (
                    <li key={c.id}>
                      {r("creator") ? (
                        <Link href={`/creators/${c.id}`} className="block rounded-md px-2 py-1.5 transition-colors hover:bg-accent">
                          {row}
                        </Link>
                      ) : (
                        <div className="rounded-md px-2 py-1.5">{row}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Aktivitas Terbaru</p>
            {overview.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
            ) : (
              <ul className="space-y-1">
                {overview.recentActivity.map((a) => {
                  const href = ACTIVITY_HREF[a.entityType]?.(a.entityId);
                  const label = ACTIVITY_LABEL[a.entityType] ?? a.entityType;
                  return (
                    <li key={a.id} className="flex items-baseline gap-2 px-2 py-1.5">
                      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {timeAgo(a.createdAt)}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="font-medium">{a.actor?.name ?? "Sistem"}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span> {label}
                        {a.details ? (
                          <span className="text-muted-foreground"> — {a.details}</span>
                        ) : null}
                      </span>
                      {href ? (
                        <Link href={href} className="shrink-0 text-xs font-medium text-brand hover:underline">
                          Lihat
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CampaignRow({ c, pct }: { c: { name: string; status: string; brand: { name: string }; gmvTarget: number; actualGmv: number }; pct: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{c.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{c.brand.name}</span>
        </span>
        <StatusBadge status={c.status} />
      </div>
      {c.gmvTarget > 0 ? (
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>GMV {formatCompactIDR(c.actualGmv)} dari target {formatCompactIDR(c.gmvTarget)}</span>
            <span className="font-medium text-foreground">{pct}%</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Target GMV belum diatur</p>
      )}
    </div>
  );
}
