import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommissionForm } from "@/components/finance/commission-form";

export default async function NewCommissionPage() {
  const user = await requireUser();
  if (!can(user.role, "finance", "write")) notFound();

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
        title="Catat Komisi"
        description="Hitung komisi creator dan revenue agensi dari sebuah transaksi GMV."
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Komisi</CardTitle>
        </CardHeader>
        <CardContent>
          <CommissionForm creators={creators} campaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  );
}
