"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isCampaignStatus } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import {
  addCampaignCreator,
  createCampaign,
  removeCampaignCreator,
} from "@/lib/services/campaigns";
import { addNote, entityBelongsToAgency, logActivity } from "@/lib/services/activity";

const dateStr = z
  .string()
  .transform((v) => (v ? new Date(`${v}T00:00:00`) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Tanggal tidak valid");

const campaignSchema = z
  .object({
    name: z.string().trim().min(3, "Nama campaign minimal 3 karakter").max(100),
    brandId: z.string().min(1, "Brand wajib dipilih"),
    ownerId: z.string().transform((v) => v || null),
    startDate: dateStr,
    endDate: dateStr,
    budget: z.coerce.number().min(0).default(0),
    creatorTarget: z.coerce.number().int().min(0).default(0),
    contentTarget: z.coerce.number().int().min(0).default(0),
    liveTarget: z.coerce.number().int().min(0).default(0),
    gmvTarget: z.coerce.number().min(0).default(0),
    commissionRate: z.coerce.number().min(0).max(100).default(0),
    status: z.string().default("Draft").refine(isCampaignStatus, "Status tidak valid"),
    notes: z.string().max(1000).transform((v) => v || null),
  })
  .refine((d) => d.endDate === null || d.startDate === null || d.endDate >= d.startDate, {
    message: "Tanggal selesai harus setelah tanggal mulai",
    path: ["endDate"],
  });

export type CampaignFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createCampaignAction(
  _prev: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  const user = await requireUser();
  if (!can(user.role as Role, "campaign", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah campaign." };
  }

  const parsed = campaignSchema.safeParse({
    name: formData.get("name"),
    brandId: formData.get("brandId") ?? "",
    ownerId: formData.get("ownerId") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    budget: formData.get("budget") || "0",
    creatorTarget: formData.get("creatorTarget") || "0",
    contentTarget: formData.get("contentTarget") || "0",
    liveTarget: formData.get("liveTarget") || "0",
    gmvTarget: formData.get("gmvTarget") || "0",
    commissionRate: formData.get("commissionRate") || "0",
    status: formData.get("status") || "Draft",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const campaign = await createCampaign(user.agencyId, parsed.data);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Campaign",
      entityId: campaign.id,
      actorId: user.id,
      action: "Campaign dibuat",
      details: campaign.name,
    });
  } catch {
    return { error: "Brand tidak ditemukan. Pilih brand yang valid." };
  }

  revalidatePath("/campaigns");
  redirect("/campaigns");
}

// ---------------------------------------------------------------------------
// Link / unlink creators to a campaign (PLAN §9)
// ---------------------------------------------------------------------------

const linkSchema = z.object({
  creatorId: z.string().min(1, "Pilih creator terlebih dahulu"),
  role: z.string().trim().max(60).transform((v) => v || null),
  fee: z.coerce.number().min(0).default(0),
});

export type LinkFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  ok?: boolean;
};

export async function addCampaignCreatorAction(
  campaignId: string,
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  const user = await requireUser();
  if (!can(user.role as Role, "campaign", "write")) {
    return { error: "Anda tidak memiliki izin untuk mengubah campaign." };
  }

  const parsed = linkSchema.safeParse({
    creatorId: formData.get("creatorId") ?? "",
    role: formData.get("role") ?? "",
    fee: formData.get("fee") || "0",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await addCampaignCreator(user.agencyId, campaignId, parsed.data);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Campaign",
      entityId: campaignId,
      actorId: user.id,
      action: "Creator ditambahkan ke campaign",
    });
  } catch {
    return { error: "Creator atau campaign tidak ditemukan." };
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true };
}

export async function removeCampaignCreatorAction(
  campaignId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  if (!can(user.role as Role, "campaign", "write")) return;

  const linkId = String(formData.get("linkId") ?? "");
  if (!linkId) return;

  try {
    await removeCampaignCreator(user.agencyId, linkId);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Campaign",
      entityId: campaignId,
      actorId: user.id,
      action: "Creator dikeluarkan dari campaign",
    });
  } catch {
    // Data sudah tidak ada — abaikan
  }

  revalidatePath(`/campaigns/${campaignId}`);
}

// ---------------------------------------------------------------------------
// Notes (PLAN §14)
// ---------------------------------------------------------------------------

export async function addCampaignNoteAction(
  campaignId: string,
  _prev: LinkFormState,
  formData: FormData,
): Promise<LinkFormState> {
  const user = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  if (content.length < 3) {
    return { error: "Catatan minimal 3 karakter." };
  }

  const ok = await entityBelongsToAgency("Campaign", campaignId, user.agencyId);
  if (!ok) return { error: "Campaign tidak ditemukan." };

  await addNote({
    agencyId: user.agencyId,
    entityType: "Campaign",
    entityId: campaignId,
    authorId: user.id,
    content,
  });
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Campaign",
    entityId: campaignId,
    actorId: user.id,
    action: "Catatan ditambahkan",
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true };
}
