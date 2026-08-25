"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is Agency OS?",
      answer:
        "Agency OS is a specialized web-based operating system for TikTok Shop, Creator, and LIVE Commerce agencies. It centralizes talent rosters, brand campaigns, content pipelines, studio schedules, task collaboration, and financial commission calculations into a single workspace.",
    },
    {
      question: "Who is Agency OS for?",
      answer:
        "It is built for TikTok creator agencies, influencer talent management teams, live stream studio operators, and agency finance managers looking to replace scattered spreadsheets and messaging apps with an integrated operational platform.",
    },
    {
      question: "Do I need an account to explore the website?",
      answer:
        "No. The public marketing landing page and product specifications are freely accessible to all visitors without requiring an account or login.",
    },
    {
      question: "Do I need to log in to use Agency OS?",
      answer:
        "Yes. Authentication is required to access your agency's workspace, view confidential creator metrics, schedule live streams, and manage financial settlements.",
    },
    {
      question: "What can I manage inside Agency OS?",
      answer:
        "You can manage 10 core agency functions: Creator Rosters & Health, Brand Client Portfolios, Products, Campaign Execution & GMV Pacing, Content Review Pipelines, LIVE Studio Room Shifts, Task Coordination, Global Search, Business Intelligence Reports, and Finance (Commissions, Payouts, Settlements).",
    },
    {
      question: "Does Agency OS support multiple agencies?",
      answer:
        "Yes. Agency OS is engineered with a strict multi-tenant architecture. Every agency has an isolated workspace where all records, users, and transactions are strictly segregated by `agencyId`.",
    },
    {
      question: "How does role-based access work?",
      answer:
        "Each team member is assigned a specific role (Admin, Manager, Operator, Finance, or Viewer). Permissions are enforced server-side on every query and mutation, ensuring staff members only access modules relevant to their operational responsibilities.",
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 bg-card border-b border-border/70">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Frequently Asked Questions
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to know.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Clear, factual answers about Agency OS architecture, features, and access requirements.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 divide-y divide-border/70 border-y border-border/70">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const buttonId = `faq-btn-${idx}`;
            const panelId = `faq-panel-${idx}`;

            return (
              <div key={faq.question} className="py-4 sm:py-5">
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors"
                >
                  <span className="text-base font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-brand",
                    )}
                  />
                </button>

                {isOpen && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="mt-3 pr-6 text-sm text-muted-foreground leading-relaxed animate-in fade-in-10 duration-150"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
