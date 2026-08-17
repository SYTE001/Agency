"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isTaskPriority, isTaskStatus } from "@/lib/constants";
import { createTask, updateTask } from "@/lib/services/tasks";
import { entityBelongsToAgency, logActivity } from "@/lib/services/activity";

const RELATED_TYPES = ["Creator", "Brand", "Campaign", "Content", "LiveSession"] as const;

const dateStr = z
  .string()
  .transform((v) => (v ? new Date(`${v}T00:00:00`) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Tanggal tidak valid");

const taskSchema = z.object({
  title: z.string().trim().min(3, "Judul task minimal 3 karakter").max(140),
  ownerId: z.string().transform((v) => v || null),
  priority: z.string().default("Medium").refine(isTaskPriority, "Prioritas tidak valid"),
  dueDate: dateStr,
  notes: z.string().max(1000).transform((v) => v || null),
  related: z.string().transform((v) => {
    if (!v) return { relatedType: null, relatedId: null };
    const idx = v.indexOf(":");
    if (idx <= 0) return { relatedType: null, relatedId: null };
    const relatedType = v.slice(0, idx);
    const relatedId = v.slice(idx + 1);
    if (!(RELATED_TYPES as readonly string[]).includes(relatedType)) {
      return { relatedType: null, relatedId: null };
    }
    return { relatedType, relatedId };
  }),
});

export type TaskFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createTaskAction(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const user = await requireUser();
  if (!can(user.role, "task", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah task." };
  }

  const parsed = taskSchema.safeParse({
    title: formData.get("title") ?? "",
    ownerId: formData.get("ownerId") ?? "",
    priority: formData.get("priority") || "Medium",
    dueDate: formData.get("dueDate") ?? "",
    notes: formData.get("notes") ?? "",
    related: formData.get("related") ?? "",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { related, ...rest } = parsed.data;
  if (related.relatedType && related.relatedId) {
    const ok = await entityBelongsToAgency(related.relatedType, related.relatedId, user.agencyId);
    if (!ok) return { error: "Entitas terkait tidak ditemukan di agensi ini." };
  }

  const task = await createTask(user.agencyId, user.id, { ...rest, ...related });
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Task",
    entityId: task.id,
    actorId: user.id,
    action: "Task dibuat",
    details: task.title,
  });

  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function updateTaskStatusAction(taskId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "task", "write")) return;

  const status = String(formData.get("status") ?? "");
  if (!isTaskStatus(status)) return;

  try {
    await updateTask(user.agencyId, taskId, user.id, { status });
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Task",
      entityId: taskId,
      actorId: user.id,
      action: "Status task diubah",
      details: `→ ${status}`,
    });
  } catch {
    // Task sudah berubah — abaikan
  }

  revalidatePath("/tasks");
}
