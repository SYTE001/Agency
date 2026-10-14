import Link from "next/link";
import type { SessionUser } from "@/lib/auth";

export function WorkspaceSection({ user }: { user: SessionUser | null }) {
  const ctaHref = user ? "/overview" : "/login";

  return (
    <section className="workspace dark" id="workspace">
      <div className="noise" aria-hidden="true" />
      <div className="container split">
        <div className="split-copy reveal">
          <h2>
            One workspace,
            <br />
            <em>zero handoff gaps</em>.
          </h2>
          <p className="lead">
            Creator management, campaign management, LIVE operations, and commission workflows —
            all connected to the same underlying database.
          </p>

          <div className="sub-feat">
            <i>
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M10 9.8c0-1.1 1.2-1.8 2.2-1.2l4 2.2a1.4 1.4 0 010 2.4l-4 2.2c-1 .6-2.2-.1-2.2-1.2v-4.4z"
                  fill="currentColor"
                />
              </svg>
            </i>
            <div>
              <strong>LIVE Studio Scheduling</strong>
              <p>
                Coordinate physical rooms, stream host shifts, and real-time TikTok LIVE GMV
                fulfillment across all creator shifts.
              </p>
            </div>
          </div>
          <div className="sub-feat">
            <i>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3v18m0-18c-2.8 0-5 1.6-5 4h10c0-2.4-2.2-4-5-4zM5 11c-1.7 1-3 2.8-3 5s1.3 4 3 5m14-10c1.7 1 3 2.8 3 5s-1.3 4-3 5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </i>
            <div>
              <strong>Automated Settlements</strong>
              <p>
                Automate creator commission splits, multi-tier formulas, batch payout approval
                queues, and client brand reconciliations.
              </p>
            </div>
          </div>

          <Link className="doc-link" href={ctaHref}>
            Open your workspace
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M7 17 17 7m0 0H9m8 0v8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>

        <div className="studio-board reveal" data-lift>
          <div className="sb-head">
            <strong>LIVE Studio Board</strong>
            <span className="tz">WIB · GMT+7 · sync&rsquo;d</span>
          </div>
          <div className="sb-rooms">
            <div className="sb-room is-live">
              <span className="seat">N</span>
              <div className="who">
                <strong>
                  Room A — Nadia{" "}
                  <span className="live-badge" style={{ marginLeft: "6px" }}>
                    <i />
                    LIVE
                  </span>
                </strong>
                <span>host · operator: Raka · 19:00–21:00</span>
              </div>
              <div className="gmv">
                <div className="gmv-bar">
                  <label>
                    <span>TARGET</span>
                    <b>86%</b>
                  </label>
                  <div className="gmv-track">
                    <div className="gmv-fill" data-fill="86" />
                  </div>
                </div>
              </div>
            </div>
            <div className="sb-room is-live">
              <span className="seat">D</span>
              <div className="who">
                <strong>
                  Room B — Dimas{" "}
                  <span className="live-badge" style={{ marginLeft: "6px" }}>
                    <i />
                    LIVE
                  </span>
                </strong>
                <span>host · operator: Salsa · 19:30–22:00</span>
              </div>
              <div className="gmv">
                <div className="gmv-bar">
                  <label>
                    <span>TARGET</span>
                    <b>64%</b>
                  </label>
                  <div className="gmv-track">
                    <div className="gmv-fill" data-fill="64" />
                  </div>
                </div>
              </div>
            </div>
            <div className="sb-room">
              <span className="seat">K</span>
              <div className="who">
                <strong>Room C — Keyla</strong>
                <span>next up · operator: Bram · 21:00–23:00</span>
              </div>
              <div className="gmv">
                <div className="gmv-bar">
                  <label>
                    <span>SCHEDULED</span>
                    <b>—</b>
                  </label>
                  <div className="gmv-track">
                    <div className="gmv-fill" data-fill="8" />
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
