"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="mx-auto max-w-[480px] py-20 text-center">
        <p className="mb-2 font-display text-[72px] font-semibold leading-none text-eccellere-gold">
          500
        </p>
        <h1 className="mb-3 font-display text-2xl font-semibold text-eccellere-ink">
          Something went wrong
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-ink-mid">
          An unexpected error occurred. Our team has been notified. You can try
          again or return to the homepage.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try Again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-stone-400">
            Error ID: <code>{error.digest}</code>
          </p>
        )}
      </div>
    </main>
  );
}
