import prisma from "@/lib/prisma";
import { paginate, totalPages, daysAgoDate } from "@/lib/services/common";
import type { ListResult } from "@/lib/services/common";
import type { Prisma } from "@/generated/prisma/client";
import { calculateCommission } from "@/lib/finance";

// ---------------------------------------------------------------------------
// Revenue summary
// ---------------------------------------------------------------------------

export async function getFinanceSummary(agencyId: string, days = 30) {
  const since = daysAgoDate(days);
  const prevSince = daysAgoDate(days * 2);

  const [cur, prev, payouts, settlements] = await Promise.all([
    prisma.commission.aggregate({
      where: { agencyId, createdAt: { gte: since } },
      _sum: { gmv: true, creatorCommission: true, agencyRevenue: true },
      _count: { _all: true },
    }),
    prisma.commission.aggregate({
      where: { agencyId, createdAt: { gte: prevSince, lt: since } },
      _sum: { gmv: true, agencyRevenue: true },
    }),
    prisma.creatorPayout.groupBy({
      by: ["status"],
      where: { agencyId },
      _sum: { amount: true },
    }),
    prisma.settlement.groupBy({
      by: ["status"],
      where: { agencyId },
      _sum: { amount: true },
    }),
  ]);

  const gmv = cur._sum.gmv ?? 0;
  const prevGmv = prev._sum.gmv ?? 0;
  const agencyRevenue = cur._sum.agencyRevenue ?? 0;
  const prevRevenue = prev._sum.agencyRevenue ?? 0;

  const payoutSum = (status: string) => payouts.find((p) => p.status === status)?._sum.amount ?? 0;
  const settlementSum = (status: string) => settlements.find((s) => s.status === status)?._sum.amount ?? 0;

  return {
    days,
    gmv,
    gmvGrowth: prevGmv > 0 ? ((gmv - prevGmv) / prevGmv) * 100 : 0,
    creatorCommission: cur._sum.creatorCommission ?? 0,
    agencyRevenue,
    agencyRevenueGrowth: prevRevenue > 0 ? ((agencyRevenue - prevRevenue) / prevRevenue) * 100 : 0,
    commissionCount: cur._count._all,
    payoutsPending: payoutSum("Pending"),
    payoutsPaid: payoutSum("Paid"),
    settlementsPending: settlementSum("Pending"),
    settlementsPaid: settlementSum("Paid"),
    settlementsOverdue: settlementSum("Overdue"),
  };
}

// ---------------------------------------------------------------------------
// Commission list
// ---------------------------------------------------------------------------

export type CommissionFilters = {
  status?: string;
  creatorId?: string;
  campaignId?: string;
  sourceType?: string;
  page?: number;
  pageSize?: number;
};

export async function listCommissions(
  agencyId: string,
  filters: CommissionFilters = {},
): Promise<ListResult<{
  id: string;
  gmv: number;
  creatorRate: number;
  creatorCommission: number;
  agencyShareRate: number;
  agencyRevenue: number;
  status: string;
  sourceType: string;
  createdAt: Date;
  creatorName: string;
  campaignName: string | null;
}>> {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 25);

  const where: Prisma.CommissionWhereInput = { agencyId };
  if (filters.status) where.status = filters.status;
  if (filters.creatorId) where.creatorId = filters.creatorId;
  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.sourceType) where.sourceType = filters.sourceType;

  const [rows, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        creator: { select: { displayName: true } },
        campaign: { select: { name: true } },
      },
    }),
    prisma.commission.count({ where }),
  ]);

  return {
    items: rows.map((c) => ({
      id: c.id,
      gmv: c.gmv,
      creatorRate: c.creatorRate,
      creatorCommission: c.creatorCommission,
      agencyShareRate: c.agencyShareRate,
      agencyRevenue: c.agencyRevenue,
      status: c.status,
      sourceType: c.sourceType,
      createdAt: c.createdAt,
      creatorName: c.creator.displayName,
      campaignName: c.campaign?.name ?? null,
    })),
    total,
    page,
    pageSize,
    totalPages: totalPages(total, pageSize),
  };
}

