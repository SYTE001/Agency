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
      desc: "All operational dates, studio shifts, and GMV reports render consistently in your agency's designated timezone.",
      icon: Clock,
    },
  ];

  return (
    <section id="security" className="border-t border-[#e2ded6] dark:border-[#2f2e2a] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#706e66] dark:text-[#9e9c94]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5a1f]" />
            <span>Architecture &amp; Security</span>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#111111] dark:text-[#f5f4f0] sm:text-4xl lg:text-5xl">
            Built on verifiable engineering foundations.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
            Strict tenant isolation, cryptographic session management, and server-side authorization to protect client contracts and financial records.
          </p>
        </div>

        {/* 3-Column Architectural Spec Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {specs.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.term}
                className="flex flex-col justify-between border-t border-[#e2ded6] dark:border-[#2f2e2a] pt-6"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-[#ff5a1f]" />
                    <h3 className="text-sm font-bold text-[#111111] dark:text-[#f5f4f0]">{item.term}</h3>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#5a5852] dark:text-[#9e9c94]">
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
