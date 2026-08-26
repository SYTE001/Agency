import type { Metadata } from "next";
import { Manrope, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
  title: "Agency OS",
  description: "Operating system for TikTok commerce agencies.",
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
