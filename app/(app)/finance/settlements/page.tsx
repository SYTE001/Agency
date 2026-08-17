import Link from "next/link";
import { Landmark } from "lucide-react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { SETTLEMENT_STATUS } from "@/lib/constants";
import { listSettlements, refreshOverdueSettlements } from "@/lib/services/finance";
import type { SettlementFilters } from "@/lib/services/finance";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { FinanceNav } from "@/components/finance/finance-nav";
import { MarkPaidButton } from "@/components/finance/mark-paid-button";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatIDR } from "@/lib/format";
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
function flattenParams(params: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v !== "") out[k] = v;
  }
  return out;
}

export default async function SettlementsPage(props: PageProps<"/finance/settlements">) {
  const user = await requireUser();
  if (!can(user.role as Role, "finance", "read")) notFound();
  const searchParams = await props.searchParams;

  // Deterministic overdue flag (no AI) before listing — PLAN §12.
  await refreshOverdueSettlements(user.agencyId);

  const statusParam = str(searchParams.status);
  const filters: SettlementFilters = {
    status: statusParam && (SETTLEMENT_STATUS as readonly string[]).includes(statusParam) ? statusParam : undefined,
    brandId: str(searchParams.brandId),
    page: num(searchParams.page) ?? 1,
  };

  const [result, brands] = await Promise.all([
    listSettlements(user.agencyId, filters),
    prisma.brand.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);
  const canWrite = can(user.role as Role, "finance", "write");
  const now = new Date();

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Settlement"
        description="Pembayaran brand/platform ke agensi. Jatuh tempo lewat ditandai otomatis."
      >
        {canWrite ? (
          <Link
            href="/finance/settlements/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm transition-colors hover:bg-brand/90"
          >
            Catat Settlement
          </Link>
        ) : null}
      </PageHeader>

      <FinanceNav active="settlements" />

      {/* Filter bar (GET form → server-side filtering, PLAN §32) */}
      <form className="flex flex-wrap items-center gap-2" method="get">
        <Select name="status" defaultValue={filters.status ?? ""} className="w-44">
          <option value="">Semua status</option>
          {SETTLEMENT_STATUS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select name="brandId" defaultValue={filters.brandId ?? ""} className="w-52">
          <option value="">Semua brand</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">Terapkan</Button>
        <Link
          href="/finance/settlements"
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Reset
        </Link>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Tidak ada settlement"
          description={
            filters.status || filters.brandId
              ? "Coba ubah filter status atau brand."
              : "Belum ada settlement. Catat settlement pertama dari brand."
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Brand</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibayar</TableHead>
                  {canWrite ? <TableHead>Aksi</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((s) => {
                  const pastDue =
                    s.dueDate !== null && s.status !== "Paid" && s.dueDate.getTime() < now.getTime();
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.brand.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.campaign?.name ?? "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{formatIDR(s.amount)}</TableCell>
                      <TableCell
                        className={cn(
                          "whitespace-nowrap",
                          pastDue ? "font-medium text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {s.dueDate ? formatDate(s.dueDate) : "—"}
                      </TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {s.paidAt ? formatDate(s.paidAt) : "—"}
                      </TableCell>
                      {canWrite ? (
                        <TableCell>
                          {s.status === "Pending" || s.status === "Overdue" ? (
                            <MarkPaidButton kind="settlement" id={s.id} />
                          ) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/finance/settlements"
            searchParams={flattenParams(searchParams)}
          />
        </div>
      )}
    </div>
  );
}
