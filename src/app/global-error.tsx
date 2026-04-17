"use client";

import { useEffect } from "react";

// Global error boundary for the root layout.
// Captures uncaught errors and reports to Sentry when available.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry if available
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    }
    console.error("[GlobalError]", error); // intentional — global error boundary
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950 p-8">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Something went wrong
          </h1>
          <p className="mb-8 text-neutral-600 dark:text-neutral-400">
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span className="mt-2 block font-mono text-xs text-neutral-400">
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-[#c9a84c] px-8 py-3 text-sm font-medium text-white hover:bg-[#b8943d] transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
