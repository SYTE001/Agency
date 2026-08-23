"use client";

import { useTransition } from "react";
import { updateTaskStatusAction } from "@/app/actions/tasks";

/** Quick status change button for a task (form POST with hidden status). */
export function TaskStatusButton({
  taskId,
  status,
  label,
  variant = "default",
}: {
  taskId: string;
  status: string;
  label: string;
  variant?: "default" | "success" | "destructive";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={updateTaskStatusAction.bind(null, taskId)}
      onSubmit={() => {
        startTransition(() => {});
      }}
    >
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        disabled={pending}
        className={
          variant === "success"
            ? "inline-flex h-7 items-center justify-center rounded-md border border-success/40 px-2.5 text-xs font-medium text-success transition-colors hover:bg-success/10 disabled:opacity-50"
            : variant === "destructive"
              ? "inline-flex h-7 items-center justify-center rounded-md border border-destructive/40 px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              : "inline-flex h-7 items-center justify-center rounded-md border bg-card px-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
        }
      >
        {label}
      </button>
    </form>
  );
}
