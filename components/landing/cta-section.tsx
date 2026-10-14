import Link from "next/link";
import type { SessionUser } from "@/lib/auth";

const papers = [
  { className: "paper--ls", src: "/landing/paper-ls.jpg", parallax: "0.35" },
  { className: "paper--lb", src: "/landing/paper-lb.jpg", parallax: "0.2" },
  { className: "paper--rs", src: "/landing/paper-rs.jpg", parallax: "0.3" },
  { className: "paper--rb", src: "/landing/paper-rb.jpg", parallax: "0.16" },
];

export function CtaSection({ user }: { user: SessionUser | null }) {
  const ctaHref = user ? "/overview" : "/login";
  const ctaLabel = user ? "Buka Dashboard" : "Masuk ke Workspace";

  return (
    <section className="cta-band" id="deploy">
      <div className="noise" aria-hidden="true" />
      {papers.map((paper) => (
        <div
          key={paper.className}
          className={`paper ${paper.className}`}
          data-parallax={paper.parallax}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative parallax card */}
          <img className="paper-img" src={paper.src} alt="" />
        </div>
      ))}

      <div className="container center">
        <h2 className="reveal">
          Your agency workspace
          <br />
          is <em style={{ color: "#FFE56E", fontStyle: "normal" }}>ready</em>.
        </h2>
        <p className="sec-sub sec-sub--light reveal">
          Manage creator rosters, execute brand campaigns, schedule LIVE studio rooms, and automate
          commissions in one central operating system.
        </p>
        <Link className="btn btn--light reveal" href={ctaHref}>
          {ctaLabel}
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14m-6-6 6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
