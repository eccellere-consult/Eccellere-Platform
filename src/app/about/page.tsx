import { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Eccellere",
  description:
    "Eccellere+ serves India's aspiring and growing organisations with industry and function specific strategy and operations assets, AI, and 200+ business frameworks.",
};

const values = [
  {
    title: "Outcomes Over Outputs",
    description: "We measure success by the impact on your business — not by the number of slides we deliver.",
  },
  {
    title: "Built for India",
    description: "Every framework, price point, and engagement model is designed for the realities of Indian businesses.",
  },
  {
    title: "Specialists, Not Generalists",
    description: "Deep expertise in Manufacturing, Retail, Consumer Products, and Logistics — the sectors that power India's economy.",
  },
  {
    title: "AI as an Accelerator",
    description: "We don't sell AI hype. We help you find where AI genuinely creates value, and we build it with you.",
  },
  {
    title: "Transparent & Modular",
    description: "No hidden fees, no 6-month lock-ins. Buy a framework, hire a specialist by the hour, or subscribe for ongoing access.",
  },
  {
    title: "Knowledge Compounding",
    description: "200+ frameworks built over 30 years. Every engagement makes the platform smarter. Your gain compounds.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-eccellere-ink pt-[72px]">
          <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-[120px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              About Eccellere
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(36px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
              Consulting reimagined{" "}
              <span className="italic">for India&apos;s growth businesses</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-light text-white/50">
              Eccellere+ is built for India&apos;s aspiring and growing organisations:
              world-class strategy, AI, and business transformation
              capabilities, deep in your industry and your function.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="bg-eccellere-cream py-20 lg:py-[120px]">
          <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-light text-eccellere-ink lg:text-4xl">
                The problem we&apos;re solving
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-mid">
                <p>
                  India has 63 million MSMEs. They contribute 30% of GDP and
                  employ 110 million people. Yet fewer than 2% have ever engaged
                  a management consultant, and the same gap is felt by many
                  growing mid-size organisations.
                </p>
                <p>
                  The reason? Traditional consulting is priced for enterprises,
                  packaged for boardrooms, and delivered on timelines that
                  growth-stage businesses can&apos;t afford.
                </p>
                <p>
                  Eccellere changes this. We&apos;ve built a platform where 30+
                  years of consulting IP — frameworks, toolkits, playbooks, and
                  diagnostics — is available on-demand, at transparent prices,
                  designed for the Indian business context.
                </p>
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl font-light text-eccellere-ink lg:text-4xl">
                What makes us different
              </h2>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink-mid">
                <p>
                  We combine a curated marketplace of 200+ business frameworks
                  with on-demand access to specialist consultants — all powered
                  by an AI layer that diagnoses, recommends, and accelerates.
                </p>
                <p>
                  Whether you need a supply chain optimisation toolkit for your
                  manufacturing unit, an AI readiness assessment for your retail
                  brand, or a growth strategy for your D2C startup — we have a
                  framework, a specialist, or an AI advisor ready to help.
                </p>
                <p>
                  No long proposals. No minimum engagement fees. No jargon. Just
                  consulting that delivers results.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="border-y border-eccellere-ink/5 bg-white py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Our Principles
            </p>
            <h2 className="mt-4 font-display text-[clamp(28px,5vw,42px)] font-light text-eccellere-ink">
              What we believe
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div key={v.title} className="border-t border-eccellere-ink/5 pt-6">
                  <h3 className="text-base font-medium text-eccellere-ink">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mid">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-eccellere-purple py-20 text-center lg:py-[120px]">
          <div className="mx-auto max-w-xl px-6">
            <h2 className="font-display text-3xl font-light text-eccellere-cream lg:text-4xl">
              Ready to grow?
            </h2>
            <p className="mt-4 text-base text-white/50">
              Start with a free AI readiness assessment, explore the marketplace,
              or talk to our team.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/assessment">Take AI Assessment</Link>
              </Button>
              <Button asChild variant="ghostLight" size="lg">
                <Link href="/contact">Talk to Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
