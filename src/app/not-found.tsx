import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-144px)] items-center justify-center pt-[72px]">
        <div className="mx-auto max-w-[480px] px-6 py-20 text-center">
          <p className="mb-2 font-display text-[96px] font-semibold leading-none text-eccellere-gold">
            404
          </p>
          <h1 className="mb-3 font-display text-2xl font-semibold text-eccellere-ink">
            Page Not Found
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-ink-mid">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/">Go to Homepage</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
          <div className="mt-10 border-t pt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-stone-400">
              Popular Pages
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
              {[
                { label: "Services", href: "/services" },
                { label: "Marketplace", href: "/marketplace" },
                { label: "About", href: "/about" },
                { label: "Pricing", href: "/pricing" },
                { label: "Assessment", href: "/assessment" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-ink-mid transition-colors hover:text-eccellere-gold"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
