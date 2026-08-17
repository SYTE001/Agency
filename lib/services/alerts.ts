import prisma from "@/lib/prisma";
import { daysAgoDate } from "@/lib/services/common";

/**
 * Deterministic operational alerts (PLAN §15).
 * Every alert carries: type, message, entity ref, action ref. No AI scores.
 */
export type Alert = {
  id: string;
  kind:
    | "creator_declining"
    | "creator_inactive"
    | "content_overdue"
    | "content_review"
    | "campaign_deadline"
    | "campaign_below_target"
    | "live_needs_operator"
    | "live_underperforming"
    | "settlement_pending"
    | "task_overdue";
  message: string;
  severity: "info" | "warning" | "critical";
  entityType: string;
  entityId: string | null;
  href: string;
  count?: number;
};

export async function getOperationalAlerts(agencyId: string, limit = 12): Promise<Alert[]> {
  const now = new Date();
  const since30 = daysAgoDate(30);
  const since60 = daysAgoDate(60);

  const [
    decliningCreators,
    overdueContent,
    reviewContent,
    upcomingDeadlines,
    unassignedLives,
    pendingSettlements,
    overdueTasks,
    recentEndedLives,
  ] = await Promise.all([
    // Creators whose GMV dropped > 20% vs previous 30 days
    prisma.creatorMetric.groupBy({
      by: ["creatorId"],
      where: { creator: { agencyId }, date: { gte: since30 } },
      _sum: { gmv: true },
    }).then(async (recent) => {
      const ids = recent.map((r) => r.creatorId);
      const prev = await prisma.creatorMetric.groupBy({
        by: ["creatorId"],
        where: { creatorId: { in: ids }, date: { gte: since60, lt: since30 } },
        _sum: { gmv: true },
      });
      const prevMap = new Map(prev.map((p) => [p.creatorId, p._sum.gmv ?? 0]));
      const decliningIds: { id: string; drop: number }[] = [];
      for (const r of recent) {
        const prevGmv = prevMap.get(r.creatorId) ?? 0;
        if (prevGmv <= 0) continue;
        const change = ((r._sum.gmv ?? 0) - prevGmv) / prevGmv;
        if (change <= -0.2) decliningIds.push({ id: r.creatorId, drop: Math.round(Math.abs(change) * 100) });
      }
      if (decliningIds.length === 0) return [];
      const creators = await prisma.creator.findMany({
        where: { id: { in: decliningIds.map((d) => d.id) } },
        select: { id: true, displayName: true },
      });
      const nameMap = new Map(creators.map((c) => [c.id, c.displayName]));
      return decliningIds.map((d) => ({
        id: nameMap.get(d.id) ?? d.id,
        drop: d.drop,
      }));
    }),
    prisma.contentItem.count({
      where: {
        agencyId,
        status: { in: ["Brief", "Assigned", "WaitingForDraft", "DraftSubmitted", "Revision"] },
        dueDate: { lt: now },
      },
    }),
    prisma.contentItem.count({
      where: { agencyId, status: { in: ["DraftSubmitted", "Revision"] } },
    }),
    prisma.campaign.count({
      where: {
        agencyId,
        status: { in: ["Recruiting", "Active", "ContentReview", "Published"] },
        endDate: { gte: now, lte: daysAgoDate(-7) },
      },
    }),
    prisma.liveSession.findMany({
      where: { agencyId, status: { in: ["Scheduled", "Preparing"] }, operatorId: null, startTime: { gte: now } },
      take: 20,
      select: { id: true, room: true, startTime: true },
    }),
    prisma.settlement.count({ where: { agencyId, status: { in: ["Pending", "Overdue"] } } }),
    prisma.task.count({
      where: { agencyId, status: { in: ["Open", "InProgress"] }, dueDate: { lt: now } },
    }),
    prisma.liveSession.findMany({
      where: { agencyId, status: { in: ["Ended", "NeedsReview"] }, targetGmv: { gt: 0 }, startTime: { gte: daysAgoDate(7) } },
      select: { id: true, actualGmv: true, targetGmv: true },
      take: 100,
    }),
  ]);

  const alerts: Alert[] = [];

  for (const c of decliningCreators.slice(0, 4)) {
    alerts.push({
      id: `creator-decline-${c.id}`,
      kind: "creator_declining",
      message: `Performa kreator ${c.id} turun ${c.drop}% (GMV 30 hari)`,
      severity: "critical",
      entityType: "Creator",
      entityId: c.id,
      href: `/creators/${c.id}`,
    });
  }

  if (overdueContent > 0) {
    alerts.push({
      id: "content-overdue",
      kind: "content_overdue",
      message: `${overdueContent} konten melewati tenggat`,
      severity: "critical",
      entityType: "Content",
      entityId: null,
      href: "/content?overdue=1",
      count: overdueContent,
    });
  }

  if (reviewContent > 0) {
    alerts.push({
      id: "content-review",
      kind: "content_review",
      message: `${reviewContent} konten menunggu review / revisi`,
      severity: "warning",
      entityType: "Content",
      entityId: null,
      href: "/content/review",
      count: reviewContent,
    });
  }

  if (upcomingDeadlines > 0) {
    alerts.push({
      id: "campaign-deadline",
      kind: "campaign_deadline",
      message: `${upcomingDeadlines} campaign berakhir dalam 7 hari`,
      severity: "warning",
      entityType: "Campaign",
      entityId: null,
      href: "/campaigns?view=active",
      count: upcomingDeadlines,
    });
  }

  for (const live of unassignedLives.slice(0, 3)) {
    alerts.push({
      id: `live-operator-${live.id}`,
      kind: "live_needs_operator",
      message: `LIVE ${live.room ?? live.id} belum punya operator`,
      severity: "warning",
      entityType: "LiveSession",
      entityId: live.id,
      href: `/live/${live.id}`,
    });
  }

  const underLives = recentEndedLives.filter((l) => l.actualGmv < l.targetGmv * 0.5).length;
  if (underLives > 0) {
    alerts.push({
      id: "live-underperforming",
      kind: "live_underperforming",
      message: `${underLives} sesi LIVE 7 hari terakhir di bawah 50% target`,
      severity: "warning",
      entityType: "LiveSession",
      entityId: null,
      href: "/live",
      count: underLives,
    });
  }

  if (pendingSettlements > 0) {
    alerts.push({
      id: "settlement-pending",
      kind: "settlement_pending",
      message: `${pendingSettlements} settlement menunggu pembayaran`,
      severity: "warning",
      entityType: "Settlement",
      entityId: null,
      href: "/finance/settlements?status=Pending",
      count: pendingSettlements,
    });
  }

  if (overdueTasks > 0) {
    alerts.push({
      id: "task-overdue",
      kind: "task_overdue",
      message: `${overdueTasks} task melewati tenggat`,
      severity: "warning",
      entityType: "Task",
      entityId: null,
      href: "/tasks?overdue=1",
      count: overdueTasks,
    });
  }

  // Critical first, stable order within severity
  const severityRank = { critical: 0, warning: 1, info: 2 } as const;
  alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return alerts.slice(0, limit);
}
