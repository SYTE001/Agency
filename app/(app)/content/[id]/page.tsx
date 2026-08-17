import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clapperboard,
  ExternalLink,
  Eye,
  Megaphone,
  RotateCcw,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { getContentDetail } from "@/lib/services/content";
import { getNotes } from "@/lib/services/activity";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactIDR, formatDate, formatNumber, timeAgo } from "@/lib/format";
import { StatusMoveForm } from "@/components/content/status-move-form";
import { ContentNoteForm } from "@/components/content/content-note-form";

const STATUS_LABEL: Record<string, string> = {
  Brief: "Brief",
  Assigned: "Ditugaskan",
  WaitingForDraft: "Menunggu Draft",
  DraftSubmitted: "Draft Masuk",
  Revision: "Revisi",
  Approved: "Disetujui",
  Scheduled: "Terjadwal",
  Published: "Published",
  Rejected: "Ditolak",
  Cancelled: "Dibatalkan",
};

const NEXT_STATUSES: Record<string, string[]> = {
  Brief: ["Assigned", "Cancelled"],
  Assigned: ["WaitingForDraft", "Cancelled"],
  WaitingForDraft: ["DraftSubmitted", "Cancelled"],
  DraftSubmitted: ["Approved", "Revision", "Rejected"],
  Revision: ["DraftSubmitted", "Cancelled"],
  Approved: ["Scheduled", "Published"],
  Scheduled: ["Published", "Cancelled"],
  Published: [],
  Rejected: [],
  Cancelled: [],
};

export default async function ContentDetailPage(props: PageProps<"/content/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const detail = await getContentDetail(user.agencyId, id);
  if (!detail) notFound();

  const { item, activity, tasks } = detail;
  const canWrite = can(user.role as Role, "content", "write");

  const notes = await getNotes("Content", item.id, user.agencyId);

  const moves = NEXT_STATUSES[item.status] ?? [];
  const isOverdue =
    item.dueDate !== null &&
    item.dueDate < new Date() &&
    ["Brief", "Assigned", "WaitingForDraft", "DraftSubmitted", "Revision"].includes(item.status);

  const stats = [
    { label: "GMV Dihasilkan", value: item.gmvGenerated > 0 ? formatCompactIDR(item.gmvGenerated) : "—" },
    { label: "Views", value: item.viewsGenerated > 0 ? formatNumber(item.viewsGenerated) : "—" },
    { label: "Revisi", value: String(item.revisionCount) },
    { label: "Reviewer", value: item.reviewer?.name ?? "—" },
  ];

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">{item.title}</h1>
          <StatusBadge status={item.status} />
          {isOverdue ? <Badge variant="destructive">Terlambat</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href={`/campaigns/${item.campaign.id}`} className="hover:text-foreground hover:underline">
            {item.campaign.name}
          </Link>
          {" · "}
          <Link href={`/creators/${item.creator.id}`} className="hover:text-foreground hover:underline">
            {item.creator.displayName} (@{item.creator.username})
          </Link>
          {item.product ? <> · produk {item.product.name}</> : null}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-base font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status moves */}
      {canWrite && moves.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clapperboard className="h-4 w-4" />Ubah Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {moves.map((status) => (
                <StatusMoveForm
                  key={status}
                  contentId={item.id}
                  status={status}
                  label={STATUS_LABEL[status] ?? status}
                  size="default"
                  variant={status === "Rejected" || status === "Cancelled" ? "destructive" : status === "Approved" || status === "Published" ? "success" : "default"}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Pergerakan revisi dengan feedback dilakukan lewat{" "}
              <Link href="/content/review" className="text-brand hover:underline">Antrian Review</Link>.
            </p>
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
              <span className="text-muted-foreground">Jatuh tempo</span>
              <span className={isOverdue ? "font-medium text-destructive" : ""}>
                {item.dueDate ? formatDate(item.dueDate) : "—"}
              </span>
              <span className="text-muted-foreground">Tanggal publish</span>
              <span>{item.publishDate ? formatDate(item.publishDate) : "—"}</span>
              <span className="text-muted-foreground">URL konten</span>
              {item.contentUrl ? (
                <a href={item.contentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                  Buka <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            {item.brief ? (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Brief</p>
                <p>{item.brief}</p>
              </div>
            ) : null}
            {item.notes ? (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Catatan Internal</p>
                <p>{item.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Revisions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RotateCcw className="h-4 w-4" />Riwayat Revisi</CardTitle>
          </CardHeader>
          <CardContent>
            {item.revisions.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada revisi.</p>
            ) : (
              <div className="space-y-2.5">
                {item.revisions.map((r) => (
                  <div key={r.id} className="rounded-md bg-muted/50 p-3 text-sm">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Revisi v{r.version} · {timeAgo(r.createdAt)}
                    </p>
                    <p>{r.feedback}</p>
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
            <CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />Task</CardTitle>
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
            <ContentNoteForm contentId={item.id} />
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada catatan.</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="rounded-md bg-muted/50 p-3 text-sm">
                  <p>{n.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {n.author.name} · {timeAgo(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Aktivitas</CardTitle>
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
                        {a.actor?.name ?? "Sistem"} · {timeAgo(a.createdAt)}
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
        <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" />{formatNumber(item.viewsGenerated)} views</span>
        <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />GMV {formatCompactIDR(item.gmvGenerated)}</span>
        <span className="inline-flex items-center gap-1.5"><Megaphone className="h-4 w-4" />{item.campaign.name}</span>
      </div>
    </div>
  );
}
