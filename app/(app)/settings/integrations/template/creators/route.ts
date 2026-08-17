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
      "username;displayName;category;followers;engagementRate;externalId",
      "alya_beauty;Alya Beauty;Beauty;125000;4.5;ttk_123456",
    ].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="template-creator.csv"',
    },
  });
}
