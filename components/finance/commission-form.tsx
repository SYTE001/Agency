"use client";

import { useActionState } from "react";
import { createCommissionAction, type CommissionFormState } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCompactIDR, formatIDR } from "@/lib/format";

const initialState: CommissionFormState = {};

/**
 * Commission entry with an explicit formula breakdown (PLAN §12: "Never hide
 * financial calculations behind unexplained numbers"). "Hitung Preview"
 * validates + previews; "Simpan Komisi" persists.
 */
export function CommissionForm({
  creators,
  campaigns,
}: {
  creators: { id: string; displayName: string }[];
  campaigns: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCommissionAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
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
          <Label htmlFor="sourceType">Sumber GMV</Label>
          <Select id="sourceType" name="sourceType" defaultValue="Campaign">
            <option value="Campaign">Campaign</option>
            <option value="LiveSession">LIVE Session</option>
            <option value="Content">Konten</option>
          </Select>
          <FieldError errors={state.fieldErrors?.sourceType} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gmv">GMV (Rp)</Label>
          <Input id="gmv" name="gmv" type="number" min={0} step={1000} required placeholder="cth. 100000000" />
          <FieldError errors={state.fieldErrors?.gmv} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="creatorRate">Rate Komisi Creator (%)</Label>
          <Input id="creatorRate" name="creatorRate" type="number" min={0} max={100} step={0.5} required placeholder="cth. 10" />
          <FieldError errors={state.fieldErrors?.creatorRate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agencyShareRate">Share Agensi dari Komisi (%)</Label>
          <Input id="agencyShareRate" name="agencyShareRate" type="number" min={0} max={100} step={1} required placeholder="cth. 30" />
          <FieldError errors={state.fieldErrors?.agencyShareRate} />
        </div>
      </div>

      {state.preview ? (
        <div className="space-y-1 rounded-md border bg-muted/40 p-4 text-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview Perhitungan (Rumus Eksplisit)
          </p>
          <Row label="Komisi Creator (GMV × rate)" value={formatIDR(state.preview.creatorCommission)} />
          <Row label="Revenue Agensi (komisi × share)" value={formatIDR(state.preview.agencyRevenue)} />
          <Row
            label="Bagian Creator (komisi − revenue agensi)"
            value={formatIDR(state.preview.creatorShare)}
            strong
          />
          <p className="pt-1 text-xs text-muted-foreground">
            Total komisi {formatCompactIDR(state.preview.creatorCommission)} dari GMV.
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" name="submit" value="1" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Komisi"}
        </Button>
        <Button type="submit" variant="secondary" disabled={pending}>
          Hitung Preview
        </Button>
      </div>
    </form>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
