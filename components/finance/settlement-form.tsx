"use client";

import { useActionState } from "react";
import { createSettlementAction, type SettlementFormState } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: SettlementFormState = {};

/**
 * Brand settlement entry (platform pays agency). Recorded as Pending with an
 * optional due date; past-due items are flagged Overdue deterministically.
 */
export function SettlementForm({
  brands,
  campaigns,
}: {
  brands: { id: string; name: string }[];
  campaigns: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createSettlementAction, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

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
        <Label htmlFor="campaignId">Campaign</Label>
        <Select id="campaignId" name="campaignId" defaultValue="">
          <option value="">Tanpa campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <FieldError errors={state.fieldErrors?.campaignId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Nominal (Rp)</Label>
          <Input id="amount" name="amount" type="number" min={1} step={1000} required placeholder="cth. 25000000" />
          <FieldError errors={state.fieldErrors?.amount} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Jatuh Tempo</Label>
          <Input id="dueDate" name="dueDate" type="date" />
          <FieldError errors={state.fieldErrors?.dueDate} />
        </div>
      </div>

      <Button type="submit" variant="brand" disabled={pending}>
        {pending ? "Menyimpan…" : "Catat Settlement"}
      </Button>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
