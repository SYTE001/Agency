import prisma from "@/lib/prisma";
import {
  paginate,
  totalPages,
  getAgencyTimezone,
  containsInsensitive,
  type SortDir,
} from "@/lib/services/common";
import { daysAgoStartInTz } from "@/lib/timezone";
import type { ListResult } from "@/lib/services/common";
import { isProductStatus } from "@/lib/constants";
import type { Prisma } from "@/lib/prisma";

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
  sortBy?: "name" | "price" | "gmv";
  sortDir?: SortDir;
  page?: number;
  pageSize?: number;
};

function mapStaticSort(
  sortBy: ProductListFilters["sortBy"],
  sortDir: SortDir = "asc",
): Prisma.ProductOrderByWithRelationInput {
  switch (sortBy) {
    case "price":
      return { price: sortDir };
    default:
      return { name: sortDir };
  }
}

export async function listProducts(
  agencyId: string,
  filters: ProductListFilters = {},
): Promise<ListResult<ProductRow>> {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 20);
  const sortDir: SortDir =
    filters.sortBy === undefined ? "asc" : filters.sortDir === "asc" ? "asc" : "desc";

  const where: Prisma.ProductWhereInput = { agencyId };
  if (filters.q) where.name = containsInsensitive(filters.q);
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;

  const tzPromise = getAgencyTimezone(agencyId);

  const [products, total, tz] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: mapStaticSort(filters.sortBy, sortDir),
      skip,
      take,
      include: { brand: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
    tzPromise,
  ]);

  const ids = products.map((p) => p.id);
  if (ids.length === 0) {
    return { items: [], total, page, pageSize, totalPages: totalPages(total, pageSize) };
  }

  const since = daysAgoStartInTz(tz, 30);
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

  // Derived sort that needs the aggregation result (same idiom as creators).
  if (filters.sortBy === "gmv") {
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => (a.gmv30 - b.gmv30) * dir);
  }

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

  const since = daysAgoStartInTz(await getAgencyTimezone(agencyId), 30);
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

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function assertValidPrice(price?: number) {
  if (price != null && (!Number.isFinite(price) || price < 0)) {
    throw new Error("Harga tidak boleh negatif");
  }
}

/** The optional brand FK must point at a brand of the SAME agency. */
async function resolveBrand(agencyId: string, brandId: string | null | undefined) {
  if (!brandId) return null;
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, agencyId },
    select: { id: true },
  });
  if (!brand) throw new Error("Brand tidak ditemukan");
  return brand.id;
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
  const name = data.name.trim();
  if (!name) throw new Error("Nama produk wajib diisi");
  const status = data.status ?? "Active";
  if (!isProductStatus(status)) throw new Error("Status produk tidak valid");
  assertValidPrice(data.price);
  const brandId = await resolveBrand(agencyId, data.brandId);

  try {
    return await prisma.product.create({
      data: {
        agencyId, // always derived from the authenticated session by the caller
        name,
        brandId,
        sku: (data.sku ?? "").trim() || null,
        category: (data.category ?? "").trim() || null,
        price: data.price ?? 0,
        status,
      },
    });
  } catch (e) {
    console.error("createProduct failed", e);
    // Tenant-scoped unique violation on @@unique([agencyId, sku]) — same
    // detection idiom as lib/services/creators.ts (works across both providers).
    if (e instanceof Error && /unique constraint/i.test(e.message)) {
      throw new Error("SKU sudah dipakai produk lain. Gunakan SKU yang berbeda.");
    }
    throw new Error("Gagal menyimpan produk");
  }
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
  // Tenant-scoped existence check — replaces the raw P2025 a filtered update
  // would throw for a missing OR cross-tenant row.
  const existing = await prisma.product.findFirst({
    where: { id: productId, agencyId },
    select: { id: true },
  });
  if (!existing) throw new Error("Produk tidak ditemukan");

  if (data.status !== undefined && !isProductStatus(data.status)) {
    throw new Error("Status produk tidak valid");
  }
  const name = data.name !== undefined ? data.name.trim() : undefined;
  if (name !== undefined && !name) throw new Error("Nama produk wajib diisi");
  assertValidPrice(data.price);

  // undefined = leave unchanged; null clears; a value must be same-agency.
  const brandId =
    data.brandId === undefined ? undefined : await resolveBrand(agencyId, data.brandId);
  const sku = data.sku !== undefined ? ((data.sku ?? "").trim() || null) : undefined;
  const category = data.category !== undefined ? ((data.category ?? "").trim() || null) : undefined;

  try {
    return await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(brandId !== undefined ? { brandId } : {}),
        ...(sku !== undefined ? { sku } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  } catch (e) {
    console.error("updateProduct failed", e);
    if (e instanceof Error && /unique constraint/i.test(e.message)) {
      throw new Error("SKU sudah dipakai produk lain. Gunakan SKU yang berbeda.");
    }
    throw new Error("Gagal menyimpan perubahan produk");
  }
}
