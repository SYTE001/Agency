import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity as ActivityIcon,
  BadgePercent,
  CalendarDays,
  CheckSquare,
  Eye,
  Radio,
  ShoppingCart,
  StickyNote,
  Target,
  TrendingUp,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { getLiveDetail } from "@/lib/services/live";
import { getNotes } from "@/lib/services/activity";
import { getAgencyTimezone } from "@/lib/services/common";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactIDR, formatDateTime, formatNumber, formatPercent, timeAgo } from "@/lib/format";
import { LiveStatusButton } from "@/components/live/live-status-button";
import { RecordResultsForm } from "@/components/live/record-results-form";
import { LiveNoteForm } from "@/components/live/live-note-form";

const NEXT_STATUSES: Record<string, string[]> = {
  Scheduled: ["Preparing", "Cancelled"],
  Preparing: ["Live", "Cancelled"],
  Live: ["NeedsReview", "Cancelled"],
  NeedsReview: ["Ended"],
  Ended: [],
  Cancelled: [],
};

const STATUS_LABEL: Record<string, string> = {
  Scheduled: "Terjadwal",
  Preparing: "Persiapan",
  Live: "Mulai LIVE",
  Ended: "Selesai",
  Cancelled: "Batalkan",
  NeedsReview: "Perlu Review",
};

