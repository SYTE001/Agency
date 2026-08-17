"use client";

import { useActionState } from "react";
import { addBrandContactAction, type ContactFormState } from "@/app/actions/brands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ContactFormState = {};

export function ContactForm({ brandId }: { brandId: string }) {
  const [state, formAction, pending] = useActionState(
    addBrandContactAction.bind(null, brandId),
    initialState,
  );

  if (state.ok) {
    return (
      <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
        Kontak tersimpan. Tambahkan kontak lain jika perlu.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Nama</Label>
          <Input id="contact-name" name="name" required placeholder="cth. Sari Utami" />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-role">Peran</Label>
          <Input id="contact-role" name="role" placeholder="cth. Marketing Lead" />
          <FieldError errors={state.fieldErrors?.role} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" name="email" type="email" placeholder="nama@brand.com" />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">Telepon</Label>
          <Input id="contact-phone" name="phone" placeholder="+62 812 3456 7890" />
          <FieldError errors={state.fieldErrors?.phone} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="isPrimary" className="h-4 w-4 rounded border-input" />
          Jadikan kontak utama
        </label>
        <Button type="submit" variant="secondary" size="sm" disabled={pending} className="ml-auto">
          {pending ? "Menyimpan…" : "Simpan Kontak"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
