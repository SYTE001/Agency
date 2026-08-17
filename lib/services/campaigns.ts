import prisma from "@/lib/prisma";
import { paginate, totalPages } from "@/lib/services/common";
import type { ListResult } from "@/lib/services/common";
import type { Prisma } from "@/generated/prisma/client";

export type CampaignRow = {
  id: string;
  name: string;
  status: string;
  brandId: string;
  brandName: string;
  ownerId: string | null;
  ownerName: string | null;
  startDate: Date | null;
  endDate: Date | null;
  budget: number;
  gmvTarget: number;
  actualGmv: number;
  creatorTarget: number;
  contentTarget: number;
  liveTarget: number;
  creatorCount: number;
  contentCount: number;
  contentPublished: number;
  liveCount: number;
  progress: number; // 0..1, GMV vs target
};

export type CampaignListFilters = {
  q?: string;
  status?: string;
  brandId?: string;
  ownerId?: string;
  view?: "active" | "upcoming" | "completed" | "all";
  page?: number;
  pageSize?: number;
};

const ACTIVE_STATUSES = ["Recruiting", "Active", "ContentReview", "Published"];
const COMPLETED_STATUSES = ["Completed", "Reporting"];

export async function listCampaigns(
  agencyId: string,
  filters: CampaignListFilters = {},
): Promise<ListResult<CampaignRow>> {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 20);

  const where: Prisma.CampaignWhereInput = { agencyId };
  if (filters.q) where.name = { contains: filters.q };
  if (filters.status) where.status = filters.status;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.view === "active") where.status = { in: ACTIVE_STATUSES };
  if (filters.view === "upcoming") where.status = { in: ["Draft", "Planning"] };
  if (filters.view === "completed") where.status = { in: COMPLETED_STATUSES };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        brand: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        _count: { select: { creators: true, contentItems: true, liveSessions: true } },
      },
    }),
    prisma.campaign.count({ where }),
  ]);

  const ids = campaigns.map((c) => c.id);
  if (ids.length === 0) {
    return { items: [], total, page, pageSize, totalPages: totalPages(total, pageSize) };
  }

  const [publishedCounts, gmvByCampaign] = await Promise.all([
    prisma.contentItem.groupBy({
      by: ["campaignId"],
      where: { agencyId, campaignId: { in: ids }, status: "Published" },
      _count: { _all: true },
    }),
    prisma.contentItem.groupBy({
      by: ["campaignId"],
      where: { agencyId, campaignId: { in: ids } },
      _sum: { gmvGenerated: true },
    }),
  ]);
  const publishedMap = new Map(publishedCounts.map((r) => [r.campaignId, r._count._all]));
  const gmvMap = new Map(gmvByCampaign.map((r) => [r.campaignId, r._sum.gmvGenerated?.toNumber() ?? 0]));

  const rows: CampaignRow[] = campaigns.map((c) => {
    const contentGmv = gmvMap.get(c.id) ?? 0;
    const storedGmv = c.actualGmv.toNumber();
    const budget = c.budget.toNumber();
    const gmvTarget = c.gmvTarget.toNumber();
    const actualGmv = storedGmv > 0 ? storedGmv : contentGmv;
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      brandId: c.brandId,
      brandName: c.brand.name,
      ownerId: c.ownerId,
      ownerName: c.owner?.name ?? null,
      startDate: c.startDate,
      endDate: c.endDate,
      budget,
      gmvTarget,
      actualGmv,
      creatorTarget: c.creatorTarget,
      contentTarget: c.contentTarget,
      liveTarget: c.liveTarget,
      creatorCount: c._count.creators,
      contentCount: c._count.contentItems,
      contentPublished: publishedMap.get(c.id) ?? 0,
      liveCount: c._count.liveSessions,
      progress: gmvTarget > 0 ? Math.min(1, actualGmv / gmvTarget) : 0,
    };
  });

  return { items: rows, total, page, pageSize, totalPages: totalPages(total, pageSize) };
}

// ---------------------------------------------------------------------------
// Detail (PLAN §9)
// ---------------------------------------------------------------------------

