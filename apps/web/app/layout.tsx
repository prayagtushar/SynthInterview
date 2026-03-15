import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import StructuredData from "@/components/seo/StructuredData";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SynthInterview — Objective AI Technical Interviews",
  description:
    "Eliminate bias in technical hiring with SynthInterview's AI-powered coding interviews. Get objective assessments, live code analysis, and fraud detection at scale.",
  keywords: [
    "AI coding interview",
    "technical interview AI",
    "objective technical assessment",
    "bias-free hiring",
    "automated coding interview",
    "real-time code analysis",
    "technical screening tool",
    "engineering hiring software",
    "remote technical interviews",
    "developer assessment platform",
  ],
  openGraph: {
    title: "SynthInterview — Objective AI Technical Interviews",
    description:
      "Eliminate bias in technical hiring with SynthInterview's AI-powered coding interviews. Get objective assessments, live code analysis, and fraud detection at scale.",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "SynthInterview AI Technical Interview Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SynthInterview — Objective AI Technical Interviews",
    description:
      "Eliminate bias in technical hiring with SynthInterview's AI-powered coding interviews.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-black text-white selection:bg-white selection:text-black`}
      >
        <link rel="manifest" href="/site.webmanifest" />
        <div className="noise" />
        <div className="grid-bg" />
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
