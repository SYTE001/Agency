"use client";

import { useTransition } from "react";
import { markPayoutPaidAction, markSettlementPaidAction } from "@/app/actions/finance";
import { cn } from "@/lib/utils";

/** Mark a pending payout/settlement as Paid (form POST, void-return action). */
export function MarkPaidButton({
  kind,
  id,
  label = "Tandai Lunas",
}: {
  kind: "payout" | "settlement";
  id: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  const action = kind === "payout" ? markPayoutPaidAction : markSettlementPaidAction;

  return (
    <form
      action={action.bind(null, id)}
      onSubmit={() => {
        startTransition(() => {});
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex h-7 items-center justify-center rounded-md border border-success/40 px-2.5 text-xs font-medium text-success transition-colors hover:bg-success/10 disabled:opacity-50",
        )}
      >
        {label}
      </button>
    </form>
  );
}
