import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { PostHogPageView } from "@/components/analytics/PostHogProvider";
import { Suspense } from "react";

// Fonts are bundled in the repo (latin subset) so builds never depend on Google Fonts.
const cormorant = localFont({
  variable: "--font-cormorant",
  src: [
    { path: "./fonts/CormorantGaramond.woff2", weight: "300 600", style: "normal" },
    { path: "./fonts/CormorantGaramond-Italic.woff2", weight: "300 600", style: "italic" },
  ],
  display: "swap",
});

const dmSans = localFont({
  variable: "--font-dm-sans",
  src: [{ path: "./fonts/DMSans.woff2", weight: "300 500", style: "normal" }],
  display: "swap",
});

const jetbrainsMono = localFont({
  variable: "--font-jetbrains-mono",
  src: [{ path: "./fonts/JetBrainsMono.woff2", weight: "400", style: "normal" }],
  display: "swap",
});

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://eccellere.co.in/#organization",
      name: "Eccellere Consulting",
      url: "https://eccellere.co.in",
      logo: {
        "@type": "ImageObject",
        url: "https://eccellere.co.in/logo.png",
      },
      description:
        "Eccellere+ is the advanced solution for deeper industry and function specific strategic planning and operations assets: frameworks, toolkits and tools built for real operating decisions.",
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
      "@id": "https://eccellere.co.in/#website",
      url: "https://eccellere.co.in",
      name: "Eccellere+",
      alternateName: "Eccellere Plus",
      description:
        "The advanced solution for deeper industry and function specific strategic planning and operations assets.",
      publisher: { "@id": "https://eccellere.co.in/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://eccellere.co.in/marketplace?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Eccellere+ — Industry and function specific strategy and operations assets",
    template: "%s | Eccellere+",
  },
  description:
    "Eccellere+ is the advanced solution for deeper industry and function specific strategic planning and operations assets: frameworks, toolkits and tools for Manufacturing, Retail, Consumer Products, Logistics and more.",
  keywords: [
    "MSME consulting",
    "consulting for growing organisations",
    "Agentic AI",
    "strategy consulting India",
    "manufacturing consulting",
    "retail transformation",
    "logistics consulting",
    "business frameworks",
    "Eccellere",
    "Eccellere+",
    "industry specific strategy",
    "functional operations assets",
  ],
  metadataBase: new URL("https://eccellere.co.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://eccellere.co.in",
    siteName: "Eccellere+",
    title: "Eccellere+ — Industry and function specific strategy and operations assets",
    description:
      "Deeper industry and function specific strategic planning and operations assets, frameworks and toolkits.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eccellere+ — Industry and function specific strategy and operations assets",
    description:
      "Deeper industry and function specific strategic planning and operations assets, frameworks and toolkits.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      "msvalidate.01": process.env.BING_SITE_VERIFICATION || "",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
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
