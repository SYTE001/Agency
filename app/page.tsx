import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SecuritySection } from "@/components/landing/security-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "TikTok Shop Agency Management",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteName} — TikTok Shop Agency Management`,
    description: siteDescription,
    type: "website",
    url: "/",
    siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — TikTok Shop Agency Management`,
    description: siteDescription,
  },
};

export default async function LandingPage() {
  // Read active session for session-aware CTA routing (/overview vs /login)
  const user = await getSessionUser();
  const siteUrl = getSiteUrl();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      inLanguage: "id",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description: siteDescription,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-brand selection:text-brand-foreground transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-4 focus:z-50 focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:text-foreground focus:shadow-md"
      >
        Skip to content
      </a>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

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
