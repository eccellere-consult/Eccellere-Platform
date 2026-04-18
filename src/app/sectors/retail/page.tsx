import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingBag, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Retail — Eccellere",
  description:
    "Expert consulting for Indian retailers. Omnichannel strategy, inventory optimisation, customer experience, and AI-driven retail transformation.",
};

const challenges = [
  {
    title: "Omnichannel Strategy",
    description:
      "Integrate your offline and online channels seamlessly — from store operations to e-commerce to quick commerce — with a unified customer view.",
  },
  {
    title: "Inventory Optimisation",
    description:
      "Reduce dead stock, improve fill rates, and build demand-driven replenishment systems that cut working capital by up to 20%.",
  },
  {
    title: "Customer Experience Design",
    description:
      "Map every touchpoint, eliminate friction, and design retail experiences that drive loyalty and repeat purchase in India's competitive market.",
  },
  {
    title: "Category Management",
    description:
      "Rationalise your SKU portfolio, improve planograms, and optimise space productivity using data-driven category strategies.",
  },
  {
    title: "Digital & AI Transformation",
    description:
      "Implement demand forecasting, personalisation engines, and smart pricing to compete with the largest retailers in the country.",
  },
  {
    title: "Store Expansion & Franchise",
    description:
      "Build scalable playbooks for new store openings, franchise models, and tier-2/3 city expansion with proven retail frameworks.",
  },
];

const frameworks = [
  "Omnichannel Readiness Assessment",
  "Retail Inventory Optimisation Toolkit",
  "Customer Journey Mapping Framework",
  "Planogram & Space Management Guide",
  "Franchise Operations Playbook",
  "Retail KPI Dashboard Template",
  "Demand Forecasting Starter Kit",
  "Store-Level P&L Framework",
];

const outcomes = [
  "15–25% reduction in inventory carrying costs",
  "10–20% improvement in same-store sales",
  "NPS improvement of 20+ points",
  "30% faster new store opening process",
  "Shrinkage reduction of 35%+",
];

export default function RetailSectorPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-[120px]">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-eccellere-gold" strokeWidth={1.5} />
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                Sector Focus
              </p>
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(36px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
              Retail{" "}
              <span className="italic">consulting for India</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-light text-white/50">
              52 proven frameworks. Specialists who have led transformations at
              India&apos;s top retail chains and D2C brands.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/marketplace?sector=Retail">Browse Frameworks</Link>
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
              The challenges retailers face
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
                  52 Frameworks
                </p>
                <h3 className="mt-3 font-display text-2xl font-light">
                  Popular retail toolkits
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
                    <Link href="/marketplace?sector=Retail">View all frameworks →</Link>
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
              Ready to transform your{" "}
              <span className="italic">retail business?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-mid">
              Start with a free diagnostic call. Our retail specialists will
              identify your top 3 opportunities within 30 minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/contact">Book a Free Diagnostic</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/marketplace?sector=Retail">Browse Frameworks</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
