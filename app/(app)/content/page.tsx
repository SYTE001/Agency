import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { KANBAN_COLUMNS, getContentBoard } from "@/lib/services/content";
import type { ContentFilters, ContentRow } from "@/lib/services/content";
import { KanbanBoard } from "@/components/content/kanban-board";

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined;
}

export default async function ContentPage(props: PageProps<"/content">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const filters: ContentFilters = {
    q: str(searchParams.q),
    campaignId: str(searchParams.campaignId),
    creatorId: str(searchParams.creatorId),
    overdue: str(searchParams.overdue) === "1",
  };

  const [board, campaigns, creators] = await Promise.all([
    getContentBoard(user.agencyId, filters),
    prisma.campaign.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.creator.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 200,
    }),
  ]);
  const canWrite = can(user.role, "content", "write");

  // Convert Map to plain Record for Client Component serialization
  const initialItemsByStatus: Record<string, ContentRow[]> = {};
  for (const status of KANBAN_COLUMNS) {
    initialItemsByStatus[status] = board.byStatus.get(status) ?? [];
  }

  const initialItems: ContentRow[] = Array.from(board.byStatus.values()).flat();

  return (
    <div className="p-6">
      <KanbanBoard
        initialItems={initialItems}
        initialItemsByStatus={initialItemsByStatus}
        totalCount={board.total}
        campaigns={campaigns}
        creators={creators}
        initialFilters={filters}
        canWrite={canWrite}
      />
    </div>
  );
}
