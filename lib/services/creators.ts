import prisma from "@/lib/prisma";
import { paginate, totalPages, getAgencyTimezone, containsInsensitive } from "@/lib/services/common";
import { daysAgoStartInTz } from "@/lib/timezone";
import type { ListResult } from "@/lib/services/common";
import type { CreatorHealth } from "@/lib/constants";
import type { Prisma } from "@/lib/prisma";

// Derived fields shown in the creator table (PLAN §6)
export type CreatorRow = {
  id: string;
  username: string;
  displayName: string;
  category: string;
  avatarUrl: string | null;
  followers: number;
  engagementRate: number;
  health: CreatorHealth;
  status: string;
  managerId: string | null;
  managerName: string | null;
  gmv30: number;
  gmvGrowth: number; // % vs previous 30 days
  avgViews: number;
  videoCount: number;
  liveGmv30: number;
  activeCampaigns: number;
  lastActivityAt: Date | null;
};

export type CreatorListFilters = {
  q?: string;
  category?: string;
  status?: string;
  health?: string;
  managerId?: string;
  minFollowers?: number;
  maxFollowers?: number;
  sortBy?: "followers" | "gmv" | "growth" | "engagementRate" | "name";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

const ACTIVE_CAMPAIGN_STATUSES = ["Recruiting", "Active", "ContentReview", "Published"];

export async function listCreators(
  agencyId: string,
  filters: CreatorListFilters = {},
): Promise<ListResult<CreatorRow>> {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 20);

  const where: Prisma.CreatorWhereInput = { agencyId };
  if (filters.q) {
    where.OR = [
      { displayName: containsInsensitive(filters.q) },
      { username: containsInsensitive(filters.q) },
    ];
  }
  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;
  if (filters.health) where.health = filters.health;
  if (filters.managerId) where.managerId = filters.managerId;
  if (filters.minFollowers != null || filters.maxFollowers != null) {
    where.followers = {};
    if (filters.minFollowers != null) where.followers.gte = filters.minFollowers;
    if (filters.maxFollowers != null) where.followers.lte = filters.maxFollowers;
  }

  const tz = await getAgencyTimezone(agencyId);

  const [creators, total] = await Promise.all([
    prisma.creator.findMany({
      where,
      orderBy: mapStaticSort(filters.sortBy, filters.sortDir),
      skip,
      take,
      include: { manager: { select: { id: true, name: true } } },
    }),
    prisma.creator.count({ where }),
  ]);

  const ids = creators.map((c) => c.id);
  if (ids.length === 0) {
    return { items: [], total, page, pageSize, totalPages: totalPages(total, pageSize) };
  }

  // Server-side aggregation: GMV last 30 days vs previous 30 days (growth).
  const since = daysAgoStartInTz(tz, 30);
  const prevSince = daysAgoStartInTz(tz, 60);

  const [recent, previous, activeCampaignCounts, lastActivities] = await Promise.all([
    prisma.creatorMetric.groupBy({
      by: ["creatorId"],
      where: { creatorId: { in: ids }, date: { gte: since } },
      _sum: { gmv: true, liveGmv: true, videos: true },
      _avg: { avgViews: true },
    }),
    prisma.creatorMetric.groupBy({
      by: ["creatorId"],
      where: { creatorId: { in: ids }, date: { gte: prevSince, lt: since } },
      _sum: { gmv: true },
    }),
    prisma.campaignCreator.groupBy({
      by: ["creatorId"],
      where: { creatorId: { in: ids }, campaign: { status: { in: ACTIVE_CAMPAIGN_STATUSES } } },
      _count: { _all: true },
    }),
    prisma.activity.groupBy({
      by: ["entityId"],
      where: { agencyId, entityType: "Creator", entityId: { in: ids } },
      _max: { createdAt: true },
    }),
  ]);

  const recentMap = new Map(recent.map((r) => [r.creatorId, r]));
  const prevMap = new Map(previous.map((r) => [r.creatorId, r._sum.gmv?.toNumber() ?? 0]));
  const campaignMap = new Map(activeCampaignCounts.map((r) => [r.creatorId, r._count._all]));
  const activityMap = new Map(lastActivities.map((r) => [r.entityId, r._max.createdAt]));

  let rows: CreatorRow[] = creators.map((c) => {
    const r = recentMap.get(c.id);
    const gmv30 = r?._sum.gmv?.toNumber() ?? 0;
    const prevGmv = prevMap.get(c.id) ?? 0;
    const growth = prevGmv > 0 ? ((gmv30 - prevGmv) / prevGmv) * 100 : gmv30 > 0 ? 100 : 0;
    return {
      id: c.id,
      username: c.username,
      displayName: c.displayName,
      category: c.category,
      avatarUrl: c.avatarUrl,
      followers: c.followers,
      engagementRate: c.engagementRate,
      health: c.health as CreatorHealth,
      status: c.status,
      managerId: c.managerId,
      managerName: c.manager?.name ?? null,
      gmv30,
      gmvGrowth: growth,
      avgViews: Math.round(r?._avg.avgViews ?? 0),
      videoCount: r?._sum.videos ?? 0,
      liveGmv30: r?._sum.liveGmv?.toNumber() ?? 0,
      activeCampaigns: campaignMap.get(c.id) ?? 0,
      lastActivityAt: activityMap.get(c.id) ?? null,
    };
  });

  // Derived sorts that need aggregation results
  if (filters.sortBy === "gmv" || filters.sortBy === "growth") {
    const dir = filters.sortDir === "asc" ? 1 : -1;
    rows = rows.sort((a, b) =>
      filters.sortBy === "gmv"
        ? (a.gmv30 - b.gmv30) * dir
        : (a.gmvGrowth - b.gmvGrowth) * dir,
    );
  }

  return { items: rows, total, page, pageSize, totalPages: totalPages(total, pageSize) };
}

