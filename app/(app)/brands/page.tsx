import Link from "next/link";
import { Building2, Search } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { BRAND_STATUS } from "@/lib/constants";
import { listBrands } from "@/lib/services/brands";
import type { BrandListFilters } from "@/lib/services/brands";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactIDR, formatNumber } from "@/lib/format";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function BrandsPage(props: PageProps<"/brands">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const filters: BrandListFilters = {
    q: str(searchParams.q),
    status: str(searchParams.status),
    industry: str(searchParams.industry),
    page: num(searchParams.page) ?? 1,
  };

  const [result, industryRows] = await Promise.all([
    listBrands(user.agencyId, filters),
    prisma.brand.findMany({
      where: { agencyId: user.agencyId, industry: { not: null } },
      select: { industry: true },
      distinct: ["industry"],
      orderBy: { industry: "asc" },
    }),
  ]);
  const canWrite = can(user.role as Role, "brand", "write");

  const industries = industryRows.map((r) => r.industry).filter(Boolean) as string[];

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Brands" description={`${result.total} brand klien agensi`}>
        {canWrite ? (
          <Link
            href="/brands/new"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
          >
            Tambah Brand
          </Link>
        ) : null}
      </PageHeader>

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Cari nama brand…" className="w-56 pl-8" />
        </div>
        <Select name="status" defaultValue={filters.status ?? ""} className="w-36">
          <option value="">Semua status</option>
          {BRAND_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select name="industry" defaultValue={filters.industry ?? ""} className="w-44">
          <option value="">Semua industri</option>
          {industries.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/brands"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tidak ada brand"
          description={
            filters.q || filters.status || filters.industry
              ? "Coba ubah filter atau kata kunci pencarian."
              : "Belum ada brand di agensi ini. Tambahkan brand pertama Anda."
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-52">Brand</TableHead>
                <TableHead>Industri</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Campaign</TableHead>
                <TableHead className="text-center">Creator Aktif</TableHead>
                <TableHead className="text-center">Produk</TableHead>
                <TableHead className="text-right">GMV 30d</TableHead>
                <TableHead className="text-right">Revenue Agensi 30d</TableHead>
                <TableHead>Kontak Utama</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Link href={`/brands/${b.id}`} className="flex items-center gap-2.5 hover:underline">
                      <Avatar name={b.name} src={b.logoUrl} className="h-8 w-8 text-xs" />
                      <span className="leading-tight">
                        <span className="block font-medium">{b.name}</span>
                        {b.website ? (
                          <span className="block max-w-44 truncate text-xs text-muted-foreground">{b.website}</span>
                        ) : null}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{b.industry ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    {b.activeCampaigns > 0 ? (
                      <span>
                        <span className="font-medium">{b.activeCampaigns}</span>
                        <span className="text-muted-foreground"> / {b.campaignCount}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{b.campaignCount}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{b.activeCreators}</TableCell>
                  <TableCell className="text-center">{formatNumber(b.productCount)}</TableCell>
                  <TableCell className="font-medium">{formatCompactIDR(b.gmv30)}</TableCell>
                  <TableCell>{formatCompactIDR(b.agencyRevenue30)}</TableCell>
                  <TableCell className="text-muted-foreground">{b.primaryContact ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/brands"
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
