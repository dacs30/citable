import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppBackground } from "@/components/AppBackground";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Citable — Generative Engine Optimization Analyzer",
  description:
    "Analyze how well your website is optimized for AI search engines like ChatGPT, Perplexity, and Google AI Overviews.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppBackground />
        {/* Navbar sits above the content stacking context so nothing can paint over it */}
        <Navbar />
        {/* Content layer sits above the fixed background */}
        <TooltipProvider>
          <div style={{ position: "relative", zIndex: 1 }} className="flex flex-col min-h-screen">
            {children}
            <Footer />
          </div>
        </TooltipProvider>
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
