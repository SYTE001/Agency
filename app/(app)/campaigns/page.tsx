import Link from "next/link";
import { Megaphone, Search } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { CAMPAIGN_STATUS } from "@/lib/constants";
import { listCampaigns } from "@/lib/services/campaigns";
import type { CampaignListFilters } from "@/lib/services/campaigns";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactIDR, formatDate, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

const VIEWS = [
  { key: undefined, label: "Semua" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
] as const;

export default async function CampaignsPage(props: PageProps<"/campaigns">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const viewParam = str(searchParams.view);
  const view = viewParam === "active" || viewParam === "upcoming" || viewParam === "completed"
    ? viewParam
    : undefined;

  const filters: CampaignListFilters = {
    q: str(searchParams.q),
    status: str(searchParams.status),
    brandId: str(searchParams.brandId),
    ownerId: str(searchParams.ownerId),
    view,
    page: num(searchParams.page) ?? 1,
  };

  const [result, brands, owners] = await Promise.all([
    listCampaigns(user.agencyId, filters),
    prisma.brand.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const canWrite = can(user.role as Role, "campaign", "write");

  const tabHref = (key?: string) => {
    const params = new URLSearchParams(
      Object.entries(flattenParams(searchParams)).filter(([k]) => k !== "view" && k !== "page"),
    );
    if (key) params.set("view", key);
    const qs = params.toString();
    return qs ? `/campaigns?${qs}` : "/campaigns";
  };

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Campaigns" description={`${result.total} campaign dikelola agensi`}>
        {canWrite ? (
          <Link
            href="/campaigns/new"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Tambah Campaign
          </Link>
        ) : null}
      </PageHeader>

      {/* View tabs (PLAN §4: Active / Upcoming / Completed) */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {VIEWS.map((v) => (
          <Link
            key={v.label}
            href={tabHref(v.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              view === v.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        {view ? <input type="hidden" name="view" value={view} /> : null}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Cari nama campaign…" className="w-56 pl-8" />
        </div>
        <Select name="brandId" defaultValue={filters.brandId ?? ""} className="w-44">
          <option value="">Semua brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Select name="ownerId" defaultValue={filters.ownerId ?? ""} className="w-44">
          <option value="">Semua PIC</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </Select>
        <Select name="status" defaultValue={filters.status ?? ""} className="w-40">
          <option value="">Semua status</option>
          {CAMPAIGN_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/campaigns"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Tidak ada campaign"
          description={
            filters.q || filters.brandId || filters.status || filters.ownerId || view
              ? "Coba ubah filter atau kata kunci pencarian."
              : "Belum ada campaign di agensi ini. Buat campaign pertama Anda."
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-52">Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">Creator</TableHead>
                <TableHead className="text-right">Konten</TableHead>
                <TableHead className="text-right">LIVE</TableHead>
                <TableHead className="min-w-48">GMV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/campaigns/${c.id}`} className="leading-tight hover:underline">
                      <span className="block font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.brandName}</span>
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {c.startDate ? formatDate(c.startDate) : "—"}
                    {" – "}
                    {c.endDate ? formatDate(c.endDate) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{c.creatorCount}</span>
                    <span className="text-muted-foreground"> / {c.creatorTarget || "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{c.contentPublished}</span>
                    <span className="text-muted-foreground"> / {c.contentTarget || c.contentCount || "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{c.liveCount}</span>
                    <span className="text-muted-foreground"> / {c.liveTarget || "—"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{formatCompactIDR(c.actualGmv)}</span>
                      <span className="text-xs text-muted-foreground">
                        target {formatCompactIDR(c.gmvTarget)}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          c.progress >= 1 ? "bg-success" : "bg-brand",
                        )}
                        style={{ width: `${Math.round(c.progress * 100)}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-right text-xs text-muted-foreground">
                      {formatPercent(c.progress * 100, 0)}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/campaigns"
            searchParams={flattenParams(searchParams)}
          />
        </div>
      )}
    </div>
  );
}

function flattenParams(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v !== "") out[k] = v;
  }
  return out;
}
