import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Consumer Products — Eccellere",
  description:
    "Expert consulting for Indian consumer goods brands. Brand building, D2C strategy, distribution networks, and innovation frameworks for FMCG and CPG.",
};

const challenges = [
  {
    title: "Brand Building & Positioning",
    description:
      "Define a compelling brand identity, sharpen your positioning, and build a brand architecture that scales across categories and geographies.",
  },
  {
    title: "D2C Strategy & Execution",
    description:
      "Launch or accelerate your direct-to-consumer channel with acquisition funnels, retention playbooks, and unit economics that actually work.",
  },
  {
    title: "Distribution Network Design",
    description:
      "Build the right channel mix — modern trade, general trade, e-commerce, and D2C — with distributor management and trade marketing frameworks.",
  },
  {
    title: "New Product Development",
    description:
      "Accelerate innovation with stage-gate processes, consumer research frameworks, and go-to-market playbooks proven in the Indian market.",
  },
  {
    title: "Pricing & Revenue Management",
    description:
      "Optimise pack-price architecture, implement promotional ROI tracking, and build pricing strategies that defend margins in competitive categories.",
  },
  {
    title: "Supply Chain & Co-Manufacturing",
    description:
      "Design resilient, cost-efficient supply chains with the right co-manufacturing partners, quality standards, and logistics networks.",
  },
];

const frameworks = [
  "Brand Positioning Workshop Toolkit",
  "D2C Launch Playbook",
  "Distributor Evaluation Matrix",
  "Stage-Gate NPD Framework",
  "Pack-Price Architecture Tool",
  "Trade Marketing ROI Calculator",
  "Consumer Insight Research Guide",
  "GTM Launch Checklist",
];

const outcomes = [
  "Brand awareness uplift of 30%+ in 6 months",
  "D2C channel contributing 20–40% of revenue",
  "25% reduction in distribution costs",
  "60% faster new product launch cycle",
  "Gross margin improvement of 3–5 points",
];

export default function ConsumerProductsSectorPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-[120px]">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-eccellere-gold" strokeWidth={1.5} />
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                Sector Focus
              </p>
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(36px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
              Consumer Products{" "}
              <span className="italic">consulting for India</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-light text-white/50">
              48 proven frameworks. Specialists from India&apos;s top FMCG and D2C
              brands who know what it takes to build and scale consumer products.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/marketplace?sector=Consumer+Products">Browse Frameworks</Link>
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
              The challenges consumer brands face
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
                  48 Frameworks
                </p>
                <h3 className="mt-3 font-display text-2xl font-light">
                  Popular consumer products toolkits
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
                    <Link href="/marketplace?sector=Consumer+Products">View all frameworks →</Link>
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
              Ready to grow your{" "}
              <span className="italic">consumer brand?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-mid">
              Start with a free diagnostic call. Our specialists will identify
              your top 3 growth opportunities within 30 minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/contact">Book a Free Diagnostic</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/marketplace?sector=Consumer+Products">Browse Frameworks</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
