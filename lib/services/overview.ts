import prisma from "@/lib/prisma";
import { getAgencyTimezone } from "@/lib/services/common";
import { daysAgoStartInTz, dayStartInTz } from "@/lib/timezone";
import { getOperationalAlerts } from "@/lib/services/alerts";

/**
 * Overview aggregation layer (PLAN §5). Built on top of the module services —
 * all numbers are derived from the same tables the module pages read.
 * Day boundaries use the tenant's timezone (Agency.timezone); DB stays UTC.
 */
export async function getOverview(agencyId: string) {
  // Start alerts computation concurrently with overview metrics
  const alertsPromise = getOperationalAlerts(agencyId);

  // Queries that do not depend on timezone boundaries can start immediately
  const activeCreatorsPromise = prisma.creator.count({ where: { agencyId, status: "Active" } });
  const activeCampaignsPromise = prisma.campaign.count({
    where: { agencyId, status: { in: ["Recruiting", "Active", "ContentReview", "Published"] } },
  });
  const activeBrandsPromise = prisma.brand.count({ where: { agencyId, status: "Active" } });
  const pendingSettlementsPromise = prisma.settlement.aggregate({
    where: { agencyId, status: { in: ["Pending", "Overdue"] } },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const campaignProgressPromise = prisma.campaign.findMany({
    where: { agencyId, status: { in: ["Recruiting", "Active", "ContentReview", "Published"] } },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      gmvTarget: true,
      actualGmv: true,
      brand: { select: { name: true } },
    },
    orderBy: { endDate: "asc" },
    take: 5,
  });
  const recentActivityPromise = prisma.activity.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { actor: { select: { name: true } } },
  });

  const tz = await getAgencyTimezone(agencyId);
  const since30 = daysAgoStartInTz(tz, 30);
  const since60 = daysAgoStartInTz(tz, 60);
  const todayStart = dayStartInTz(tz);

  const [
    gmvCur,
    gmvPrev,
    revenueCur,
    activeCreators,
    activeCampaigns,
    activeBrands,
    liveToday,
    pendingSettlements,
    campaignProgress,
    gmvDaily,
    topCreators,
    recentActivity,
    alerts,
  ] = await Promise.all([
    prisma.creatorMetric.aggregate({
      where: { creator: { agencyId }, date: { gte: since30 } },
      _sum: { gmv: true, liveGmv: true },
    }),
    prisma.creatorMetric.aggregate({
      where: { creator: { agencyId }, date: { gte: since60, lt: since30 } },
      _sum: { gmv: true },
    }),
    prisma.commission.aggregate({
      where: { agencyId, createdAt: { gte: since30 } },
      _sum: { agencyRevenue: true },
    }),
    activeCreatorsPromise,
    activeCampaignsPromise,
    activeBrandsPromise,
    prisma.liveSession.findMany({
      where: { agencyId, startTime: { gte: todayStart } },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        room: true,
        startTime: true,
        status: true,
        targetGmv: true,
        actualGmv: true,
        creator: { select: { displayName: true } },
        operator: { select: { name: true } },
      },
      take: 10,
    }),
    pendingSettlementsPromise,
    campaignProgressPromise,
    prisma.creatorMetric.groupBy({
      by: ["date"],
      where: { creator: { agencyId }, date: { gte: since30 } },
      _sum: { gmv: true },
    }),
    prisma.creatorMetric.groupBy({
      by: ["creatorId"],
      where: { creator: { agencyId }, date: { gte: since30 } },
      _sum: { gmv: true },
      orderBy: { _sum: { gmv: "desc" } },
      take: 5,
    }),
    recentActivityPromise,
    alertsPromise,
  ]);

  const totalGmv = gmvCur._sum.gmv?.toNumber() ?? 0;
  const prevGmv = gmvPrev._sum.gmv?.toNumber() ?? 0;

  const topCreatorIds = topCreators.map((c) => c.creatorId);
  const topCreatorRows =
    topCreatorIds.length > 0
      ? await prisma.creator.findMany({
          where: { id: { in: topCreatorIds } },
          select: { id: true, displayName: true, username: true, avatarUrl: true, category: true },
        })
      : [];
  const creatorInfo = new Map(topCreatorRows.map((c) => [c.id, c]));

  return {
    kpis: {
      totalGmv,
      gmvGrowth: prevGmv > 0 ? ((totalGmv - prevGmv) / prevGmv) * 100 : 0,
      agencyRevenue: revenueCur._sum.agencyRevenue?.toNumber() ?? 0,
      liveGmv30: gmvCur._sum.liveGmv?.toNumber() ?? 0,
      activeCreators,
      activeCampaigns,
      activeBrands,
      pendingSettlements: pendingSettlements._sum.amount?.toNumber() ?? 0,
      pendingSettlementCount: pendingSettlements._count._all,
    },
    gmvDaily: gmvDaily
      .map((d) => ({ date: d.date, gmv: d._sum.gmv?.toNumber() ?? 0 }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
    topCreators: topCreators.map((c) => ({
      id: c.creatorId,
      gmv: c._sum.gmv?.toNumber() ?? 0,
      ...creatorInfo.get(c.creatorId),
    })),
    liveToday,
    campaignProgress,
    alerts,
    recentActivity,
  };
}
