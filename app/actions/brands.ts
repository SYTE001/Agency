"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isBrandStatus } from "@/lib/constants";
import { createBrand, createBrandContact } from "@/lib/services/brands";
import { addNote, entityBelongsToAgency, logActivity } from "@/lib/services/activity";

const brandSchema = z.object({
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

export type BrandFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createBrandAction(
  _prev: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const user = await requireUser();
  if (!can(user.role, "brand", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah brand." };
  }

  const parsed = brandSchema.safeParse({
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

  const brand = await createBrand(user.agencyId, parsed.data);
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Brand",
    entityId: brand.id,
    actorId: user.id,
    action: "Brand ditambahkan",
    details: brand.name,
  });

  revalidatePath("/brands");
  redirect("/brands");
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
  } catch {
    return { error: "Brand tidak ditemukan." };
  }

  revalidatePath(`/brands/${brandId}`);
  return { ok: true };
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
