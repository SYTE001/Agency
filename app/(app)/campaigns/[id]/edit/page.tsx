import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { CampaignForm } from "@/components/campaigns/campaign-form";

export default async function EditCampaignPage(props: PageProps<"/campaigns/[id]/edit">) {
  const user = await requireUser();
  if (!can(user.role, "campaign", "write")) redirect("/campaigns");

  const { id } = await props.params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, agencyId: user.agencyId },
    select: {
      id: true,
      name: true,
      brandId: true,
      ownerId: true,
      status: true,
      startDate: true,
      endDate: true,
      budget: true,
      gmvTarget: true,
      creatorTarget: true,
      contentTarget: true,
      liveTarget: true,
      commissionRate: true,
      notes: true,
    },
  });
  if (!campaign) notFound();

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

  const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

  return (
    <div className="space-y-4 p-6">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Detail Campaign
      </Link>
      <PageHeader title="Ubah Campaign" description={campaign.name} />
      <div className="rounded-lg border bg-card p-6">
        <CampaignForm
          brands={brands}
          users={users}
          campaign={{
            id: campaign.id,
            name: campaign.name,
            brandId: campaign.brandId,
            ownerId: campaign.ownerId,
            status: campaign.status,
            startDate: toDateInput(campaign.startDate),
            endDate: toDateInput(campaign.endDate),
            budget: campaign.budget.toNumber(),
            gmvTarget: campaign.gmvTarget.toNumber(),
            creatorTarget: campaign.creatorTarget,
            contentTarget: campaign.contentTarget,
            liveTarget: campaign.liveTarget,
            commissionRate: Number(campaign.commissionRate),
            notes: campaign.notes,
          }}
        />
      </div>
    </div>
  );
}
