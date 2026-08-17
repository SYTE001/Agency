import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentForm } from "@/components/content/content-form";

export default async function NewContentPage() {
  const user = await requireUser();
  if (!can(user.role as Role, "content", "write")) notFound();

  const [campaigns, creators, products, users] = await Promise.all([
    prisma.campaign.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.creator.findMany({
      where: { agencyId: user.agencyId, status: "Active" },
      select: { id: true, displayName: true, username: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.product.findMany({
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
        title="Konten Baru"
        description="Buat brief konten baru untuk pipeline review dan publikasi."
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Konten</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentForm campaigns={campaigns} creators={creators} products={products} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
