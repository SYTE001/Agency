"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import {
  importCreatorsCsv,
  importProductsCsv,
  runMockSync,
  getOrCreateIntegration,
} from "@/lib/services/integrations";
import { logActivity } from "@/lib/services/activity";

// Only "*" roles (owner/admin) hold setting:integration — the permission
// matrix grants it to no other role, so this is owner/admin-only by design.

export type IntegrationFormState = { error?: string; success?: string };

async function requireIntegrationManager() {
  const user = await requireUser();
  if (!can(user.role, "integration", "manage")) return null;
  return user;
}

export async function importCsvAction(
  _prev: IntegrationFormState,
  formData: FormData,
): Promise<IntegrationFormState> {
  const user = await requireIntegrationManager();
  if (!user) return { error: "Anda tidak memiliki izin untuk mengelola integrasi." };

  const entity = formData.get("entity");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih file CSV terlebih dahulu." };
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { error: "Format file harus .csv" };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "File terlalu besar (maks 2 MB)." };
  }
  if (entity !== "creators" && entity !== "products") {
    return { error: "Jenis import tidak dikenal." };
  }

  const text = await file.text();
  const result =
    entity === "creators"
      ? await importCreatorsCsv(user.agencyId, text)
      : await importProductsCsv(user.agencyId, text);

  if ("error" in result) return { error: result.error };

  const label = entity === "creators" ? "creator" : "produk";
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Integration",
    entityId: entity,
    actorId: user.id,
    action: "Import CSV",
    details: `${result.created} ${label} baru, ${result.updated} diperbarui`,
  });

  revalidatePath("/settings/integrations");
  revalidatePath(entity === "creators" ? "/creators" : "/products");
  return {
    success: `${result.created} ${label} baru ditambahkan, ${result.updated} diperbarui.`,
  };
}

export async function runSyncAction(): Promise<IntegrationFormState> {
  const user = await requireIntegrationManager();
  if (!user) return { error: "Anda tidak memiliki izin untuk mengelola integrasi." };

  const outcome = await runMockSync(user.agencyId);
  const integration = await getOrCreateIntegration(user.agencyId);
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Integration",
    entityId: integration.id,
    actorId: user.id,
    action: "Sinkronisasi TikTok",
    details: outcome.status === "Success" ? "Sync mock berhasil" : "Sync mock gagal",
  });

  revalidatePath("/settings/integrations");
  return outcome.status === "Success"
    ? { success: "Sinkronisasi selesai. Metrik creator dan GMV campaign diperbarui." }
    : { error: "Sinkronisasi gagal. Lihat log sync untuk detailnya." };
}
