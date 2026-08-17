import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import type { Role } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/constants";
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

  const members = await prisma.user.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Settings"
        description="Kelola tim, role, integrasi, dan pengaturan agensi"
      />

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
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Undang anggota baru melalui tombol “Undang Anggota” — tersedia setelah fitur undangan
            (email magic link) dirilis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
