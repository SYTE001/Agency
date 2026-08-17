import prisma from "@/lib/prisma";
import { readableResources } from "@/lib/authorization";
import type { Resource, Role } from "@/lib/constants";

/**
 * Global search (PLAN §24). One query per entity type, results grouped by
 * entity and filtered server-side by the user's read permissions — a role
 * that cannot read an entity never sees its group. Tasks have no [id] page,
 * so they deep-link to the tasks list with the query pre-filled.
 */

export type SearchGroup = {
  resource: Resource;
  label: string;
  results: { id: string; title: string; subtitle?: string; href: string }[];
};

const GROUPS: { resource: Resource; label: string; href: (id: string, q: string) => string }[] = [
  { resource: "creator", label: "Creator", href: (id) => `/creators/${id}` },
  { resource: "brand", label: "Brand", href: (id) => `/brands/${id}` },
  { resource: "campaign", label: "Campaign", href: (id) => `/campaigns/${id}` },
  { resource: "product", label: "Product", href: (id) => `/products/${id}` },
  { resource: "content", label: "Content", href: (id) => `/content/${id}` },
  { resource: "live", label: "LIVE", href: (id) => `/live/${id}` },
  // Tasks link to the list view (no detail page)
  { resource: "task", label: "Task", href: (_id, q) => `/tasks?q=${encodeURIComponent(q)}` },
];

const TAKE = 5;

export async function globalSearch(agencyId: string, role: Role, query: string): Promise<SearchGroup[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const readable = new Set<Resource>(readableResources(role));

  const [creators, brands, campaigns, products, contents, lives, tasks] = await Promise.all([
    prisma.creator.findMany({
      where: { agencyId, OR: [{ displayName: { contains: q } }, { username: { contains: q } }] },
      select: { id: true, displayName: true, username: true },
      orderBy: { displayName: "asc" },
      take: TAKE,
    }),
    prisma.brand.findMany({
      where: { agencyId, name: { contains: q } },
      select: { id: true, name: true, industry: true },
      orderBy: { name: "asc" },
      take: TAKE,
    }),
    prisma.campaign.findMany({
      where: { agencyId, name: { contains: q } },
      select: { id: true, name: true, brand: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
    prisma.product.findMany({
      where: { agencyId, name: { contains: q } },
      select: { id: true, name: true, brand: { select: { name: true } } },
      orderBy: { name: "asc" },
      take: TAKE,
    }),
    prisma.contentItem.findMany({
      where: { agencyId, OR: [{ title: { contains: q } }, { brief: { contains: q } }] },
      select: { id: true, title: true, creator: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
    prisma.liveSession.findMany({
      where: { agencyId, OR: [{ room: { contains: q } }, { creator: { displayName: { contains: q } } }] },
      select: {
        id: true,
        room: true,
        creator: { select: { displayName: true } },
        campaign: { select: { name: true } },
      },
      orderBy: { startTime: "desc" },
      take: TAKE,
    }),
    prisma.task.findMany({
      where: {
        agencyId,
        OR: [{ title: { contains: q } }, { notes: { contains: q } }],
        status: { not: "Done" },
      },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
  ]);

  const all: { resource: Resource; label: string; results: SearchGroup["results"] }[] = [
    {
      resource: "creator",
      label: GROUPS[0].label,
      results: creators.map((c) => ({
        id: c.id,
        title: c.displayName,
        subtitle: `@${c.username}`,
        href: GROUPS[0].href(c.id, q),
      })),
    },
    {
      resource: "brand",
      label: GROUPS[1].label,
      results: brands.map((b) => ({
        id: b.id,
        title: b.name,
        subtitle: b.industry ?? undefined,
        href: GROUPS[1].href(b.id, q),
      })),
    },
    {
      resource: "campaign",
      label: GROUPS[2].label,
      results: campaigns.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.brand.name,
        href: GROUPS[2].href(c.id, q),
      })),
    },
    {
      resource: "product",
      label: GROUPS[3].label,
      results: products.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.brand?.name ?? undefined,
        href: GROUPS[3].href(p.id, q),
      })),
    },
    {
      resource: "content",
      label: GROUPS[4].label,
      results: contents.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.creator.displayName,
        href: GROUPS[4].href(c.id, q),
      })),
    },
    {
      resource: "live",
      label: GROUPS[5].label,
      results: lives.map((l) => ({
        id: l.id,
        title: l.room ? `${l.room} · ${l.creator.displayName}` : l.creator.displayName,
        subtitle: l.campaign?.name ?? undefined,
        href: GROUPS[5].href(l.id, q),
      })),
    },
    {
      resource: "task",
      label: GROUPS[6].label,
      results: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        href: GROUPS[6].href(t.id, q),
      })),
    },
  ];

  // Drop empty groups and anything the role cannot read
  return all
    .filter((g) => g.results.length > 0 && readable.has(g.resource))
    .map((g) => ({ resource: g.resource, label: g.label, results: g.results }));
}
