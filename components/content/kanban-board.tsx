"use client";

import { useState, useTransition, useMemo, useRef, useEffect, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Clapperboard,
  Plus,
  MoreVertical,
  ExternalLink,
  MessageSquare,
  Check,
  KanbanSquare,
} from "lucide-react";
import { moveContentAction } from "@/app/actions/content";
import { formatDate } from "@/lib/format";
import type { ContentRow } from "@/lib/services/content";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// 5 Visual Columns in exact required order
export type VisualColumnId = "DRAFT" | "TASK" | "REVIEW" | "PROGRESS" | "COMPLETE";

export interface VisualColumnDef {
  id: VisualColumnId;
  label: string;
  dotColor: string;
  statuses: readonly string[];
  defaultDropStatus: string;
}

export const ACTIVE_COLUMNS: readonly VisualColumnDef[] = [
  {
    id: "DRAFT",
    label: "DRAFT",
    dotColor: "bg-neutral-400",
    statuses: ["Brief"],
    defaultDropStatus: "Brief",
  },
  {
    id: "TASK",
    label: "TASK",
    dotColor: "bg-neutral-300",
    statuses: ["Assigned"],
    defaultDropStatus: "Assigned",
  },
  {
    id: "REVIEW",
    label: "REVIEW",
    dotColor: "bg-amber-400",
    statuses: ["WaitingForDraft", "DraftSubmitted", "Revision"],
    defaultDropStatus: "DraftSubmitted",
  },
  {
    id: "PROGRESS",
    label: "IN PROGRESS",
    dotColor: "bg-blue-500",
    statuses: ["Approved", "Scheduled"],
    defaultDropStatus: "Approved",
  },
] as const;

export const COMPLETE_COLUMN: VisualColumnDef = {
  id: "COMPLETE",
  label: "COMPLETE",
  dotColor: "bg-emerald-500",
  statuses: ["Published", "Rejected", "Cancelled"],
  defaultDropStatus: "Published",
};

export const VISUAL_COLUMNS: readonly VisualColumnDef[] = [
  ...ACTIVE_COLUMNS,
  COMPLETE_COLUMN,
];

export const STATUS_TO_COLUMN: Record<string, VisualColumnId> = {
  Brief: "DRAFT",
  Assigned: "TASK",
  WaitingForDraft: "REVIEW",
  DraftSubmitted: "REVIEW",
  Revision: "REVIEW",
  Approved: "PROGRESS",
  Scheduled: "PROGRESS",
  Published: "COMPLETE",
  Rejected: "COMPLETE",
  Cancelled: "COMPLETE",
};

// Deterministic palette from specification: cream #E8DDCC, warm ivory #F2EBDD,
// charcoal #262626, near-black #171717, muted olive-gray #45483D, warm taupe #665D50
export const THUMBNAIL_PALETTES = [
  { bg: "#E8DDCC", text: "#171717" }, // cream
  { bg: "#F2EBDD", text: "#171717" }, // warm ivory
  { bg: "#262626", text: "#FAFAFA" }, // charcoal
  { bg: "#171717", text: "#FAFAFA" }, // near-black
  { bg: "#45483D", text: "#FAFAFA" }, // muted olive-gray
  { bg: "#665D50", text: "#FAFAFA" }, // warm taupe
] as const;

export function getThumbnailPalette(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return THUMBNAIL_PALETTES[Math.abs(hash) % THUMBNAIL_PALETTES.length];
}

interface CampaignOption {
  id: string;
  name: string;
}

interface CreatorOption {
  id: string;
  displayName: string;
}

export interface KanbanBoardProps {
  initialItems?: ContentRow[];
  initialItemsByStatus?: Record<string, ContentRow[]>;
  columns?: readonly string[];
  totalCount: number;
  campaigns: CampaignOption[];
  creators: CreatorOption[];
  initialFilters: {
    q?: string;
    campaignId?: string;
    creatorId?: string;
    overdue?: boolean;
  };
  canWrite: boolean;
}

