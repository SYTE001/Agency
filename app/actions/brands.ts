"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isBrandStatus } from "@/lib/constants";
import { createBrand, updateBrand, createBrandContact } from "@/lib/services/brands";
import { addNote, entityBelongsToAgency, logActivity } from "@/lib/services/activity";

// Shared fields between create and edit.
const brandFieldsSchema = z.object({
  name: z.string().trim().min(2, "Nama brand minimal 2 karakter").max(80),
  industry: z.string().trim().max(60).transform((v) => v || null),
  website: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Website harus diawali http(s)://")
    .transform((v) => v || null),
  description: z.string().max(500).transform((v) => v || null),
  status: z.string().default("Active").refine(isBrandStatus, "Status tidak valid"),
});

const brandUpdateSchema = brandFieldsSchema.extend({
  brandId: z.string().min(1, "Brand tidak valid"),
});

export type BrandFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

// Services throw neutral, user-facing Indonesian messages and log the
// original error server-side — safe to surface as-is.
function toFormError(e: unknown): BrandFormState {
  if (e instanceof Error && e.message) return { error: e.message };
  return { error: "Gagal menyimpan brand. Coba lagi." };
}

export async function createBrandAction(
  _prev: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const user = await requireUser();
  if (!can(user.role, "brand", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah brand." };
  }

  const parsed = brandFieldsSchema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry") ?? "",
    website: formData.get("website") ?? "",
    description: formData.get("description") ?? "",
    status: formData.get("status") || "Active",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const brand = await createBrand(user.agencyId, parsed.data);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Brand",
      entityId: brand.id,
      actorId: user.id,
      action: "Brand ditambahkan",
      details: brand.name,
    });
  } catch (e) {
    return toFormError(e);
  }

  revalidatePath("/brands");
  redirect("/brands");
}

export async function updateBrandAction(
  _prev: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const user = await requireUser();
  if (!can(user.role, "brand", "write")) {
    return { error: "Anda tidak memiliki izin untuk mengubah brand." };
  }

  const parsed = brandUpdateSchema.safeParse({
    brandId: formData.get("brandId"),
    name: formData.get("name"),
    industry: formData.get("industry") ?? "",
    website: formData.get("website") ?? "",
    description: formData.get("description") ?? "",
    status: formData.get("status") || "Active",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { brandId, ...fields } = parsed.data;

  let updatedId: string;
  try {
    const updated = await updateBrand(user.agencyId, brandId, fields);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Brand",
      entityId: updated.id,
      actorId: user.id,
      action: "Brand diperbarui",
      details: updated.name,
    });
    updatedId = updated.id;
  } catch (e) {
    return toFormError(e);
  }

  revalidatePath("/brands");
  revalidatePath(`/brands/${updatedId}`);
  redirect(`/brands/${updatedId}`);
}

// ---------------------------------------------------------------------------
// Contact person (PLAN §8)
// ---------------------------------------------------------------------------

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  email: z
    .string()
    .trim()
    .transform((v) => v || null)
    .pipe(z.union([z.null(), z.string().email("Email tidak valid")])),
  phone: z.string().trim().max(30).transform((v) => v || null),
  role: z.string().trim().max(60).transform((v) => v || null),
  isPrimary: z.boolean().default(false),
});

export type ContactFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  ok?: boolean;
};

export async function addBrandContactAction(
  brandId: string,
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const user = await requireUser();
  if (!can(user.role, "brand", "write")) {
    return { error: "Anda tidak memiliki izin untuk mengubah brand." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    role: formData.get("role") ?? "",
    isPrimary: formData.get("isPrimary") === "on",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const contact = await createBrandContact(user.agencyId, brandId, parsed.data);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Brand",
      entityId: brandId,
      actorId: user.id,
      action: "Kontak ditambahkan",
      details: contact.name,
    });
  } catch (e) {
    // Service throws neutral messages ("Brand tidak ditemukan", storage failures).
    return toContactError(e);
  }

  revalidatePath(`/brands/${brandId}`);
  return { ok: true };
}

function toContactError(e: unknown): ContactFormState {
  if (e instanceof Error && e.message) return { error: e.message };
  return { error: "Gagal menyimpan kontak. Coba lagi." };
}

// ---------------------------------------------------------------------------
// Notes (PLAN §14)
// ---------------------------------------------------------------------------

export async function addBrandNoteAction(
  brandId: string,
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const user = await requireUser();
  // Catatan adalah data baru pada brand — butuh izin write, read saja tidak cukup
  if (!can(user.role, "brand", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah catatan." };
  }
  const content = String(formData.get("content") ?? "").trim();
  if (content.length < 3) {
    return { error: "Catatan minimal 3 karakter." };
  }

  const ok = await entityBelongsToAgency("Brand", brandId, user.agencyId);
  if (!ok) return { error: "Brand tidak ditemukan." };

  await addNote({
    agencyId: user.agencyId,
    entityType: "Brand",
    entityId: brandId,
    authorId: user.id,
    content,
  });
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Brand",
    entityId: brandId,
    actorId: user.id,
    action: "Catatan ditambahkan",
  });

  revalidatePath(`/brands/${brandId}`);
  return { ok: true };
}
