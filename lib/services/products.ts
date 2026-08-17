import prisma from "@/lib/prisma";
import { paginate, totalPages, daysAgoDate } from "@/lib/services/common";
import type { ListResult } from "@/lib/services/common";
import type { Prisma } from "@/generated/prisma/client";

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  price: number;
  imageUrl: string | null;
  status: string;
  brandId: string | null;
  brandName: string | null;
  gmv30: number;
  orders30: number;
  units30: number;
};

export type ProductListFilters = {
  q?: string;
  brandId?: string;
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

export async function listProducts(
  agencyId: string,
  filters: ProductListFilters = {},
): Promise<ListResult<ProductRow>> {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 20);

  const where: Prisma.ProductWhereInput = { agencyId };
  if (filters.q) where.name = { contains: filters.q };
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
      include: { brand: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  const ids = products.map((p) => p.id);
  if (ids.length === 0) {
    return { items: [], total, page, pageSize, totalPages: totalPages(total, pageSize) };
  }

  const since = daysAgoDate(30);
  const recent = await prisma.productMetric.groupBy({
    by: ["productId"],
    where: { productId: { in: ids }, date: { gte: since } },
    _sum: { gmv: true, orders: true, units: true },
  });
  const metricMap = new Map(recent.map((r) => [r.productId, r]));

  const rows: ProductRow[] = products.map((p) => {
    const m = metricMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price.toNumber(),
      imageUrl: p.imageUrl,
      status: p.status,
      brandId: p.brandId,
      brandName: p.brand?.name ?? null,
      gmv30: m?._sum.gmv?.toNumber() ?? 0,
      orders30: m?._sum.orders ?? 0,
      units30: m?._sum.units ?? 0,
    };
  });

  return { items: rows, total, page, pageSize, totalPages: totalPages(total, pageSize) };
}

export async function getProductDetail(agencyId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, agencyId },
    include: { brand: { select: { id: true, name: true } } },
  });
  if (!product) return null;

  const [metrics, campaigns, recentContent] = await Promise.all([
    prisma.productMetric.findMany({
      where: { productId },
      orderBy: { date: "asc" },
      take: 45,
    }),
    prisma.campaignProduct.findMany({
      where: { productId },
      include: { campaign: { select: { id: true, name: true, status: true } } },
      take: 10,
    }),
    prisma.contentItem.findMany({
      where: { productId, agencyId },
      include: { creator: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const since = daysAgoDate(30);
  const totals = await prisma.productMetric.aggregate({
    where: { productId, date: { gte: since } },
    _sum: { gmv: true, orders: true, units: true },
  });

  return {
    product,
    metrics,
    campaigns,
    recentContent,
    totals: {
      gmv30: totals._sum.gmv?.toNumber() ?? 0,
      orders30: totals._sum.orders ?? 0,
      units30: totals._sum.units ?? 0,
    },
  };
}

export async function createProduct(
  agencyId: string,
  data: {
    name: string;
    brandId?: string | null;
    sku?: string | null;
    category?: string | null;
    price?: number;
    status?: string;
  },
) {
  if (data.brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: data.brandId, agencyId },
      select: { id: true },
    });
    if (!brand) throw new Error("Brand tidak ditemukan");
  }
  return prisma.product.create({
    data: {
      agencyId,
      name: data.name,
      brandId: data.brandId ?? null,
      sku: data.sku ?? null,
      category: data.category ?? null,
      price: data.price ?? 0,
      status: data.status ?? "Active",
    },
  });
}

export async function updateProduct(
  agencyId: string,
  productId: string,
  data: Partial<{
    name: string;
    brandId: string | null;
    sku: string | null;
    category: string | null;
    price: number;
    status: string;
  }>,
) {
  return prisma.product.update({ where: { id: productId, agencyId }, data });
}
