import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { getInternalReport, PERIODS } from "@/lib/services/reports";
import type { Period } from "@/lib/services/reports";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ReportsNav, ExportLink } from "@/components/reports/reports-nav";
import { formatCompactIDR, formatDate, formatDelta, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function InternalReportPage(props: PageProps<"/reports/internal">) {
  const user = await requireUser();
  if (!can(user.role as Role, "report", "read")) {
    return (
      <div className="p-6">
        <EmptyState title="Tidak ada akses" description="Role Anda tidak memiliki akses ke laporan." />
      </div>
    );
  }
  const searchParams = await props.searchParams;
  const periodParam = str(searchParams.period) ?? "30d";
  const period: Period = periodParam in PERIODS ? (periodParam as Period) : "30d";

  const r = await getInternalReport(user.agencyId, period);

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Reports"
        description="Laporan internal agensi — operasional dan keuangan, dibuat dari data yang sudah tercatat"
      >
        <ExportLink href={`/reports/export/internal?period=${period}`} />
      </PageHeader>

      <ReportsNav active="internal" />

      <form className="flex flex-wrap items-center gap-2" method="get">
        <Select name="period" defaultValue={period} className="w-36">
          <option value="30d">30 hari</option>
          <option value="90d">90 hari</option>
        </Select>
        <Button type="submit" variant="secondary">Tampilkan</Button>
        <span className="text-xs text-muted-foreground">
          Periode {formatDate(r.period.start)} s/d {formatDate(r.period.end)}
        </span>
      </form>

      {/* Headline KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Agency GMV" value={formatCompactIDR(r.gmv)} delta={r.gmvGrowth} />
        <Kpi label="Revenue Agensi" value={formatCompactIDR(r.revenue)} delta={r.revenueGrowth} />
        <Kpi label="Komisi Creator" value={formatCompactIDR(r.commission)} sub={`${r.commissionCount} transaksi`} />
        <Kpi label="Video Dibuat" value={formatNumber(r.creatorProductivity.videos)} sub="di periode ini" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Creator productivity */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Produktivitas Creator</p>
            <dl className="space-y-2 text-sm">
              <Row label="Creator total" value={String(r.creatorProductivity.creatorsTotal)} />
              <Row label="Creator aktif" value={String(r.creatorProductivity.creatorsActive)} tone="text-success" />
              <Row label="Creator nonaktif" value={String(r.creatorProductivity.creatorsInactive)} />
              <Row
                label="Video per creator aktif"
                value={r.creatorProductivity.videosPerCreator.toFixed(1).replace(".", ",")}
              />
            </dl>
          </CardContent>
        </Card>

        {/* Campaign completion */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Penyelesaian Campaign</p>
            <dl className="space-y-2 text-sm">
              <Row label="Campaign aktif" value={String(r.campaigns.active)} />
              <Row label="Campaign selesai" value={String(r.campaigns.completed)} tone="text-success" />
              <Row label="Konten dibuat (periode)" value={formatNumber(r.content.createdInPeriod)} />
              <Row label="Konten tayang (total)" value={formatNumber(r.content.publishedTotal)} />
            </dl>
          </CardContent>
        </Card>

        {/* LIVE performance */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Performa LIVE</p>
            <dl className="space-y-2 text-sm">
              <Row label="Sesi selesai" value={String(r.live.sessions)} />
              <Row label="GMV LIVE" value={formatCompactIDR(r.live.gmv)} />
              <Row label="Orders" value={formatNumber(r.live.orders)} />
              <Row label="Viewers" value={formatNumber(r.live.viewers)} />
            </dl>
          </CardContent>
        </Card>

        {/* Pending tasks */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Task Menunggu</p>
            <dl className="space-y-2 text-sm">
              <Row label="Task terbuka / dikerjakan" value={String(r.tasks.pending)} />
              <Row
                label="Lewat tenggat"
                value={String(r.tasks.overdue)}
                tone={r.tasks.overdue > 0 ? "text-destructive" : "text-success"}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Financial status */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">Status Keuangan</p>
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="Payout creator menunggu" value={formatCompactIDR(r.finance.payoutsPending)} tone={r.finance.payoutsPending > 0 ? "text-warning" : undefined} />
            <Row label="Payout creator dibayar" value={formatCompactIDR(r.finance.payoutsPaid)} tone="text-success" />
            <Row label="Settlement menunggu" value={formatCompactIDR(r.finance.settlementsPending)} tone={r.finance.settlementsPending > 0 ? "text-warning" : undefined} />
            <Row label="Settlement terlambat" value={formatCompactIDR(r.finance.settlementsOverdue)} tone={r.finance.settlementsOverdue > 0 ? "text-destructive" : undefined} />
            <Row label="Settlement dibayar" value={formatCompactIDR(r.finance.settlementsPaid)} tone="text-success" />
          </dl>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Pertumbuhan dihitung terhadap periode {r.period.days} hari sebelumnya. Semua angka berasal dari modul
        LIVE, komisi, payout, dan settlement yang sudah tercatat.
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-base font-semibold">{value}</p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
        {delta !== undefined ? (
          <p
            className={cn(
              "text-xs font-medium",
              delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {formatDelta(delta)} vs periode sebelumnya
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-semibold tabular-nums", tone)}>{value}</dd>
    </div>
  );
}
