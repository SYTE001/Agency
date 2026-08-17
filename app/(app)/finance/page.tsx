import Link from "next/link";
import { Banknote, Calculator, Coins, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { getFinanceSummary } from "@/lib/services/finance";
import { PageHeader } from "@/components/page-header";
import { FinanceNav } from "@/components/finance/finance-nav";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactIDR, formatDelta } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function FinancePage() {
  const user = await requireUser();
  if (!can(user.role, "finance", "read")) notFound();

  const s = await getFinanceSummary(user.agencyId);
  const canWrite = can(user.role, "finance", "write");

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title="Finance"
        description={`Ringkasan pendapatan agensi, ${s.days} hari terakhir`}
      >
        {canWrite ? (
          <Link
            href="/finance/commissions/new"
            className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Catat Komisi
          </Link>
        ) : null}
      </PageHeader>

      <FinanceNav active="overview" />

      {/* Revenue KPIs (30 hari) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-muted-foreground">Gross GMV ({s.days} hari)</span>
              <span className="block text-lg font-semibold tracking-tight tabular-nums">{formatCompactIDR(s.gmv)}</span>
            </span>
            <span
              className={cn(
                "ml-auto text-xs font-medium tabular-nums",
                s.gmvGrowth > 0 ? "text-success" : s.gmvGrowth < 0 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {formatDelta(s.gmvGrowth)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <Coins className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-muted-foreground">Komisi Creator</span>
              <span className="block text-lg font-semibold tracking-tight tabular-nums">{formatCompactIDR(s.creatorCommission)}</span>
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-muted-foreground">Revenue Agensi</span>
              <span className="block text-lg font-semibold tracking-tight tabular-nums">{formatCompactIDR(s.agencyRevenue)}</span>
            </span>
            <span
              className={cn(
                "ml-auto text-xs font-medium tabular-nums",
                s.agencyRevenueGrowth > 0
                  ? "text-success"
                  : s.agencyRevenueGrowth < 0
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {formatDelta(s.agencyRevenueGrowth)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-muted-foreground">Transaksi Komisi</span>
              <span className="block text-lg font-semibold tracking-tight tabular-nums">{s.commissionCount}</span>
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Creator payout */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Payout Creator</p>
            <div className="space-y-2">
              <PayoutRow
                label="Menunggu dibayar"
                href="/finance/payouts?status=Pending"
                value={formatCompactIDR(s.payoutsPending)}
                tone={s.payoutsPending > 0 ? "text-warning" : undefined}
              />
              <PayoutRow
                label="Sudah dibayar"
                href="/finance/payouts?status=Paid"
                value={formatCompactIDR(s.payoutsPaid)}
                tone="text-success"
              />
            </div>
          </CardContent>
        </Card>

        {/* Settlement brand */}
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-semibold">Settlement Brand</p>
            <div className="space-y-2">
              <PayoutRow
                label="Menunggu"
                href="/finance/settlements?status=Pending"
                value={formatCompactIDR(s.settlementsPending)}
                tone={s.settlementsPending > 0 ? "text-warning" : undefined}
              />
              <PayoutRow
                label="Terlambat"
                href="/finance/settlements?status=Overdue"
                value={formatCompactIDR(s.settlementsOverdue)}
                tone={s.settlementsOverdue > 0 ? "text-destructive" : undefined}
              />
              <PayoutRow
                label="Sudah dibayar"
                href="/finance/settlements?status=Paid"
                value={formatCompactIDR(s.settlementsPaid)}
                tone="text-success"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rumus eksplisit — PLAN §12: never hide financial calculations */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-semibold">Rumus Perhitungan (Eksplisit)</p>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="font-mono text-xs">Komisi Creator = GMV × rate%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Contoh: GMV Rp100jt × 10% = komisi Rp10jt
              </p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="font-mono text-xs">Revenue Agensi = Komisi × share%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Contoh: Rp10jt × 30% = revenue agensi Rp3jt
              </p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="font-mono text-xs">Bagian Creator = Komisi − Revenue Agensi</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Contoh: Rp10jt − Rp3jt = bagian creator Rp7jt
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Angka GMV/komisi di atas adalah angka komisi (perspektif creator). Angka platform TikTok
            (sebelum potongan platform) dapat berbeda; yang dicatat di sini adalah yang menjadi dasar
            perhitungan komisi agensi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutRow({
  label,
  href,
  value,
  tone,
}: {
  label: string;
  href: string;
  value: string;
  tone?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-md border bg-card px-3 py-2 transition-colors hover:bg-accent"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold", tone)}>{value}</span>
    </Link>
  );
}
