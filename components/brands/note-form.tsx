"use client";

import { useActionState } from "react";
import { addBrandNoteAction, type ContactFormState } from "@/app/actions/brands";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: ContactFormState = {};

export function NoteForm({ brandId }: { brandId: string }) {
  const [state, formAction, pending] = useActionState(
    addBrandNoteAction.bind(null, brandId),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <Textarea name="content" rows={2} placeholder="Tulis catatan tentang brand ini…" />
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Catatan"}
        </Button>
      </div>
    </form>
  );
}
