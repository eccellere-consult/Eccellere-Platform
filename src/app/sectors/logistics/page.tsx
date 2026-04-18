import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Truck, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Logistics — Eccellere",
  description:
    "Expert consulting for Indian logistics businesses. Route optimisation, last-mile delivery, fleet management, and warehouse operations frameworks.",
};

const challenges = [
  {
    title: "Route Optimisation",
    description:
      "Reduce fuel costs, improve delivery density, and cut transit times with data-driven route planning and dynamic dispatching systems.",
  },
  {
    title: "Last-Mile Delivery",
    description:
      "Build scalable last-mile operations — whether in-house, 3PL, or crowdsourced — that meet India's growing consumer expectations.",
  },
  {
    title: "Fleet Management",
    description:
      "Optimise fleet utilisation, reduce maintenance downtime, and build driver productivity systems that lower cost-per-km.",
  },
  {
    title: "Warehouse Operations",
    description:
      "Design efficient warehouse layouts, implement WMS best practices, and achieve order accuracy rates above 99.5%.",
  },
  {
    title: "3PL & Network Design",
    description:
      "Evaluate and manage 3PL partners, design the optimal logistics network, and build SLA frameworks that protect your service levels.",
  },
  {
    title: "AI & Technology Adoption",
    description:
      "Implement predictive demand planning, IoT-based fleet tracking, and AI-driven delivery ETA systems to lead the next wave of logistics.",
  },
];

const frameworks = [
  "Route Planning Optimisation Toolkit",
  "Last-Mile Operations Playbook",
  "Fleet Utilisation Dashboard",
  "Warehouse Layout Design Guide",
  "3PL Evaluation & SLA Framework",
  "Freight Cost Benchmarking Tool",
  "Delivery KPI Scorecard",
  "Reverse Logistics Management Guide",
];

const outcomes = [
  "15–25% reduction in delivery cost per order",
  "20–30% improvement in fleet utilisation",
  "On-time delivery improvement to 95%+",
  "Warehouse throughput increase of 30%",
  "10–15% reduction in fuel costs",
];

export default function LogisticsSectorPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-[120px]">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-eccellere-gold" strokeWidth={1.5} />
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                Sector Focus
              </p>
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(36px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
              Logistics{" "}
              <span className="italic">consulting for India</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-light text-white/50">
              42 proven frameworks. Specialists with deep experience building
              logistics operations for India&apos;s fastest-growing companies.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/marketplace?sector=Logistics">Browse Frameworks</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                <Link href="/contact">Talk to a Specialist</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Challenges */}
        <section className="py-20 lg:py-[100px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              What We Solve
            </p>
            <h2 className="mt-4 font-display text-[clamp(28px,4vw,44px)] font-light text-eccellere-ink">
              The challenges logistics businesses face
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((c) => (
                <div key={c.title} className="rounded-lg border border-eccellere-ink/8 bg-white p-6 shadow-sm">
                  <h3 className="font-medium text-eccellere-ink">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mid">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section className="bg-gold-pale py-20 lg:py-[100px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 lg:items-center">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                  Outcomes
                </p>
                <h2 className="mt-4 font-display text-[clamp(28px,4vw,44px)] font-light text-eccellere-ink">
                  Results our clients achieve
                </h2>
                <ul className="mt-8 space-y-4">
                  {outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-eccellere-gold" />
                      <span className="text-eccellere-ink">{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-eccellere-ink p-8 text-eccellere-cream">
                <p className="font-mono text-xs uppercase tracking-widest text-eccellere-gold">
                  42 Frameworks
                </p>
                <h3 className="mt-3 font-display text-2xl font-light">
                  Popular logistics toolkits
                </h3>
                <ul className="mt-6 space-y-3">
                  {frameworks.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <ArrowRight className="h-3.5 w-3.5 text-eccellere-gold" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button asChild size="sm">
                    <Link href="/marketplace?sector=Logistics">View all frameworks →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-[100px]">
          <div className="mx-auto max-w-[1280px] px-6 text-center">
            <h2 className="font-display text-[clamp(28px,4vw,44px)] font-light text-eccellere-ink">
              Ready to optimise your{" "}
              <span className="italic">logistics operations?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-mid">
              Start with a free diagnostic call. Our logistics specialists will
              identify your top 3 cost-saving opportunities within 30 minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/contact">Book a Free Diagnostic</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/marketplace?sector=Logistics">Browse Frameworks</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
