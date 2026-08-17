"use client";

import { useActionState } from "react";
import { createTaskAction, type TaskFormState } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TASK_PRIORITY } from "@/lib/constants";

const initialState: TaskFormState = {};

export type RelatedOption = { value: string; label: string };

export function TaskForm({
  users,
  relatedOptions,
}: {
  users: { id: string; name: string }[];
  relatedOptions: RelatedOption[];
}) {
  const [state, formAction, pending] = useActionState(createTaskAction, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Judul Task</Label>
        <Input id="title" name="title" required placeholder="cth. Follow up creator untuk draft" />
        <FieldError errors={state.fieldErrors?.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ownerId">Penanggung Jawab</Label>
          <Select id="ownerId" name="ownerId" defaultValue="">
            <option value="">Tanpa penanggung jawab</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.ownerId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioritas</Label>
          <Select id="priority" name="priority" defaultValue="Medium">
            {TASK_PRIORITY.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.priority} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Jatuh Tempo</Label>
          <Input id="dueDate" name="dueDate" type="date" />
          <FieldError errors={state.fieldErrors?.dueDate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="related">Terkait</Label>
          <Select id="related" name="related" defaultValue="">
            <option value="">Tidak terkait entitas</option>
            {relatedOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.related} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Detail task…" />
        <FieldError errors={state.fieldErrors?.notes} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Task"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
