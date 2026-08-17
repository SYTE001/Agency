import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/authorization";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskForm, type RelatedOption } from "@/components/tasks/task-form";

export default async function NewTaskPage() {
  const user = await requireUser();
  if (!can(user.role, "task", "write")) notFound();

  const [users, creators, brands, campaigns, contents, lives] = await Promise.all([
    prisma.user.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.creator.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 100,
    }),
    prisma.brand.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.campaign.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.contentItem.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.liveSession.findMany({
      where: { agencyId: user.agencyId },
      select: { id: true, room: true },
      orderBy: { startTime: "desc" },
      take: 100,
    }),
  ]);

  const relatedOptions: RelatedOption[] = [
    ...creators.map((c) => ({ value: `Creator:${c.id}`, label: `Creator — ${c.displayName}` })),
    ...brands.map((b) => ({ value: `Brand:${b.id}`, label: `Brand — ${b.name}` })),
    ...campaigns.map((c) => ({ value: `Campaign:${c.id}`, label: `Campaign — ${c.name}` })),
    ...contents.map((c) => ({ value: `Content:${c.id}`, label: `Konten — ${c.title}` })),
    ...lives.map((l) => ({ value: `LiveSession:${l.id}`, label: `LIVE — ${l.room ?? l.id}` })),
  ];

  return (
    <div className="space-y-4 p-6">
      <PageHeader
        title="Task Baru"
        description="Buat task operasional dan kaitkan ke creator, brand, campaign, konten, atau LIVE."
      />
      <Card>
        <CardHeader>
          <CardTitle>Detail Task</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm users={users} relatedOptions={relatedOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
