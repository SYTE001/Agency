import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";

export default async function NewProductPage() {
  const user = await requireUser();
  if (!can(user.role, "product", "write")) redirect("/products");

  const brands = await prisma.brand.findMany({
    where: { agencyId: user.agencyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4 p-6">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Products
      </Link>
      <PageHeader title="Tambah Produk" description="Daftarkan produk baru ke katalog agensi Anda." />
      <div className="rounded-lg border bg-card p-6">
        <ProductForm brands={brands} />
      </div>
    </div>
  );
}