export async function getCampaignDetail(agencyId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, agencyId },
    include: {
      brand: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  if (!campaign) return null;

  const [creators, products, content, lives, commissions, tasks, activity] = await Promise.all([
    prisma.campaignCreator.findMany({
      where: { campaignId },
      include: {
        creator: { select: { id: true, displayName: true, username: true, avatarUrl: true, followers: true, category: true } },
      },
    }),
    prisma.campaignProduct.findMany({
      where: { campaignId },
      include: { product: { select: { id: true, name: true, price: true, category: true } } },
    }),
    prisma.contentItem.findMany({
      where: { campaignId, agencyId },
      include: { creator: { select: { id: true, displayName: true } } },
      orderBy: { dueDate: "asc" },
      take: 50,
    }),
    prisma.liveSession.findMany({
      where: { campaignId, agencyId },
      include: { creator: { select: { id: true, displayName: true } } },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
    prisma.commission.findMany({
      where: { campaignId, agencyId },
      include: { creator: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.task.findMany({
      where: { agencyId, relatedType: "Campaign", relatedId: campaignId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.activity.findMany({
      where: { agencyId, entityType: "Campaign", entityId: campaignId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { id: true, name: true } } },
    }),
  ]);

  const finance = await prisma.commission.aggregate({
    where: { campaignId, agencyId },
    _sum: { gmv: true, creatorCommission: true, agencyRevenue: true },
  });

  const statusCounts = content.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    campaign,
    creators,
    products,
    content,
    lives,
    commissions,
    tasks,
    activity,
    contentStatusCounts: statusCounts,
    finance: {
      gmv: finance._sum.gmv?.toNumber() ?? 0,
      creatorCommission: finance._sum.creatorCommission?.toNumber() ?? 0,
      agencyRevenue: finance._sum.agencyRevenue?.toNumber() ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createCampaign(
  agencyId: string,
  data: {
    name: string;
    brandId: string;
    ownerId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    budget?: number;
    creatorTarget?: number;
    contentTarget?: number;
    liveTarget?: number;
    gmvTarget?: number;
    commissionRate?: number;
    status?: string;
    notes?: string | null;
  },
) {
  const brand = await prisma.brand.findFirst({ where: { id: data.brandId, agencyId }, select: { id: true } });
  if (!brand) throw new Error("Brand tidak ditemukan");
  return prisma.campaign.create({
    data: {
      agencyId,
      name: data.name,
      brandId: data.brandId,
      ownerId: data.ownerId ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      budget: data.budget ?? 0,
      creatorTarget: data.creatorTarget ?? 0,
      contentTarget: data.contentTarget ?? 0,
      liveTarget: data.liveTarget ?? 0,
      gmvTarget: data.gmvTarget ?? 0,
      commissionRate: data.commissionRate ?? 0,
      status: data.status ?? "Draft",
      notes: data.notes ?? null,
    },
  });
}

export async function updateCampaign(
  agencyId: string,
  campaignId: string,
  data: Partial<{
    name: string;
    brandId: string;
    ownerId: string | null;
    startDate: Date | null;
    endDate: Date | null;
    budget: number;
    creatorTarget: number;
    contentTarget: number;
    liveTarget: number;
    gmvTarget: number;
    actualGmv: number;
    commissionRate: number;
    status: string;
    notes: string | null;
  }>,
) {
  return prisma.campaign.update({ where: { id: campaignId, agencyId }, data });
}

export async function addCampaignCreator(
  agencyId: string,
  campaignId: string,
  data: { creatorId: string; role?: string | null; fee?: number },
) {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, agencyId }, select: { id: true } });
  if (!campaign) throw new Error("Campaign tidak ditemukan");
  const creator = await prisma.creator.findFirst({ where: { id: data.creatorId, agencyId }, select: { id: true } });
  if (!creator) throw new Error("Creator tidak ditemukan");
  return prisma.campaignCreator.create({
    data: {
      campaignId,
      creatorId: data.creatorId,
      role: data.role ?? null,
      fee: data.fee ?? 0,
    },
  });
}

export async function removeCampaignCreator(agencyId: string, linkId: string) {
  const link = await prisma.campaignCreator.findFirst({
    where: { id: linkId, campaign: { agencyId } },
    select: { id: true },
  });
  if (!link) throw new Error("Data tidak ditemukan");
  return prisma.campaignCreator.delete({ where: { id: linkId } });
}
