import prisma from "@/lib/prisma";
import { getAgencyTimezone } from "@/lib/services/common";
import { daysAgoStartInTz, dayEndInTz } from "@/lib/timezone";

/**
 * Reporting layer (PLAN §13 / Phase 8). Reports are generated entirely from
 * existing data — nothing here writes. Two report kinds:
 *  - client report: per-campaign performance for the brand
 *  - internal report: agency-wide operational + financial summary
 * Both support a 30/90 day period with comparison to the previous window.
 *
 * Day boundaries are interpreted in the tenant's timezone (Agency.timezone):
 * the DB stays UTC, the window is computed as local calendar days.
 */

export const PERIODS = { "30d": 30, "90d": 90 } as const;
export type Period = keyof typeof PERIODS;

export function resolvePeriod(period: Period, timeZone: string, now: Date = new Date()) {
  const days = PERIODS[period];
  const start = daysAgoStartInTz(timeZone, days, now);
  const prevStart = daysAgoStartInTz(timeZone, days * 2, now);
  const end = dayEndInTz(timeZone, now);
  return { days, start, prevStart, end };
}

function growth(cur: number, prev: number): number {
  return prev > 0 ? ((cur - prev) / prev) * 100 : 0;
}

const LIVE_DONE = ["Ended", "NeedsReview", "Live"] as const;

// ---------------------------------------------------------------------------
// Client report — one campaign's performance for the brand
// ---------------------------------------------------------------------------

