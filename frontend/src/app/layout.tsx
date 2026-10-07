import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "SkillShift — Find the right skills",
    template: "%s · SkillShift",
  },
  description:
    "SkillShift connects clients with skilled freelancers for quality, project-based work with protected payments.",
  openGraph: {
    type: "website",
    siteName: "SkillShift",
    title: "SkillShift — Find the right skills",
    description:
      "Browse services with clear pricing, order confidently, and pay only when the work lands.",
  },
  twitter: {
    card: "summary",
    title: "SkillShift — Find the right skills",
    description:
      "Browse services with clear pricing, order confidently, and pay only when the work lands.",
  },
};

export const viewport: Viewport = {
  themeColor: "#3f4fe0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-[10px] focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        <Navbar />
        <div id="main-content" className="flex-1">
          {children}
        </div>
        <Footer />
        <OfflineBanner />
      </body>
    </html>
  );
}
