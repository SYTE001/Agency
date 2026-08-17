"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import {
  createCommission,
  createPayout,
  createSettlement,
  markPayoutPaid,
  markSettlementPaid,
} from "@/lib/services/finance";
import { calculateCommission } from "@/lib/finance";
import { logActivity } from "@/lib/services/activity";

const FINANCE_PATHS = ["/finance", "/finance/commissions", "/finance/payouts", "/finance/settlements"];

function revalidateFinance() {
  for (const p of FINANCE_PATHS) revalidatePath(p);
}

// ---------------------------------------------------------------------------
// Commission
// ---------------------------------------------------------------------------

const commissionSchema = z.object({
  creatorId: z.string().min(1, "Creator wajib dipilih"),
  campaignId: z.string().transform((v) => v || null),
  sourceType: z.enum(["LiveSession", "Content", "Campaign"]),
  gmv: z.coerce.number().gt(0, "GMV harus lebih dari 0"),
  creatorRate: z.coerce
    .number()
    .min(0, "Rate komisi tidak boleh negatif")
    .max(100, "Rate komisi maksimal 100%"),
  agencyShareRate: z.coerce
    .number()
    .min(0, "Share agensi tidak boleh negatif")
    .max(100, "Share agensi maksimal 100%"),
});

export type CommissionFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  preview?: { creatorCommission: number; agencyRevenue: number; creatorShare: number };
};

/** Validate + live-preview the explicit formula (PLAN §12: never hide numbers). */
export async function createCommissionAction(
  _prev: CommissionFormState,
  formData: FormData,
): Promise<CommissionFormState> {
  const user = await requireUser();
  if (!can(user.role, "finance", "write")) {
    return { error: "Anda tidak memiliki izin untuk mencatat komisi." };
  }

  const parsed = commissionSchema.safeParse({
    creatorId: formData.get("creatorId") ?? "",
    campaignId: formData.get("campaignId") ?? "",
    sourceType: formData.get("sourceType") ?? "Campaign",
    gmv: formData.get("gmv") ?? 0,
    creatorRate: formData.get("creatorRate") ?? 0,
    agencyShareRate: formData.get("agencyShareRate") ?? 0,
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const data = parsed.data;
  const amounts = calculateCommission({
    gmv: data.gmv,
    creatorRate: data.creatorRate,
    agencyShareRate: data.agencyShareRate,
  });

  // preview-only (no submit=1) → return calculation without persisting
  if (!formData.get("submit")) {
    return { preview: amounts };
  }

  try {
    await createCommission(user.agencyId, data);
  } catch {
    return { error: "Creator atau campaign tidak ditemukan di agensi ini.", preview: amounts };
  }
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Finance",
    entityId: data.creatorId,
    actorId: user.id,
    action: "Komisi dicatat",
    details: `GMV ${data.gmv}, komisi ${amounts.creatorCommission}, revenue agensi ${amounts.agencyRevenue}`,
  });

  revalidateFinance();
  redirect("/finance/commissions");
}

// ---------------------------------------------------------------------------
// Payout
// ---------------------------------------------------------------------------

const payoutSchema = z.object({
  creatorId: z.string().min(1, "Creator wajib dipilih"),
  campaignId: z.string().transform((v) => v || null),
  amount: z.coerce.number().gt(0, "Nominal payout harus lebih dari 0"),
});

export type PayoutFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createPayoutAction(
  _prev: PayoutFormState,
  formData: FormData,
): Promise<PayoutFormState> {
  const user = await requireUser();
  if (!can(user.role, "finance", "write")) {
    return { error: "Anda tidak memiliki izin untuk mencatat payout." };
  }

  const parsed = payoutSchema.safeParse({
    creatorId: formData.get("creatorId") ?? "",
    campaignId: formData.get("campaignId") ?? "",
    amount: formData.get("amount") ?? 0,
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await createPayout(user.agencyId, parsed.data);
  } catch {
    return { error: "Creator tidak ditemukan di agensi ini." };
  }
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Finance",
    entityId: parsed.data.creatorId,
    actorId: user.id,
    action: "Payout dicatat",
    details: `Rp${parsed.data.amount}`,
  });

  revalidateFinance();
  redirect("/finance/payouts");
}

/** Mark a pending payout as Paid. */
export async function markPayoutPaidAction(payoutId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "finance", "write")) return;

  try {
    await markPayoutPaid(user.agencyId, payoutId);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Finance",
      entityId: payoutId,
      actorId: user.id,
      action: "Payout dibayar",
    });
  } catch {
    // Sudah berubah — abaikan
  }
  revalidateFinance();
  void formData;
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

const dateStr = z
  .string()
  .transform((v) => (v ? new Date(`${v}T00:00:00`) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Tanggal tidak valid");

const settlementSchema = z.object({
  brandId: z.string().min(1, "Brand wajib dipilih"),
  campaignId: z.string().transform((v) => v || null),
  amount: z.coerce.number().gt(0, "Nominal settlement harus lebih dari 0"),
  dueDate: dateStr,
});

export type SettlementFormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function createSettlementAction(
  _prev: SettlementFormState,
  formData: FormData,
): Promise<SettlementFormState> {
  const user = await requireUser();
  if (!can(user.role, "finance", "write")) {
    return { error: "Anda tidak memiliki izin untuk mencatat settlement." };
  }

  const parsed = settlementSchema.safeParse({
    brandId: formData.get("brandId") ?? "",
    campaignId: formData.get("campaignId") ?? "",
    amount: formData.get("amount") ?? 0,
    dueDate: formData.get("dueDate") ?? "",
  });

  if (!parsed.success) {
    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await createSettlement(user.agencyId, parsed.data);
  } catch {
    return { error: "Brand tidak ditemukan di agensi ini." };
  }
  await logActivity({
    agencyId: user.agencyId,
    entityType: "Finance",
    entityId: parsed.data.brandId,
    actorId: user.id,
    action: "Settlement dicatat",
    details: `Rp${parsed.data.amount}`,
  });

  revalidateFinance();
  redirect("/finance/settlements");
}

/** Mark a pending/overdue settlement as Paid. */
export async function markSettlementPaidAction(settlementId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "finance", "write")) return;

  try {
    await markSettlementPaid(user.agencyId, settlementId);
    await logActivity({
      agencyId: user.agencyId,
      entityType: "Finance",
      entityId: settlementId,
      actorId: user.id,
      action: "Settlement dibayar",
    });
  } catch {
    // Sudah berubah — abaikan
  }
  revalidateFinance();
  void formData;
}