export async function getClientReport(agencyId: string, campaignId: string, period: Period) {
  const [campaign, timeZone] = await Promise.all([
    prisma.campaign.findFirst({
      where: { id: campaignId, agencyId },
      include: { brand: { select: { name: true, industry: true } } },
    }),
    getAgencyTimezone(agencyId),
  ]);
  if (!campaign) return null;

  const { days, start, prevStart, end } = resolvePeriod(period, timeZone);
  const inCampaignProducts = {
    date: { gte: start },
    product: { agencyId, campaignLinks: { some: { campaignId } } },
  } as const;
  const inCampaignProductsPrev = {
    ...inCampaignProducts,
    date: { gte: prevStart, lt: start },
  };

  const [
    videos,
    videosPublished,
    liveAgg,
    commissionAgg,
    commissionPrevAgg,
    creators,
    productGmvAgg,
    productGmvPrevAgg,
    productOrdersAgg,
    topCreatorsRaw,
    topProductsRaw,
  ] = await Promise.all([
    prisma.contentItem.count({ where: { agencyId, campaignId } }),
    prisma.contentItem.count({ where: { agencyId, campaignId, status: "Published" } }),
    prisma.liveSession.aggregate({
      where: { agencyId, campaignId, status: { in: [...LIVE_DONE] } },
      _sum: { actualGmv: true, orders: true, viewers: true },
      _count: { _all: true },
    }),
    prisma.commission.aggregate({
      where: { agencyId, campaignId, createdAt: { gte: start } },
      _sum: { gmv: true, creatorCommission: true, agencyRevenue: true },
    }),
    prisma.commission.aggregate({
      where: { agencyId, campaignId, createdAt: { gte: prevStart, lt: start } },
      _sum: { gmv: true },
    }),
    prisma.campaignCreator.count({ where: { campaignId } }),
    prisma.productMetric.aggregate({ where: inCampaignProducts, _sum: { gmv: true } }),
    prisma.productMetric.aggregate({ where: inCampaignProductsPrev, _sum: { gmv: true } }),
    prisma.productMetric.aggregate({ where: inCampaignProducts, _sum: { orders: true } }),
    prisma.commission.groupBy({
      by: ["creatorId"],
      where: { agencyId, campaignId, createdAt: { gte: start } },
      _sum: { gmv: true, creatorCommission: true },
      orderBy: { _sum: { gmv: "desc" } },
      take: 5,
    }),
    prisma.productMetric.groupBy({
      by: ["productId"],
      where: inCampaignProducts,
      _sum: { gmv: true, orders: true },
      orderBy: { _sum: { gmv: "desc" } },
      take: 5,
    }),
  ]);

  const [topCreatorRows, topProductRows] = await Promise.all([
    prisma.creator.findMany({
      where: { id: { in: topCreatorsRaw.map((c) => c.creatorId) } },
      select: { id: true, displayName: true },
    }),
    prisma.product.findMany({
      where: { id: { in: topProductsRaw.map((p) => p.productId) } },
      select: { id: true, name: true },
    }),
  ]);
  const creatorNames = new Map(topCreatorRows.map((c) => [c.id, c.displayName]));
  const productNames = new Map(topProductRows.map((p) => [p.id, p.name]));

  const gmv = commissionAgg._sum.gmv?.toNumber() ?? 0;
  const productGmv = productGmvAgg._sum.gmv?.toNumber() ?? 0;

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      gmvTarget: campaign.gmvTarget.toNumber(),
      brandName: campaign.brand.name,
      brandIndustry: campaign.brand.industry,
    },
    period: { period, days, start, end },
    totals: {
      gmv,
      gmvGrowth: growth(gmv, commissionPrevAgg._sum.gmv?.toNumber() ?? 0),
      commission: commissionAgg._sum.creatorCommission?.toNumber() ?? 0,
      agencyRevenue: commissionAgg._sum.agencyRevenue?.toNumber() ?? 0,
      creators,
      videos,
      videosPublished,
      liveSessions: liveAgg._count._all,
      liveGmv: liveAgg._sum.actualGmv?.toNumber() ?? 0,
      liveOrders: liveAgg._sum.orders ?? 0,
      liveViewers: liveAgg._sum.viewers ?? 0,
      productGmv,
      productGmvGrowth: growth(productGmv, productGmvPrevAgg._sum.gmv?.toNumber() ?? 0),
      productOrders: productOrdersAgg._sum.orders ?? 0,
    },
    topCreators: topCreatorsRaw.map((c) => ({
      id: c.creatorId,
      name: creatorNames.get(c.creatorId) ?? c.creatorId,
      gmv: c._sum.gmv?.toNumber() ?? 0,
      commission: c._sum.creatorCommission?.toNumber() ?? 0,
    })),
    topProducts: topProductsRaw.map((p) => ({
      id: p.productId,
      name: productNames.get(p.productId) ?? p.productId,
      gmv: p._sum.gmv?.toNumber() ?? 0,
      orders: p._sum.orders ?? 0,
    })),
  };
}

export type ClientReport = NonNullable<Awaited<ReturnType<typeof getClientReport>>>;

// ---------------------------------------------------------------------------
// Internal report — agency-wide operational + financial summary
// ---------------------------------------------------------------------------

