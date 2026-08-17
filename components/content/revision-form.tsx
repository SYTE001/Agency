"use client";

import { useTransition } from "react";
import { moveContentAction } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Revision move with required feedback (saved as a ContentRevision row). */
export function RevisionForm({ contentId }: { contentId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={moveContentAction.bind(null, contentId)}
      onSubmit={() => {
        startTransition(() => {});
      }}
      className="space-y-2"
    >
      <input type="hidden" name="status" value="Revision" />
      <Textarea
        name="feedback"
        rows={2}
        placeholder="Feedback revisi untuk creator…"
        required
      />
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Mengirim…" : "Kirim Revisi"}
        </Button>
      </div>
    </form>
  );
}
