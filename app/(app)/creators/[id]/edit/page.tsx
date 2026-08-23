import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { CreatorForm } from "@/components/creators/creator-form";

export default async function EditCreatorPage(props: PageProps<"/creators/[id]/edit">) {
  const user = await requireUser();
  if (!can(user.role, "creator", "write")) redirect("/creators");

  const { id } = await props.params;
  // Tenant-scoped read with an explicit field list — only master-data columns
  // cross into the client form.
  const [creator, managers] = await Promise.all([
    prisma.creator.findFirst({
      where: { id, agencyId: user.agencyId },
      select: {
        id: true,
        username: true,
        displayName: true,
        category: true,
        managerId: true,
        followers: true,
        engagementRate: true,
        status: true,
        bio: true,
      },
    }),
    prisma.user.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!creator) notFound();

  return (
    <div className="space-y-4 p-6">
      <Link
        href={`/creators/${creator.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Detail Creator
      </Link>
      <PageHeader title="Ubah Creator" description={creator.displayName} />
      <div className="rounded-lg border bg-card p-6">
        <CreatorForm
          managers={managers}
          creator={{
            id: creator.id,
            username: creator.username,
            displayName: creator.displayName,
            category: creator.category,
            managerId: creator.managerId,
            followers: creator.followers,
            // Decimal-safe for the number input.
            engagementRate: Number(creator.engagementRate),
            status: creator.status,
            bio: creator.bio,
          }}
        />
      </div>
    </div>
  );
}