export default async function LiveDetailPage(props: PageProps<"/live/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const detail = await getLiveDetail(user.agencyId, id);
  if (!detail) notFound();

  const { session, metrics, activity } = detail;
  const canWrite = can(user.role, "live", "write");

  // Rendered timestamps (start/end, metric snapshots, relative note/activity
  // times) follow the tenant's business timezone, not the server's.
  const [notes, tasks, tz] = await Promise.all([
    getNotes("LiveSession", session.id, user.agencyId),
    prisma.task.findMany({
      where: { agencyId: user.agencyId, relatedType: "LiveSession", relatedId: session.id },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    getAgencyTimezone(user.agencyId),
  ]);

  const targetGmv = session.targetGmv.toNumber();
  const actualGmv = session.actualGmv.toNumber();
  const achieved = targetGmv > 0 ? (actualGmv / targetGmv) * 100 : 0;
  const moves = NEXT_STATUSES[session.status] ?? [];

  const stats = [
    { label: "GMV Aktual", value: actualGmv > 0 ? formatCompactIDR(actualGmv) : "—" },
    {
      label: "Target GMV",
      value: targetGmv > 0 ? formatCompactIDR(targetGmv) : "—",
      sub: targetGmv > 0 && actualGmv > 0 ? `${formatPercent(achieved, 0)} tercapai` : undefined,
    },
    { label: "Viewers", value: session.viewers > 0 ? formatNumber(session.viewers) : "—" },
    { label: "Orders", value: session.orders > 0 ? formatNumber(session.orders) : "—" },
    { label: "Konversi", value: session.conversionRate > 0 ? formatPercent(session.conversionRate) : "—" },
  ];

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">
            {session.room ? `${session.room} · ${session.creator.displayName}` : session.creator.displayName}
          </h1>
          <StatusBadge status={session.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href={`/creators/${session.creator.id}`} className="hover:text-foreground hover:underline">
            {session.creator.displayName} (@{session.creator.username})
          </Link>
          {session.campaign ? (
            <>
              {" · "}
              <Link href={`/campaigns/${session.campaign.id}`} className="hover:text-foreground hover:underline">
                {session.campaign.name}
              </Link>
            </>
          ) : null}
          {session.brand ? <> · brand {session.brand.name}</> : null}
          {session.product ? <> · produk {session.product.name}</> : null}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-base font-semibold">{s.value}</p>
              {"sub" in s && s.sub ? <p className="text-xs text-muted-foreground">{s.sub}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status moves + record results */}
      {canWrite && (moves.length > 0 || session.status === "Live" || session.status === "NeedsReview") ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Radio className="h-4 w-4" />Ubah Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {moves.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {moves.map((status) => (
                  <LiveStatusButton
                    key={status}
                    sessionId={session.id}
                    status={status}
                    label={STATUS_LABEL[status] ?? status}
                    size="default"
                    variant={
                      status === "Cancelled"
                        ? "destructive"
                        : status === "Live"
                          ? "live"
                          : "default"
                    }
                  />
                ))}
              </div>
            ) : null}
            {session.status === "Live" || session.status === "NeedsReview" ? (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="mb-2 text-sm font-medium">Tutup sesi dengan hasil akhir</p>
                <RecordResultsForm sessionId={session.id} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <span className="text-muted-foreground">Waktu mulai</span>
              <span>{formatDateTime(session.startTime, tz)}</span>
              <span className="text-muted-foreground">Waktu selesai</span>
              <span>{session.endTime ? formatDateTime(session.endTime, tz) : "—"}</span>
              <span className="text-muted-foreground">Room / Studio</span>
              <span>{session.room ?? "—"}</span>
              <span className="text-muted-foreground">Operator</span>
              <span>{session.operator?.name ?? "—"}</span>
              <span className="text-muted-foreground">Brand</span>
              <span>
                {session.brand ? (
                  <Link href={`/brands/${session.brand.id}`} className="text-brand hover:underline">
                    {session.brand.name}
                  </Link>
                ) : (
                  "—"
                )}
              </span>
              <span className="text-muted-foreground">Produk</span>
              <span>
                {session.product ? (
                  <Link href="/products" className="text-brand hover:underline">
                    {session.product.name}
                  </Link>
                ) : (
                  "—"
                )}
              </span>
            </div>
            {session.notes ? (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Catatan</p>
                <p>{session.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Metrics timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Metrik Selama LIVE</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                Belum ada metrik tercatat. Snapshot viewers/GMV muncul saat sesi berjalan.
              </p>
            ) : (
              <div className="space-y-2">
                {metrics.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="w-28 shrink-0 font-medium">{formatDateTime(m.timestamp, tz)}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />{formatNumber(m.viewers)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <ShoppingCart className="h-3.5 w-3.5" />{formatNumber(m.orders)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />{formatCompactIDR(m.gmv)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckSquare className="h-4 w-4" />Task</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Tidak ada task terkait.</p>
            ) : (
              <div className="space-y-2.5">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{t.title}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><StickyNote className="h-4 w-4" />Catatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <LiveNoteForm sessionId={session.id} />
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada catatan.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="rounded-md bg-muted/50 p-3 text-sm">
                  <p>{n.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.author.name} · {timeAgo(n.createdAt, tz)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ActivityIcon className="h-4 w-4" />Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
            ) : (
              <div className="space-y-0">
                {activity.map((a, i) => (
                  <div key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < activity.length - 1 ? (
                      <span className="absolute left-1 top-3 h-full w-px bg-border" aria-hidden />
                    ) : null}
                    <span className="relative mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50" />
                    <div className="text-sm">
                      <p className="font-medium">{a.action}</p>
                      {a.details ? <p className="text-xs text-muted-foreground">{a.details}</p> : null}
                      <p className="text-xs text-muted-foreground">
                        {a.actor?.name ?? "Sistem"} · {timeAgo(a.createdAt, tz)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer summary */}
      <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Radio className="h-4 w-4" />GMV {formatCompactIDR(session.actualGmv)}</span>
        <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" />{formatNumber(session.viewers)} viewers</span>
        <span className="inline-flex items-center gap-1.5"><ShoppingCart className="h-4 w-4" />{formatNumber(session.orders)} orders</span>
        <span className="inline-flex items-center gap-1.5"><BadgePercent className="h-4 w-4" />{formatPercent(session.conversionRate)} konversi</span>
        {targetGmv > 0 && actualGmv > 0 && achieved < 50 ? (
          <Badge variant="destructive">Di bawah 50% target</Badge>
        ) : null}
      </div>
    </div>
  );
}
