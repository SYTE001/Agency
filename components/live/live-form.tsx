"use client";

import { useActionState } from "react";
import { createLiveAction, type LiveFormState } from "@/app/actions/live";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: LiveFormState = {};

export function LiveForm({
  creators,
  campaigns,
  brands,
  products,
  users,
}: {
  creators: { id: string; displayName: string; username: string }[];
  campaigns: { id: string; name: string }[];
  brands: { id: string; name: string }[];
  products: { id: string; name: string }[];
  users: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createLiveAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="creatorId">Creator / Host</Label>
          <Select id="creatorId" name="creatorId" required defaultValue="">
            <option value="" disabled>Pilih creator…</option>
            {creators.map((c) => (
              <option key={c.id} value={c.id}>{c.displayName} (@{c.username})</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.creatorId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaignId">Campaign</Label>
          <Select id="campaignId" name="campaignId" defaultValue="">
            <option value="">Tanpa campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.campaignId} />
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
          <Label htmlFor="productId">Produk</Label>
          <Select id="productId" name="productId" defaultValue="">
            <option value="">Tanpa produk</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.productId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="room">Room / Studio</Label>
          <Input id="room" name="room" placeholder="cth. Studio 1" />
          <FieldError errors={state.fieldErrors?.room} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="operatorId">Operator</Label>
          <Select id="operatorId" name="operatorId" defaultValue="">
            <option value="">Tanpa operator</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.operatorId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startTime">Waktu Mulai</Label>
          <Input id="startTime" name="startTime" type="datetime-local" required />
          <FieldError errors={state.fieldErrors?.startTime} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime">Waktu Selesai</Label>
          <Input id="endTime" name="endTime" type="datetime-local" />
          <FieldError errors={state.fieldErrors?.endTime} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetGmv">Target GMV (Rp)</Label>
          <Input id="targetGmv" name="targetGmv" type="number" min={0} step={100000} defaultValue={0} />
          <FieldError errors={state.fieldErrors?.targetGmv} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Persiapan, talking points, dsb…" />
        <FieldError errors={state.fieldErrors?.notes} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : "Jadwalkan LIVE"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
