"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/constants";
import { createAgencyUser, updateAgencyUser } from "@/lib/services/users";
import { logActivity } from "@/lib/services/activity";

// Member administration is gated by setting:write — the existing matrix
// grants that permission to owner/admin only (["*"]), so no new resource is
// introduced and there is no UI-hiding-only check.

export type UserFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const roleField = z.string().refine((v) => (ROLES as readonly string[]).includes(v), "Role tidak valid");

const createUserSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(80),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  title: z.string().max(80, "Judul maksimal 80 karakter").transform((v) => v || ""),
  role: roleField,
  password: z.string().min(8, "Password minimal 8 karakter").max(100),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(80),
  title: z.string().max(80, "Judul maksimal 80 karakter").transform((v) => v || ""),
  role: roleField,
});

function toFormState(e: unknown): UserFormState {
  // Service-layer throws are authored Indonesian messages; anything else
  // (infrastructure) collapses to a neutral text so DB internals never leak.
  return {
    error: e instanceof Error && e.message.length < 200 ? e.message : "Terjadi kesalahan. Coba lagi.",
  };
}

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const user = await requireUser();
  if (!can(user.role, "setting", "write")) {
    return { error: "Anda tidak memiliki izin untuk mengelola anggota." };
  }

  const parsed = createUserSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    title: formData.get("title") ?? "",
    role: formData.get("role") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  let createdId: string;
  try {
    const created = await createAgencyUser(user.agencyId, user, parsed.data);
    createdId = created.id;
  } catch (e) {
    return toFormState(e);
  }

  await logActivity({
    agencyId: user.agencyId,
    entityType: "User",
    entityId: createdId,
    actorId: user.id,
    action: "Anggota ditambahkan",
    details: `${parsed.data.name} sebagai ${ROLE_LABELS[parsed.data.role as Role] ?? parsed.data.role}`,
  });

  revalidatePath("/settings");
  redirect("/settings");
}

export async function updateUserAction(
  userId: string,
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const user = await requireUser();
  if (!can(user.role, "setting", "write")) {
    return { error: "Anda tidak memiliki izin untuk mengelola anggota." };
  }

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name") ?? "",
    title: formData.get("title") ?? "",
    role: formData.get("role") ?? "",
  });
  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  // Read the member through the same tenant scope for the audit entry — the
  // service re-checks all authorization server-side regardless.
  const before = await prisma.user.findFirst({
    where: { id: userId, agencyId: user.agencyId },
    select: { role: true },
  });

  try {
    await updateAgencyUser(user.agencyId, user, userId, parsed.data);
  } catch (e) {
    return toFormState(e);
  }

  const roleChanged = before !== null && before.role !== parsed.data.role;
  const previousLabel = before ? ROLE_LABELS[before.role as Role] ?? before.role : "?";
  await logActivity({
    agencyId: user.agencyId,
    entityType: "User",
    entityId: userId,
    actorId: user.id,
    action: roleChanged ? "Role anggota diubah" : "Profil anggota diperbarui",
    details: roleChanged
      ? `${parsed.data.name}: ${previousLabel} → ${ROLE_LABELS[parsed.data.role as Role] ?? parsed.data.role}`
      : parsed.data.name,
  });

  revalidatePath("/settings");
  redirect("/settings");
}
