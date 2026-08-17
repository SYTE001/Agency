import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { CREATOR_CATEGORIES, CREATOR_HEALTH, CREATOR_STATUS } from "@/lib/constants";
import { listCreators } from "@/lib/services/creators";
import type { CreatorListFilters } from "@/lib/services/creators";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactIDR, formatCompactNumber, formatDelta, formatPercent, timeAgo } from "@/lib/format";
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

export default async function CreatorsPage(props: PageProps<"/creators">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const filters: CreatorListFilters = {
    q: str(searchParams.q),
    category: str(searchParams.category),
    status: str(searchParams.status),
    health: str(searchParams.health),
    managerId: str(searchParams.managerId),
    minFollowers: num(searchParams.minFollowers),
    sortBy: (str(searchParams.sortBy) as CreatorListFilters["sortBy"]) ?? undefined,
    sortDir: str(searchParams.sortDir) === "asc" ? "asc" : "desc",
    page: num(searchParams.page) ?? 1,
  };

  const [result, managers] = await Promise.all([
    listCreators(user.agencyId, filters),
    prisma.user.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const canWrite = can(user.role, "creator", "write");

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Creators" description={`${result.total} kreator dikelola agensi`}>
        {canWrite ? (
          <Link
            href="/creators/new"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Tambah Creator
          </Link>
        ) : null}
      </PageHeader>

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={filters.q}
            placeholder="Cari nama atau username…"
            className="w-56 pl-8"
          />
        </div>
        <Select name="category" defaultValue={filters.category ?? ""} className="w-40">
          <option value="">Semua kategori</option>
          {CREATOR_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <Select name="health" defaultValue={filters.health ?? ""} className="w-36">
          <option value="">Semua health</option>
          {CREATOR_HEALTH.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </Select>
        <Select name="status" defaultValue={filters.status ?? ""} className="w-36">
          <option value="">Semua status</option>
          {CREATOR_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select name="managerId" defaultValue={filters.managerId ?? ""} className="w-44">
          <option value="">Semua manager</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/creators"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak ada creator"
          description={
            filters.q || filters.category || filters.health || filters.status
              ? "Coba ubah filter atau kata kunci pencarian."
              : "Belum ada creator di agensi ini. Tambahkan creator pertama Anda."
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-52">Creator</TableHead>
                <TableHead>Kategori</TableHead>
                <SortHead label="Followers" sortBy="followers" current={filters.sortBy} dir={filters.sortDir} params={searchParams} />
                <SortHead label="ER" sortBy="engagementRate" current={filters.sortBy} dir={filters.sortDir} params={searchParams} />
                <SortHead label="GMV 30d" sortBy="gmv" current={filters.sortBy} dir={filters.sortDir} params={searchParams} />
                <SortHead label="Growth" sortBy="growth" current={filters.sortBy} dir={filters.sortDir} params={searchParams} />
                <TableHead className="text-right">Video</TableHead>
                <TableHead className="text-right">Avg Views</TableHead>
                <TableHead className="text-right">LIVE GMV</TableHead>
                <TableHead className="text-center">Campaign</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Aktivitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/creators/${c.id}`} className="flex items-center gap-2.5 hover:underline">
                      <Avatar name={c.displayName} src={c.avatarUrl} className="h-8 w-8 text-xs" />
                      <span className="leading-tight">
                        <span className="block font-medium">{c.displayName}</span>
                        <span className="block text-xs text-muted-foreground">@{c.username}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.category}</TableCell>
                  <TableCell>{formatCompactNumber(c.followers)}</TableCell>
                  <TableCell>{formatPercent(c.engagementRate)}</TableCell>
                  <TableCell className="font-medium">{formatCompactIDR(c.gmv30)}</TableCell>
                  <TableCell>
                    <GrowthCell value={c.gmvGrowth} />
                  </TableCell>
                  <TableCell className="text-right">{c.videoCount}</TableCell>
                  <TableCell className="text-right">{formatCompactNumber(c.avgViews)}</TableCell>
                  <TableCell className="text-right">{formatCompactIDR(c.liveGmv30)}</TableCell>
                  <TableCell className="text-center">{c.activeCampaigns}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.health} kind="health" />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.managerName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.lastActivityAt ? timeAgo(c.lastActivityAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/creators"
            searchParams={flattenParams(searchParams)}
          />
        </div>
      )}
    </div>
  );
}

function GrowthCell({ value }: { value: number }) {
  const up = value > 0;
  const flat = value === 0;
  return (
    <span
      className={cn(
        "text-xs font-medium",
        flat ? "text-muted-foreground" : up ? "text-success" : "text-destructive",
      )}
    >
      {formatDelta(value)}
    </span>
  );
}

function SortHead({
  label,
  sortBy,
  current,
  dir,
  params,
}: {
  label: string;
  sortBy: string;
  current?: string;
  dir?: "asc" | "desc";
  params: Record<string, string | string[] | undefined>;
}) {
  const active = current === sortBy;
  const nextDir = active && dir === "desc" ? "asc" : "desc";
  const p = new URLSearchParams(
    Object.entries(flattenParams(params)).filter(([k]) => k !== "page"),
  );
  p.set("sortBy", sortBy);
  p.set("sortDir", nextDir);
  return (
    <TableHead>
      <Link href={`/creators?${p.toString()}`} className="inline-flex items-center gap-1 hover:text-foreground">
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

function flattenParams(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v !== "") out[k] = v;
  }
  return out;
}
