import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";

export default async function EditProductPage(props: PageProps<"/products/[id]/edit">) {
  const user = await requireUser();
  if (!can(user.role, "product", "write")) redirect("/products");

  const { id } = await props.params;
  // Tenant-scoped read with an explicit field list — only master-data columns
  // cross into the client form.
  const [product, brands] = await Promise.all([
    prisma.product.findFirst({
      where: { id, agencyId: user.agencyId },
      select: {
        id: true,
        name: true,
        brandId: true,
        sku: true,
        category: true,
        price: true,
        status: true,
      },
    }),
    prisma.brand.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-4 p-6">
      <Link
        href={`/products/${product.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Detail Produk
      </Link>
      <PageHeader title="Ubah Produk" description={product.name} />
      <div className="rounded-lg border bg-card p-6">
        <ProductForm
          brands={brands}
          product={{
            id: product.id,
            name: product.name,
            brandId: product.brandId,
            sku: product.sku,
            category: product.category,
            price: product.price.toNumber(),
            status: product.status,
          }}
        />
      </div>
    </div>
  );
}
