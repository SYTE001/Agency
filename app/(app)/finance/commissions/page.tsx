import Link from "next/link";
import { Calculator } from "lucide-react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { COMMISSION_STATUS } from "@/lib/constants";
import { listCommissions } from "@/lib/services/finance";
import type { CommissionFilters } from "@/lib/services/finance";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { FinanceNav } from "@/components/finance/finance-nav";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCompactIDR, formatDate } from "@/lib/format";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
function flattenParams(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v !== "") out[k] = v;
  }
  return out;
}

const SOURCE_TYPES = ["Campaign", "LiveSession", "Content"] as const;
const SOURCE_LABEL: Record<string, string> = {
  Campaign: "Campaign",
  LiveSession: "LIVE",
  Content: "Konten",
};

export default async function CommissionsPage(props: PageProps<"/finance/commissions">) {
  const user = await requireUser();
  if (!can(user.role, "finance", "read")) notFound();
  const searchParams = await props.searchParams;

  const statusParam = str(searchParams.status);
  const sourceParam = str(searchParams.sourceType);
  const filters: CommissionFilters = {
    status: statusParam && (COMMISSION_STATUS as readonly string[]).includes(statusParam) ? statusParam : undefined,
    creatorId: str(searchParams.creatorId),
    campaignId: str(searchParams.campaignId),
    sourceType: sourceParam && (SOURCE_TYPES as readonly string[]).includes(sourceParam) ? sourceParam : undefined,
    page: num(searchParams.page) ?? 1,
  };

  const [result, creators, campaigns] = await Promise.all([
    listCommissions(user.agencyId, filters),
    prisma.creator.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 100,
    }),
    prisma.campaign.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const canWrite = can(user.role, "finance", "write");
  const hasFilter = Boolean(filters.status || filters.creatorId || filters.campaignId || filters.sourceType);

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Komisi" description="Riwayat komisi per transaksi GMV dengan rumus eksplisit">
        {canWrite ? (
          <Link
            href="/finance/commissions/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Catat Komisi
          </Link>
        ) : null}
      </PageHeader>

      <FinanceNav active="commissions" />

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <Select name="status" defaultValue={filters.status ?? ""} className="w-40">
          <option value="">Semua status</option>
          {COMMISSION_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select name="sourceType" defaultValue={filters.sourceType ?? ""} className="w-40">
          <option value="">Semua sumber</option>
          {SOURCE_TYPES.map((s) => (
            <option key={s} value={s}>{SOURCE_LABEL[s]}</option>
          ))}
        </Select>
        <Select name="creatorId" defaultValue={filters.creatorId ?? ""} className="w-52">
          <option value="">Semua creator</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </Select>
        <Select name="campaignId" defaultValue={filters.campaignId ?? ""} className="w-52">
          <option value="">Semua campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/finance/commissions"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="Tidak ada komisi"
          description={
            hasFilter
              ? "Coba ubah filter status, sumber, creator, atau campaign."
              : "Belum ada catatan komisi. Catat komisi pertama dari transaksi GMV."
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="min-w-44">Creator</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead className="text-right">GMV</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Komisi Creator</TableHead>
                  <TableHead className="text-right">Share Agensi</TableHead>
                  <TableHead className="text-right">Revenue Agensi</TableHead>
                  <TableHead className="text-right">Bagian Creator</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="block font-medium">{c.creatorName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {c.campaignName ?? "Tanpa campaign"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{SOURCE_LABEL[c.sourceType] ?? c.sourceType}</TableCell>
                    <TableCell className="text-right">{formatCompactIDR(c.gmv)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{c.creatorRate}%</TableCell>
                    <TableCell className="text-right font-medium">{formatCompactIDR(c.creatorCommission)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{c.agencyShareRate}%</TableCell>
                    <TableCell className="text-right font-medium">{formatCompactIDR(c.agencyRevenue)}</TableCell>
                    <TableCell className="text-right">
                      {formatCompactIDR(c.creatorCommission - c.agencyRevenue)}
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/finance/commissions"
            searchParams={flattenParams(searchParams)}
          />
        </div>
      )}
    </div>
  );
}
