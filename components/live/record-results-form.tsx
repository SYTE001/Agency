"use client";

import { useActionState } from "react";
import { recordLiveResultsAction, type LiveResultsState } from "@/app/actions/live";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LiveResultsState = {};

/** Form to close a LIVE session by recording final GMV / viewers / orders. */
export function RecordResultsForm({ sessionId }: { sessionId: string }) {
  const [state, formAction, pending] = useActionState(
    recordLiveResultsAction.bind(null, sessionId),
    initialState,
  );

  if (state.ok) {
    return (
      <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
        Hasil LIVE tersimpan. Sesi ditandai Selesai.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="actualGmv">GMV Aktual (Rp)</Label>
          <Input id="actualGmv" name="actualGmv" type="number" min={0} step={1000} required defaultValue={0} />
          <FieldError errors={state.fieldErrors?.actualGmv} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="viewers">Viewers</Label>
          <Input id="viewers" name="viewers" type="number" min={0} required defaultValue={0} />
          <FieldError errors={state.fieldErrors?.viewers} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="orders">Orders</Label>
          <Input id="orders" name="orders" type="number" min={0} required defaultValue={0} />
          <FieldError errors={state.fieldErrors?.orders} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="brand" size="sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Akhiri & Simpan Hasil"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
