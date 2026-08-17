import Link from "next/link";
import { Banknote } from "lucide-react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PAYOUT_STATUS } from "@/lib/constants";
import { listPayouts } from "@/lib/services/finance";
import type { PayoutFilters } from "@/lib/services/finance";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { FinanceNav } from "@/components/finance/finance-nav";
import { MarkPaidButton } from "@/components/finance/mark-paid-button";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatIDR } from "@/lib/format";

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

export default async function PayoutsPage(props: PageProps<"/finance/payouts">) {
  const user = await requireUser();
  if (!can(user.role, "finance", "read")) notFound();
  const searchParams = await props.searchParams;

  const statusParam = str(searchParams.status);
  const filters: PayoutFilters = {
    status: statusParam && (PAYOUT_STATUS as readonly string[]).includes(statusParam) ? statusParam : undefined,
    creatorId: str(searchParams.creatorId),
    page: num(searchParams.page) ?? 1,
  };

  const [result, creators] = await Promise.all([
    listPayouts(user.agencyId, filters),
    prisma.creator.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 100,
    }),
  ]);
  const canWrite = can(user.role, "finance", "write");

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Payout Creator" description="Pembayaran ke creator atas bagiannya dari komisi">
        {canWrite ? (
          <Link
            href="/finance/payouts/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Catat Payout
          </Link>
        ) : null}
      </PageHeader>

      <FinanceNav active="payouts" />

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <Select name="status" defaultValue={filters.status ?? ""} className="w-44">
          <option value="">Semua status</option>
          {PAYOUT_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select name="creatorId" defaultValue={filters.creatorId ?? ""} className="w-52">
          <option value="">Semua creator</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/finance/payouts"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Tidak ada payout"
          description={
            filters.status || filters.creatorId
              ? "Coba ubah filter status atau creator."
              : "Belum ada payout. Catat payout pertama untuk creator."
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Creator</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dicatat</TableHead>
                  <TableHead>Dibayar</TableHead>
                  {canWrite ? <TableHead>Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.creator.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{p.campaign?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{formatIDR(p.amount)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(p.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {p.paidAt ? formatDateTime(p.paidAt) : "—"}
                    </TableCell>
                    {canWrite ? (
                      <TableCell>
                        {p.status === "Pending" ? <MarkPaidButton kind="payout" id={p.id} /> : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/finance/payouts"
            searchParams={flattenParams(searchParams)}
          />
        </div>
      )}
    </div>
  );
}
