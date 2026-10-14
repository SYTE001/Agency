const cards = [
  {
    num: "01",
    tag: "MASTER DATA",
    title: "Creator & Brand Directory",
    body: "Centralize your creator roster and client brand relationships — tier categories, health indicators, platform handles, and assigned talent managers in one directory.",
    className: "cap-card--purple",
    checks: [
      "Creator health & tier classification",
      "Assigned talent manager ownership",
      "Brand profiles & product catalogs",
      "Historical GMV contribution per creator",
    ],
  },
  {
    num: "02",
    tag: "EXECUTION",
    title: "Campaign & Content Pipeline",
    body: "Drive brand campaigns end-to-end: link creator rosters to briefs, pace GMV targets against live sales, and manage script reviews and video deliverables.",
    className: "cap-card--blue",
    checks: [
      "Campaign GMV target vs actual pacing",
      "Multi-creator assignment and briefing",
      "Script approval and revision workflows",
      "Publishing deadlines & deliverable status",
    ],
  },
  {
    num: "03",
    tag: "STUDIO OPS",
    title: "LIVE Commerce Scheduling",
    body: "Coordinate physical studio rooms, host creator shifts and stream operators — then track session GMV fulfillment in real time, agency-wide.",
    className: "cap-card--pink",
    checks: [
      "Studio room reservation and availability",
      "Host creator and stream operator shifts",
      "Live GMV target and actual fulfillment",
      "Agency timezone-synchronized calendar",
    ],
  },
  {
    num: "04",
    tag: "FINANCIAL ENGINE",
    title: "Automated Commissions & Settlements",
    body: "No more spreadsheet math. Commission splits compute from verified campaign and LIVE GMVs, payout batches queue for approval, brand invoices reconcile.",
    className: "cap-card--amber",
    checks: [
      "Multi-tier contract commission formulas",
      "Batch creator payout approval queues",
      "Brand settlement ledger & invoice tracking",
      "Full audit trail for agency accounting",
    ],
  },
];

export function CapabilitiesSection() {
  return (
    <section className="caps" id="capabilities">
      <div className="noise" aria-hidden="true" />
      <div className="container">
        <div className="sec-head reveal">
          <h2>
            Engineered for <em>high-velocity</em>
            <br />
            agency execution.
          </h2>
          <p className="sec-sub">
            Four core modules connected to one database — replacing fragmented spreadsheets and
            disjointed handoffs.
          </p>
        </div>

        <div className="caps-grid">
          {cards.map((card) => (
            <article
              key={card.num}
              className={`cap-card ${card.className} reveal`}
              data-tilt
            >
              <div className="cap-header">
                <span className="cap-num">{card.num}</span>
                <span className="cap-sep" aria-hidden="true" />
                <span className="cap-title">{card.tag}</span>
                <span className="cap-line" aria-hidden="true" />
                <span className="cap-badge" aria-hidden="true">
                  <svg width="44" height="12" viewBox="0 0 44 12" fill="none">
                    <defs>
                      <linearGradient id={`cap-trail-${card.num}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points="3,12 9,0 15,0 9,12" fill="currentColor" />
                    <polygon points="9,12 15,0 44,0 44,12" fill={`url(#cap-trail-${card.num})`} />
                  </svg>
                </span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <ul className="check-list">
                {card.checks.map((check) => (
                  <li key={check}>
                    <i>✓</i>
                    {check}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