/** Create a commission record from a GMV source with explicit formula. */
export async function createCommission(
  agencyId: string,
  data: {
    campaignId?: string | null;
    creatorId: string;
    sourceType: string;
    sourceId?: string | null;
    gmv: number;
    creatorRate: number; // persen, mis. 12 = 12% dari GMV
    agencyShareRate: number; // persen dari komisi creator, mis. 30 = 30%
  },
) {
  const creator = await prisma.creator.findFirst({ where: { id: data.creatorId, agencyId }, select: { id: true } });
  if (!creator) throw new Error("Creator tidak ditemukan");
  const amounts = calculateCommission({
    gmv: data.gmv,
    creatorRate: data.creatorRate,
    agencyShareRate: data.agencyShareRate,
  });
  return prisma.commission.create({
    data: {
      agencyId,
      campaignId: data.campaignId ?? null,
      creatorId: data.creatorId,
      sourceType: data.sourceType,
      sourceId: data.sourceId ?? null,
      gmv: data.gmv,
      creatorRate: data.creatorRate,
      creatorCommission: amounts.creatorCommission,
      agencyShareRate: data.agencyShareRate,
      agencyRevenue: amounts.agencyRevenue,
      status: "Calculated",
    },
  });
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

export type PayoutFilters = {
  status?: string;
  creatorId?: string;
  page?: number;
  pageSize?: number;
};

export async function listPayouts(agencyId: string, filters: PayoutFilters = {}) {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 25);
  const where: Prisma.CreatorPayoutWhereInput = { agencyId };
  if (filters.status) where.status = filters.status;
  if (filters.creatorId) where.creatorId = filters.creatorId;

  const [rows, total] = await Promise.all([
    prisma.creatorPayout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        creator: { select: { id: true, displayName: true } },
        campaign: { select: { name: true } },
      },
    }),
    prisma.creatorPayout.count({ where }),
  ]);
  return { items: rows, total, page, pageSize, totalPages: totalPages(total, pageSize) };
}

export async function createPayout(
  agencyId: string,
  data: { creatorId: string; campaignId?: string | null; amount: number },
) {
  const creator = await prisma.creator.findFirst({ where: { id: data.creatorId, agencyId }, select: { id: true } });
  if (!creator) throw new Error("Creator tidak ditemukan");
  return prisma.creatorPayout.create({
    data: {
      agencyId,
      creatorId: data.creatorId,
      campaignId: data.campaignId ?? null,
      amount: data.amount,
      status: "Pending",
    },
  });
}

export async function markPayoutPaid(agencyId: string, payoutId: string) {
  const payout = await prisma.creatorPayout.findFirst({ where: { id: payoutId, agencyId }, select: { id: true } });
  if (!payout) throw new Error("Payout tidak ditemukan");
  return prisma.creatorPayout.update({
    where: { id: payoutId },
    data: { status: "Paid", paidAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------

export type SettlementFilters = {
  status?: string;
  brandId?: string;
  page?: number;
  pageSize?: number;
};

export async function listSettlements(agencyId: string, filters: SettlementFilters = {}) {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 25);
  const where: Prisma.SettlementWhereInput = { agencyId };
  if (filters.status) where.status = filters.status;
  if (filters.brandId) where.brandId = filters.brandId;

  const [rows, total] = await Promise.all([
    prisma.settlement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        brand: { select: { id: true, name: true } },
        campaign: { select: { name: true } },
      },
    }),
    prisma.settlement.count({ where }),
  ]);
  return { items: rows, total, page, pageSize, totalPages: totalPages(total, pageSize) };
}

export async function createSettlement(
  agencyId: string,
  data: { brandId: string; campaignId?: string | null; amount: number; dueDate?: Date | null },
) {
  const brand = await prisma.brand.findFirst({ where: { id: data.brandId, agencyId }, select: { id: true } });
  if (!brand) throw new Error("Brand tidak ditemukan");
  return prisma.settlement.create({
    data: {
      agencyId,
      brandId: data.brandId,
      campaignId: data.campaignId ?? null,
      amount: data.amount,
      dueDate: data.dueDate ?? null,
      status: "Pending",
    },
  });
}

export async function markSettlementPaid(agencyId: string, settlementId: string) {
  const settlement = await prisma.settlement.findFirst({
    where: { id: settlementId, agencyId },
    select: { id: true },
  });
  if (!settlement) throw new Error("Settlement tidak ditemukan");
  return prisma.settlement.update({
    where: { id: settlementId },
    data: { status: "Paid", paidAt: new Date() },
  });
}

/** Flag past-due pending settlements as Overdue (deterministic, no AI). */
export async function refreshOverdueSettlements(agencyId: string) {
  return prisma.settlement.updateMany({
    where: { agencyId, status: "Pending", dueDate: { lt: new Date() } },
    data: { status: "Overdue" },
  });
}
