"use client";

import { useActionState } from "react";
import {
  createCreatorAction,
  updateCreatorAction,
  type CreatorFormState,
} from "@/app/actions/creators";
import { CREATOR_CATEGORIES, CREATOR_STATUS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialState: CreatorFormState = {};

/** Editable master-data snapshot of an existing creator (identity excluded). */
export type CreatorFormDefaults = {
  id: string;
  username: string;
  displayName: string;
  category: string;
  managerId: string | null;
  followers: number;
  engagementRate: number;
  status: string;
  bio: string | null;
};

export function CreatorForm({
  managers,
  creator,
}: {
  managers: { id: string; name: string }[];
  creator?: CreatorFormDefaults;
}) {
  const [state, formAction, pending] = useActionState(
    creator ? updateCreatorAction : createCreatorAction,
    initialState,
  );

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {creator ? <input type="hidden" name="creatorId" value={creator.id} /> : null}
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Nama Tampilan</Label>
          <Input
            id="displayName"
            name="displayName"
            required
            placeholder="cth. Putri Andina"
            defaultValue={creator?.displayName}
          />
          <FieldError errors={state.fieldErrors?.displayName} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username TikTok</Label>
          {/* Identity anchor for sync — immutable after creation. */}
          <Input id="username" name="username" required placeholder="cth. putriandina" defaultValue={creator?.username} disabled={Boolean(creator)} />
          {creator ? (
            <p className="text-xs text-muted-foreground">Username tidak dapat diubah.</p>
          ) : (
            <FieldError errors={state.fieldErrors?.username} />
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Kategori</Label>
          <Select id="category" name="category" required defaultValue={creator?.category ?? ""}>
            <option value="" disabled>Pilih kategori…</option>
            {CREATOR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <FieldError errors={state.fieldErrors?.category} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="managerId">Manager</Label>
          <Select id="managerId" name="managerId" defaultValue={creator?.managerId ?? ""}>
            <option value="">Tanpa manager</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="followers">Followers</Label>
          <Input id="followers" name="followers" type="number" min={0} defaultValue={creator?.followers ?? 0} />
          <FieldError errors={state.fieldErrors?.followers} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="engagementRate">Engagement Rate (%)</Label>
          <Input
            id="engagementRate"
            name="engagementRate"
            type="number"
            min={0}
            max={100}
            step="0.1"
            defaultValue={creator?.engagementRate ?? 0}
          />
          <FieldError errors={state.fieldErrors?.engagementRate} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={creator?.status ?? "Active"}>
            {CREATOR_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">
            Nonaktifkan dengan status Inactive/Paused — riwayat campaign, komisi, dan payout tetap tersimpan.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" rows={3} placeholder="Deskripsi singkat kreator…" defaultValue={creator?.bio ?? ""} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit" variant="brand" disabled={pending}>
          {pending ? "Menyimpan…" : creator ? "Simpan Perubahan" : "Simpan Creator"}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
