"use client";

import { useActionState } from "react";
import { addLiveNoteAction } from "@/app/actions/live";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: { error?: string; ok?: boolean } = {};

export function LiveNoteForm({ sessionId }: { sessionId: string }) {
  const [state, formAction, pending] = useActionState(
    addLiveNoteAction.bind(null, sessionId),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <Textarea name="content" rows={2} placeholder="Tulis catatan tentang sesi LIVE ini…" />
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Catatan"}
        </Button>
      </div>
    </form>
  );
}
