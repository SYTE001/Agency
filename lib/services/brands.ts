import prisma from "@/lib/prisma";
import { paginate, totalPages, getAgencyTimezone, containsInsensitive } from "@/lib/services/common";
import { daysAgoStartInTz } from "@/lib/timezone";
import type { ListResult } from "@/lib/services/common";
import type { Prisma } from "@/lib/prisma";

export type BrandRow = {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  website: string | null;
  status: string;
  campaignCount: number;
  activeCampaigns: number;
  productCount: number;
  gmv30: number;
  agencyRevenue30: number;
  activeCreators: number;
  primaryContact: string | null;
};

export type BrandListFilters = {
  q?: string;
  status?: string;
  industry?: string;
  page?: number;
  pageSize?: number;
};

const ACTIVE_CAMPAIGN_STATUSES = ["Recruiting", "Active", "ContentReview", "Published"];

export async function listBrands(
  agencyId: string,
  filters: BrandListFilters = {},
): Promise<ListResult<BrandRow>> {
  const { skip, take, page, pageSize } = paginate(filters.page ?? 1, filters.pageSize ?? 20);

  const where: Prisma.BrandWhereInput = { agencyId };
  if (filters.q) where.name = containsInsensitive(filters.q);
  if (filters.status) where.status = filters.status;
  if (filters.industry) where.industry = filters.industry;

  const tzPromise = getAgencyTimezone(agencyId);

  const [brands, total, tz] = await Promise.all([
    prisma.brand.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take,
      include: {
        contacts: { where: { isPrimary: true }, take: 1, select: { name: true } },
      },
    }),
    prisma.brand.count({ where }),
    tzPromise,
  ]);

  const ids = brands.map((b) => b.id);
  if (ids.length === 0) {
    return { items: [], total, page, pageSize, totalPages: totalPages(total, pageSize) };
  }

  const since = daysAgoStartInTz(tz, 30);

  // Agency revenue attributed to each brand's campaigns (last 30 days)
  const [campaignAgg, campaignCounts, productCounts] = await Promise.all([
    prisma.commission.groupBy({
      by: ["campaignId"],
      where: {
        agencyId,
        campaignId: { not: null },
        campaign: { brandId: { in: ids } },
        createdAt: { gte: since },
      },
      _sum: { gmv: true, agencyRevenue: true },
    }),
    prisma.campaign.groupBy({
      by: ["brandId", "status"],
      where: { agencyId, brandId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.product.groupBy({
      by: ["brandId"],
      where: { agencyId, brandId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  // Roll commission rows up to the brand level via campaign → brand
  const campaignBrand = new Map(
    (
      await prisma.campaign.findMany({
        where: { id: { in: campaignAgg.filter((c) => c.campaignId != null).map((c) => c.campaignId as string) } },
        select: { id: true, brandId: true },
      })
    ).map((c) => [c.id, c.brandId] as const),
  );

  const brandGmv = new Map<string, number>();
  const brandRevenue = new Map<string, number>();
  for (const row of campaignAgg) {
    const brandId = row.campaignId ? campaignBrand.get(row.campaignId) : null;
    if (!brandId) continue;
    brandGmv.set(brandId, (brandGmv.get(brandId) ?? 0) + (row._sum.gmv?.toNumber() ?? 0));
    brandRevenue.set(brandId, (brandRevenue.get(brandId) ?? 0) + (row._sum.agencyRevenue?.toNumber() ?? 0));
  }

  const totalCampaigns = new Map<string, number>();
  const activeCampaigns = new Map<string, number>();
  for (const row of campaignCounts) {
    totalCampaigns.set(row.brandId, (totalCampaigns.get(row.brandId) ?? 0) + row._count._all);
    if (ACTIVE_CAMPAIGN_STATUSES.includes(row.status)) {
      activeCampaigns.set(row.brandId, (activeCampaigns.get(row.brandId) ?? 0) + row._count._all);
    }
  }

  const productCount = new Map(productCounts.map((r) => [r.brandId, r._count._all]));

  // Distinct active creators per brand
  const activeCreatorsByBrand = new Map<string, Set<string>>();
  const creatorRows = await prisma.campaignCreator.findMany({
    where: { campaign: { agencyId, brandId: { in: ids } }, status: "Active" },
    select: { creatorId: true, campaign: { select: { brandId: true } } },
  });
  for (const r of creatorRows) {
    const set = activeCreatorsByBrand.get(r.campaign.brandId) ?? new Set<string>();
    set.add(r.creatorId);
    activeCreatorsByBrand.set(r.campaign.brandId, set);
  }

  const rows: BrandRow[] = brands.map((b) => ({
    id: b.id,
    name: b.name,
    logoUrl: b.logoUrl,
    industry: b.industry,
    website: b.website,
    status: b.status,
    campaignCount: totalCampaigns.get(b.id) ?? 0,
    activeCampaigns: activeCampaigns.get(b.id) ?? 0,
    productCount: productCount.get(b.id) ?? 0,
    gmv30: brandGmv.get(b.id) ?? 0,
    agencyRevenue30: brandRevenue.get(b.id) ?? 0,
    activeCreators: activeCreatorsByBrand.get(b.id)?.size ?? 0,
    primaryContact: b.contacts[0]?.name ?? null,
  }));

  return { items: rows, total, page, pageSize, totalPages: totalPages(total, pageSize) };
}

// ---------------------------------------------------------------------------
// Detail — answers "How much business does this client generate?" (PLAN §8)
// ---------------------------------------------------------------------------

export async function getBrandDetail(agencyId: string, brandId: string) {
  const brand = await prisma.brand.findFirst({
    where: { id: brandId, agencyId },
    include: { contacts: { orderBy: { isPrimary: "desc" } } },
  });
  if (!brand) return null;

  const [campaigns, products, settlements, totals, tasks] = await Promise.all([
    prisma.campaign.findMany({
      where: { brandId, agencyId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.product.findMany({
      where: { brandId, agencyId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.settlement.findMany({
      where: { brandId, agencyId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.commission.aggregate({
      where: { agencyId, campaign: { brandId } },
      _sum: { gmv: true, agencyRevenue: true, creatorCommission: true },
    }),
    prisma.task.findMany({
      where: { agencyId, relatedType: "Brand", relatedId: brandId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const pendingSettlement = await prisma.settlement.aggregate({
    where: { brandId, agencyId, status: "Pending" },
    _sum: { amount: true },
  });

  // Distinct creators with an active campaign under this brand
  const creatorRows = await prisma.campaignCreator.findMany({
    where: { campaign: { agencyId, brandId }, status: "Active" },
    select: { creatorId: true },
  });
  const activeCreators = new Set(creatorRows.map((r) => r.creatorId)).size;

  return {
    brand,
    campaigns,
    products,
    settlements,
    tasks,
    totals: {
      gmv: totals._sum.gmv?.toNumber() ?? 0,
      agencyRevenue: totals._sum.agencyRevenue?.toNumber() ?? 0,
      creatorCommission: totals._sum.creatorCommission?.toNumber() ?? 0,
      campaignCount: campaigns.length,
      productCount: products.length,
      pendingSettlement: pendingSettlement._sum.amount?.toNumber() ?? 0,
      activeCreators,
    },
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createBrand(
  agencyId: string,
  data: {
    name: string;
    industry?: string | null;
    website?: string | null;
    description?: string | null;
    status?: string;
  },
) {
  return prisma.brand.create({
    data: {
      agencyId,
      name: data.name,
      industry: data.industry ?? null,
      website: data.website ?? null,
      description: data.description ?? null,
      status: data.status ?? "Active",
    },
  });
}

export async function updateBrand(
  agencyId: string,
  brandId: string,
  data: Partial<{
    name: string;
    industry: string | null;
    website: string | null;
    description: string | null;
    status: string;
  }>,
) {
  return prisma.brand.update({ where: { id: brandId, agencyId }, data });
}

export async function createBrandContact(
  agencyId: string,
  brandId: string,
  data: { name: string; email?: string | null; phone?: string | null; role?: string | null; isPrimary?: boolean },
) {
  // Tenant check on the parent brand
  const brand = await prisma.brand.findFirst({ where: { id: brandId, agencyId }, select: { id: true } });
  if (!brand) throw new Error("Brand tidak ditemukan");
  return prisma.brandContact.create({
    data: {
      brandId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      role: data.role ?? null,
      isPrimary: data.isPrimary ?? false,
    },
  });
}
