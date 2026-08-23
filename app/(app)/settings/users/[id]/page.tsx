import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserEditForm } from "@/components/settings/user-form";

export default async function AgencyUserDetailPage(props: PageProps<"/settings/users/[id]">) {
  const user = await requireUser();
  if (!can(user.role, "setting", "read")) notFound();

  const { id } = await props.params;
  // Tenant-scoped read with an explicit safe field list — passwordHash never
  // crosses into the page tree.
  const member = await prisma.user.findFirst({
    where: { id, agencyId: user.agencyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      createdAt: true,
    },
  });
  if (!member) notFound();

  const canManage = can(user.role, "setting", "write");
  // Admins may open the page but only owners can modify owner accounts —
  // the same rule updateAgencyUser enforces server-side.
  const canEditThis = canManage && !(member.role === "owner" && user.role !== "owner");

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title={member.name}
        description={`${member.email}${member.title ? ` · ${member.title}` : ""} · bergabung ${formatDate(member.createdAt)}`}
      >
        <Badge variant={member.role === "owner" || member.role === "admin" ? "brand" : "secondary"}>
          {ROLE_LABELS[member.role as Role] ?? member.role}
        </Badge>
      </PageHeader>
      <SettingsNav active="team" />

      {canEditThis ? (
        <Card>
          <CardHeader>
            <CardTitle>Kelola Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            <UserEditForm member={member} />
            {member.id === user.id ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Role akun Anda sendiri tidak dapat diubah dari sini.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            {canManage
              ? "Hanya Owner yang dapat mengubah akun Owner."
              : "Role Anda tidak memiliki izin mengelola anggota."}
          </CardContent>
        </Card>
      )}

      <Link href="/settings" className="inline-block text-sm text-brand hover:underline">
        ← Kembali ke Team
      </Link>
    </div>
  );
}
