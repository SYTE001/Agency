"use client";

import { useActionState } from "react";
import { createCampaignAction, type CampaignFormState } from "@/app/actions/campaigns";
import { CAMPAIGN_STATUS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: CampaignFormState = {};

export function CampaignForm({
  brands,
  users,
}: {
  brands: { id: string; name: string }[];
  users: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCampaignAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Campaign</Label>
          <Input id="name" name="name" required placeholder="cth. Glow Up Ramadan" />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brandId">Brand</Label>
          <Select id="brandId" name="brandId" required defaultValue="">
            <option value="" disabled>Pilih brand…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.brandId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownerId">Penanggung Jawab</Label>
          <Select id="ownerId" name="ownerId" defaultValue="">
            <option value="">Tanpa penanggung jawab</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.ownerId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="Draft">
            {CAMPAIGN_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.status} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input id="startDate" name="startDate" type="date" />
          <FieldError errors={state.fieldErrors?.startDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Tanggal Selesai</Label>
          <Input id="endDate" name="endDate" type="date" />
          <FieldError errors={state.fieldErrors?.endDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budget">Budget (Rp)</Label>
          <Input id="budget" name="budget" type="number" min={0} defaultValue={0} />
          <FieldError errors={state.fieldErrors?.budget} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gmvTarget">Target GMV (Rp)</Label>
          <Input id="gmvTarget" name="gmvTarget" type="number" min={0} defaultValue={0} />
          <FieldError errors={state.fieldErrors?.gmvTarget} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="creatorTarget">Target Creator</Label>
          <Input id="creatorTarget" name="creatorTarget" type="number" min={0} defaultValue={0} />
          <FieldError errors={state.fieldErrors?.creatorTarget} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contentTarget">Target Konten</Label>
          <Input id="contentTarget" name="contentTarget" type="number" min={0} defaultValue={0} />
          <FieldError errors={state.fieldErrors?.contentTarget} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="liveTarget">Target Sesi LIVE</Label>
          <Input id="liveTarget" name="liveTarget" type="number" min={0} defaultValue={0} />
          <FieldError errors={state.fieldErrors?.liveTarget} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="commissionRate">Rate Komisi (%)</Label>
          <Input id="commissionRate" name="commissionRate" type="number" min={0} max={100} step="0.1" defaultValue={0} />
          <FieldError errors={state.fieldErrors?.commissionRate} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Catatan internal campaign…" />
        <FieldError errors={state.fieldErrors?.notes} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Campaign"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
