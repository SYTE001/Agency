"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isCreatorStatus } from "@/lib/constants";
import { createCreator, updateCreator } from "@/lib/services/creators";
import { logActivity } from "@/lib/services/activity";

// Shared fields between create and edit; username (identity) only exists on
// create — it is never editable afterwards.
const creatorFieldsSchema = z.object({
  displayName: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  category: z.string().min(1, "Kategori wajib dipilih"),
  followers: z.coerce.number().int().min(0).default(0),
  engagementRate: z.coerce.number().min(0).max(100).default(0),
  managerId: z.string().transform((v) => v || null),
  bio: z.string().max(500).transform((v) => v || null),
  status: z.string().default("Active").refine(isCreatorStatus, "Status tidak valid"),
});

const creatorSchema = creatorFieldsSchema.extend({
  username: z.string().trim().min(3, "Username minimal 3 karakter").max(50),
});

const creatorUpdateSchema = creatorFieldsSchema.extend({
  creatorId: z.string().min(1, "Creator tidak valid"),
});

export type CreatorFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

// Services throw neutral, user-facing Indonesian messages and log the
// original error server-side — safe to surface as-is.
function toFormError(e: unknown): CreatorFormState {
  if (e instanceof Error && e.message) return { error: e.message };
  return { error: "Gagal menyimpan creator. Coba lagi." };
}

export async function createCreatorAction(
  _prev: CreatorFormState,
  formData: FormData,
): Promise<CreatorFormState> {
  const user = await requireUser();
  if (!can(user.role, "creator", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah creator." };
  }

  const parsed = creatorSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
    category: formData.get("category"),
    followers: formData.get("followers") || "0",
    engagementRate: formData.get("engagementRate") || "0",
    managerId: formData.get("managerId") ?? "",
    bio: formData.get("bio") ?? "",
    status: formData.get("status") || "Active",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const creator = await createCreator(user.agencyId, parsed.data);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Creator",
      entityId: creator.id,
      actorId: user.id,
      action: "Creator ditambahkan",
      details: creator.displayName,
    });
  } catch (e) {
    return toFormError(e);
  }

  revalidatePath("/creators");
  redirect("/creators");
}

export async function updateCreatorAction(
  _prev: CreatorFormState,
  formData: FormData,
): Promise<CreatorFormState> {
  const user = await requireUser();
  if (!can(user.role, "creator", "write")) {
    return { error: "Anda tidak memiliki izin untuk mengubah creator." };
  }

  const parsed = creatorUpdateSchema.safeParse({
    creatorId: formData.get("creatorId"),
    displayName: formData.get("displayName"),
    category: formData.get("category"),
    followers: formData.get("followers") || "0",
    engagementRate: formData.get("engagementRate") || "0",
    managerId: formData.get("managerId") ?? "",
    bio: formData.get("bio") ?? "",
    status: formData.get("status") || "Active",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { creatorId, ...fields } = parsed.data;

  let updatedId: string;
  try {
    const updated = await updateCreator(user.agencyId, creatorId, fields);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Creator",
      entityId: updated.id,
      actorId: user.id,
      action: "Creator diperbarui",
      details: updated.displayName,
    });
    updatedId = updated.id;
  } catch (e) {
    return toFormError(e);
  }

  revalidatePath("/creators");
  revalidatePath(`/creators/${updatedId}`);
  redirect(`/creators/${updatedId}`);
}
