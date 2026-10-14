import Link from "next/link";

const footNav = [
  { href: "#workspace", label: "Workspace" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#workflow", label: "Workflow" },
  { href: "#security", label: "Security" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-foot">
      <div className="container">
        <div className="foot-top">
          <Link className="foot-brand" href="#top">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="26" height="7" rx="2.6" fill="#1463FF" />
              <rect x="3" y="14.2" width="19" height="6.4" rx="2.6" fill="#21DDFF" />
              <rect x="3" y="22.6" width="12" height="6" rx="2.6" fill="#7214FF" opacity=".9" />
            </svg>
            TikTok Shop HQ<b className="dot-blue">.</b>
          </Link>
          <nav className="foot-nav" aria-label="Footer">
            {footNav.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <Link href="/login">Login</Link>
          </nav>
        </div>
        <div className="foot-bottom">
          <span>
            © {year} TikTok Shop Agency Management — landing redesign, single-file edition.
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
