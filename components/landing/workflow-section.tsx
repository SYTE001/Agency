const steps = [
  {
    num: "01",
    title: "Set up your workspace",
    body: "Name your agency, set operational timezone (WIB/WITA/WIT) and default currency, invite the team, configure role-based permissions.",
    className: "step--1",
    checks: [
      "Agency profile & timezone alignment",
      "8-tier RBAC role assignment",
      "Tenant-isolated relational database",
    ],
  },
  {
    num: "02",
    title: "Execute daily operations",
    body: "Onboard creator rosters and brand catalogs, link creators to campaign briefs, allocate studio rooms, assign stream operators.",
    className: "step--2",
    checks: [
      "Creator health & talent manager linkage",
      "Physical studio room & shift booking",
      "Content deliverables & review stages",
    ],
  },
  {
    num: "03",
    title: "Close and settle numbers",
    body: "Commissions compute automatically from recorded campaign and LIVE GMVs. Payout batches queue for approval, invoices reconcile.",
    className: "step--3",
    checks: [
      "Decimal precision calculations",
      "Batch creator payout approval queues",
      "Brand settlement invoice ledger",
    ],
  },
];

export function WorkflowSection() {
  return (
    <section className="workflow" id="workflow">
      <div className="container">
        <div className="sec-head reveal">
          <h2>
            Three steps,
            <br />
            <em>then it repeats</em>.
          </h2>
          <p className="sec-sub">
            A predictable cadence connecting talent managers, studio teams, and finance in one
            synchronized loop.
          </p>
        </div>

        <div className="steps">
          {steps.map((step) => (
            <article key={step.num} className={`step ${step.className} reveal`} data-tilt>
              <span className="step-num">{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <ul className="check-list">
                {step.checks.map((check) => (
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
