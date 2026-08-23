import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { BrandForm } from "@/components/brands/brand-form";

export default async function EditBrandPage(props: PageProps<"/brands/[id]/edit">) {
  const user = await requireUser();
  if (!can(user.role, "brand", "write")) redirect("/brands");

  const { id } = await props.params;
  // Tenant-scoped read with an explicit field list — only master-data columns
  // cross into the client form.
  const brand = await prisma.brand.findFirst({
    where: { id, agencyId: user.agencyId },
    select: {
      id: true,
      name: true,
      industry: true,
      website: true,
      description: true,
      status: true,
    },
  });
  if (!brand) notFound();

  return (
    <div className="space-y-4 p-6">
      <Link
        href={`/brands/${brand.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Detail Brand
      </Link>
      <PageHeader title="Ubah Brand" description={brand.name} />
      <div className="rounded-lg border bg-card p-6">
        <BrandForm
          brand={{
            id: brand.id,
            name: brand.name,
            industry: brand.industry,
            website: brand.website,
            description: brand.description,
            status: brand.status,
          }}
        />
      </div>
    </div>
  );
}
