import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayoutForm } from "@/components/finance/payout-form";

export default async function NewPayoutPage() {
  const user = await requireUser();
  if (!can(user.role as Role, "finance", "write")) notFound();

  const [creators, campaigns] = await Promise.all([
    prisma.creator.findMany({
      where: { agencyId: user.agencyId, status: "Active" },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 100,
    }),
    prisma.campaign.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Catat Payout"
        description="Catat pembayaran ke creator. Payout baru berstatus Menunggu sampai ditandai Lunas."
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <PayoutForm creators={creators} campaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  );
}
