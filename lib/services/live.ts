import prisma from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/services/common";
import type { Prisma } from "@/generated/prisma/client";
import { isLiveStatus } from "@/lib/constants";

export type LiveRow = {
  id: string;
  room: string | null;
  status: string;
  startTime: Date;
  endTime: Date | null;
  targetGmv: number;
  actualGmv: number;
  viewers: number;
  orders: number;
  conversionRate: number;
  creatorId: string;
  creatorName: string;
  brandName: string | null;
  campaignName: string | null;
  operatorName: string | null;
};

export type LiveFilters = {
  status?: string;
  creatorId?: string;
  date?: Date; // specific day
  rangeStart?: Date;
  rangeEnd?: Date;
};

export async function listLiveSessions(agencyId: string, filters: LiveFilters = {}) {
  const where: Prisma.LiveSessionWhereInput = { agencyId };
  if (filters.status) where.status = filters.status;
  if (filters.creatorId) where.creatorId = filters.creatorId;
  if (filters.date) {
    where.startTime = { gte: startOfDay(filters.date), lte: endOfDay(filters.date) };
  } else if (filters.rangeStart || filters.rangeEnd) {
    where.startTime = {};
    if (filters.rangeStart) where.startTime.gte = filters.rangeStart;
    if (filters.rangeEnd) where.startTime.lte = filters.rangeEnd;
  }

  const sessions = await prisma.liveSession.findMany({
    where,
    orderBy: { startTime: "desc" },
    include: {
      creator: { select: { id: true, displayName: true } },
      brand: { select: { name: true } },
      campaign: { select: { name: true } },
      operator: { select: { name: true } },
    },
    take: 200,
  });

  const rows: LiveRow[] = sessions.map((s) => ({
    id: s.id,
    room: s.room,
    status: s.status,
    startTime: s.startTime,
    endTime: s.endTime,
    targetGmv: s.targetGmv.toNumber(),
    actualGmv: s.actualGmv.toNumber(),
    viewers: s.viewers,
    orders: s.orders,
    conversionRate: s.conversionRate,
    creatorId: s.creatorId,
    creatorName: s.creator.displayName,
    brandName: s.brand?.name ?? null,
    campaignName: s.campaign?.name ?? null,
    operatorName: s.operator?.name ?? null,
  }));

  return { sessions: rows, total: rows.length };
}

/** LIVE dashboard data (PLAN §11): live now, upcoming today, today's totals. */
export async function getLiveDashboard(agencyId: string) {
  const today = new Date();
  const [liveNow, upcoming, todayStats, underperforming] = await Promise.all([
    prisma.liveSession.findMany({
      where: { agencyId, status: "Live" },
      include: { creator: { select: { displayName: true } }, campaign: { select: { name: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.liveSession.findMany({
      where: {
        agencyId,
        status: { in: ["Scheduled", "Preparing"] },
        startTime: { gte: startOfDay(today), lte: endOfDay(today) },
      },
      include: { creator: { select: { displayName: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.liveSession.aggregate({
      where: { agencyId, startTime: { gte: startOfDay(today), lte: endOfDay(today) } },
      _sum: { actualGmv: true, orders: true },
      _count: { _all: true },
    }),
    prisma.liveSession.findMany({
      where: {
        agencyId,
        status: { in: ["Ended", "NeedsReview"] },
        targetGmv: { gt: 0 },
        startTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: { creator: { select: { displayName: true } } },
      orderBy: { startTime: "desc" },
      take: 50,
    }),
  ]);

  const under = underperforming
    .filter((s) => s.actualGmv.toNumber() < s.targetGmv.toNumber() * 0.5)
    .slice(0, 5);

  return {
    liveNow,
    upcoming,
    todayGmv: todayStats._sum.actualGmv?.toNumber() ?? 0,
    todayOrders: todayStats._sum.orders ?? 0,
    todaySessions: todayStats._count._all,
    underperforming: under,
  };
}

export async function getLiveDetail(agencyId: string, sessionId: string) {
  const session = await prisma.liveSession.findFirst({
    where: { id: sessionId, agencyId },
    include: {
      creator: { select: { id: true, displayName: true, username: true } },
      brand: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true, status: true } },
      product: { select: { id: true, name: true } },
      operator: { select: { id: true, name: true } },
    },
  });
  if (!session) return null;

  const [metrics, activity] = await Promise.all([
    prisma.liveMetric.findMany({
      where: { liveSessionId: sessionId },
      orderBy: { timestamp: "asc" },
    }),
    prisma.activity.findMany({
      where: { agencyId, entityType: "LiveSession", entityId: sessionId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { id: true, name: true } } },
    }),
  ]);

  return { session, metrics, activity };
}

export async function createLiveSession(
  agencyId: string,
  data: {
    creatorId: string;
    campaignId?: string | null;
    brandId?: string | null;
    productId?: string | null;
    room?: string | null;
    operatorId?: string | null;
    startTime: Date;
    endTime?: Date | null;
    targetGmv?: number;
    status?: string;
    notes?: string | null;
  },
) {
  const creator = await prisma.creator.findFirst({ where: { id: data.creatorId, agencyId }, select: { id: true } });
  if (!creator) throw new Error("Creator tidak ditemukan");
  return prisma.liveSession.create({
    data: {
      agencyId,
      creatorId: data.creatorId,
      campaignId: data.campaignId ?? null,
      brandId: data.brandId ?? null,
      productId: data.productId ?? null,
      room: data.room ?? null,
      operatorId: data.operatorId ?? null,
      startTime: data.startTime,
      endTime: data.endTime ?? null,
      targetGmv: data.targetGmv ?? 0,
      status: data.status ?? "Scheduled",
      notes: data.notes ?? null,
    },
  });
}

export async function updateLiveSession(
  agencyId: string,
  sessionId: string,
  data: Partial<{
    campaignId: string | null;
    brandId: string | null;
    productId: string | null;
    room: string | null;
    operatorId: string | null;
    startTime: Date;
    endTime: Date | null;
    targetGmv: number;
    actualGmv: number;
    viewers: number;
    orders: number;
    conversionRate: number;
    status: string;
    notes: string | null;
  }>,
) {
  if (data.status && !isLiveStatus(data.status)) throw new Error("Status tidak valid");
  const session = await prisma.liveSession.findFirst({ where: { id: sessionId, agencyId }, select: { id: true } });
  if (!session) throw new Error("Sesi LIVE tidak ditemukan");
  return prisma.liveSession.update({ where: { id: sessionId }, data });
}

/** Record final LIVE results in one shot (PLAN §31 step 9-10). */
export async function recordLiveResults(
  agencyId: string,
  sessionId: string,
  results: { actualGmv: number; viewers: number; orders: number; endTime?: Date | null },
) {
  const session = await prisma.liveSession.findFirst({ where: { id: sessionId, agencyId }, select: { id: true } });
  if (!session) throw new Error("Sesi LIVE tidak ditemukan");
  const conversionRate = results.viewers > 0 ? (results.orders / results.viewers) * 100 : 0;
  return prisma.liveSession.update({
    where: { id: sessionId },
    data: {
      actualGmv: results.actualGmv,
      viewers: results.viewers,
      orders: results.orders,
      conversionRate,
      endTime: results.endTime ?? new Date(),
      status: "Ended",
    },
  });
}
