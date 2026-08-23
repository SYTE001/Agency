import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Package, Search } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { listProducts } from "@/lib/services/products";
import type { ProductListFilters } from "@/lib/services/products";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactIDR, formatIDR, formatNumber } from "@/lib/format";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

// Whitelist URL input — never cast arbitrary strings into the filter type.
const SORT_FIELDS = new Set(["name", "price", "gmv"]);

export default async function ProductsPage(props: PageProps<"/products">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const rawSortBy = str(searchParams.sortBy);
  const filters: ProductListFilters = {
    q: str(searchParams.q),
    brandId: str(searchParams.brandId),
    status: str(searchParams.status),
    category: str(searchParams.category),
    sortBy: rawSortBy && SORT_FIELDS.has(rawSortBy)
      ? (rawSortBy as ProductListFilters["sortBy"])
      : undefined,
    sortDir: str(searchParams.sortDir) === "asc" ? "asc" : "desc",
    page: num(searchParams.page) ?? 1,
  };

  const [result, brands, categoryRows] = await Promise.all([
    listProducts(user.agencyId, filters),
    prisma.brand.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { agencyId: user.agencyId, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);
  const canWrite = can(user.role, "product", "write");
  const categories = categoryRows.map((r) => r.category).filter(Boolean) as string[];

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Products" description={`${result.total} produk di katalog agensi`}>
        {canWrite ? (
          <Link
            href="/products/new"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Tambah Produk
          </Link>
        ) : null}
      </PageHeader>

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Cari nama produk…" className="w-56 pl-8" />
        </div>
        <Select name="brandId" defaultValue={filters.brandId ?? ""} className="w-44">
          <option value="">Semua brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Select name="category" defaultValue={filters.category ?? ""} className="w-40">
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select name="status" defaultValue={filters.status ?? ""} className="w-36">
          <option value="">Semua status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/products"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Tidak ada produk"
          description={
            filters.q || filters.brandId || filters.status || filters.category
              ? "Coba ubah filter atau kata kunci pencarian."
              : "Belum ada produk di agensi ini. Tambahkan produk pertama Anda."
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead label="Produk" sortBy="name" current={filters.sortBy} dir={filters.sortDir ?? "asc"} params={searchParams} className="min-w-52" />
                <TableHead>Brand</TableHead>
                <TableHead>Kategori</TableHead>
                <SortHead label="Harga" sortBy="price" current={filters.sortBy} dir={filters.sortDir ?? "asc"} params={searchParams} className="text-right" />
                <TableHead>Status</TableHead>
                <SortHead label="GMV 30d" sortBy="gmv" current={filters.sortBy} dir={filters.sortDir ?? "asc"} params={searchParams} className="text-right" />
                <TableHead className="text-right">Order 30d</TableHead>
                <TableHead className="text-right">Unit 30d</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/products/${p.id}`} className="leading-tight hover:underline">
                      <span className="block font-medium">{p.name}</span>
                      {p.sku ? <span className="block text-xs text-muted-foreground">SKU {p.sku}</span> : null}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.brandId ? (
                      <Link href={`/brands/${p.brandId}`} className="hover:text-foreground hover:underline">
                        {p.brandName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.category ?? "—"}</TableCell>
                  <TableCell className="text-right">{formatIDR(p.price)}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="font-medium">{formatCompactIDR(p.gmv30)}</TableCell>
                  <TableCell className="text-right">{formatNumber(p.orders30)}</TableCell>
                  <TableCell className="text-right">{formatNumber(p.units30)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/products"
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

function SortHead({
  label,
  sortBy,
  current,
  dir,
  params,
  className,
}: {
  label: string;
  sortBy: NonNullable<ProductListFilters["sortBy"]>;
  current?: ProductListFilters["sortBy"];
  dir: "asc" | "desc";
  params: Record<string, string | string[] | undefined>;
  className?: string;
}) {
  const active = current === sortBy;
  // Default direction per column: name reads naturally A→Z, price/GMV top-first.
  const defaultDir = sortBy === "name" ? "asc" : "desc";
  const nextDir = !active ? defaultDir : dir === "asc" ? "desc" : "asc";
  const p = new URLSearchParams(
    Object.entries(flattenParams(params)).filter(([k]) => k !== "page"),
  );
  p.set("sortBy", sortBy);
  p.set("sortDir", nextDir);
  return (
    <TableHead className={className}>
      <Link href={`/products?${p.toString()}`} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {active ? (
          dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </Link>
    </TableHead>
  );
}
