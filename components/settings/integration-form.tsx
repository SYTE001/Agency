"use client";

import { useRef, useState, useActionState } from "react";
import { FileUp, RefreshCw, Upload } from "lucide-react";
import {
  importCsvAction,
  runSyncAction,
  type IntegrationFormState,
} from "@/app/actions/integrations";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const initialState: IntegrationFormState = {};

export function ImportCsvForm() {
  const [state, formAction, pending] = useActionState(importCsvAction, initialState);
  const [entity, setEntity] = useState<"creators" | "products">("creators");
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {state.success}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Select
          name="entity"
          defaultValue={entity}
          onChange={(e) => setEntity(e.target.value as "creators" | "products")}
          className="w-40"
          aria-label="Jenis data"
        >
          <option value="creators">Creator</option>
          <option value="products">Produk</option>
        </Select>

        {/* Hidden file input behind a visible button */}
        <input
          ref={inputRef}
          type="file"
          name="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          <FileUp />
          {fileName ?? "Pilih file CSV…"}
        </Button>

        <Button type="submit" disabled={pending}>
          <Upload />
          {pending ? "Mengimpor…" : "Import"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {entity === "creators" ? (
          <>
            Kolom: <code>username;displayName;category;followers;engagementRate;externalId</code>. Kategori:{" "}
            {CREATOR_CATEGORIES.join(", ")}.
          </>
        ) : (
          <>
            Kolom: <code>name;brand;sku;category;price;externalId</code>. Brand yang belum ada akan dibuat
            otomatis.
          </>
        )}{" "}
        Pemisah titik koma (format Excel id-ID). Baris yang cocok dengan externalId atau nama akan
        diperbarui, sisanya ditambahkan.{" "}
        <a
          href={`/settings/integrations/template/${entity}`}
          className="font-medium text-brand underline"
        >
          Unduh template CSV
        </a>
      </p>
    </form>
  );
}

export function SyncButton() {
  const [state, formAction, pending] = useActionState(runSyncAction, initialState);
  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" disabled={pending}>
          <RefreshCw className={pending ? "animate-spin" : undefined} />
          {pending ? "Menyinkronkan…" : "Jalankan Sinkronisasi (Mock)"}
        </Button>
      </form>
      {state.success ? (
        <p className="text-sm text-success">{state.success}</p>
      ) : state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </div>
  );
}
