import { Megaphone } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { getClientReport, PERIODS } from "@/lib/services/reports";
import type { Period } from "@/lib/services/reports";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsNav, ExportLink } from "@/components/reports/reports-nav";
import { formatCompactIDR, formatDate, formatDelta, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function ClientReportPage(props: PageProps<"/reports">) {
  const user = await requireUser();
  if (!can(user.role as Role, "report", "read")) {
    return (
      <div className="p-6">
        <EmptyState
          title="Tidak ada akses"
          description="Role Anda tidak memiliki akses ke laporan."
        />
      </div>
    );
  }
  const searchParams = await props.searchParams;

  const campaigns = await prisma.campaign.findMany({
    where: { agencyId: user.agencyId },
    select: { id: true, name: true, brand: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const campaignId = str(searchParams.campaignId);
  const periodParam = str(searchParams.period) ?? "30d";
  const period: Period = periodParam in PERIODS ? (periodParam as Period) : "30d";

  const report = campaignId ? await getClientReport(user.agencyId, campaignId, period) : null;

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Reports"
        description="Laporan performa campaign untuk client (brand), dibuat dari data yang sudah tercatat"
      >
        {report ? (
          <ExportLink href={`/reports/export/client?campaignId=${report.campaign.id}&period=${period}`} />
        ) : null}
      </PageHeader>

      <ReportsNav active="client" />

      {/* Period + campaign selector */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <Select name="campaignId" defaultValue={campaignId ?? ""} className="w-72">
          <option value="">Pilih campaign…</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.brand.name}
            </option>
          ))}
        </Select>
        <Select name="period" defaultValue={period} className="w-36">
          <option value="30d">30 hari</option>
          <option value="90d">90 hari</option>
        </Select>
        <Button type="submit" variant="secondary">Tampilkan</Button>
      </form>

      {!campaignId ? (
        <EmptyState
          icon={Megaphone}
          title="Pilih campaign"
          description="Pilih salah satu campaign di atas untuk membuat laporan performa bagi client."
        />
      ) : !report ? (
        <EmptyState title="Campaign tidak ditemukan" description="Campaign ini tidak ada di agensi Anda." />
      ) : (
        <>
          {/* Campaign header */}
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{report.campaign.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.campaign.brandName}
                    {report.campaign.brandIndustry ? ` · ${report.campaign.brandIndustry}` : ""} · Periode{" "}
                    {report.period.days} hari (sampai {formatDate(report.period.end)})
                  </p>
                </div>
                <StatusBadge status={report.campaign.status} />
              </div>
              {report.campaign.gmvTarget > 0 ? (
                <div className="space-y-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{
                        width: `${Math.min(100, Math.round((report.totals.gmv / report.campaign.gmvTarget) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    GMV {formatCompactIDR(report.totals.gmv)} dari target {formatCompactIDR(report.campaign.gmvTarget)}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* KPI grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="GMV (dasar komisi)" value={formatCompactIDR(report.totals.gmv)} delta={report.totals.gmvGrowth} />
            <Kpi label="GMV Produk" value={formatCompactIDR(report.totals.productGmv)} delta={report.totals.productGmvGrowth} />
            <Kpi label="Orders Produk" value={formatNumber(report.totals.productOrders)} />
            <Kpi label="Creator Terlibat" value={String(report.totals.creators)} />
            <Kpi
              label="Video"
              value={formatNumber(report.totals.videos)}
              sub={`${formatNumber(report.totals.videosPublished)} tayang`}
            />
            <Kpi label="Sesi LIVE" value={String(report.totals.liveSessions)} sub={`GMV ${formatCompactIDR(report.totals.liveGmv)}`} />
            <Kpi label="Komisi Creator" value={formatCompactIDR(report.totals.commission)} />
            <Kpi label="Revenue Agensi" value={formatCompactIDR(report.totals.agencyRevenue)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <p className="mb-3 text-sm font-semibold">Top Creator</p>
                {report.topCreators.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Belum ada transaksi komisi di periode ini.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Creator</TableHead>
                        <TableHead className="text-right">GMV</TableHead>
                        <TableHead className="text-right">Komisi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topCreators.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell className="text-right">{formatCompactIDR(c.gmv)}</TableCell>
                          <TableCell className="text-right">{formatCompactIDR(c.commission)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="mb-3 text-sm font-semibold">Top Produk</p>
                {report.topProducts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Belum ada data GMV produk untuk campaign ini di periode ini.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">GMV</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.topProducts.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{formatCompactIDR(p.gmv)}</TableCell>
                          <TableCell className="text-right">{formatNumber(p.orders)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            GMV dan komisi mengikuti basis perhitungan komisi agensi (PLAN §12): Komisi Creator = GMV × rate%,
            Revenue Agensi = Komisi × share%. Angka LIVE diambil dari hasil sesi yang sudah dicatat.
          </p>
        </>
      )}
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
