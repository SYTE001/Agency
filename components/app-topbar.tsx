import { Bell, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";

export function AppTopbar({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Kreatif Nusantara</span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Agency OS
        </span>
      </div>

      <div className="flex items-center gap-1">
        <CommandPalette />
        <Button variant="ghost" size="icon" aria-label="Notifikasi">
          <Bell />
        </Button>
        <ThemeToggle />
        <div className="ml-2 flex items-center gap-2.5 border-l pl-3">
          <Avatar name={user.name} />
          <div className="hidden leading-tight sm:block">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</div>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="icon" type="submit" aria-label="Keluar">
              <LogOut />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
