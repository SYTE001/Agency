import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export default async function NewCampaignPage() {
  const user = await requireUser();
  if (!can(user.role as Role, "campaign", "write")) notFound();

  const [brands, users] = await Promise.all([
    prisma.brand.findMany({
      where: { agencyId: user.agencyId, status: "Active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Campaign Baru"
        description="Buat campaign untuk mengelola creator, konten, LIVE, dan target GMV."
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignForm brands={brands} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
