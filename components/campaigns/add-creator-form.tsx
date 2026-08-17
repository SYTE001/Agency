"use client";

import { useActionState } from "react";
import { addCampaignCreatorAction, type LinkFormState } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: LinkFormState = {};

export function AddCreatorForm({
  campaignId,
  creators,
}: {
  campaignId: string;
  creators: { id: string; displayName: string; username: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    addCampaignCreatorAction.bind(null, campaignId),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      {state.ok ? (
        <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Creator ditambahkan ke campaign.
        </p>
      ) : null}

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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="link-role">Peran</Label>
          <Input id="link-role" name="role" placeholder="cth. Host LIVE" />
          <FieldError errors={state.fieldErrors?.role} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="link-fee">Fee (Rp)</Label>
          <Input id="link-fee" name="fee" type="number" min={0} defaultValue={0} />
          <FieldError errors={state.fieldErrors?.fee} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Menambahkan…" : "Tambah Creator"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
