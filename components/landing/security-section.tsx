import {
  ShieldCheck,
  Server,
  Lock,
  KeyRound,
  Database,
  UserCheck,
} from "lucide-react";

export function SecuritySection() {
  const specs = [
    {
      icon: Database,
      title: "Multi-Tenant Isolation",
      desc: "Every record (creators, brands, campaigns, finances) is bound to the agency workspace ID (`agencyId`) at the database layer.",
    },
    {
      icon: UserCheck,
      title: "Role-Based Access Control",
      desc: "Granular permissions for Owner/Admin, Talent Manager, Live Operator, Finance, and Viewer roles prevent unauthorized data exposure.",
    },
    {
      icon: KeyRound,
      title: "Pinned HMAC-SHA256 JWT Sessions",
      desc: "Tamper-resistant cryptographic session cookies with strict algorithm, issuer, and audience binding verified server-side.",
    },
    {
      icon: ShieldCheck,
      title: "Server-Side Authorization",
      desc: "Every data mutation and server action resolves the signed session user from the database and enforces RBAC rules prior to execution.",
    },
    {
      icon: Lock,
      title: "Argon2 / Secure Password Hashing",
      desc: "User credentials are protected using industry-standard salted password hashes, never stored or transmitted in plain text.",
    },
    {
      icon: Server,
      title: "Production PostgreSQL Schema",
      desc: "Engineered on relational PostgreSQL with foreign key integrity, indexed queries, and timezone-aware operational tracking.",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-subtle/30 border-b border-border/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Architecture & Reliability
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built on robust, verifiable engineering foundations.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Strict tenant isolation, cryptographic session management, and server-side authorization
            to ensure your agency's client and financial data remains secure.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-xs"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
