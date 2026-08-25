import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { CapabilityStatement } from "@/components/landing/capability-statement";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCases } from "@/components/landing/use-cases";
import { SecuritySection } from "@/components/landing/security-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Agency OS — One workspace for your TikTok commerce agency",
  description:
    "Creators, brands, campaigns, content deliverables, LIVE operations, tasks, and finance in a single system. Built specifically for TikTok Shop agencies.",
  openGraph: {
    title: "Agency OS — Run Your TikTok Commerce Agency From One Workspace",
    description:
      "Manage creators, brands, campaigns, LIVE studio operations, and finance in one centralized operating system.",
    type: "website",
  },
};

export default async function LandingPage() {
  // Read active session for session-aware CTA routing (/overview vs /login)
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-brand selection:text-brand-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-50 focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-md"
      >
        Skip to content
      </a>

      <Navbar user={user} />

      <main id="main-content" className="flex-1">
        <Hero user={user} />
        <CapabilityStatement />
        <ProblemSection />
        <FeaturesSection />
        <ProductShowcase />
        <HowItWorks />
        <UseCases />
        <SecuritySection />
        <FaqSection />
        <CtaSection user={user} />
      </main>

      <Footer />
    </div>
  );
}
