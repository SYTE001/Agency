"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isProductStatus } from "@/lib/constants";
import { createProduct, updateProduct } from "@/lib/services/products";
import { logActivity } from "@/lib/services/activity";

// Shared fields between create and edit.
const productFieldsSchema = z.object({
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter").max(80),
  brandId: z.string().transform((v) => v || null),
  sku: z.string().trim().max(60).transform((v) => v || null),
  category: z.string().trim().max(60).transform((v) => v || null),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif").default(0),
  status: z.string().default("Active").refine(isProductStatus, "Status tidak valid"),
});

const productUpdateSchema = productFieldsSchema.extend({
  productId: z.string().min(1, "Produk tidak valid"),
});

export type ProductFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

// Services throw neutral, user-facing Indonesian messages and log the
// original error server-side — safe to surface as-is.
function toFormError(e: unknown): ProductFormState {
  if (e instanceof Error && e.message) return { error: e.message };
  return { error: "Gagal menyimpan produk. Coba lagi." };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requireUser();
  if (!can(user.role, "product", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah produk." };
  }

  const parsed = productFieldsSchema.safeParse({
    name: formData.get("name"),
    brandId: formData.get("brandId") ?? "",
    sku: formData.get("sku") ?? "",
    category: formData.get("category") ?? "",
    price: formData.get("price") || "0",
    status: formData.get("status") || "Active",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    const product = await createProduct(user.agencyId, parsed.data);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Product",
      entityId: product.id,
      actorId: user.id,
      action: "Produk ditambahkan",
      details: product.name,
    });
  } catch (e) {
    return toFormError(e);
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requireUser();
  if (!can(user.role, "product", "write")) {
    return { error: "Anda tidak memiliki izin untuk mengubah produk." };
  }

  const parsed = productUpdateSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    brandId: formData.get("brandId") ?? "",
    sku: formData.get("sku") ?? "",
    category: formData.get("category") ?? "",
    price: formData.get("price") || "0",
    status: formData.get("status") || "Active",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { productId, ...fields } = parsed.data;

  let updatedId: string;
  try {
    const updated = await updateProduct(user.agencyId, productId, fields);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Product",
      entityId: updated.id,
      actorId: user.id,
      action: "Produk diperbarui",
      details: updated.name,
    });
    updatedId = updated.id;
  } catch (e) {
    return toFormError(e);
  }

  revalidatePath("/products");
  revalidatePath(`/products/${updatedId}`);
  redirect(`/products/${updatedId}`);
}
