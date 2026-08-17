import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveForm } from "@/components/live/live-form";

export default async function NewLivePage() {
  const user = await requireUser();
  if (!can(user.role as Role, "live", "write")) notFound();

  const [creators, campaigns, brands, products, users] = await Promise.all([
    prisma.creator.findMany({
      where: { agencyId: user.agencyId, status: "Active" },
      select: { id: true, displayName: true, username: true },
      orderBy: { displayName: "asc" },
      take: 100,
    }),
    prisma.campaign.findMany({
      where: { agencyId: user.agencyId, status: { in: ["Recruiting", "Active", "ContentReview"] } },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.brand.findMany({
      where: { agencyId: user.agencyId, status: "Active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.product.findMany({
      where: { agencyId: user.agencyId, status: "Active" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
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
        title="Jadwalkan LIVE"
        description="Buat sesi LIVE baru dan kaitkan ke creator, brand, campaign, dan produk."
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Sesi LIVE</CardTitle>
        </CardHeader>
        <CardContent>
          <LiveForm
            creators={creators}
            campaigns={campaigns}
            brands={brands}
            products={products}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
