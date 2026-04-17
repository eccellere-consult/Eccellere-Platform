import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Case Studies | Eccellere",
  description:
    "Real-world results: how Eccellere helped MSMEs and startups transform with strategy, AI, and structured frameworks.",
};

const placeholderCases = [
  {
    title: "Scaling a Mid-Size Manufacturer with Agentic AI",
    sector: "Manufacturing",
    outcome: "32% reduction in planning cycle time",
    description:
      "A 200-crore contract manufacturer integrated AI-driven demand forecasting and MES integration, cutting planning overhead significantly.",
  },
  {
    title: "D2C Brand Doubles Repeat Purchase Rate",
    sector: "Consumer Products",
    outcome: "2.1× repeat purchase rate in 6 months",
    description:
      "Eccellere revamped the brand's CX, loyalty mechanics, and supply-chain visibility to drive sustained retention improvement.",
  },
  {
    title: "Retail Chain Transformation Across 80 Outlets",
    sector: "Retail",
    outcome: "18% gross margin improvement",
    description:
      "A regional retail chain adopted dynamic pricing, regional assortment planning, and store-level dashboards built on the Eccellere platform.",
  },
];

export default function CaseStudiesPage() {
  return (
    <>
      <Header />
      <main className="pt-[72px]">
        {/* Hero */}
        <section className="bg-eccellere-ink py-20 text-white">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.15em] text-eccellere-gold">
              Case Studies
            </p>
            <h1 className="mb-4 font-display text-4xl font-semibold md:text-5xl">
              Results That Speak
            </h1>
            <p className="max-w-2xl text-lg text-white/70">
              Real impact delivered to MSMEs and growth-stage companies across
              Manufacturing, Retail, Consumer Products, and Logistics.
            </p>
          </div>
        </section>

        {/* Case cards */}
        <section className="py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {placeholderCases.map((c) => (
                <div
                  key={c.title}
                  className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="w-fit rounded-full bg-gold-pale px-3 py-1 text-xs font-medium text-eccellere-gold">
                    {c.sector}
                  </span>
                  <h2 className="font-display text-xl font-semibold text-eccellere-ink">
                    {c.title}
                  </h2>
                  <p className="text-sm font-semibold text-eccellere-gold">
                    {c.outcome}
                  </p>
                  <p className="text-sm leading-relaxed text-ink-mid">
                    {c.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Coming soon note */}
            <div className="mt-16 rounded-lg border border-dashed border-stone-300 bg-stone-50 py-12 text-center">
              <p className="mb-2 text-sm font-medium text-ink-mid">
                More detailed case studies coming soon
              </p>
              <p className="mb-6 text-sm text-stone-500">
                Want to see how we can create results like these for your
                business?
              </p>
              <Button asChild>
                <Link href="/contact?type=call">Book a Discovery Call</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
