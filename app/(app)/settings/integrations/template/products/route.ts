import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/authorization";

const BOM = "﻿";

export async function GET() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can(user.role, "integration", "read")) {
    return new Response("Forbidden", { status: 403 });
  }

  const csv =
    BOM +
    [
      "name;brand;sku;category;price;externalId",
      "Serum Glowella;Glowella;SKU-001;Skincare;129000;ttk_p_9876",
    ].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-produk.csv"',
    },
  });
}
