import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { BrandLogo } from "@/components/brand-logo";

const footNav = [
  { href: "#workspace", label: "Workspace" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#workflow", label: "Workflow" },
  { href: "#security", label: "Security" },
];

export function Footer({ user }: { user?: SessionUser | null } = {}) {
  const year = new Date().getFullYear();
  const ctaHref = user ? "/overview" : "/login";
  const ctaLabel = user ? "Dashboard" : "Login";

  return (
    <footer className="site-foot">
      <div className="container">
        <div className="foot-top">
          <Link className="foot-brand" href="#top" aria-label="Agency OS">
            <BrandLogo variant="full" theme="dark" className="h-[26px] w-auto" />
          </Link>
          <nav className="foot-nav" aria-label="Footer">
            {footNav.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <Link href={ctaHref}>{ctaLabel}</Link>
          </nav>
        </div>
        <div className="foot-bottom">
          <span>
            © {year} Agency OS — TikTok Shop Agency Management.
          </span>
          <span className="foot-status">
            <span className="pulse-dot" />
            All systems humming
          </span>
        </div>
      </div>
    </footer>
  );
}
