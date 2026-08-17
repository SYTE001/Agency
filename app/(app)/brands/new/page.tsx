import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { BrandForm } from "@/components/brands/brand-form";

export default async function NewBrandPage() {
  const user = await requireUser();
  if (!can(user.role, "brand", "write")) redirect("/brands");

  return (
    <div className="space-y-4 p-6">
      <Link href="/brands" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Brands
      </Link>
      <PageHeader title="Tambah Brand" description="Daftarkan brand klien baru ke agensi Anda." />
      <div className="rounded-lg border bg-card p-6">
        <BrandForm />
      </div>
    </div>
  );
}
