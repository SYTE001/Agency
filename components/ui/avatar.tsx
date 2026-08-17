import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

const palette = [
  "bg-indigo-950/90",
  "bg-zinc-700",
  "bg-emerald-800",
  "bg-amber-800",
  "bg-sky-800",
  "bg-violet-800",
  "bg-teal-800",
  "bg-rose-800",
];

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn("h-8 w-8 rounded-full object-cover", className)} />;
  }
  const color = palette[(name.charCodeAt(0) || 0) % palette.length];
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
        color,
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
