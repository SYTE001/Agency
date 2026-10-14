const specs = [
  {
    title: "Tenant Isolation",
    body: "Every record — creator, brand, campaign, commission — is scoped by",
    code: "agencyId",
    tail: ". Cross-tenant access is blocked at the database level.",
    icon: (
      <path
        d="M12 3l8 3v6c0 4.4-3.4 8-8 9-4.6-1-8-4.6-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Server-Side RBAC",
    body: "Eight distinct roles, Owner to Viewer. Permissions validated on the server for every read, mutation, and server action.",
    icon: (
      <>
        <rect x="4" y="9" width="16" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 9V7a4 4 0 118 0v2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="14.5" r="1.6" fill="currentColor" />
      </>
    ),
  },
  {
    title: "Cryptographic Sessions",
    body: "Pinned HMAC-SHA256 JWT in httpOnly cookies. Issuer and audience verified on every request; roles re-read from the database.",
    icon: (
      <>
        <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 12h9m-3-3v3m-3-3v3m6-3v6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    title: "Password Security",
    body: "Salted scrypt hashing protects all credentials. Plain text is never stored or logged — anywhere.",
    icon: (
      <>
        <path
          d="M6 11V8a6 6 0 1112 0v3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <rect x="4" y="11" width="16" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M10 15.5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Relational Schema",
    body: "PostgreSQL with strict foreign keys, Decimal-precision money values, and indexed query paths throughout.",
    icon: (
      <>
        <ellipse cx="12" cy="6" rx="8" ry="3" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </>
    ),
  },
  {
    title: "Timezone Engine",
    body: "All operational dates, studio shifts, and GMV reports render consistently in your agency's designated timezone.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 7v5l3.5 2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
];

export function SecuritySection() {
  return (
    <section className="security dark2" id="security">
      <div className="noise" aria-hidden="true" />
      <div className="container">
        <div className="sec-head reveal">
          <h2>
            Built on verifiable
            <br />
            <em>engineering foundations</em>.
          </h2>
          <p className="sec-sub sec-sub--light">
            Strict tenant isolation, cryptographic session management, and server-side authorization
            — protecting client contracts and financial records.
          </p>
        </div>

        <div className="sec-grid">
          {specs.map((spec) => (
            <article key={spec.title} className="sec-card reveal" data-tilt>
              <i>
                <svg viewBox="0 0 24 24" fill="none">
                  {spec.icon}
                </svg>
              </i>
              <h3>{spec.title}</h3>
              <p>
                {spec.body}
                {spec.code ? <code>{spec.code}</code> : null}
                {spec.tail ?? ""}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
