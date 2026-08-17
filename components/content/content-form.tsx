"use client";

import { useActionState } from "react";
import { createContentAction, type ContentFormState } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: ContentFormState = {};

export function ContentForm({
  campaigns,
  creators,
  products,
  users,
}: {
  campaigns: { id: string; name: string }[];
  creators: { id: string; displayName: string; username: string }[];
  products: { id: string; name: string }[];
  users: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createContentAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Judul Konten</Label>
        <Input id="title" name="title" required placeholder="cth. Video review serum Glowella" />
        <FieldError errors={state.fieldErrors?.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="campaignId">Campaign</Label>
          <Select id="campaignId" name="campaignId" required defaultValue="">
            <option value="" disabled>Pilih campaign…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.campaignId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="creatorId">Creator</Label>
          <Select id="creatorId" name="creatorId" required defaultValue="">
            <option value="" disabled>Pilih creator…</option>
            {creators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName} (@{c.username})
              </option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.creatorId} />
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
          <Label htmlFor="reviewerId">Reviewer</Label>
          <Select id="reviewerId" name="reviewerId" defaultValue="">
            <option value="">Tanpa reviewer</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.reviewerId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Jatuh Tempo</Label>
          <Input id="dueDate" name="dueDate" type="date" />
          <FieldError errors={state.fieldErrors?.dueDate} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="brief">Brief</Label>
        <Textarea id="brief" name="brief" rows={3} placeholder="Brief untuk creator…" />
        <FieldError errors={state.fieldErrors?.brief} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Konten"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
