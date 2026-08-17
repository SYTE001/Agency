"use client";

import { useTransition } from "react";
import { moveContentAction } from "@/app/actions/content";
import { cn } from "@/lib/utils";

/**
 * Moves a content item to another pipeline column via the bound
 * moveContentAction server action (form POST with hidden status).
 */
export function StatusMoveForm({
  contentId,
  status,
  label,
  variant = "default",
  size = "sm",
  className,
  disabled,
}: {
  contentId: string;
  status: string;
  label: string;
  variant?: "default" | "destructive" | "success";
  size?: "sm" | "default";
  className?: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={moveContentAction.bind(null, contentId)}
      onSubmit={() => {
        startTransition(() => {});
      }}
      className={className}
    >
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={disabled || pending}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50",
          size === "sm" ? "h-7 px-2.5 text-xs" : "h-9 px-4 text-sm",
          variant === "destructive"
            ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
            : variant === "success"
              ? "border border-success/40 text-success hover:bg-success/10"
              : "border bg-card text-foreground hover:bg-accent",
        )}
      >
        {label}
      </button>
    </form>
  );
}
