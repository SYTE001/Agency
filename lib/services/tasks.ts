import prisma from "@/lib/prisma";
import { paginate, totalPages, containsInsensitive } from "@/lib/services/common";
import type { Prisma } from "@/lib/prisma";
import { isTaskPriority, isTaskStatus } from "@/lib/constants";

export type TaskFilters = {
  q?: string;
  status?: string;
  priority?: string;
  ownerId?: string;
  relatedType?: string;
  relatedId?: string;
  overdue?: boolean;
  page?: number;
  pageSize?: number;
};

export async function listTasks(agencyId: string, filters: TaskFilters = {}) {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 25);

  const where: Prisma.TaskWhereInput = { agencyId };
  if (filters.q) where.title = containsInsensitive(filters.q);
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.relatedType) where.relatedType = filters.relatedType;
  if (filters.relatedId) where.relatedId = filters.relatedId;
  if (filters.overdue) {
    where.status = { in: ["Open", "InProgress"] };
    where.dueDate = { lt: new Date() };
  }

  const [rows, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      skip,
      take,
      include: {
        owner: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return { items: rows, total, page, pageSize, totalPages: totalPages(total, pageSize) };
}

export async function getTaskCounts(agencyId: string) {
  const [open, inProgress, overdue, done, cancelled] = await Promise.all([
    prisma.task.count({ where: { agencyId, status: "Open" } }),
    prisma.task.count({ where: { agencyId, status: "InProgress" } }),
    prisma.task.count({
      where: { agencyId, status: { in: ["Open", "InProgress"] }, dueDate: { lt: new Date() } },
    }),
    prisma.task.count({ where: { agencyId, status: "Done" } }),
    prisma.task.count({ where: { agencyId, status: "Cancelled" } }),
  ]);
  return { open, inProgress, overdue, done, cancelled };
}

export async function createTask(
  agencyId: string,
  actorId: string,
  data: {
    title: string;
    ownerId?: string | null;
    relatedType?: string | null;
    relatedId?: string | null;
    priority?: string;
    dueDate?: Date | null;
    notes?: string | null;
  },
) {
  return prisma.task.create({
    data: {
      agencyId,
      title: data.title,
      ownerId: data.ownerId ?? null,
      relatedType: data.relatedType ?? null,
      relatedId: data.relatedId ?? null,
      priority: isTaskPriority(data.priority ?? "") ? data.priority! : "Medium",
      dueDate: data.dueDate ?? null,
      notes: data.notes ?? null,
      createdById: actorId,
      status: "Open",
    },
  });
}

export async function updateTask(
  agencyId: string,
  taskId: string,
  actorId: string,
  data: Partial<{
    title: string;
    ownerId: string | null;
    priority: string;
    dueDate: Date | null;
    status: string;
    notes: string | null;
  }>,
) {
  const task = await prisma.task.findFirst({ where: { id: taskId, agencyId }, select: { id: true, status: true } });
  if (!task) throw new Error("Task tidak ditemukan");
  if (data.status && !isTaskStatus(data.status)) throw new Error("Status tidak valid");

  // Cancelling is only meaningful for unfinished work: Done must be reopened
  // first, and Cancelled itself is terminal. Enforced here so every caller —
  // the status action today, any future caller — hits the same rule.
  if (
    data.status === "Cancelled" &&
    task.status !== "Open" &&
    task.status !== "InProgress"
  ) {
    throw new Error("Hanya task berstatus Open atau InProgress yang dapat dibatalkan");
  }

  const willComplete = data.status === "Done" && task.status !== "Done";
  const reopened = data.status && data.status !== "Done" && task.status === "Done";

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      completedById: willComplete ? actorId : reopened ? null : undefined,
      completedAt: willComplete ? new Date() : reopened ? null : undefined,
    },
  });
}
