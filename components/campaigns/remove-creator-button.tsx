"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { removeCampaignCreatorAction } from "@/app/actions/campaigns";

export function RemoveCreatorButton({
  campaignId,
  linkId,
}: {
  campaignId: string;
  linkId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={removeCampaignCreatorAction.bind(null, campaignId)}
      onSubmit={() => {
        startTransition(() => {});
      }}
    >
      <input type="hidden" name="linkId" value={linkId} />
      <button
        type="submit"
        disabled={pending}
        title="Keluarkan dari campaign"
        className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
