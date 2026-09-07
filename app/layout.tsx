import type { Metadata } from "next";
import { Manrope, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";

const fontSans = Manrope({
  variable: "--font-sans-custom",
  subsets: ["latin"],
  display: "swap",
});

const fontDisplay = Outfit({
  variable: "--font-display-custom",
  subsets: ["latin"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono-custom",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${siteName} — TikTok Shop Agency Management`,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: `${siteName} — TikTok Shop Agency Management`,
    description: siteDescription,
    siteName,
    type: "website",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${siteName} preview` }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: `${siteName} — TikTok Shop Agency Management`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
