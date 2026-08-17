"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isLiveStatus } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { createLiveSession, recordLiveResults, updateLiveSession } from "@/lib/services/live";
import { addNote, entityBelongsToAgency, logActivity } from "@/lib/services/activity";

// "2026-08-17T14:30" from <input type="datetime-local">
const dateTimeStr = z.coerce
  .date()
  .refine((d) => !Number.isNaN(d.getTime()), "Waktu tidak valid");
const optionalDateTime = z
  .string()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Waktu tidak valid");

const liveSchema = z.object({
  creatorId: z.string().min(1, "Creator wajib dipilih"),
  campaignId: z.string().transform((v) => v || null),
  brandId: z.string().transform((v) => v || null),
  productId: z.string().transform((v) => v || null),
  operatorId: z.string().transform((v) => v || null),
  room: z.string().max(80).transform((v) => v.trim() || null),
  startTime: dateTimeStr,
  endTime: optionalDateTime,
  targetGmv: z.coerce.number().min(0, "Target GMV tidak boleh negatif").default(0),
  notes: z.string().max(1000).transform((v) => v || null),
});

export type LiveFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createLiveAction(
  _prev: LiveFormState,
  formData: FormData,
): Promise<LiveFormState> {
  const user = await requireUser();
  if (!can(user.role as Role, "live", "write")) {
    return { error: "Anda tidak memiliki izin untuk menjadwalkan LIVE." };
  }

  const parsed = liveSchema.safeParse({
    creatorId: formData.get("creatorId") ?? "",
    campaignId: formData.get("campaignId") ?? "",
    brandId: formData.get("brandId") ?? "",
    productId: formData.get("productId") ?? "",
    operatorId: formData.get("operatorId") ?? "",
    room: formData.get("room") ?? "",
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
    targetGmv: formData.get("targetGmv") || 0,
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const data = parsed.data;
  const checks: [string | null, "Creator" | "Campaign" | "Brand" | "Product"][] = [
    [data.creatorId, "Creator"],
    [data.campaignId, "Campaign"],
    [data.brandId, "Brand"],
    [data.productId, "Product"],
  ];
  for (const [id, type] of checks) {
    if (!id) continue;
    const ok = await entityBelongsToAgency(type, id, user.agencyId);
    if (!ok) return { error: `${type} terpilih tidak ditemukan di agensi ini.` };
  }
  if (data.operatorId) {
    const operator = await prisma.user.findFirst({
      where: { id: data.operatorId, agencyId: user.agencyId },
      select: { id: true },
    });
    if (!operator) return { error: "Operator terpilih tidak ditemukan di agensi ini." };
  }

  const session = await createLiveSession(user.agencyId, data);
  await logActivity({
    agencyId: user.agencyId,
    entityType: "LiveSession",
    entityId: session.id,
    actorId: user.id,
    action: "Sesi LIVE dijadwalkan",
    details: session.room ?? undefined,
  });

  revalidatePath("/live");
  redirect(`/live/${session.id}`);
}

/** Quick status transition from the list/detail page (form POST, hidden status). */
export async function moveLiveStatusAction(sessionId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role as Role, "live", "write")) return;

  const status = String(formData.get("status") ?? "");
  if (!isLiveStatus(status)) return;

  try {
    await updateLiveSession(user.agencyId, sessionId, { status });
    await logActivity({
      agencyId: user.agencyId,
      entityType: "LiveSession",
      entityId: sessionId,
      actorId: user.id,
      action: "Status LIVE diubah",
      details: `→ ${status}`,
    });
  } catch {
    // Sesi sudah berubah — abaikan
  }

  revalidatePath("/live");
  revalidatePath(`/live/${sessionId}`);
}

const resultsSchema = z.object({
  actualGmv: z.coerce.number().min(0, "GMV tidak boleh negatif"),
  viewers: z.coerce.number().int().min(0, "Viewers tidak boleh negatif"),
  orders: z.coerce.number().int().min(0, "Orders tidak boleh negatif"),
});

export type LiveResultsState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  ok?: boolean;
};

/** Close a session by recording final GMV/viewers/orders (PLAN §31 step 9-10). */
export async function recordLiveResultsAction(
  sessionId: string,
  _prev: LiveResultsState,
  formData: FormData,
): Promise<LiveResultsState> {
  const user = await requireUser();
  if (!can(user.role as Role, "live", "write")) {
    return { error: "Anda tidak memiliki izin untuk menutup sesi LIVE." };
  }

  const parsed = resultsSchema.safeParse({
    actualGmv: formData.get("actualGmv") ?? 0,
    viewers: formData.get("viewers") ?? 0,
    orders: formData.get("orders") ?? 0,
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali angka hasil LIVE.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const ok = await entityBelongsToAgency("LiveSession", sessionId, user.agencyId);
  if (!ok) return { error: "Sesi LIVE tidak ditemukan." };

  await recordLiveResults(user.agencyId, sessionId, parsed.data);
  await logActivity({
    agencyId: user.agencyId,
    entityType: "LiveSession",
    entityId: sessionId,
    actorId: user.id,
    action: "Hasil LIVE dicatat",
    details: `GMV ${parsed.data.actualGmv}, ${parsed.data.viewers} viewers, ${parsed.data.orders} orders`,
  });

  revalidatePath("/live");
  revalidatePath(`/live/${sessionId}`);
  return { ok: true };
}

export async function addLiveNoteAction(
  sessionId: string,
  _prev: { error?: string; ok?: boolean },
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  const user = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  if (content.length < 3) {
    return { error: "Catatan minimal 3 karakter." };
  }

  const ok = await entityBelongsToAgency("LiveSession", sessionId, user.agencyId);
  if (!ok) return { error: "Sesi LIVE tidak ditemukan." };

  await addNote({
    agencyId: user.agencyId,
    entityType: "LiveSession",
    entityId: sessionId,
    authorId: user.id,
    content,
  });
  await logActivity({
    agencyId: user.agencyId,
    entityType: "LiveSession",
    entityId: sessionId,
    actorId: user.id,
    action: "Catatan ditambahkan",
  });

  revalidatePath(`/live/${sessionId}`);
  return { ok: true };
}
