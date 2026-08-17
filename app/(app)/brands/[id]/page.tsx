import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Coins,
  ExternalLink,
  HandCoins,
  Megaphone,
  Package,
  StickyNote,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { getBrandDetail } from "@/lib/services/brands";
import { getActivity, getNotes } from "@/lib/services/activity";
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
import { formatCompactIDR, formatDate, formatIDR, timeAgo } from "@/lib/format";
import { ContactForm } from "@/components/brands/contact-form";
import { NoteForm } from "@/components/brands/note-form";

export default async function BrandDetailPage(props: PageProps<"/brands/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const detail = await getBrandDetail(user.agencyId, id);
  if (!detail) notFound();

  const { brand, campaigns, products, settlements, tasks, totals } = detail;
  const canWrite = can(user.role, "brand", "write");

  const [activity, notes] = await Promise.all([
    getActivity("Brand", brand.id, user.agencyId, 15),
    getNotes("Brand", brand.id, user.agencyId),
  ]);

  const stats = [
    { label: "Total GMV", value: formatCompactIDR(totals.gmv) },
    { label: "Revenue Agensi", value: formatCompactIDR(totals.agencyRevenue) },
    { label: "Komisi Creator", value: formatCompactIDR(totals.creatorCommission) },
    { label: "Settlement Menunggu", value: formatCompactIDR(totals.pendingSettlement) },
    { label: "Creator Aktif", value: String(totals.activeCreators) },
  ];

  return (
    <div className="space-y-5 p-6">
      {/* Profile header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={brand.name} src={brand.logoUrl} className="h-14 w-14 text-lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{brand.name}</h1>
              <StatusBadge status={brand.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {brand.industry ?? "Industri belum diisi"}
              {brand.website ? (
                <>
                  {" · "}
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                  >
                    {brand.website.replace(/^https?:\/\//, "")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              ) : null}
            </p>
            {brand.description ? (
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{brand.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Campaign</p>
            <p className="font-semibold">{totals.campaignCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Produk</p>
            <p className="font-semibold">{totals.productCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kontak</p>
            <p className="font-semibold">{brand.contacts.length}</p>
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
              <p className="py-4 text-sm text-muted-foreground">Belum ada campaign untuk brand ini.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">GMV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.startDate ? formatDate(c.startDate) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{c.actualGmv.toNumber() > 0 ? formatCompactIDR(c.actualGmv) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" />Produk</CardTitle>
            <Link href="/products" className="text-xs text-brand hover:underline">Katalog</Link>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada produk untuk brand ini.</p>
            ) : (
              <div className="space-y-2.5">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/products/${p.id}`} className="block truncate font-medium hover:underline">
                        {p.name}
                      </Link>
                      {p.sku ? <p className="text-xs text-muted-foreground">SKU {p.sku}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatIDR(p.price)}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HandCoins className="h-4 w-4" />Settlement</CardTitle>
          </CardHeader>
          <CardContent>
            {settlements.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada settlement.</p>
            ) : (
              <div className="space-y-2.5">
                {settlements.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium">{formatIDR(s.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.dueDate ? `Jatuh tempo ${formatDate(s.dueDate)}` : `Dibuat ${timeAgo(s.createdAt)}`}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {brand.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada kontak person.</p>
            ) : (
              <div className="space-y-2.5">
                {brand.contacts.map((c) => (
                  <div key={c.id} className="rounded-md bg-muted/50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{c.name}</p>
                      {c.isPrimary ? <Badge variant="brand">Utama</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[c.role, c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {canWrite ? (
              <>
                <Separator />
                <ContactForm brandId={brand.id} />
              </>
            ) : null}
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
            <NoteForm brandId={brand.id} />
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
        <span className="inline-flex items-center gap-1.5"><Coins className="h-4 w-4" />Komisi {formatIDR(totals.creatorCommission)}</span>
        <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{totals.activeCreators} creator aktif</span>
        <span className="inline-flex items-center gap-1.5"><Megaphone className="h-4 w-4" />{totals.campaignCount} campaign</span>
      </div>
    </div>
  );
}
