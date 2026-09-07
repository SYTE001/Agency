import Link from "next/link";
import { ArrowRight, BellRing, CalendarDays, ChevronRight, Megaphone, Radio, TrendingUp, Users, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Resource } from "@/lib/constants";
import { getAgencyTimezone } from "@/lib/services/common";
import { getOverview } from "@/lib/services/overview";
import { Avatar } from "@/components/ui/avatar";
import { GmvChart } from "@/components/overview/gmv-chart";
import { ActiveProjects } from "@/components/overview/active-projects";
import { formatCompactIDR, formatDelta, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function tenantHourInTz(timeZone: string, date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false });
  return Number(formatter.format(date)) % 24;
}

function greetingFor(hour: number) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

const activityHref: Record<string, (id: string) => string> = {
  Creator: (id) => `/creators/${id}`,
  Brand: (id) => `/brands/${id}`,
  Product: (id) => `/products/${id}`,
  Campaign: (id) => `/campaigns/${id}`,
  ContentItem: (id) => `/content/${id}`,
  LiveSession: (id) => `/live/${id}`,
  Commission: () => "/finance/commissions",
  CreatorPayout: () => "/finance/payouts",
  Settlement: () => "/finance/settlements",
};

export default async function OverviewPage() {
  const user = await requireUser();
  const overview = await getOverview(user.agencyId);
  const timezone = await getAgencyTimezone(user.agencyId);
  const { kpis } = overview;
  const canRead = (resource: Resource) => can(user.role, resource, "read");
  const now = new Date();
  const dateLine = new Intl.DateTimeFormat("id-ID", { timeZone: timezone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  const idTime = new Intl.DateTimeFormat("id-ID", { timeZone: timezone, hour: "2-digit", minute: "2-digit" });
  const alerts = overview.alerts.filter((alert) => {
    const resource: Record<string, Resource | undefined> = { Creator: "creator", Content: "content", Campaign: "campaign", LiveSession: "live", Settlement: "finance", Task: "task" };
    const target = resource[alert.entityType];
    return !target || canRead(target);
  });
  const projects = overview.campaignProgress.map((project) => ({
    ...project,
    gmvTarget: project.gmvTarget.toNumber(),
    actualGmv: project.actualGmv.toNumber(),
  }));

  const metrics = [
    { label: "Total GMV", value: formatCompactIDR(kpis.totalGmv), delta: kpis.gmvGrowth, icon: TrendingUp, href: canRead("report") ? "/reports" : undefined },
    { label: "Revenue agensi", value: formatCompactIDR(kpis.agencyRevenue), icon: Wallet, href: canRead("finance") ? "/finance" : undefined },
    { label: "Creator aktif", value: String(kpis.activeCreators), icon: Users, href: canRead("creator") ? "/creators" : undefined },
  ];

  return (
    <div className="min-h-full bg-[#F5F5F7]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-500">{dateLine}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{greetingFor(tenantHourInTz(timezone, now))}, {user.name}</h1>
            <p className="mt-2 text-sm font-medium text-zinc-500">Ringkasan operasional agensi Anda.</p>
          </div>
          <Link href="/campaigns/new" className="hidden shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 sm:inline-flex">
            <Megaphone className="h-4 w-4" />
            Campaign baru
          </Link>
        </header>

        <section aria-labelledby="overview-title">
          <div className="mb-4 flex items-center justify-between"><h2 id="overview-title" className="text-lg font-semibold tracking-tight text-zinc-900">Overview</h2><span className="text-xs font-medium text-zinc-400">30 hari terakhir</span></div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const content = <><div className="flex items-center justify-between"><span className="text-sm font-medium text-zinc-500">{metric.label}</span><Icon className="h-4 w-4 text-zinc-300" /></div><div className="mt-8 flex items-end gap-3"><span className="text-4xl font-bold tracking-tight text-zinc-900">{metric.value}</span>{metric.delta !== undefined ? <span className={cn("mb-1 rounded-full px-2 py-0.5 text-xs font-semibold", metric.delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>{formatDelta(metric.delta)}</span> : null}</div></>;
              return metric.href ? <Link key={metric.label} href={metric.href} className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-transform hover:-translate-y-0.5">{content}</Link> : <div key={metric.label} className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">{content}</div>;
            })}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="projects-title">
          <div className="mb-4 flex items-end justify-between"><div><h2 id="projects-title" className="text-lg font-semibold tracking-tight text-zinc-900">Active deliverables</h2><p className="mt-1 text-sm font-medium text-zinc-500">Campaign yang sedang bergerak minggu ini.</p></div>{canRead("campaign") ? <Link href="/campaigns?view=active" className="inline-flex items-center gap-1 text-sm font-semibold text-[#007AFF] hover:underline">Lihat semua <ChevronRight className="h-4 w-4" /></Link> : null}</div>
          <ActiveProjects projects={projects} />
        </section>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]" aria-labelledby="performance-title"><div className="mb-5 flex items-center justify-between"><h2 id="performance-title" className="font-semibold tracking-tight text-zinc-900">GMV harian</h2><span className="text-sm font-medium text-zinc-500">Total {formatCompactIDR(kpis.totalGmv)}</span></div><GmvChart data={overview.gmvDaily} timeZone={timezone} /></section>
          <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]" aria-labelledby="today-title"><div className="mb-5 flex items-center justify-between"><h2 id="today-title" className="font-semibold tracking-tight text-zinc-900">Hari ini</h2><CalendarDays className="h-4 w-4 text-zinc-300" /></div><div className="space-y-4"><div className="flex items-center justify-between"><span className="text-sm font-medium text-zinc-500">Campaign aktif</span><span className="font-semibold text-zinc-900">{kpis.activeCampaigns}</span></div><div className="flex items-center justify-between"><span className="text-sm font-medium text-zinc-500">Brand aktif</span><span className="font-semibold text-zinc-900">{kpis.activeBrands}</span></div><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-medium text-zinc-500"><Radio className="h-4 w-4" /> LIVE terjadwal</span><span className="font-semibold text-zinc-900">{overview.liveToday.length}</span></div><div className="flex items-center justify-between"><span className="text-sm font-medium text-zinc-500">Settlement menunggu</span><span className="font-semibold text-zinc-900">{formatCompactIDR(kpis.pendingSettlements)}</span></div></div></section>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]" aria-labelledby="live-title"><div className="mb-4 flex items-center justify-between"><h2 id="live-title" className="font-semibold tracking-tight text-zinc-900">LIVE hari ini</h2>{canRead("live") ? <Link href="/live" className="text-sm font-semibold text-[#007AFF]">Jadwal lengkap</Link> : null}</div>{overview.liveToday.length === 0 ? <p className="py-6 text-sm font-medium text-zinc-500">Tidak ada sesi LIVE hari ini.</p> : <ul className="divide-y divide-zinc-100">{overview.liveToday.slice(0, 4).map((live) => <li key={live.id} className="flex items-center gap-3 py-3"><span className="w-12 text-xs font-semibold tabular-nums text-zinc-400">{idTime.format(live.startTime)}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">{live.creator.displayName}</span><span className="text-xs font-medium text-zinc-500">{live.room ?? "Sesi LIVE"}</span></li>)}</ul>}</section>
          <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]" aria-labelledby="alerts-title"><div className="mb-4 flex items-center gap-2"><BellRing className="h-4 w-4 text-zinc-400" /><h2 id="alerts-title" className="font-semibold tracking-tight text-zinc-900">Peringatan operasional</h2>{alerts.length > 0 ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{alerts.length}</span> : null}</div>{alerts.length === 0 ? <p className="py-6 text-sm font-medium text-zinc-500">Semua indikator operasional dalam kondisi baik.</p> : <ul className="divide-y divide-zinc-100">{alerts.slice(0, 4).map((alert) => <li key={alert.id}><Link href={alert.href} className="flex items-center gap-3 py-3 text-sm font-medium text-zinc-700 hover:text-[#007AFF]"><span className={cn("h-2 w-2 shrink-0 rounded-full", alert.severity === "critical" ? "bg-rose-500" : alert.severity === "warning" ? "bg-amber-500" : "bg-emerald-500")} /> <span className="min-w-0 flex-1 truncate">{alert.message}</span><ArrowRight className="h-4 w-4 shrink-0 text-zinc-300" /></Link></li>)}</ul>}</section>
        </div>

        <section className="mt-10 rounded-3xl bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]" aria-labelledby="activity-title"><div className="mb-3 flex items-center justify-between"><h2 id="activity-title" className="font-semibold tracking-tight text-zinc-900">Aktivitas terbaru</h2><span className="text-xs font-medium text-zinc-400">Live feed</span></div>{overview.recentActivity.length === 0 ? <p className="py-6 text-sm font-medium text-zinc-500">Belum ada aktivitas tercatat.</p> : <ul className="divide-y divide-zinc-100">{overview.recentActivity.slice(0, 5).map((activity) => { const href = activityHref[activity.entityType]?.(activity.entityId); return <li key={activity.id} className="flex items-center gap-3 py-3"><Avatar name={activity.actor?.name ?? "Sistem"} className="h-8 w-8" /><span className="min-w-0 flex-1 truncate text-sm text-zinc-600"><span className="font-semibold text-zinc-900">{activity.actor?.name ?? "Sistem"}</span> {activity.action.toLowerCase()}</span><span className="shrink-0 text-xs font-medium text-zinc-400">{timeAgo(activity.createdAt, timezone)}</span>{href ? <Link href={href} aria-label="Lihat aktivitas" className="text-zinc-300 hover:text-[#007AFF]"><ArrowRight className="h-4 w-4" /></Link> : null}</li>; })}</ul>}</section>
      </div>
    </div>
  );
}
