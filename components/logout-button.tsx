"use client";

import { useFormStatus } from "react-dom";
import { LogOut, Loader2 } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      variant="ghost"
      size="icon"
      type="submit"
      disabled={pending}
      aria-label={pending ? "Sedang keluar..." : "Keluar"}
      title={pending ? "Sedang keluar..." : "Keluar"}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </Button>
  );
}

export function LogoutButton() {
  const handleClearClient = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
    } catch {}
  };

  return (
    <form action={logout} onSubmit={handleClearClient}>
      <SubmitButton />
    </form>
  );
}
