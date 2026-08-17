import Link from "next/link";
import { Clapperboard, KanbanSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { getContentBoard } from "@/lib/services/content";
import type { ContentRow } from "@/lib/services/content";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { StatusMoveForm } from "@/components/content/status-move-form";
import { RevisionForm } from "@/components/content/revision-form";

const REVIEW_STATUSES = ["DraftSubmitted", "Revision"] as const;

export default async function ReviewQueuePage() {
  const user = await requireUser();
  const canWrite = can(user.role, "content", "write");

  const queue: ContentRow[] = [];
  for (const status of REVIEW_STATUSES) {
    const board = await getContentBoard(user.agencyId, { status });
    queue.push(...(board.byStatus.get(status) ?? []));
  }
  queue.sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity));

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Antrian Review" description={`${queue.length} konten menunggu review`}>
        <Link
          href="/content"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-card px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          <KanbanSquare className="h-4 w-4" />
          Pipeline
        </Link>
      </PageHeader>

      {queue.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="Antrian review kosong"
          description="Konten dengan status Draft Masuk atau Revisi akan muncul di sini untuk direview."
        />
      ) : (
        <div className="space-y-3">
          {queue.map((row) => (
            <Card key={row.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/content/${row.id}`} className="text-sm font-medium hover:underline">
                      {row.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {row.campaignName} · {row.creatorName}
                      {row.dueDate ? <> · jatuh tempo {formatDate(row.dueDate)}</> : null}
                      {row.revisionCount > 0 ? <> · revisi ke-{row.revisionCount}</> : null}
                    </p>
                  </div>
                  {canWrite ? (
                    <div className="flex items-center gap-2">
                      {row.status === "Revision" ? (
                        <StatusMoveForm contentId={row.id} status="DraftSubmitted" label="Kembali ke Review" />
                      ) : null}
                      <StatusMoveForm contentId={row.id} status="Approved" label="Setujui" variant="success" />
                      <StatusMoveForm contentId={row.id} status="Rejected" label="Tolak" variant="destructive" />
                    </div>
                  ) : null}
                </div>
                {canWrite && row.status === "DraftSubmitted" ? (
                  <RevisionForm contentId={row.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
