"use client";

import { useActionState } from "react";
import { createProductAction, type ProductFormState } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: ProductFormState = {};

export function ProductForm({
  brands,
}: {
  brands: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createProductAction, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Produk</Label>
          <Input id="name" name="name" required placeholder="cth. Serum Vitamin C" />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brandId">Brand</Label>
          <Select id="brandId" name="brandId" defaultValue="">
            <option value="">Tanpa brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.brandId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" name="sku" placeholder="cth. GLW-001" />
          <FieldError errors={state.fieldErrors?.sku} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Input id="category" name="category" placeholder="cth. Skincare" />
          <FieldError errors={state.fieldErrors?.category} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Harga (Rp)</Label>
          <Input id="price" name="price" type="number" min={0} defaultValue={0} />
          <FieldError errors={state.fieldErrors?.price} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="Active">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Produk"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
