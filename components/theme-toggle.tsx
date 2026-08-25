"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

// `className` is optional and additive: the app chrome renders the default 36px
// icon button, while the public footer passes a larger size to meet the 44px
// pointer-target guideline. Callers that pass nothing are unaffected.
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Ganti tema"
      className={cn(className)}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
