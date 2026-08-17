import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { CreatorForm } from "@/components/creators/creator-form";

export default async function NewCreatorPage() {
  const user = await requireUser();
  if (!can(user.role, "creator", "write")) redirect("/creators");

  const managers = await prisma.user.findMany({
    where: { agencyId: user.agencyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4 p-6">
      <Link href="/creators" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Creators
      </Link>
      <PageHeader title="Tambah Creator" description="Daftarkan kreator baru ke agensi Anda." />
      <div className="rounded-lg border bg-card p-6">
        <CreatorForm managers={managers} />
      </div>
    </div>
  );
}
