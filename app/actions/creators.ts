"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isCreatorStatus } from "@/lib/constants";
import { createCreator } from "@/lib/services/creators";
import { logActivity } from "@/lib/services/activity";

const creatorSchema = z.object({
  username: z.string().trim().min(3, "Username minimal 3 karakter").max(50),
  displayName: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  category: z.string().min(1, "Kategori wajib dipilih"),
  followers: z.coerce.number().int().min(0).default(0),
  engagementRate: z.coerce.number().min(0).max(100).default(0),
  managerId: z.string().transform((v) => v || null),
  bio: z.string().max(500).transform((v) => v || null),
  status: z.string().default("Active").refine(isCreatorStatus, "Status tidak valid"),
});

export type CreatorFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

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
  } catch {
    return { error: "Username sudah dipakai. Pilih username lain." };
  }

  revalidatePath("/creators");
  redirect("/creators");
}
