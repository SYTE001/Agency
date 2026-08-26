import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SecuritySection } from "@/components/landing/security-section";
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
    <div className="flex min-h-screen flex-col bg-[#f7f6f0] dark:bg-[#141412] text-[#111111] dark:text-[#f5f4f0] selection:bg-[#ff5a1f] selection:text-white transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-50 focus:border focus:border-[#111111] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-[#111111] focus:shadow-md"
      >
        Skip to content
      </a>

      <Navbar user={user} />

      <main id="main-content" className="flex-1">
        <Hero user={user} />
        <FeaturesSection />
        <HowItWorks />
        <SecuritySection />
        <CtaSection user={user} />
      </main>

      <Footer />
    </div>
  );
}
