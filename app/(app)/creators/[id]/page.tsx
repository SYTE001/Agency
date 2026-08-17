import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Coins, Megaphone, Radio, StickyNote, TrendingUp, Video } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCreatorDetail } from "@/lib/services/creators";
import { getActivity, getNotes } from "@/lib/services/activity";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatDelta,
  formatIDR,
  formatNumber,
  timeAgo,
} from "@/lib/format";

export default async function CreatorDetailPage(props: PageProps<"/creators/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const detail = await getCreatorDetail(user.agencyId, id);
  if (!detail) notFound();

  const { creator, metrics, campaigns, content, lives, commissions, tasks, totals } = detail;
  const [activity, notes] = await Promise.all([
    getActivity("Creator", creator.id, user.agencyId, 15),
    getNotes("Creator", creator.id, user.agencyId),
  ]);

  const stats = [
    { label: "GMV 30 Hari", value: formatIDR(totals.gmv30), delta: formatDelta(totals.gmvGrowth), up: totals.gmvGrowth > 0 },
    { label: "LIVE GMV 30 Hari", value: formatIDR(totals.liveGmv30) },
    { label: "Video 30 Hari", value: formatNumber(totals.videos30) },
    { label: "Komisi 30 Hari", value: formatIDR(totals.commission30) },
    { label: "Total Dibayarkan", value: formatIDR(totals.totalPaid) },
  ];

  return (
    <div className="space-y-5 p-6">
      {/* Profile header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={creator.displayName} src={creator.avatarUrl} className="h-14 w-14 text-lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{creator.displayName}</h1>
              <StatusBadge status={creator.health} kind="health" />
              <StatusBadge status={creator.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              @{creator.username} · {creator.category}
              {creator.manager ? ` · Manager: ${creator.manager.name}` : ""}
            </p>
            {creator.bio ? <p className="mt-1 max-w-xl text-sm text-muted-foreground">{creator.bio}</p> : null}
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Followers</p>
            <p className="font-semibold">{formatCompactNumber(creator.followers)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Engagement</p>
            <p className="font-semibold">{creator.engagementRate.toFixed(1).replace(".", ",")}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Campaign Aktif</p>
            <p className="font-semibold">{campaigns.filter((c) => ["Recruiting", "Active", "ContentReview", "Published"].includes(c.campaign.status)).length}</p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-base font-semibold">{s.value}</p>
              {"delta" in s && s.delta ? (
                <p className={`mt-0.5 text-xs font-medium ${s.up ? "text-success" : "text-destructive"}`}>
                  {s.delta} vs 30 hari sebelumnya
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Campaigns */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" />Campaign</CardTitle>
            <Link href="/campaigns" className="text-xs text-brand hover:underline">Lihat semua</Link>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada campaign.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/campaigns/${c.campaignId}`} className="font-medium hover:underline">
                          {c.campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell><StatusBadge status={c.campaign.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.campaign.startDate ? formatDate(c.campaign.startDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{c.fee.toNumber() > 0 ? formatIDR(c.fee) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Video className="h-4 w-4" />Konten Terakhir</CardTitle>
            <Link href="/content" className="text-xs text-brand hover:underline">Pipeline</Link>
          </CardHeader>
          <CardContent>
            {content.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada konten.</p>
            ) : (
              <div className="space-y-2.5">
                {content.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/content/${item.id}`} className="block truncate font-medium hover:underline">
                        {item.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{item.campaign?.name}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* LIVE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Radio className="h-4 w-4" />Sesi LIVE</CardTitle>
          </CardHeader>
          <CardContent>
            {lives.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada sesi LIVE.</p>
            ) : (
              <div className="space-y-2.5">
                {lives.map((live) => (
                  <div key={live.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/live/${live.id}`} className="block font-medium hover:underline">
                        {live.room ?? "LIVE"} · {formatDateTime(live.startTime)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        GMV {formatIDR(live.actualGmv)} · {formatNumber(live.viewers)} penonton
                      </p>
                    </div>
                    <StatusBadge status={live.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Coins className="h-4 w-4" />Komisi Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada komisi.</p>
            ) : (
              <div className="space-y-2.5">
                {commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{formatIDR(c.creatorCommission)}</p>
                      <p className="text-xs text-muted-foreground">
                        GMV {formatIDR(c.gmv)} · {timeAgo(c.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
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
          <CardContent>
            {notes.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada catatan.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="rounded-md bg-muted/50 p-3 text-sm">
                    <p>{n.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.author.name} · {timeAgo(n.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
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

      {/* Metrics snapshot */}
      {metrics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tren Metrik (45 hari)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricSummary label="Followers terakhir" value={formatCompactNumber(metrics[metrics.length - 1].followers)} />
              <MetricSummary
                label="Followers 45 hari lalu"
                value={formatCompactNumber(metrics[0].followers)}
              />
              <MetricSummary
                label="Total GMV 45 hari"
                value={formatIDR(metrics.reduce((s, m) => s + m.gmv.toNumber(), 0))}
              />
              <MetricSummary
                label="Total video"
                value={formatNumber(metrics.reduce((s, m) => s + m.videos, 0))}
              />
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricSummary label="Avg views terakhir" value={formatCompactNumber(metrics[metrics.length - 1].avgViews)} />
              <MetricSummary label="ER terakhir" value={`${metrics[metrics.length - 1].engagementRate.toFixed(1).replace(".", ",")}%`} />
              <MetricSummary label="LIVE GMV 45 hari" value={formatIDR(metrics.reduce((s, m) => s + m.liveGmv.toNumber(), 0))} />
              <MetricSummary label="Jumlah data harian" value={formatNumber(metrics.length)} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function MetricSummary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
