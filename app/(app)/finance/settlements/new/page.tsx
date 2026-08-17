import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettlementForm } from "@/components/finance/settlement-form";

export default async function NewSettlementPage() {
  const user = await requireUser();
  if (!can(user.role, "finance", "write")) notFound();

  const [brands, campaigns] = await Promise.all([
    prisma.brand.findMany({
      where: { agencyId: user.agencyId, status: "Active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
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
        title="Catat Settlement"
        description="Catat tagihan/pembayaran dari brand ke agensi, lengkap dengan jatuh tempo."
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Settlement</CardTitle>
        </CardHeader>
        <CardContent>
          <SettlementForm brands={brands} campaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  );
}
