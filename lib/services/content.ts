import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { CONTENT_STATUS, isContentStatus } from "@/lib/constants";

export type ContentRow = {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  publishDate: Date | null;
  revisionCount: number;
  gmvGenerated: number;
  viewsGenerated: number;
  campaignId: string;
  campaignName: string;
  creatorId: string;
  creatorName: string;
  productName: string | null;
  reviewerName: string | null;
};

export type ContentFilters = {
  q?: string;
  campaignId?: string;
  creatorId?: string;
  status?: string;
  overdue?: boolean;
};

export const KANBAN_COLUMNS = CONTENT_STATUS;

/** Kanban board: all open-pipeline items grouped by status (PLAN §10). */
export async function getContentBoard(agencyId: string, filters: ContentFilters = {}) {
  const where: Prisma.ContentItemWhereInput = { agencyId };
  if (filters.q) where.title = { contains: filters.q };
  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.creatorId) where.creatorId = filters.creatorId;
  if (filters.status) where.status = filters.status;
  if (filters.overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { in: ["Brief", "Assigned", "WaitingForDraft", "DraftSubmitted", "Revision"] };
  }

  const items = await prisma.contentItem.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      campaign: { select: { id: true, name: true } },
      creator: { select: { id: true, displayName: true } },
      product: { select: { name: true } },
      reviewer: { select: { name: true } },
    },
    take: 500,
  });

  const byStatus = new Map<string, ContentRow[]>(KANBAN_COLUMNS.map((s) => [s, []]));
  for (const item of items) {
    const row: ContentRow = {
      id: item.id,
      title: item.title,
      status: item.status,
      dueDate: item.dueDate,
      publishDate: item.publishDate,
      revisionCount: item.revisionCount,
      gmvGenerated: item.gmvGenerated.toNumber(),
      viewsGenerated: item.viewsGenerated,
      campaignId: item.campaignId,
      campaignName: item.campaign.name,
      creatorId: item.creatorId,
      creatorName: item.creator.displayName,
      productName: item.product?.name ?? null,
      reviewerName: item.reviewer?.name ?? null,
    };
    byStatus.get(item.status)?.push(row);
  }
  return { items, byStatus, total: items.length };
}

export async function getContentDetail(agencyId: string, contentId: string) {
  const item = await prisma.contentItem.findFirst({
    where: { id: contentId, agencyId },
    include: {
      campaign: { select: { id: true, name: true, status: true } },
      creator: { select: { id: true, displayName: true, username: true } },
      product: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
      revisions: { orderBy: { version: "desc" } },
    },
  });
  if (!item) return null;

  const [activity, tasks] = await Promise.all([
    prisma.activity.findMany({
      where: { agencyId, entityType: "Content", entityId: contentId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { id: true, name: true } } },
    }),
    prisma.task.findMany({
      where: { agencyId, relatedType: "Content", relatedId: contentId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return { item, activity, tasks };
}

export async function createContentItem(
  agencyId: string,
  data: {
    campaignId: string;
    creatorId: string;
    productId?: string | null;
    title: string;
    brief?: string | null;
    dueDate?: Date | null;
    reviewerId?: string | null;
  },
) {
  const campaign = await prisma.campaign.findFirst({ where: { id: data.campaignId, agencyId }, select: { id: true } });
  if (!campaign) throw new Error("Campaign tidak ditemukan");
  const creator = await prisma.creator.findFirst({ where: { id: data.creatorId, agencyId }, select: { id: true } });
  if (!creator) throw new Error("Creator tidak ditemukan");
  return prisma.contentItem.create({
    data: {
      agencyId,
      campaignId: data.campaignId,
      creatorId: data.creatorId,
      productId: data.productId ?? null,
      title: data.title,
      brief: data.brief ?? null,
      dueDate: data.dueDate ?? null,
      reviewerId: data.reviewerId ?? null,
      status: "Brief",
    },
  });
}

export async function updateContentStatus(
  agencyId: string,
  contentId: string,
  status: string,
  opts: { feedback?: string | null } = {},
) {
  const item = await prisma.contentItem.findFirst({
    where: { id: contentId, agencyId },
    select: { id: true, status: true, revisionCount: true },
  });
  if (!item) throw new Error("Konten tidak ditemukan");
  if (!isContentStatus(status)) throw new Error("Status tidak valid");

  const isRevision = status === "Revision";
  return prisma.$transaction([
    prisma.contentItem.update({
      where: { id: contentId },
      data: {
        status,
        revisionCount: isRevision ? item.revisionCount + 1 : item.revisionCount,
        publishDate: status === "Published" ? new Date() : undefined,
      },
    }),
    ...(isRevision && opts.feedback
      ? [
          prisma.contentRevision.create({
            data: { contentItemId: contentId, version: item.revisionCount + 1, feedback: opts.feedback },
          }),
        ]
      : []),
  ]);
}

export async function updateContentItem(
  agencyId: string,
  contentId: string,
  data: Partial<{
    title: string;
    brief: string | null;
    dueDate: Date | null;
    publishDate: Date | null;
    contentUrl: string | null;
    status: string;
    reviewerId: string | null;
    notes: string | null;
    gmvGenerated: number;
    viewsGenerated: number;
  }>,
) {
  const item = await prisma.contentItem.findFirst({ where: { id: contentId, agencyId }, select: { id: true } });
  if (!item) throw new Error("Konten tidak ditemukan");
  return prisma.contentItem.update({ where: { id: contentId }, data });
}
