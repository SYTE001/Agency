const items = [
  "Creator Rosters",
  "Brand Briefs",
  "Campaign GMV",
  "LIVE Shifts",
  "Payout Queues",
  "Tiered Commissions",
];

export function Marquee() {
  return (
    <section className="marquee-sec" aria-label="Capabilities ticker">
      <div className="marquee reveal">
        <div className="marquee-track">
          {items.map((item) => (
            <span key={item}>
              {item} <b>●</b>
            </span>
          ))}
          {items.map((item) => (
            <span key={`dup-${item}`} aria-hidden="true">
              {item} <b>●</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
