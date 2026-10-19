"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isContentStatus } from "@/lib/constants";
import { createContentItem, updateContentStatus } from "@/lib/services/content";
import { addNote, entityBelongsToAgency, logActivity } from "@/lib/services/activity";
import { getAgencyTimezone } from "@/lib/services/common";
import { parseDateTimeLocalInTz } from "@/lib/timezone";

function makeContentSchema(tz: string) {
  return z.object({
    title: z.string().trim().min(3, "Judul konten minimal 3 karakter").max(120),
    campaignId: z.string().min(1, "Campaign wajib dipilih"),
    creatorId: z.string().min(1, "Creator wajib dipilih"),
    productId: z.string().transform((v) => v || null),
    reviewerId: z.string().transform((v) => v || null),
    dueDate: z
      .string()
      .transform((v) => (v ? parseDateTimeLocalInTz(tz, v) : null))
      .refine((d) => d === null || !Number.isNaN(d.getTime()), "Tanggal tidak valid"),
    brief: z.string().max(1000).transform((v) => v || null),
  });
}

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

  const tz = await getAgencyTimezone(user.agencyId);
  const parsed = makeContentSchema(tz).safeParse({
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

  const checks: [string | null, "Campaign" | "Creator" | "Product" | "User"][] = [
    [parsed.data.campaignId, "Campaign"],
    [parsed.data.creatorId, "Creator"],
    [parsed.data.productId, "Product"],
    [parsed.data.reviewerId, "User"],
  ];
  for (const [id, type] of checks) {
    if (!id) continue;
    const ok = await entityBelongsToAgency(type, id, user.agencyId);
    if (!ok) return { error: `${type} terpilih tidak ditemukan di agensi ini.` };
  }

  let newId: string;
  try {
    const item = await createContentItem(user.agencyId, parsed.data);
    newId = item.id;
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Content",
      entityId: item.id,
      actorId: user.id,
      action: "Konten dibuat",
      details: item.title,
    });
  } catch (e) {
    console.error("createContentAction failed", e);
    return { error: "Campaign atau creator tidak ditemukan." };
  }

  revalidatePath("/content");
  redirect(`/content/${newId}`);
}

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
  } catch (e) {
    console.error("moveContentAction failed", e);
  }

  revalidatePath("/content");
  revalidatePath(`/content/${contentId}`);
}

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
