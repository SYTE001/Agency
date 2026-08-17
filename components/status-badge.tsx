import { Badge } from "@/components/ui/badge";
import type { CreatorHealth } from "@/lib/constants";

// Single shared status renderer — maps domain status strings (source of truth
// in lib/constants.ts) to a badge variant + Indonesian label.
type Variant = "success" | "warning" | "destructive" | "muted" | "brand" | "secondary";

const HEALTH: Record<CreatorHealth, { label: string; variant: Variant }> = {
  Healthy: { label: "Sehat", variant: "success" },
  Watch: { label: "Pantauan", variant: "warning" },
  AtRisk: { label: "Berisiko", variant: "destructive" },
  Inactive: { label: "Tidak Aktif", variant: "muted" },
};

const GENERIC: Record<string, { label: string; variant: Variant }> = {
  // Creator / brand / product
  Active: { label: "Aktif", variant: "success" },
  Paused: { label: "Jeda", variant: "warning" },
  Churned: { label: "Berhenti", variant: "muted" },
  // Campaign
  Draft: { label: "Draft", variant: "muted" },
  Planning: { label: "Perencanaan", variant: "secondary" },
  Recruiting: { label: "Rekrutmen", variant: "brand" },
  ContentReview: { label: "Review Konten", variant: "warning" },
  Published: { label: "Tayang", variant: "success" },
  Completed: { label: "Selesai", variant: "success" },
  Reporting: { label: "Pelaporan", variant: "secondary" },
  // Content
  Brief: { label: "Brief", variant: "muted" },
  Assigned: { label: "Ditugaskan", variant: "secondary" },
  WaitingForDraft: { label: "Menunggu Draft", variant: "warning" },
  DraftSubmitted: { label: "Draft Masuk", variant: "brand" },
  Revision: { label: "Revisi", variant: "warning" },
  Approved: { label: "Disetujui", variant: "success" },
  Scheduled: { label: "Terjadwal", variant: "secondary" },
  Rejected: { label: "Ditolak", variant: "destructive" },
  Cancelled: { label: "Dibatalkan", variant: "muted" },
  // LIVE
  Preparing: { label: "Persiapan", variant: "warning" },
  Live: { label: "LIVE", variant: "destructive" },
  Ended: { label: "Selesai", variant: "muted" },
  NeedsReview: { label: "Perlu Review", variant: "warning" },
  // Task
  Open: { label: "Terbuka", variant: "brand" },
  InProgress: { label: "Dikerjakan", variant: "warning" },
  Done: { label: "Selesai", variant: "success" },
  Low: { label: "Rendah", variant: "muted" },
  Medium: { label: "Sedang", variant: "secondary" },
  High: { label: "Tinggi", variant: "warning" },
  Urgent: { label: "Urgen", variant: "destructive" },
  // Finance
  Pending: { label: "Menunggu", variant: "warning" },
  Paid: { label: "Lunas", variant: "success" },
  Overdue: { label: "Terlambat", variant: "destructive" },
  Calculated: { label: "Terhitung", variant: "brand" },
  Settled: { label: "Selesai", variant: "success" },
  // Integration / sync
  Connected: { label: "Terhubung", variant: "success" },
  Disconnected: { label: "Tidak Terhubung", variant: "muted" },
  Error: { label: "Error", variant: "destructive" },
  Queued: { label: "Antre", variant: "muted" },
  Running: { label: "Berjalan", variant: "brand" },
  Success: { label: "Berhasil", variant: "success" },
  Failed: { label: "Gagal", variant: "destructive" },
};

export function StatusBadge({ status, kind = "generic" }: { status: string; kind?: "health" | "generic" }) {
  const cfg =
    kind === "health"
      ? HEALTH[status as CreatorHealth] ?? { label: status, variant: "secondary" as Variant }
      : GENERIC[status] ?? { label: status, variant: "secondary" as Variant };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function StatusLabel({ status, kind = "generic" }: { status: string; kind?: "health" | "generic" }) {
  const cfg =
    kind === "health"
      ? HEALTH[status as CreatorHealth]
      : GENERIC[status];
  return <span>{cfg?.label ?? status}</span>;
}
