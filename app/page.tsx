import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { CapabilityStrip } from "@/components/landing/capability-strip";
import { ProblemSection } from "@/components/landing/problem-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { UseCasesSection } from "@/components/landing/use-cases";
import { SecuritySection } from "@/components/landing/security-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Agency OS — Operating System for TikTok Commerce Agencies",
  description:
    "Run your TikTok Commerce Agency from one workspace. Manage creators, brands, campaigns, content, LIVE operations, tasks, and finances in one centralized operating system.",
  openGraph: {
    title: "Agency OS — TikTok Commerce Agency Operating System",
    description:
      "Manage creators, brands, campaigns, content, LIVE operations, tasks, and finances in one centralized workspace.",
    type: "website",
  },
};

export default async function LandingPage() {
  // Non-blocking read of active session to customize CTAs for signed-in users
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-brand selection:text-brand-foreground">
      <LandingNavbar user={user} />
      <main id="main-content" className="flex-1">
        <LandingHero user={user} />
        <CapabilityStrip />
        <ProblemSection />
        <FeaturesSection />
        <ProductShowcase />
        <HowItWorks />
        <UseCasesSection />
        <SecuritySection />
        <FaqSection />
        <CtaSection user={user} />
      </main>
      <LandingFooter />
    </div>
  );
}
