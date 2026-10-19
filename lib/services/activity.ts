import prisma from "@/lib/prisma";

export function logActivity(args: {
  agencyId: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  action: string;
  details?: string | null;
}) {
  return prisma.activity.create({
    data: {
      agencyId: args.agencyId,
      entityType: args.entityType,
      entityId: args.entityId,
      actorId: args.actorId ?? null,
      action: args.action,
      details: args.details ?? null,
    },
  });
}

export async function getActivity(entityType: string, entityId: string, agencyId: string, limit = 20) {
  return prisma.activity.findMany({
    where: { agencyId, entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { id: true, name: true } } },
  });
}

export async function getNotes(entityType: string, entityId: string, agencyId: string) {
  return prisma.note.findMany({
    where: { agencyId, entityType, entityId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, name: true } } },
  });
}

export function addNote(args: {
  agencyId: string;
  entityType: string;
  entityId: string;
  authorId: string;
  content: string;
}) {
  return prisma.note.create({
    data: {
      agencyId: args.agencyId,
      entityType: args.entityType,
      entityId: args.entityId,
      authorId: args.authorId,
      content: args.content,
    },
  });
}

export async function entityBelongsToAgency(

  entityType: string,
  entityId: string,
  agencyId: string,
): Promise<boolean> {
  const findFirst = (model: {
    findFirst: (args: { where: { id: string; agencyId: string }; select: { id: true } }) => Promise<{ id: string } | null>;
  }) => model.findFirst({ where: { id: entityId, agencyId }, select: { id: true } });

  const found =
    entityType === "Creator" ? await findFirst(prisma.creator) :
    entityType === "Brand" ? await findFirst(prisma.brand) :
    entityType === "Campaign" ? await findFirst(prisma.campaign) :
    entityType === "Content" ? await findFirst(prisma.contentItem) :
    entityType === "LiveSession" ? await findFirst(prisma.liveSession) :
    entityType === "Product" ? await findFirst(prisma.product) :
    entityType === "User" ? await findFirst(prisma.user) :
    null;
  return found != null;
}
