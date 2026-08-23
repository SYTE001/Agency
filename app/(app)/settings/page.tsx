import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/constants";
import { listAgencyUsers } from "@/lib/services/users";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SettingsNav } from "@/components/settings/settings-nav";
import { formatDate } from "@/lib/format";

export default async function SettingsTeamPage() {
  const user = await requireUser();
  if (!can(user.role, "setting", "read")) {
    return (
      <div className="p-6">
        <EmptyState title="Tidak ada akses" description="Role Anda tidak memiliki akses ke pengaturan." />
      </div>
    );
  }

  const members = await listAgencyUsers(user.agencyId);
  const canManage = can(user.role, "setting", "write");

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Settings"
        description="Kelola tim, role, integrasi, dan pengaturan agensi"
      >
        {canManage ? (
          <Link
            href="/settings/users/new"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Anggota
          </Link>
        ) : null}
      </PageHeader>

      <SettingsNav active="team" />

      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold">
            Anggota Team <span className="font-normal text-muted-foreground">({members.length})</span>
          </p>
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.name}
                    {m.id === user.id ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(Anda)</span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.title ? ` · ${m.title}` : ""} · bergabung {formatDate(m.createdAt)}
                  </p>
                </div>
                <Badge variant={m.role === "owner" || m.role === "admin" ? "brand" : "secondary"}>
                  {ROLE_LABELS[m.role as Role] ?? m.role}
                </Badge>
                {canManage && !(m.role === "owner" && user.role !== "owner") ? (
                  <Link
                    href={`/settings/users/${m.id}`}
                    className="inline-flex h-8 items-center justify-center rounded-md border bg-card px-3 text-xs font-medium transition-colors hover:bg-accent"
                  >
                    Kelola
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Anggota baru dibuat oleh Owner/Admin dengan password awal. Role berlaku langsung —
            sesi selalu membaca role terkini dari basis data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
