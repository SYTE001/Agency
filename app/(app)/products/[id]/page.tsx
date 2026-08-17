import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Megaphone, ShoppingCart, TrendingUp, Video } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProductDetail } from "@/lib/services/products";
import { getActivity } from "@/lib/services/activity";
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
import {
  formatCompactIDR,
  formatCompactNumber,
  formatIDR,
  formatNumber,
  timeAgo,
} from "@/lib/format";

export default async function ProductDetailPage(props: PageProps<"/products/[id]">) {
  const user = await requireUser();
  const { id } = await props.params;

  const detail = await getProductDetail(user.agencyId, id);
  if (!detail) notFound();

  const { product, metrics, campaigns, recentContent, totals } = detail;
  const activity = await getActivity("Product", product.id, user.agencyId, 15);

  const stats = [
    { label: "Harga", value: formatIDR(product.price) },
    { label: "GMV 30 Hari", value: formatCompactIDR(totals.gmv30) },
    { label: "Order 30 Hari", value: formatNumber(totals.orders30) },
    { label: "Unit 30 Hari", value: formatNumber(totals.units30) },
    {
      label: "Avg Order Value",
      value: totals.orders30 > 0 ? formatCompactIDR(totals.gmv30 / totals.orders30) : "—",
    },
  ];

  return (
    <div className="space-y-5 p-6">
      {/* Product header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={product.name} src={product.imageUrl} className="h-14 w-14 text-lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{product.name}</h1>
              <StatusBadge status={product.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {product.sku ? `SKU ${product.sku} · ` : ""}
              {product.category ?? "Kategori belum diisi"}
              {product.brand ? (
                <>
                  {" · Brand: "}
                  <Link href={`/brands/${product.brand.id}`} className="hover:text-foreground hover:underline">
                    {product.brand.name}
                  </Link>
                </>
              ) : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Campaign</p>
            <p className="font-semibold">{campaigns.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Konten</p>
            <p className="font-semibold">{recentContent.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data Harian</p>
            <p className="font-semibold">{metrics.length}</p>
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
        {/* Campaigns featuring this product */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4" />Campaign Terkait</CardTitle>
            <Link href="/campaigns" className="text-xs text-brand hover:underline">Lihat semua</Link>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada campaign untuk produk ini.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((cp) => (
                    <TableRow key={cp.id}>
                      <TableCell>
                        <Link href={`/campaigns/${cp.campaign.id}`} className="font-medium hover:underline">
                          {cp.campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell><StatusBadge status={cp.campaign.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent content featuring this product */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2"><Video className="h-4 w-4" />Konten Terakhir</CardTitle>
            <Link href="/content" className="text-xs text-brand hover:underline">Pipeline</Link>
          </CardHeader>
          <CardContent>
            {recentContent.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">Belum ada konten untuk produk ini.</p>
            ) : (
              <div className="space-y-2.5">
                {recentContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/content/${item.id}`} className="block truncate font-medium hover:underline">
                        {item.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.creator?.displayName ?? "Creator"} · GMV {formatCompactIDR(item.gmvGenerated)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metrics snapshot + activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        {metrics.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Tren Penjualan ({metrics.length} hari)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MetricSummary label="GMV total" value={formatCompactIDR(metrics.reduce((s, m) => s + m.gmv.toNumber(), 0))} />
                <MetricSummary label="Order total" value={formatNumber(metrics.reduce((s, m) => s + m.orders, 0))} />
                <MetricSummary label="Unit total" value={formatNumber(metrics.reduce((s, m) => s + m.units, 0))} />
                <MetricSummary
                  label="GMV hari terakhir"
                  value={formatCompactNumber(metrics[metrics.length - 1].gmv)}
                />
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <MetricSummary
                  label="Order hari terakhir"
                  value={formatNumber(metrics[metrics.length - 1].orders)}
                />
                <MetricSummary
                  label="Rata-rata GMV/hari"
                  value={formatCompactIDR(metrics.reduce((s, m) => s + m.gmv.toNumber(), 0) / metrics.length)}
                />
                <MetricSummary
                  label="Rata-rata order/hari"
                  value={formatNumber(metrics.reduce((s, m) => s + m.orders, 0) / metrics.length)}
                />
                <MetricSummary label="Jumlah data harian" value={formatNumber(metrics.length)} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Tren Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-sm text-muted-foreground">Belum ada data metrik untuk produk ini.</p>
            </CardContent>
          </Card>
        )}

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
        <span className="inline-flex items-center gap-1.5"><Megaphone className="h-4 w-4" />{campaigns.length} campaign</span>
        <span className="inline-flex items-center gap-1.5"><Video className="h-4 w-4" />{recentContent.length} konten</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{metrics.length} hari data</span>
        {product.brand ? <Badge variant="secondary">{product.brand.name}</Badge> : null}
      </div>
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
