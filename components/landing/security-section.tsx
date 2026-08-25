import { Database, ShieldCheck, KeyRound, Lock, Server, Clock } from "lucide-react";

export function SecuritySection() {
  const specs = [
    {
      term: "Tenant Isolation",
      desc: "Every record — creator, brand, campaign, commission — is scoped by `agencyId`. Cross-tenant data access is blocked at the database level.",
      icon: Database,
    },
    {
      term: "Server-Side RBAC",
      desc: "Eight distinct roles (Owner to Viewer). Permissions are validated on the server for every read, mutation, and server action.",
      icon: ShieldCheck,
    },
    {
      term: "Cryptographic Sessions",
      desc: "Pinned HMAC-SHA256 JWT stored in httpOnly cookies. Issuer and audience verified on every request; roles are re-read from the database.",
      icon: KeyRound,
    },
    {
      term: "Password Security",
      desc: "Salted scrypt hashing protects all credentials. Plain text is never stored or logged.",
      icon: Lock,
    },
    {
      term: "Relational Schema",
      desc: "Engineered on PostgreSQL with strict foreign keys, Prisma Decimal precision, and indexed query paths.",
      icon: Server,
    },
    {
      term: "Timezone Engine",
      desc: "All operational dates, studio shifts, and GMV reports render in your agency's designated timezone.",
      icon: Clock,
    },
  ];

  return (
    <section className="border-b border-border/70 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Architecture & Security
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built on verifiable engineering foundations.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Strict tenant isolation, cryptographic session management, and server-side authorization to protect client contracts and financial records.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.term}
                className="flex flex-col justify-between border-t border-border/80 pt-6"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-brand" />
                    <h3 className="text-sm font-semibold text-foreground">{item.term}</h3>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
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
