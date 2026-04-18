import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Factory, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Manufacturing — Eccellere",
  description:
    "Expert consulting for Indian manufacturing businesses. Operational efficiency, quality systems, supply chain optimisation, and AI-driven transformation.",
};

const challenges = [
  {
    title: "Operational Efficiency",
    description:
      "Eliminate waste, reduce cycle times, and optimise your production floor with lean and six sigma frameworks tailored for Indian factories.",
  },
  {
    title: "Quality Management Systems",
    description:
      "Build ISO-ready QMS, implement statistical process control, and create a culture of zero-defect manufacturing.",
  },
  {
    title: "Supply Chain Optimisation",
    description:
      "Reduce procurement costs, improve vendor relationships, and build resilient supply chains that withstand disruption.",
  },
  {
    title: "Workforce Productivity",
    description:
      "Upskill operators, reduce attrition, and implement performance management systems that drive accountability on the shop floor.",
  },
  {
    title: "AI & Automation Readiness",
    description:
      "Identify where AI creates real value in your plant — predictive maintenance, defect detection, demand forecasting — and build it step by step.",
  },
  {
    title: "Export & Compliance",
    description:
      "Navigate export documentation, international quality certifications, and regulatory compliance to unlock new markets.",
  },
];

const frameworks = [
  "Lean Manufacturing Assessment",
  "Value Stream Mapping Toolkit",
  "OEE Improvement Playbook",
  "Supplier Evaluation Matrix",
  "Kaizen Event Framework",
  "Production Planning Template",
  "Quality Gate Checklist",
  "5S Implementation Guide",
];

const outcomes = [
  "20–35% reduction in production downtime",
  "15–25% improvement in OEE",
  "10–20% reduction in procurement costs",
  "ISO 9001 / ISO 45001 readiness in 90 days",
  "Defect rate reduction of 40%+",
];

export default function ManufacturingSectorPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-[120px]">
            <div className="flex items-center gap-3">
              <Factory className="h-8 w-8 text-eccellere-gold" strokeWidth={1.5} />
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                Sector Focus
              </p>
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(36px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
              Manufacturing{" "}
              <span className="italic">consulting for India</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-light text-white/50">
              65 proven frameworks. Specialists with 15+ years on the plant floor.
              Built for MSMEs and mid-size manufacturers looking to compete at
              world-class standards.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/marketplace?sector=Manufacturing">Browse Frameworks</Link>
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
              The challenges manufacturers face
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
                  65 Frameworks
                </p>
                <h3 className="mt-3 font-display text-2xl font-light">
                  Popular manufacturing toolkits
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
                    <Link href="/marketplace?sector=Manufacturing">View all frameworks →</Link>
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
              <span className="italic">manufacturing operations?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-mid">
              Start with a free diagnostic call. Our specialists will identify
              your top 3 opportunities within 30 minutes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/contact">Book a Free Diagnostic</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/marketplace?sector=Manufacturing">Browse Frameworks</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
