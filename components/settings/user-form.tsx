"use client";

import { useActionState } from "react";
import { createUserAction, updateUserAction, type UserFormState } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

const initialState: UserFormState = {};

function FieldError({ errors }: { errors?: string[] | undefined }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}

function ErrorBanner({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </div>
  );
}

function RoleSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <Select id="role" name="role" defaultValue={defaultValue ?? "viewer"}>
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
      ))}
    </Select>
  );
}

export function UserCreateForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <ErrorBanner error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input id="name" name="name" required placeholder="cth. Budi Santoso" />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Jabatan</Label>
          <Input id="title" name="title" placeholder="cth. LIVE Operator" />
          <FieldError errors={state.fieldErrors?.title} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="nama@agensi.id" />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password Awal</Label>
          <Input id="password" name="password" type="password" required minLength={8} placeholder="Minimal 8 karakter" />
          <FieldError errors={state.fieldErrors?.password} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <RoleSelect />
          <FieldError errors={state.fieldErrors?.role} />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Tambah Anggota"}
      </Button>
    </form>
  );
}

export function UserEditForm({
  member,
}: {
  member: { id: string; name: string; email: string; title: string | null; role: string };
}) {
  const [state, formAction, pending] = useActionState(updateUserAction.bind(null, member.id), initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <ErrorBanner error={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input id="name" name="name" required defaultValue={member.name} />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Jabatan</Label>
          <Input id="title" name="title" defaultValue={member.title ?? ""} />
          <FieldError errors={state.fieldErrors?.title} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <p className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
            {member.email}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <RoleSelect defaultValue={member.role} />
          <FieldError errors={state.fieldErrors?.role} />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