export async function getInternalReport(agencyId: string, period: Period) {
  const timeZone = await getAgencyTimezone(agencyId);
  const { days, start, prevStart, end } = resolvePeriod(period, timeZone);

  const [
    metricsCur,
    metricsPrev,
    commissionCur,
    commissionPrev,
    creatorsTotal,
    creatorsActive,
    creatorsInactive,
    campaignsActive,
    campaignsCompleted,
    contentCreated,
    contentPublished,
    liveAgg,
    pendingTasks,
    overdueTasks,
    payoutsPending,
    payoutsPaid,
    settlementsPending,
    settlementsOverdue,
    settlementsPaid,
  ] = await Promise.all([
    prisma.creatorMetric.aggregate({
      where: { creator: { agencyId }, date: { gte: start } },
      _sum: { gmv: true, videos: true, liveGmv: true },
    }),
    prisma.creatorMetric.aggregate({
      where: { creator: { agencyId }, date: { gte: prevStart, lt: start } },
      _sum: { gmv: true },
    }),
    prisma.commission.aggregate({
      where: { agencyId, createdAt: { gte: start } },
      _sum: { agencyRevenue: true, creatorCommission: true },
      _count: { _all: true },
    }),
    prisma.commission.aggregate({
      where: { agencyId, createdAt: { gte: prevStart, lt: start } },
      _sum: { agencyRevenue: true },
    }),
    prisma.creator.count({ where: { agencyId } }),
    prisma.creator.count({ where: { agencyId, status: "Active" } }),
    prisma.creator.count({ where: { agencyId, status: "Inactive" } }),
    prisma.campaign.count({
      where: { agencyId, status: { in: ["Recruiting", "Active", "ContentReview", "Published"] } },
    }),
    prisma.campaign.count({ where: { agencyId, status: "Completed" } }),
    prisma.contentItem.count({ where: { agencyId, createdAt: { gte: start } } }),
    prisma.contentItem.count({ where: { agencyId, status: "Published" } }),
    prisma.liveSession.aggregate({
      where: { agencyId, startTime: { gte: start }, status: { in: [...LIVE_DONE] } },
      _sum: { actualGmv: true, orders: true, viewers: true },
      _count: { _all: true },
    }),
    prisma.task.count({ where: { agencyId, status: { in: ["Open", "InProgress"] } } }),
    prisma.task.count({
      where: { agencyId, status: { in: ["Open", "InProgress"] }, dueDate: { lt: new Date() } },
    }),
    prisma.creatorPayout.aggregate({ where: { agencyId, status: "Pending" }, _sum: { amount: true } }),
    prisma.creatorPayout.aggregate({ where: { agencyId, status: "Paid" }, _sum: { amount: true } }),
    prisma.settlement.aggregate({ where: { agencyId, status: "Pending" }, _sum: { amount: true } }),
    prisma.settlement.aggregate({ where: { agencyId, status: "Overdue" }, _sum: { amount: true } }),
    prisma.settlement.aggregate({ where: { agencyId, status: "Paid" }, _sum: { amount: true } }),
  ]);

  const gmv = metricsCur._sum.gmv?.toNumber() ?? 0;
  const revenue = commissionCur._sum.agencyRevenue?.toNumber() ?? 0;
  const videos = metricsCur._sum.videos ?? 0;

  return {
    period: { period, days, start, end },
    gmv,
    gmvGrowth: growth(gmv, metricsPrev._sum.gmv?.toNumber() ?? 0),
    revenue,
    revenueGrowth: growth(revenue, commissionPrev._sum.agencyRevenue?.toNumber() ?? 0),
    commission: commissionCur._sum.creatorCommission?.toNumber() ?? 0,
    commissionCount: commissionCur._count._all,
    creatorProductivity: {
      creatorsTotal,
      creatorsActive,
      creatorsInactive,
      videos,
      videosPerCreator: creatorsActive > 0 ? videos / creatorsActive : 0,
    },
    campaigns: { active: campaignsActive, completed: campaignsCompleted },
    content: { createdInPeriod: contentCreated, publishedTotal: contentPublished },
    live: {
      sessions: liveAgg._count._all,
      gmv: liveAgg._sum.actualGmv?.toNumber() ?? 0,
      orders: liveAgg._sum.orders ?? 0,
      viewers: liveAgg._sum.viewers ?? 0,
    },
    tasks: { pending: pendingTasks, overdue: overdueTasks },
    finance: {
      payoutsPending: payoutsPending._sum.amount?.toNumber() ?? 0,
      payoutsPaid: payoutsPaid._sum.amount?.toNumber() ?? 0,
      settlementsPending: settlementsPending._sum.amount?.toNumber() ?? 0,
      settlementsOverdue: settlementsOverdue._sum.amount?.toNumber() ?? 0,
      settlementsPaid: settlementsPaid._sum.amount?.toNumber() ?? 0,
    },
  };
}

export type InternalReport = Awaited<ReturnType<typeof getInternalReport>>;

