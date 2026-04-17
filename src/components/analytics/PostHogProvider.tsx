"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// PostHog is loaded via CDN script to avoid bundle size impact.
// Set NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST in .env.local.
declare global {
  interface Window {
    posthog?: {
      init: (key: string, options: Record<string, unknown>) => void;
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

interface PostHogProviderProps {
  apiKey: string;
  apiHost?: string;
}

export function PostHogPageView({ apiKey, apiHost }: PostHogProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialise on first mount
  useEffect(() => {
    if (!apiKey || typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = `${apiHost ?? "https://eu.i.posthog.com"}/static/array.js`;
    script.async = true;
    script.onload = () => {
      window.posthog?.init(apiKey, {
        api_host: apiHost ?? "https://eu.i.posthog.com",
        capture_pageview: false, // manual below
        persistence: "localStorage",
        respect_dnt: true,
      });
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Track page views on navigation
  useEffect(() => {
    if (!pathname) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.posthog?.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
