"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckSquare,
  CornerDownLeft,
  Megaphone,
  Package,
  Radio,
  Search,
  User,
  Video,
} from "lucide-react";
import type { SearchGroup } from "@/lib/services/search";
import { cn } from "@/lib/utils";

const RESOURCE_ICON: Record<string, typeof User> = {
  creator: User,
  brand: Building2,
  campaign: Megaphone,
  product: Package,
  content: Video,
  live: Radio,
  task: CheckSquare,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  // ⌘K / Ctrl+K toggles from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Trigger — faux search input on desktop, icon on mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 w-60 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">Cari…</span>
        <kbd className="rounded border bg-background px-1 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cari"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
      >
        <Search className="size-4" />
      </button>

      {/* Mounted only while open, so it remounts fresh every time */}
      {open ? <PaletteDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  // Focus + scroll lock are one-time external-system syncs
  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const id = ++seq.current;
    setLoading(true);
    try {
      const res = await fetch(`/search?q=${encodeURIComponent(q)}`);
      if (id !== seq.current) return; // stale — a newer request supersedes
      if (!res.ok) {
        setGroups([]);
        return;
      }
      const data = (await res.json()) as { groups: SearchGroup[] };
      setGroups(data.groups);
      setActive(0);
    } catch {
      // network blip — keep the previous results
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, []);

  // Debounced search from the event, not an effect
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return; // reset happens in handleChange
    const t = setTimeout(() => runSearch(q), 200);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const handleChange = (v: string) => {
    setQuery(v);
    if (v.trim().length < 2) {
      setGroups([]);
      setLoading(false);
    }
  };

  const select = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const flat = useMemo(() => groups.flatMap((g) => g.results), [groups]);

  // Keep the highlighted row in view
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[active];
      if (item) select(item.href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const trimmed = query.trim();
  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Pencarian global">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 top-[12vh] mx-auto w-full max-w-xl px-4">
        <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
          {/* Input row */}
          <div className="flex items-center gap-2.5 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Cari creator, brand, campaign, produk, konten, LIVE, task…"
              aria-label="Cari global"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {loading ? (
              <span className="shrink-0 text-xs text-muted-foreground">Mencari…</span>
            ) : (
              <kbd className="shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                esc
              </kbd>
            )}
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
            {trimmed.length < 2 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Ketik minimal 2 karakter untuk mencari di semua modul.
              </p>
            ) : flat.length === 0 && !loading ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                Tidak ada hasil untuk <span className="font-medium text-foreground">“{trimmed}”</span>.
              </p>
            ) : (
              groups.map((g) => {
                const Icon = RESOURCE_ICON[g.resource] ?? Search;
                return (
                  <div key={g.resource} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {g.label}
                    </p>
                    {g.results.map((r) => {
                      runningIndex += 1;
                      const i = runningIndex;
                      return (
                        <button
                          key={`${g.resource}-${r.id}`}
                          type="button"
                          data-index={i}
                          onClick={() => select(r.href)}
                          onMouseEnter={() => setActive(i)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm",
                            i === active ? "bg-muted" : "hover:bg-muted/50",
                          )}
                        >
                          <Icon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{r.title}</span>
                            {r.subtitle ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {r.subtitle}
                              </span>
                            ) : null}
                          </span>
                          <CornerDownLeft
                            className={cn(
                              "size-3.5 shrink-0 text-muted-foreground",
                              i === active ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer hints */}
          {flat.length > 0 ? (
            <div className="flex items-center gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-medium">↑</kbd>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-medium">↓</kbd> navigasi
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-medium">↵</kbd> buka
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-medium">esc</kbd> tutup
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
