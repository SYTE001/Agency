import Link from "next/link";
import type { CSSProperties } from "react";
import type { SessionUser } from "@/lib/auth";

export function Hero({ user }: { user: SessionUser | null }) {
  // Session-aware CTA: signed-in users jump straight into the app.
  const ctaHref = user ? "/overview" : "/login";
  const ctaLabel = user ? "Buka Dashboard" : "Masuk ke Workspace";

  return (
    <section className="hero" id="hero">
      <div className="noise" aria-hidden="true" style={{ opacity: ".4" }} />

      <div className="container hero-inner">
        <h1 className="hero-title reveal" style={{ "--d": "0ms" } as CSSProperties}>
          Run Your
          <svg className="h-ico" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="11" fill="#1463FF" />
            <path
              d="M20 10.5c.9 0 1.7.6 1.9 1.5l1 3.6h5.7a1.9 1.9 0 011.9 2.4l-2.3 8.6a3.4 3.4 0 01-3.3 2.6H15.1a3.4 3.4 0 01-3.3-2.6L9.5 18a1.9 1.9 0 011.9-2.4h5.7l1-3.6c.2-.9 1-1.5 1.9-1.5z"
              fill="#fff"
              opacity=".94"
            />
            <circle cx="16.4" cy="23.4" r="1.5" fill="#1463FF" />
            <circle cx="23.6" cy="23.4" r="1.5" fill="#1463FF" />
          </svg>
          TikTok Shop Agency
          <svg className="h-ico" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="11" fill="#F6285F" />
            <path
              d="M16.5 12.5c0-1.8 2-2.9 3.6-2L28 16.1c1.5.9 1.5 3 0 3.9l-7.9 5.6c-1.6 1.1-3.6 0-3.6-1.9V12.5z"
              fill="#fff"
            />
          </svg>
        </h1>

        <p className="hero-sub reveal" style={{ "--d": "160ms" } as CSSProperties}>
          Creator rosters, brand briefs, campaign execution, LIVE studio schedules, and
          commission payouts — managed in one operational system, not scattered spreadsheets.
        </p>

        <div className="hero-cta reveal" style={{ "--d": "240ms" } as CSSProperties}>
          <Link className="btn btn--primary" href={ctaHref}>
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
          <a className="btn btn--ghost" href="#capabilities">
            Explore capabilities
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14m-6-6 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
        <p className="hero-hint reveal" style={{ "--d": "300ms" } as CSSProperties}>
          tenant-isolated // 8-tier RBAC // WIB · WITA · WIT ready
        </p>

        {/* Ops widget */}
        <div className="hero-stage reveal" style={{ "--d": "360ms" } as CSSProperties}>
          <div className="ops-card">
            <div className="browser-bar">
              <span className="bdot" style={{ "--c": "#FF5F57" } as CSSProperties} />
              <span className="bdot" style={{ "--c": "#FEBC2E" } as CSSProperties} />
              <span className="bdot" style={{ "--c": "#28C840" } as CSSProperties} />
              <span className="baddr">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                hq.ttshop.app/dashboard
              </span>
            </div>
            <div className="ops-body">
              <div className="ops-strip">
                <strong>Today&rsquo;s Operations</strong>
                <span className="live-badge">
                  <i />
                  3 ROOMS LIVE
                </span>
              </div>
              <div className="ops-grid">
                <div className="stat-card" data-tilt>
                  <span className="sc-label">GMV Today</span>
                  <div className="sc-num">
                    Rp <span data-counter="128.4" data-decimals="1">0</span>
                    <small> jt</small>
                  </div>
                  <div className="sc-sub">
                    <span className="trend-up">▲ 12.4%</span> vs yesterday
                  </div>
                </div>
                <div className="stat-card" data-tilt>
                  <span className="sc-label">Active Creators</span>
                  <div className="sc-num">
                    <span data-counter="128">0</span>
                  </div>
                  <div className="sc-sub">across 4 tier categories</div>
                </div>
                <div className="stat-card" data-tilt>
                  <span className="sc-label">Payout Queue</span>
                  <div className="sc-num">
                    <span data-counter="12">0</span> <small>batches</small>
                  </div>
                  <div className="sc-sub">awaiting approval</div>
                </div>
              </div>
              <div className="room-row" data-tilt>
                <span className="room-id">A</span>
                <div className="room-info">
                  <strong>Studio Room A — Host: Nadia</strong>
                  <span>shift 19:00 – 21:00 WIB · operator: Raka</span>
                </div>
                <div className="gmv-bar">
                  <label>
                    <span>GMV FULFILLMENT</span>
                    <b>86%</b>
                  </label>
                  <div className="gmv-track">
                    <div className="gmv-fill" data-fill="86" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
