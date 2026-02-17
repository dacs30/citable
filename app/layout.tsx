import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { AppBackground } from "@/components/AppBackground";
import { Navbar } from "@/components/Navbar";
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
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
