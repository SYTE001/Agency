"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { isProductStatus } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { createProduct } from "@/lib/services/products";
import { logActivity } from "@/lib/services/activity";

const productSchema = z.object({
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter").max(80),
  brandId: z.string().transform((v) => v || null),
  sku: z.string().trim().max(60).transform((v) => v || null),
  category: z.string().trim().max(60).transform((v) => v || null),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif").default(0),
  status: z.string().default("Active").refine(isProductStatus, "Status tidak valid"),
});

export type ProductFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const user = await requireUser();
  if (!can(user.role as Role, "product", "write")) {
    return { error: "Anda tidak memiliki izin untuk menambah produk." };
  }

  const parsed = productSchema.safeParse({
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
  } catch {
    return { error: "Brand tidak ditemukan. Pilih brand yang valid." };
  }

  revalidatePath("/products");
  redirect("/products");
}
