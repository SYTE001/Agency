import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  /**
   * "full" renders the full Agency OS logo (mark + typography).
   * "mark" renders just the dual-tone blue "A" icon.
   */
  variant?: "full" | "mark";
  /**
   * "auto" adapts full logo to light/dark mode via CSS.
   * "light" forces dark text (for light backgrounds).
   * "dark" forces white text (for dark backgrounds).
   */
  theme?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
  alt?: string;
}

export function BrandLogo({
  variant = "full",
  theme = "auto",
  className,
  priority = false,
  alt = "Agency OS",
}: BrandLogoProps) {
  if (variant === "mark") {
    return (
      <Image
        src="/logo-mark.png"
        alt={alt}
        width={130}
        height={100}
        priority={priority}
        className={cn("h-7 w-auto shrink-0 object-contain", className)}
      />
    );
  }

  if (theme === "dark") {
    return (
      <Image
        src="/logo-white.png"
        alt={alt}
        width={594}
        height={101}
        priority={priority}
        className={cn("h-7 w-auto shrink-0 object-contain", className)}
      />
    );
  }

  if (theme === "light") {
    return (
      <Image
        src="/logo.png"
        alt={alt}
        width={594}
        height={101}
        priority={priority}
        className={cn("h-7 w-auto shrink-0 object-contain", className)}
      />
    );
  }

  // theme === "auto" -> switches automatically via CSS rules
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/logo.png"
        alt={alt}
        width={594}
        height={101}
        priority={priority}
        className="brand-logo-light h-full w-auto shrink-0 object-contain"
      />
      <Image
        src="/logo-white.png"
        alt={alt}
        width={594}
        height={101}
        priority={priority}
        className="brand-logo-dark h-full w-auto shrink-0 object-contain"
      />
    </span>
  );
}

export function BrandMark({
  className,
  priority = false,
  alt = "Agency OS",
}: {
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <Image
      src="/logo-mark.png"
      alt={alt}
      width={130}
      height={100}
      priority={priority}
      className={cn("h-6 w-auto shrink-0 object-contain", className)}
    />
  );
}
