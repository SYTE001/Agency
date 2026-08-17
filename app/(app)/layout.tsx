import { requireUser } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-subtle md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-foreground">
            KN
          </div>
          <span className="truncate text-sm font-semibold">Kreatif Nusantara</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <AppSidebar role={user.role} />
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