function mapStaticSort(
  sortBy: CreatorListFilters["sortBy"],
  sortDir: "asc" | "desc" = "desc",
): Prisma.CreatorOrderByWithRelationInput {
  switch (sortBy) {
    case "followers":
      return { followers: sortDir };
    case "engagementRate":
      return { engagementRate: sortDir };
    case "name":
      return { displayName: sortDir };
    default:
      return { followers: "desc" };
  }
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export async function getCreatorDetail(agencyId: string, creatorId: string) {
  const creator = await prisma.creator.findFirst({
    where: { id: creatorId, agencyId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      platformAccounts: true,
    },
  });
  if (!creator) return null;

  const [metrics, campaigns, content, lives, commissions, tasks] = await Promise.all([
    prisma.creatorMetric.findMany({
      where: { creatorId },
      orderBy: { date: "asc" },
      take: 45,
    }),
    prisma.campaignCreator.findMany({
      where: { creatorId },
      include: { campaign: { select: { id: true, name: true, status: true, startDate: true, endDate: true } } },
      orderBy: { campaign: { createdAt: "desc" } },
      take: 10,
    }),
    prisma.contentItem.findMany({
      where: { creatorId, agencyId },
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.liveSession.findMany({
      where: { creatorId, agencyId },
      orderBy: { startTime: "desc" },
      take: 10,
    }),
    prisma.commission.findMany({
      where: { creatorId, agencyId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.task.findMany({
      where: { agencyId, relatedType: "Creator", relatedId: creatorId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Totals & growth
  const tz = await getAgencyTimezone(agencyId);
  const since = daysAgoStartInTz(tz, 30);
  const prevSince = daysAgoStartInTz(tz, 60);
  const [recent, previous, payoutsTotal] = await Promise.all([
    prisma.creatorMetric.aggregate({
      where: { creatorId, date: { gte: since } },
      _sum: { gmv: true, liveGmv: true, videos: true },
    }),
    prisma.creatorMetric.aggregate({
      where: { creatorId, date: { gte: prevSince, lt: since } },
      _sum: { gmv: true },
    }),
    prisma.creatorPayout.aggregate({ where: { creatorId, agencyId }, _sum: { amount: true } }),
  ]);

  const gmv30 = recent._sum.gmv?.toNumber() ?? 0;
  const prevGmv = previous._sum.gmv?.toNumber() ?? 0;
  const gmvGrowth = prevGmv > 0 ? ((gmv30 - prevGmv) / prevGmv) * 100 : 0;
  const commission30 = commissions
    .filter((c) => c.createdAt >= since)
    .reduce((sum, c) => sum + c.creatorCommission.toNumber(), 0);

  return {
    creator,
    metrics,
    campaigns,
    content,
    lives,
    commissions,
    tasks,
    totals: {
      gmv30,
      gmvGrowth,
      liveGmv30: recent._sum.liveGmv?.toNumber() ?? 0,
      videos30: recent._sum.videos ?? 0,
      commission30,
      totalPaid: payoutsTotal._sum.amount?.toNumber() ?? 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Health (deterministic — no AI scores, PLAN §6)
// ---------------------------------------------------------------------------

export function computeHealth(args: {
  status: string;
  gmvGrowthPct: number;
  activeCampaigns: number;
  lastActivityDaysAgo: number | null;
}): CreatorHealth {
  if (args.status === "Inactive") return "Inactive";
  if (args.lastActivityDaysAgo != null && args.lastActivityDaysAgo > 30) return "Inactive";
  if (args.gmvGrowthPct <= -30) return "AtRisk";
  if (args.gmvGrowthPct <= -10 || args.activeCampaigns === 0) return "Watch";
  return "Healthy";
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createCreator(
  agencyId: string,
  data: {
    username: string;
    displayName: string;
    category: string;
    followers?: number;
    engagementRate?: number;
    managerId?: string | null;
    bio?: string | null;
    status?: string;
  },
) {
  return prisma.creator.create({
    data: {
      agencyId,
      username: data.username,
      displayName: data.displayName,
      category: data.category,
      followers: data.followers ?? 0,
      engagementRate: data.engagementRate ?? 0,
      managerId: data.managerId ?? null,
      bio: data.bio ?? null,
      status: data.status ?? "Active",
    },
  });
}

export async function updateCreator(
  agencyId: string,
  creatorId: string,
  data: Partial<{
    displayName: string;
    category: string;
    followers: number;
    engagementRate: number;
    managerId: string | null;
    bio: string | null;
    status: string;
    health: string;
  }>,
) {
  return prisma.creator.update({
    where: { id: creatorId, agencyId },
    data,
  });
}