export function KanbanBoard({
  initialItems,
  initialItemsByStatus,
  totalCount,
  campaigns,
  creators,
  initialFilters,
  canWrite,
}: KanbanBoardProps) {
  const router = useRouter();

  // Normalized list of cards from either initialItems or initialItemsByStatus
  const normalizedInitial = useMemo(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    if (initialItemsByStatus) return Object.values(initialItemsByStatus).flat();
    return [];
  }, [initialItems, initialItemsByStatus]);

  const [items, setItems] = useState<ContentRow[]>(normalizedInitial);
  const [prevInitial, setPrevInitial] = useState(normalizedInitial);
  if (prevInitial !== normalizedInitial) {
    setPrevInitial(normalizedInitial);
    setItems(normalizedInitial);
  }

  const [searchQuery, setSearchQuery] = useState(initialFilters.q ?? "");
  const [selectedCampaign, setSelectedCampaign] = useState(initialFilters.campaignId ?? "");
  const [selectedCreator, setSelectedCreator] = useState(initialFilters.creatorId ?? "");
  const [isOverdueOnly, setIsOverdueOnly] = useState(Boolean(initialFilters.overdue));
  const [isCompleteOpen, setIsCompleteOpen] = useState(true);

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<VisualColumnId | null>(null);
  const isDraggingRef = useRef(false);
  const [, startTransition] = useTransition();

  // Client-side quick filter
  const filteredItemsByColumn = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result: Record<VisualColumnId, ContentRow[]> = {
      DRAFT: [],
      TASK: [],
      REVIEW: [],
      PROGRESS: [],
      COMPLETE: [],
    };
    const now = new Date();

    for (const item of items) {
      if (query) {
        const haystack = `${item.title} ${item.creatorName} ${item.creatorUsername ?? ""} ${item.campaignName}`.toLowerCase();
        if (!haystack.includes(query)) continue;
      }
      if (selectedCampaign && item.campaignId !== selectedCampaign) continue;
      if (selectedCreator && item.creatorId !== selectedCreator) continue;
      if (isOverdueOnly) {
        const isOverdue = item.dueDate !== null && item.dueDate < now && item.status !== "Approved" && item.status !== "Published";
        if (!isOverdue) continue;
      }

      const colId = STATUS_TO_COLUMN[item.status] ?? "DRAFT";
      result[colId].push(item);
    }
    return result;
  }, [items, searchQuery, selectedCampaign, selectedCreator, isOverdueOnly]);

  const currentTotal = useMemo(() => {
    return Object.values(filteredItemsByColumn).reduce((sum, list) => sum + list.length, 0);
  }, [filteredItemsByColumn]);

  // Status transition handler (used by drag-drop and card menu)
  const handleMoveStatus = (cardId: string, targetStatus: string) => {
    if (!canWrite) return;
    const card = items.find((c) => c.id === cardId);
    if (!card || card.status === targetStatus) return;

    const isNewRevision = targetStatus === "Revision";
    const updatedCard: ContentRow = {
      ...card,
      status: targetStatus,
      revisionCount: isNewRevision ? card.revisionCount + 1 : card.revisionCount,
    };

    setItems((prev) => prev.map((c) => (c.id === cardId ? updatedCard : c)));

    startTransition(async () => {
      const formData = new FormData();
      formData.set("status", targetStatus);
      await moveContentAction(cardId, formData);
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent<HTMLElement>, cardId: string) => {
    if (!canWrite) return;
    isDraggingRef.current = true;
    setDraggedCardId(cardId);
    e.dataTransfer.setData("text/plain", cardId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    setDragOverColumn(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const handleDragOver = (e: DragEvent<HTMLElement>, columnId: VisualColumnId) => {
    if (!canWrite || !draggedCardId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>, columnId: VisualColumnId) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLElement>, columnId: VisualColumnId) => {
    if (!canWrite) return;
    e.preventDefault();
    setDragOverColumn(null);

    const cardId = draggedCardId || e.dataTransfer.getData("text/plain");
    if (!cardId) return;

    const card = items.find((c) => c.id === cardId);
    if (!card) return;

    const currentColumn = STATUS_TO_COLUMN[card.status];
    if (currentColumn === columnId) return;

    const targetDef = VISUAL_COLUMNS.find((c) => c.id === columnId);
    if (!targetDef) return;

    handleMoveStatus(cardId, targetDef.defaultDropStatus);
  };

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedCampaign) params.set("campaignId", selectedCampaign);
    if (selectedCreator) params.set("creatorId", selectedCreator);
    if (isOverdueOnly) params.set("overdue", "1");
    router.push(`/content?${params.toString()}`);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCampaign("");
    setSelectedCreator("");
    setIsOverdueOnly(false);
    router.push("/content");
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Topbar: Title & Quick Links */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Content</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {currentTotal} konten di pipeline
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/content/review"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <KanbanSquare className="size-3.5" />
            Antrian Review
          </Link>

          {canWrite ? (
            <Link
              href="/content/new"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <Plus className="size-3.5" />
              Konten Baru
            </Link>
          ) : null}
        </div>
      </header>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-xs"
      >
        {/* Search */}
        <label className="relative flex h-9 w-60 items-center rounded-md border border-input bg-transparent transition-colors focus-within:ring-1 focus-within:ring-ring focus-within:border-ring">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul konten…"
            className="h-full w-full bg-transparent pl-8 pr-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        {/* Campaign Filter */}
        <Select
          value={selectedCampaign}
          onChange={(e) => setSelectedCampaign(e.target.value)}
          className="w-44"
        >
          <option value="">Semua campaign</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        {/* Creator Filter */}
        <Select
          value={selectedCreator}
          onChange={(e) => setSelectedCreator(e.target.value)}
          className="w-40"
        >
          <option value="">Semua creator</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </Select>

        {/* Overdue */}
        <label className="inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-md border border-input bg-transparent px-3 text-xs font-medium text-foreground transition-colors">
          <input
            type="checkbox"
            checked={isOverdueOnly}
            onChange={(e) => setIsOverdueOnly(e.target.checked)}
            className="size-3.5 cursor-pointer accent-primary"
          />
          <span>Terlambat</span>
        </label>

        {/* Action Buttons */}
        <Button type="submit">Terapkan</Button>

        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
        >
          Reset
        </Button>
      </form>

      {/* Board or Empty State */}
      {totalCount === 0 && currentTotal === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Clapperboard className="size-10 text-muted-foreground" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">Tidak ada konten</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {searchQuery || selectedCampaign || selectedCreator || isOverdueOnly
              ? "Coba ubah filter atau kata kunci pencarian."
              : "Belum ada konten di pipeline. Buat brief konten pertama Anda."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          {/* Active 4-column workflow grid (DRAFT, TASK, REVIEW, IN PROGRESS) */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 items-start">
            {ACTIVE_COLUMNS.map((column) => {
              const columnCards = filteredItemsByColumn[column.id] ?? [];
              const isTarget = dragOverColumn === column.id;

              return (
                <section
                  key={column.id}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={(e) => handleDragLeave(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className={cn(
                    "flex flex-col rounded-xl border border-border bg-subtle p-2.5 transition-colors min-h-[420px]",
                    isTarget && "bg-accent/40 ring-2 ring-inset ring-foreground/20",
                  )}
                >
                  {/* Column Header matching Image 1 */}
                  <header className="flex h-8 items-center justify-between px-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", column.dotColor)} aria-hidden="true" />
                      <h2 className="text-[11px] font-bold tracking-[0.05em] text-foreground">
                        {column.label}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-card border border-border px-1.5 text-[10px] font-bold text-foreground">
                        {columnCards.length}
                      </span>
                      {canWrite ? (
                        <Link
                          href="/content/new"
                          title="Tambah Konten"
                          className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                        >
                          <Plus className="size-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </header>

                  {/* Cards List */}
                  <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                    {columnCards.length === 0 ? (
                      <div className="flex flex-1 min-h-[100px] items-center justify-center rounded-lg border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                        Tidak ada konten
                      </div>
                    ) : (
                      columnCards.map((row) => (
                        <ContentCard
                          key={row.id}
                          row={row}
                          canWrite={canWrite}
                          isDragging={draggedCardId === row.id}
                          onDragStart={(e) => handleDragStart(e, row.id)}
                          onDragEnd={handleDragEnd}
                          onMoveStatus={handleMoveStatus}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Dedicated COMPLETE Section below the active pipeline */}
          {(() => {
            const completeCards = filteredItemsByColumn[COMPLETE_COLUMN.id] ?? [];
            const isTarget = dragOverColumn === COMPLETE_COLUMN.id;

            return (
              <section
                onDragOver={(e) => handleDragOver(e, COMPLETE_COLUMN.id)}
                onDragLeave={(e) => handleDragLeave(e, COMPLETE_COLUMN.id)}
                onDrop={(e) => handleDrop(e, COMPLETE_COLUMN.id)}
                className={cn(
                  "flex flex-col rounded-xl border border-border bg-subtle p-3 transition-colors",
                  isTarget && "bg-accent/40 ring-2 ring-inset ring-foreground/20",
                )}
              >
                {/* Header */}
                <header className="flex h-8 items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", COMPLETE_COLUMN.dotColor)} aria-hidden="true" />
                    <h2 className="text-[11px] font-bold tracking-[0.05em] text-foreground">
                      {COMPLETE_COLUMN.label}
                    </h2>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      (Published, Ditolak, Batal)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-card border border-border px-1.5 text-[10px] font-bold text-foreground">
                      {completeCards.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCompleteOpen((v) => !v)}
                      className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-card hover:text-foreground transition-colors cursor-pointer"
                      aria-label={isCompleteOpen ? "Ciutkan section complete" : "Bentangkan section complete"}
                      title={isCompleteOpen ? "Ciutkan" : "Bentangkan"}
                    >
                      <ChevronDown
                        className={cn("size-3.5 transition-transform duration-200", !isCompleteOpen && "-rotate-90")}
                      />
                    </button>
                  </div>
                </header>

                {/* Cards List or Empty state */}
                {isCompleteOpen && (
                  <div className="mt-3">
                    {completeCards.length === 0 ? (
                      <div className="flex min-h-[90px] items-center justify-center rounded-lg border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                        Tidak ada konten selesai
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {completeCards.map((row) => (
                          <ContentCard
                            key={row.id}
                            row={row}
                            canWrite={canWrite}
                            isDragging={draggedCardId === row.id}
                            onDragStart={(e) => handleDragStart(e, row.id)}
                            onDragEnd={handleDragEnd}
                            onMoveStatus={handleMoveStatus}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// Compact horizontal Content Card matching Image 1
function ContentCard({
  row,
  canWrite,
  isDragging,
  onDragStart,
  onDragEnd,
  onMoveStatus,
}: {
  row: ContentRow;
  canWrite: boolean;
  isDragging: boolean;
  onDragStart: (e: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onMoveStatus: (cardId: string, targetStatus: string) => void;
}) {
  const palette = useMemo(() => getThumbnailPalette(row.id), [row.id]);
  const isOverdue =
    row.dueDate !== null &&
    row.dueDate < new Date() &&
    row.status !== "Approved" &&
    row.status !== "Published";

  const displayDate =
    row.status === "Published"
      ? row.publishDate ?? row.dueDate
      : row.dueDate ?? row.publishDate;

  return (
    <div
      draggable={canWrite}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex rounded-xl border border-border bg-card p-2.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-neutral-500 shadow-xs",
        canWrite && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 scale-[0.98]",
      )}
    >
      {/* Left: Typography Thumbnail */}
      <Link
        href={`/content/${row.id}`}
        className="shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-lg"
      >
        <div
          style={{ backgroundColor: palette.bg, color: palette.text }}
          className="flex h-[110px] w-[88px] shrink-0 flex-col justify-center rounded-lg p-2.5 text-left select-none overflow-hidden"
        >
          <span className="line-clamp-3 text-[11px] font-black uppercase leading-[1.2] tracking-tight break-words">
            {row.title || "Untitled"}
          </span>
        </div>
      </Link>

      {/* Right: Content Information */}
      <div className="flex flex-1 flex-col justify-between min-w-0 pl-2.5 py-0.5">
        {/* Top: Title & Three-dots Menu */}
        <div>
          <div className="flex items-start justify-between gap-1">
            <Link
              href={`/content/${row.id}`}
              className="line-clamp-2 text-xs font-semibold leading-snug text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
              title={row.title}
            >
              {row.title}
            </Link>
            <CardActionsMenu row={row} canWrite={canWrite} onMove={onMoveStatus} />
          </div>

          {/* Campaign / Brand with icon */}
          <div className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <Clapperboard className="size-3 shrink-0 opacity-70" />
            <span className="truncate">{row.campaignName || "Tanpa campaign"}</span>
          </div>
        </div>

        {/* Bottom row: Avatars on left, Status / Revisions / Due date on right */}
        <div className="mt-2 flex items-end justify-between gap-1 text-[11px]">
          {/* Creator & Reviewer Avatars */}
          <div className="flex items-center -space-x-1.5 shrink-0 mb-0.5">
            <Avatar
              name={row.creatorName}
              className="size-5 text-[9px] border-2 border-card ring-1 ring-border"
            />
            {row.reviewerName ? (
              <Avatar
                name={row.reviewerName}
                className="size-5 text-[9px] border-2 border-card ring-1 ring-border"
              />
            ) : null}
          </div>

          {/* Right: Status badge / Date / Revision count */}
          <div className="flex flex-col items-end justify-end gap-0.5 shrink-0">
            {row.status === "Published" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <Check className="size-2.5" />
                Published
              </span>
            ) : row.status === "Rejected" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                Ditolak
              </span>
            ) : row.status === "Cancelled" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-400">
                Batal
              </span>
            ) : null}

            {displayDate ? (
              <span
                className={cn(
                  "text-[10px] text-muted-foreground tabular-nums",
                  isOverdue && "font-semibold text-destructive",
                )}
                title={isOverdue ? "Jatuh tempo terlewat" : undefined}
              >
                {formatDate(displayDate)}
              </span>
            ) : null}

            {row.revisionCount > 0 ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground"
                title={`${row.revisionCount} revisi`}
              >
                <MessageSquare className="size-2.5 text-muted-foreground/80" />
                {row.revisionCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// Three-dots menu component
function CardActionsMenu({
  row,
  canWrite,
  onMove,
}: {
  row: ContentRow;
  canWrite: boolean;
  onMove: (cardId: string, targetStatus: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Menu konten"
        title="Opsi"
      >
        <MoreVertical className="size-3.5" />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-7 z-30 w-44 rounded-md border border-border bg-card p-1 shadow-lg text-xs"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Link
            href={`/content/${row.id}`}
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-foreground hover:bg-muted"
            onClick={() => setOpen(false)}
          >
            <ExternalLink className="size-3.5 text-muted-foreground" />
            Buka Detail
          </Link>
          {canWrite ? (
            <>
              <div className="my-1 border-t border-border" />
              <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pindahkan ke
              </p>
              {VISUAL_COLUMNS.map((col) => {
                const isCurrent = STATUS_TO_COLUMN[row.status] === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      setOpen(false);
                      onMove(row.id, col.defaultDropStatus);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left transition-colors",
                      isCurrent
                        ? "opacity-40 cursor-default"
                        : "text-foreground hover:bg-muted cursor-pointer",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", col.dotColor)} />
                    <span>{col.label}</span>
                  </button>
                );
              })}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
