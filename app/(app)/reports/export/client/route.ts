import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { clientReportCsv, getClientReport, PERIODS } from "@/lib/services/reports";
import type { Period } from "@/lib/services/reports";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!can(user.role as Role, "report", "read")) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId") ?? "";
  const periodParam = url.searchParams.get("period") ?? "30d";
  const period: Period = periodParam in PERIODS ? (periodParam as Period) : "30d";
  if (!campaignId) return new Response("campaignId wajib diisi", { status: 400 });

  const report = await getClientReport(user.agencyId, campaignId, period);
  if (!report) return new Response("Campaign tidak ditemukan", { status: 404 });

  const csv = "﻿" + clientReportCsv(report);
  const filename = `laporan-client-${report.campaign.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${period}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
