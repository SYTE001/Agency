"use client";

import { useTransition } from "react";
import { moveLiveStatusAction } from "@/app/actions/live";
import { cn } from "@/lib/utils";

/** Quick status change for a LIVE session (form POST with hidden status). */
export function LiveStatusButton({
  sessionId,
  status,
  label,
  variant = "default",
  size = "sm",
}: {
  sessionId: string;
  status: string;
  label: string;
  variant?: "default" | "destructive" | "success" | "live";
  size?: "sm" | "default";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={moveLiveStatusAction.bind(null, sessionId)}
      onSubmit={() => {
        startTransition(() => {});
      }}
    >
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50",
          size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-4 text-sm",
          variant === "destructive"
            ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
            : variant === "success"
              ? "border border-success/40 text-success hover:bg-success/10"
              : variant === "live"
                ? "border border-destructive/40 bg-destructive/10 font-semibold text-destructive hover:bg-destructive/20"
                : "border bg-card text-foreground hover:bg-accent",
        )}
      >
        {label}
      </button>
    </form>
  );
}
