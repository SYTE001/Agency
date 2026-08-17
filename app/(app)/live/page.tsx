import Link from "next/link";
import { AlertTriangle, CalendarDays, Radio, ShoppingCart } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { LIVE_STATUS } from "@/lib/constants";
import { getLiveDashboard, listLiveSessions } from "@/lib/services/live";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactIDR, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { LiveStatusButton } from "@/components/live/live-status-button";
import { cn } from "@/lib/utils";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function LivePage(props: PageProps<"/live">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const statusParam = str(searchParams.status);
  const filters = {
    status: statusParam && (LIVE_STATUS as readonly string[]).includes(statusParam) ? statusParam : undefined,
    creatorId: str(searchParams.creatorId),
  };

  const [result, dashboard, creators] = await Promise.all([
    listLiveSessions(user.agencyId, filters),
    getLiveDashboard(user.agencyId),
    prisma.creator.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 100,
    }),
  ]);
  const canWrite = can(user.role as Role, "live", "write");

  const kpis = [
    { label: "Sesi Hari Ini", value: String(dashboard.todaySessions), icon: CalendarDays },
    { label: "GMV Hari Ini", value: formatCompactIDR(dashboard.todayGmv), icon: Radio },
    { label: "Orders Hari Ini", value: formatNumber(dashboard.todayOrders), icon: ShoppingCart },
  ];

  return (
    <div className="space-y-5 p-6">
      <PageHeader title="LIVE" description="Jadwal operasional dan performa sesi LIVE commerce">
        <div className="flex items-center gap-2">
          <Link
            href="/live/schedule"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <CalendarDays className="h-4 w-4" />
            Jadwal
          </Link>
          {canWrite ? (
            <Link
              href="/live/new"
              className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
            >
              Jadwalkan LIVE
            </Link>
          ) : null}
        </div>
      </PageHeader>

      {/* LIVE dashboard (PLAN §11) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <k.icon className="h-4 w-4 text-muted-foreground" />
              </span>
              <span>
                <span className="block text-xs text-muted-foreground">{k.label}</span>
                <span className="block text-base font-semibold">{k.value}</span>
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* LIVE NOW */}
        <Card className={cn(dashboard.liveNow.length > 0 && "border-destructive/40")}>
          <CardContent className="p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              {dashboard.liveNow.length > 0 ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                </span>
              ) : (
                <Radio className="h-4 w-4 text-muted-foreground" />
              )}
              LIVE Sekarang
              {dashboard.liveNow.length > 0 ? <span className="text-xs font-normal text-muted-foreground">({dashboard.liveNow.length})</span> : null}
            </p>
            {dashboard.liveNow.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Tidak ada sesi yang sedang tayang.</p>
            ) : (
              <div className="space-y-2">
                {dashboard.liveNow.map((s) => (
                  <Link
                    key={s.id}
                    href={`/live/${s.id}`}
                    className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {s.creator.displayName} {s.room ? `· ${s.room}` : ""}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.campaign?.name ?? "Tanpa campaign"} · {formatNumber(s.viewers)} viewers
                      </span>
                    </span>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming today */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Jadwal Hari Ini
              <span className="text-xs font-normal text-muted-foreground">({dashboard.upcoming.length})</span>
            </p>
            {dashboard.upcoming.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">Tidak ada sesi terjadwal untuk hari ini.</p>
            ) : (
              <div className="space-y-2">
                {dashboard.upcoming.map((s) => (
                  <Link
                    key={s.id}
                    href={`/live/${s.id}`}
                    className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <span className="w-14 shrink-0 text-sm font-semibold">
                      {s.startTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{s.creator.displayName}</span>
                    <StatusBadge status={s.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Underperforming sessions */}
      {dashboard.underperforming.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Sesi Underperforming (GMV &lt; 50% target, 7 hari terakhir)
            </p>
            <div className="space-y-2">
              {dashboard.underperforming.map((s) => (
                <Link
                  key={s.id}
                  href={`/live/${s.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-card px-3 py-2 transition-colors hover:bg-accent"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {s.creator.displayName} {s.room ? `· ${s.room}` : ""}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatCompactIDR(s.actualGmv)} / {formatCompactIDR(s.targetGmv)}
                  </span>
                  <span className="text-sm font-medium text-destructive">
                    {formatPercent(s.targetGmv > 0 ? (s.actualGmv / s.targetGmv) * 100 : 0, 0)}
                  </span>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Sessions table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Semua Sesi</h2>
          <span className="text-xs text-muted-foreground">({result.total})</span>
        </div>

        <form className="flex flex-wrap items-center gap-2" method="get">
          <Select name="status" defaultValue={filters.status ?? ""} className="w-44">
            <option value="">Semua status</option>
            {LIVE_STATUS.map((s) => (
              <option key={s} value={s}>{s === "NeedsReview" ? "Needs Review" : s}</option>
            ))}
          </Select>
          <Select name="creatorId" defaultValue={filters.creatorId ?? ""} className="w-52">
            <option value="">Semua creator</option>
            {creators.map((c) => (
              <option key={c.id} value={c.id}>{c.displayName}</option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">Terapkan</Button>
          <Link
            href="/live"
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Reset
          </Link>
        </form>

        {result.sessions.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="Tidak ada sesi LIVE"
            description={
              filters.status || filters.creatorId
                ? "Coba ubah filter status atau creator."
                : "Belum ada sesi LIVE. Jadwalkan sesi pertama Anda."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-56">Sesi</TableHead>
                  <TableHead>Mulai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Target GMV</TableHead>
                  <TableHead className="text-right">GMV Aktual</TableHead>
                  <TableHead className="text-right">Viewers</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Konversi</TableHead>
                  {canWrite ? <TableHead>Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.sessions.map((s) => {
                  const achieved = s.targetGmv > 0 ? s.actualGmv / s.targetGmv : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/live/${s.id}`} className="group block">
                          <span className="flex items-center gap-2">
                            <Avatar name={s.creatorName} className="h-6 w-6 text-[10px]" />
                            <span className="font-medium group-hover:underline">{s.creatorName}</span>
                          </span>
                          <span className="block pl-8 text-xs text-muted-foreground">
                            {s.room ?? "Room belum ditentukan"}
                            {s.campaignName ? ` · ${s.campaignName}` : ""}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(s.startTime)}</TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.targetGmv > 0 ? formatCompactIDR(s.targetGmv) : "—"}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(s.actualGmv > 0 && s.targetGmv > 0 && achieved < 0.5 && "text-destructive")}>
                          {s.actualGmv > 0 ? formatCompactIDR(s.actualGmv) : "—"}
                        </span>
                        {s.targetGmv > 0 && s.actualGmv > 0 ? (
                          <span className="block text-xs text-muted-foreground">{formatPercent(achieved * 100, 0)} dari target</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.viewers > 0 ? formatNumber(s.viewers) : "—"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.orders > 0 ? formatNumber(s.orders) : "—"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.conversionRate > 0 ? formatPercent(s.conversionRate) : "—"}</TableCell>
                      {canWrite ? (
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {s.status === "Scheduled" ? (
                              <LiveStatusButton sessionId={s.id} status="Preparing" label="Persiapan" />
                            ) : null}
                            {s.status === "Preparing" ? (
                              <LiveStatusButton sessionId={s.id} status="Live" label="Mulai LIVE" variant="live" />
                            ) : null}
                            {(s.status === "Live" || s.status === "NeedsReview") ? (
                              <LiveStatusButton sessionId={s.id} status="Ended" label="Akhiri" variant="success" />
                            ) : null}
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
