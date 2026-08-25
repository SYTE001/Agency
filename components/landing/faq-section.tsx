"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Do I need an account to read this page?",
    answer:
      "No. This page is public. Everything past it requires an authenticated sign-in, because it manages a specific agency's creators, brand contracts, campaigns, and financial records.",
  },
  {
    question: "How do team members and talent get access?",
    answer:
      "Access is invite-only. An agency Owner or Admin creates team member accounts in Settings and assigns their specific RBAC role. Users then log in with their credentials.",
  },
  {
    question: "What can each role see and modify?",
    answer:
      "Agency OS supports 8 granular roles: Owner, Admin, Account Manager, Creator Manager, Campaign Manager, Live Manager, Finance, and Viewer. All permissions are verified on the server for every read and write operation.",
  },
  {
    question: "Can one installation host multiple agency workspaces?",
    answer:
      "Yes. Agency OS is engineered with multi-tenant architecture. Every business record carries its agencyId identifier, ensuring complete data isolation between agencies.",
  },
  {
    question: "What happens when an agency opens on day one?",
    answer:
      "The workspace initializes cleanly. You set your agency's operational timezone and currency, invite the team, and begin entering creators and brand partners. The dashboard reporting populates in real time as work is logged.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 border-b border-border/70 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Frequently Asked Questions
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Questions &amp; Answers.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Key operational details about workspace access, tenant isolation, and team roles.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="border-b border-border/80">
              {FAQS.map((faq, idx) => {
                const isOpen = openIndex === idx;
                const buttonId = `faq-btn-${idx}`;
                const panelId = `faq-panel-${idx}`;

                return (
                  <div key={faq.question} className="border-t border-border/80">
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="flex w-full items-baseline justify-between gap-6 py-6 text-left transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
                      >
                        <span className="text-base font-medium tracking-tight text-foreground sm:text-lg">
                          {faq.question}
                        </span>
                        <span
                          aria-hidden="true"
                          className="relative mt-1 h-4 w-4 shrink-0"
                        >
                          <span className="absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 rounded-full bg-foreground" />
                          <span
                            className={cn(
                              "absolute left-1/2 top-0 h-4 w-[1.5px] -translate-x-1/2 rounded-full bg-foreground transition-transform duration-200",
                              isOpen ? "rotate-90" : "rotate-0",
                            )}
                          />
                        </span>
                      </button>
                    </h3>

                    {isOpen && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        className="-mt-2 max-w-2xl pb-6 text-sm leading-relaxed text-muted-foreground sm:text-base"
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
