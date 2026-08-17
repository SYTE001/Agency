"use client";

import { useActionState } from "react";
import { createPayoutAction, type PayoutFormState } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: PayoutFormState = {};

/** Creator payout entry — recorded as Pending, then marked Paid from the list. */
export function PayoutForm({
  creators,
  campaigns,
}: {
  creators: { id: string; displayName: string }[];
  campaigns: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createPayoutAction, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="creatorId">Creator</Label>
        <Select id="creatorId" name="creatorId" required defaultValue="">
          <option value="" disabled>Pilih creator…</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.displayName}</option>
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
        <Label htmlFor="amount">Nominal (Rp)</Label>
        <Input id="amount" name="amount" type="number" min={1} step={1000} required placeholder="cth. 7500000" />
        <FieldError errors={state.fieldErrors?.amount} />
      </div>

      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Menyimpan…" : "Catat Payout"}
      </Button>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
