import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { getInternalReport, internalReportCsv, PERIODS } from "@/lib/services/reports";
import type { Period } from "@/lib/services/reports";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can(user.role as Role, "report", "read")) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const periodParam = url.searchParams.get("period") ?? "30d";
  const period: Period = periodParam in PERIODS ? (periodParam as Period) : "30d";

  const report = await getInternalReport(user.agencyId, period);
  const csv = "﻿" + internalReportCsv(report);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-internal-${period}.csv"`,
    },
  });
}
