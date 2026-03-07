import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";

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
  title: "SynthInterview — Real-time AI Coding Interviewer",
  description:
    "Full technical coding interviews via voice and screen-share, powered by Gemini Live API. Watching your editor in real time, asking adaptive follow-ups.",
  keywords: [
    "AI coding interview",
    "technical interview AI",
    "Gemini Live API",
    "automated coding interview",
    "real-time editor monitoring",
  ],
  openGraph: {
    title: "SynthInterview — Real-time AI Coding Interviewer",
    description:
      "Full technical coding interviews via voice and screen-share, powered by Gemini Live API.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-black text-white selection:bg-white selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
