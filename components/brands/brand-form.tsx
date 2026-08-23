"use client";

import { useActionState } from "react";
import {
  createBrandAction,
  updateBrandAction,
  type BrandFormState,
} from "@/app/actions/brands";
import { BRAND_STATUS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: BrandFormState = {};

/** Editable master-data snapshot of an existing brand. */
export type BrandFormDefaults = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  status: string;
};

export function BrandForm({ brand }: { brand?: BrandFormDefaults }) {
  const [state, formAction, pending] = useActionState(
    brand ? updateBrandAction : createBrandAction,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {brand ? <input type="hidden" name="brandId" value={brand.id} /> : null}
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Brand</Label>
          <Input id="name" name="name" required placeholder="cth. Aksara Apparel" defaultValue={brand?.name} />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="industry">Industri</Label>
          <Input id="industry" name="industry" placeholder="cth. Fashion" defaultValue={brand?.industry ?? ""} />
          <FieldError errors={state.fieldErrors?.industry} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" placeholder="https://contoh.com" defaultValue={brand?.website ?? ""} />
          <FieldError errors={state.fieldErrors?.website} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={brand?.status ?? "Active"}>
            {BRAND_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Arsipkan dengan status Paused/Churned — riwayat campaign, settlement, dan kontak tetap tersimpan.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea id="description" name="description" rows={3} placeholder="Deskripsi singkat brand…" defaultValue={brand?.description ?? ""} />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : brand ? "Simpan Perubahan" : "Simpan Brand"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
