import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { PostHogPageView } from "@/components/analytics/PostHogProvider";
import { Suspense } from "react";

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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://eccellere.in/#organization",
      name: "Eccellere Consulting",
      url: "https://eccellere.in",
      logo: {
        "@type": "ImageObject",
        url: "https://eccellere.in/logo.png",
      },
      description:
        "India's premier consulting platform for MSMEs and startups. Strategy, Process Transformation, Agentic AI, and 200+ business frameworks.",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
      sameAs: [
        "https://www.linkedin.com/company/eccellere",
        "https://twitter.com/eccellere",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://eccellere.in/#website",
      url: "https://eccellere.in",
      name: "Eccellere",
      description:
        "Strategy, AI & Consulting for India's MSMEs",
      publisher: { "@id": "https://eccellere.in/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://eccellere.in/marketplace?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-eccellere-gold focus:px-4 focus:py-2 focus:text-white focus:outline-none">
            Skip to content
          </a>
          {children}
          <ChatbotWidget />
          {process.env.NEXT_PUBLIC_POSTHOG_KEY && (
            <Suspense fallback={null}>
              <PostHogPageView
                apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
                apiHost={process.env.NEXT_PUBLIC_POSTHOG_HOST}
              />
            </Suspense>
          )}
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
