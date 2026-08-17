import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgePercent,
  CalendarDays,
  Clapperboard,
  Coins,
  FileVideo,
  HandCoins,
  Megaphone,
  Package,
  Radio,
  StickyNote,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { getCampaignDetail } from "@/lib/services/campaigns";
import { getNotes } from "@/lib/services/activity";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { formatCompactIDR, formatDate, formatIDR, formatNumber, formatPercent, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddCreatorForm } from "@/components/campaigns/add-creator-form";
import { CampaignNoteForm } from "@/components/campaigns/campaign-note-form";
import { RemoveCreatorButton } from "@/components/campaigns/remove-creator-button";

export default async function CampaignDetailPage(props: PageProps<"/campaigns/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const detail = await getCampaignDetail(user.agencyId, id);
  if (!detail) notFound();

  const { campaign, creators, products, content, lives, commissions, tasks, activity, contentStatusCounts, finance } = detail;
  const canWrite = can(user.role as Role, "campaign", "write");

  const notes = await getNotes("Campaign", campaign.id, user.agencyId);

  const linkedIds = new Set(creators.map((l) => l.creatorId));
  const availableCreators = await prisma.creator.findMany({
    where: { agencyId: user.agencyId, id: { notIn: [...linkedIds] } },
    select: { id: true, displayName: true, username: true },
    orderBy: { displayName: "asc" },
  });

  const contentGmv = content.reduce((sum, item) => sum + item.gmvGenerated, 0);
  const actualGmv = campaign.actualGmv > 0 ? campaign.actualGmv : contentGmv;
  const progress = campaign.gmvTarget > 0 ? Math.min(1, actualGmv / campaign.gmvTarget) : 0;

  const stats = [
    { label: "Budget", value: formatCompactIDR(campaign.budget) },
    { label: "Target GMV", value: formatCompactIDR(campaign.gmvTarget) },
    { label: "GMV Aktual", value: formatCompactIDR(actualGmv), sub: formatPercent(progress * 100, 0) },
    { label: "Komisi Creator", value: formatCompactIDR(finance.creatorCommission) },
    { label: "Revenue Agensi", value: formatCompactIDR(finance.agencyRevenue) },
  ];

  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{campaign.name}</h1>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            <Link href={`/brands/${campaign.brand.id}`} className="hover:text-foreground hover:underline">
              {campaign.brand.name}
            </Link>
            {campaign.owner ? <> · PIC {campaign.owner.name}</> : null}
            <>
              {" · "}
              {campaign.startDate ? formatDate(campaign.startDate) : "—"}
              {" – "}
              {campaign.endDate ? formatDate(campaign.endDate) : "—"}
            </>
            <> · komisi {campaign.commissionRate}%</>
          </p>
          {campaign.notes ? (
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{campaign.notes}</p>
          ) : null}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-base font-semibold">{s.value}</p>
              {"sub" in s && s.sub ? <p className="text-xs text-muted-foreground">{s.sub} dari target</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium">Progres GMV</p>
            <p className="text-muted-foreground">
              {formatCompactIDR(actualGmv)} / {formatCompactIDR(campaign.gmvTarget)}
            </p>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", progress >= 1 ? "bg-success" : "bg-brand")}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Targets vs actual */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Creator</p>
              <p className="text-base font-semibold">
                {creators.length}
                <span className="text-sm font-normal text-muted-foreground"> / {campaign.creatorTarget || "—"} target</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <FileVideo className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Konten Published</p>
              <p className="text-base font-semibold">
                {contentStatusCounts["Published"] ?? 0}
                <span className="text-sm font-normal text-muted-foreground"> / {campaign.contentTarget || content.length || "—"} target</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Radio className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Sesi LIVE</p>
              <p className="text-base font-semibold">
                {lives.length}
                <span className="text-sm font-normal text-muted-foreground"> / {campaign.liveTarget || "—"} target</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Creator di Campaign Ini</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {creators.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada creator yang ditautkan.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creator</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Followers</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead className="text-right">Kontribusi GMV</TableHead>
                  <TableHead>Status</TableHead>
                  {canWrite ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {creators.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={link.creator.displayName} src={link.creator.avatarUrl} />
                        <div className="leading-tight">
                          <Link href={`/creators/${link.creator.id}`} className="block font-medium hover:underline">
                            {link.creator.displayName}
                          </Link>
                          <span className="block text-xs text-muted-foreground">@{link.creator.username}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{link.creator.category ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatNumber(link.creator.followers)}</TableCell>
                    <TableCell className="text-muted-foreground">{link.role ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatIDR(link.fee)}</TableCell>
                    <TableCell className="text-right">{link.gmvContribution > 0 ? formatCompactIDR(link.gmvContribution) : "—"}</TableCell>
                    <TableCell><StatusBadge status={link.status} /></TableCell>
                    {canWrite ? (
                      <TableCell>
                        <RemoveCreatorButton campaignId={campaign.id} linkId={link.id} />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {canWrite ? (
            <>
              <Separator />
              {availableCreators.length === 0 ? (
                <p className="text-sm text-muted-foreground">Semua creator sudah ditautkan ke campaign ini.</p>
              ) : (
                <AddCreatorForm campaignId={campaign.id} creators={availableCreators} />
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Products */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" />Produk Dipromosikan</CardTitle>
            <Link href="/products" className="text-xs text-brand hover:underline">Katalog</Link>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada produk ditautkan ke campaign ini.</p>
            ) : (
              <div className="space-y-2.5">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/products/${p.product.id}`} className="block truncate font-medium hover:underline">
                        {p.product.name}
                      </Link>
                      {p.product.category ? <p className="text-xs text-muted-foreground">{p.product.category}</p> : null}
                    </div>
                    <span className="font-medium">{formatIDR(p.product.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HandCoins className="h-4 w-4" />Komisi</CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada komisi terhitung untuk campaign ini.</p>
            ) : (
              <div className="space-y-2.5">
                {commissions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{c.creator.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        GMV {formatIDR(c.gmv)} · komisi {formatIDR(c.creatorCommission)}
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

      {/* Content */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Clapperboard className="h-4 w-4" />Konten</CardTitle>
          <Link href="/content" className="text-xs text-brand hover:underline">Pipeline</Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(contentStatusCounts).length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(contentStatusCounts).map(([status, count]) => (
                <Badge key={status} variant="secondary" className="font-normal">
                  {count} {status}
                </Badge>
              ))}
            </div>
          ) : null}
          {content.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Belum ada konten untuk campaign ini.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Judul</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">GMV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={`/content/${item.id}`} className="font-medium hover:underline">
                        {item.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.creator.displayName}</TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.dueDate ? formatDate(item.dueDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.gmvGenerated > 0 ? formatCompactIDR(item.gmvGenerated) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* LIVE sessions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2"><Radio className="h-4 w-4" />Sesi LIVE</CardTitle>
          <Link href="/live" className="text-xs text-brand hover:underline">Modul LIVE</Link>
        </CardHeader>
        <CardContent>
          {lives.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Belum ada sesi LIVE untuk campaign ini.</p>
          ) : (
            <div className="space-y-2.5">
              {lives.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {l.room ?? `LIVE ${l.creator.displayName}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.creator.displayName} · {formatDate(l.startTime)}
                      {l.actualGmv > 0 ? <> · GMV {formatCompactIDR(l.actualGmv)}</> : null}
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            <CampaignNoteForm campaignId={campaign.id} />
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
        <span className="inline-flex items-center gap-1.5"><Coins className="h-4 w-4" />GMV {formatIDR(actualGmv)}</span>
        <span className="inline-flex items-center gap-1.5"><BadgePercent className="h-4 w-4" />Komisi rate {campaign.commissionRate}%</span>
        <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{creators.length} creator</span>
        <span className="inline-flex items-center gap-1.5"><Megaphone className="h-4 w-4" />{content.length} konten</span>
      </div>
    </div>
  );
}
