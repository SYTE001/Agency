"use client";

import { useActionState } from "react";
import {
  createProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/app/actions/products";
import { PRODUCT_STATUS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: ProductFormState = {};

/** Editable master-data snapshot of an existing product. */
export type ProductFormDefaults = {
  id: string;
  name: string;
  brandId: string | null;
  sku: string | null;
  category: string | null;
  price: number;
  status: string;
};

export function ProductForm({
  brands,
  product,
}: {
  brands: { id: string; name: string }[];
  product?: ProductFormDefaults;
}) {
  const [state, formAction, pending] = useActionState(
    product ? updateProductAction : createProductAction,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Produk</Label>
          <Input id="name" name="name" required placeholder="cth. Serum Vitamin C" defaultValue={product?.name} />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brandId">Brand</Label>
          <Select id="brandId" name="brandId" defaultValue={product?.brandId ?? ""}>
            <option value="">Tanpa brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.brandId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" placeholder="cth. GLW-001" defaultValue={product?.sku ?? ""} />
          <p className="text-xs text-muted-foreground">SKU harus unik di dalam agensi.</p>
          <FieldError errors={state.fieldErrors?.sku} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Input id="category" name="category" placeholder="cth. Skincare" defaultValue={product?.category ?? ""} />
          <FieldError errors={state.fieldErrors?.category} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Harga (Rp)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="any"
            defaultValue={product ? product.price : 0}
          />
          <FieldError errors={state.fieldErrors?.price} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={product?.status ?? "Active"}>
            {PRODUCT_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Arsipkan dengan status Inactive — riwayat campaign, konten, dan metrik tetap tersimpan.
          </p>
          <FieldError errors={state.fieldErrors?.status} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : product ? "Simpan Perubahan" : "Simpan Produk"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
