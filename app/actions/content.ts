"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isContentStatus } from "@/lib/constants";
import { createContentItem, updateContentStatus } from "@/lib/services/content";
import { addNote, entityBelongsToAgency, logActivity } from "@/lib/services/activity";

const dateStr = z
  .string()
  .transform((v) => (v ? new Date(`${v}T00:00:00`) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Tanggal tidak valid");

const contentSchema = z.object({
  title: z.string().trim().min(3, "Judul konten minimal 3 karakter").max(120),
  campaignId: z.string().min(1, "Campaign wajib dipilih"),
  creatorId: z.string().min(1, "Creator wajib dipilih"),
  productId: z.string().transform((v) => v || null),
  reviewerId: z.string().transform((v) => v || null),
  dueDate: dateStr,
  brief: z.string().max(1000).transform((v) => v || null),
});

export type ContentFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createContentAction(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const user = await requireUser();
  if (!can(user.role, "content", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah konten." };
  }

  const parsed = contentSchema.safeParse({
    title: formData.get("title") ?? "",
    campaignId: formData.get("campaignId") ?? "",
    creatorId: formData.get("creatorId") ?? "",
    productId: formData.get("productId") ?? "",
    reviewerId: formData.get("reviewerId") ?? "",
    dueDate: formData.get("dueDate") ?? "",
    brief: formData.get("brief") ?? "",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const item = await createContentItem(user.agencyId, parsed.data);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Content",
      entityId: item.id,
      actorId: user.id,
      action: "Konten dibuat",
      details: item.title,
    });
  } catch {
    return { error: "Campaign atau creator tidak ditemukan." };
  }

  revalidatePath("/content");
  redirect("/content");
}

// ---------------------------------------------------------------------------
// Status moves (PLAN §10 — Kanban pipeline)
// ---------------------------------------------------------------------------

export async function moveContentAction(contentId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "content", "write")) return;

  const status = String(formData.get("status") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  if (!status || !isContentStatus(status)) return;

  try {
    await updateContentStatus(user.agencyId, contentId, status, { feedback });
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Content",
      entityId: contentId,
      actorId: user.id,
      action: "Status konten diubah",
      details: `→ ${status}`,
    });
  } catch {
    // Data sudah berubah — abaikan
  }

  revalidatePath("/content");
  revalidatePath(`/content/${contentId}`);
}

// ---------------------------------------------------------------------------
// Notes (PLAN §14)
// ---------------------------------------------------------------------------

export type ContentNoteState = { error?: string; ok?: boolean };

export async function addContentNoteAction(
  contentId: string,
  _prev: ContentNoteState,
  formData: FormData,
): Promise<ContentNoteState> {
  const user = await requireUser();
  // Catatan adalah data baru pada konten — butuh izin write, read saja tidak cukup
  if (!can(user.role, "content", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah catatan." };
  }
  const content = String(formData.get("content") ?? "").trim();
  if (content.length < 3) {
    return { error: "Catatan minimal 3 karakter." };
  }

  const ok = await entityBelongsToAgency("Content", contentId, user.agencyId);
  if (!ok) return { error: "Konten tidak ditemukan." };

  await addNote({
    agencyId: user.agencyId,
    entityType: "Content",
    entityId: contentId,
    authorId: user.id,
    content,
  });
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Content",
    entityId: contentId,
    actorId: user.id,
    action: "Catatan ditambahkan",
  });

  revalidatePath(`/content/${contentId}`);
  return { ok: true };
}