// ---------------------------------------------------------------------------
// CSV export — semicolon-separated (id-ID Excel list separator), BOM so Excel
// reads UTF-8 correctly. Currency stays a plain number for re-import.
// ---------------------------------------------------------------------------

function csvEscape(v: string | number): string {
  const s = String(v);
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvEscape).join(";");
}

const iso = (d: Date | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

export function clientReportCsv(r: ClientReport): string {
  const t = r.totals;
  const lines: string[] = [
    csvRow(["Laporan Client"]),
    csvRow(["Campaign", r.campaign.name]),
    csvRow(["Brand", r.campaign.brandName]),
    csvRow(["Periode", `${iso(r.period.start)} s/d ${iso(r.period.end)} (${r.period.days} hari)`]),
    "",
    csvRow(["Metrik", "Nilai"]),
    csvRow(["GMV (dasar komisi)", t.gmv]),
    csvRow(["GMV produk", t.productGmv]),
    csvRow(["Orders produk", t.productOrders]),
    csvRow(["Jumlah creator", t.creators]),
    csvRow(["Jumlah video", t.videos]),
    csvRow(["Video tayang", t.videosPublished]),
    csvRow(["Sesi LIVE", t.liveSessions]),
    csvRow(["GMV LIVE", t.liveGmv]),
    csvRow(["Orders LIVE", t.liveOrders]),
    csvRow(["Viewers LIVE", t.liveViewers]),
    csvRow(["Komisi creator", t.commission]),
    csvRow(["Revenue agensi", t.agencyRevenue]),
    "",
    csvRow(["Top Creator", "GMV", "Komisi"]),
    ...r.topCreators.map((c) => csvRow([c.name, c.gmv, c.commission])),
    "",
    csvRow(["Top Produk", "GMV", "Orders"]),
    ...r.topProducts.map((p) => csvRow([p.name, p.gmv, p.orders])),
  ];
  return lines.join("\r\n");
}

export function internalReportCsv(r: InternalReport): string {
  const lines: string[] = [
    csvRow(["Laporan Internal"]),
    csvRow(["Periode", `${iso(r.period.start)} s/d ${iso(r.period.end)} (${r.period.days} hari)`]),
    "",
    csvRow(["Metrik", "Nilai"]),
    csvRow(["Agency GMV", r.gmv]),
    csvRow(["Revenue agensi", r.revenue]),
    csvRow(["Komisi creator", r.commission]),
    csvRow(["Transaksi komisi", r.commissionCount]),
    csvRow(["Creator total", r.creatorProductivity.creatorsTotal]),
    csvRow(["Creator aktif", r.creatorProductivity.creatorsActive]),
    csvRow(["Video dibuat (periode)", r.creatorProductivity.videos]),
    csvRow(["Video per creator aktif", Math.round(r.creatorProductivity.videosPerCreator * 10) / 10]),
    csvRow(["Campaign aktif", r.campaigns.active]),
    csvRow(["Campaign selesai", r.campaigns.completed]),
    csvRow(["Konten dibuat (periode)", r.content.createdInPeriod]),
    csvRow(["Konten tayang (total)", r.content.publishedTotal]),
    csvRow(["Sesi LIVE", r.live.sessions]),
    csvRow(["GMV LIVE", r.live.gmv]),
    csvRow(["Orders LIVE", r.live.orders]),
    csvRow(["Task terbuka", r.tasks.pending]),
    csvRow(["Task lewat tenggat", r.tasks.overdue]),
    "",
    csvRow(["Status Keuangan", "Nilai"]),
    csvRow(["Payout menunggu", r.finance.payoutsPending]),
    csvRow(["Payout dibayar", r.finance.payoutsPaid]),
    csvRow(["Settlement menunggu", r.finance.settlementsPending]),
    csvRow(["Settlement terlambat", r.finance.settlementsOverdue]),
    csvRow(["Settlement dibayar", r.finance.settlementsPaid]),
  ];
  return lines.join("\r\n");
}
