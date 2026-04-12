import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Eccellere — Strategy, AI & Consulting for India's MSMEs",
    template: "%s | Eccellere",
  },
  description:
    "India's premier consulting platform for MSMEs and startups. Strategy, Process Transformation, Agentic AI, and 200+ business frameworks for Manufacturing, Retail, Consumer Products & Logistics.",
  keywords: [
    "MSME consulting",
    "Agentic AI",
    "strategy consulting India",
    "manufacturing consulting",
    "retail transformation",
    "logistics consulting",
    "business frameworks",
    "Eccellere",
  ],
  metadataBase: new URL("https://eccellere.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://eccellere.in",
    siteName: "Eccellere Consulting",
    title: "Eccellere — Strategy, AI & Consulting for India's MSMEs",
    description:
      "Consulting, AI skills, and business toolkits — designed for MSMEs and startups that mean business.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eccellere — Strategy, AI & Consulting for India's MSMEs",
    description:
      "Consulting, AI skills, and business toolkits — designed for MSMEs and startups that mean business.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
