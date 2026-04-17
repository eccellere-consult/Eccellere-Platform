"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ServiceData, SectorApplication, ServiceFaq } from "@/lib/services-data";
import type { Asset } from "@/lib/marketplace-data";
import { cn } from "@/lib/utils";

interface Props {
  service: ServiceData;
  relatedAssets: Asset[];
}

export function ServicePageContent({ service, relatedAssets }: Props) {
  return (
    <main id="main-content">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-eccellere-ink pt-[72px]">
        <div className="mx-auto max-w-[1280px] px-6 py-20 lg:py-[120px]">
          <div className="flex flex-wrap gap-2 mb-6">
            {service.sectors.slice(0, 4).map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full border border-eccellere-gold/30 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-eccellere-gold"
              >
                {s}
              </span>
            ))}
          </div>
          <h1 className="font-display text-[clamp(40px,7vw,80px)] font-light leading-[1.05] text-eccellere-cream max-w-3xl">
            {service.name}
          </h1>
          <p className="mt-4 text-xl font-light italic text-eccellere-gold-light max-w-2xl">
            {service.tagline}
          </p>
          <p className="mt-6 text-lg font-light text-white/60 max-w-2xl leading-relaxed">
            {service.heroDescription}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-eccellere-gold text-white hover:bg-eccellere-gold-dark"
            >
              <Link href="/contact">{service.heroCtaLabel}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-white/20 text-white hover:bg-white/10"
            >
              <Link href="/assessment">Take the AI Assessment →</Link>
            </Button>
          </div>
          {service.startingPrice && (
            <p className="mt-8 text-sm text-white/40">
              Engagements starting from{" "}
              <span className="font-medium text-eccellere-gold">
                {service.startingPrice}
              </span>
              .{" "}
              <Link href="/contact" className="underline hover:text-white/60">
                Get a custom quote →
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ── Pain Points ──────────────────────────────────────────────── */}
      <section className="bg-eccellere-cream py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2 className="font-display text-[clamp(28px,4vw,48px)] font-light text-eccellere-ink mb-16">
            The challenges we solve
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {service.painPoints.map((pt, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-eccellere-ink/10 bg-white p-8 shadow-sm"
              >
                <p className="mb-3 font-display text-lg font-normal italic text-eccellere-ink">
                  {pt.headline}
                </p>
                <p className="text-sm font-light text-eccellere-ink/70 leading-relaxed">
                  {pt.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Approach ─────────────────────────────────────────────── */}
      <section className="bg-eccellere-ink py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <h2 className="font-display text-[clamp(28px,4vw,48px)] font-light text-eccellere-cream mb-16">
            Our approach
          </h2>
          <div className="relative">
            <div className="absolute left-[22px] top-8 bottom-8 w-px bg-eccellere-gold/20 hidden md:block" />
            <div className="space-y-10">
              {service.approach.map((step, i) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="flex gap-8"
                >
                  <div className="relative flex-none">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-eccellere-gold/40 bg-eccellere-gold/10 text-sm font-medium text-eccellere-gold">
                      {String(step.step).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="pb-2">
                    <h3 className="text-lg font-medium text-eccellere-cream mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm font-light text-white/55 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Deliverables ─────────────────────────────────────────────── */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid gap-16 lg:grid-cols-2 items-start">
            <div>
              <h2 className="font-display text-[clamp(28px,4vw,48px)] font-light text-eccellere-ink mb-6">
                What you receive
              </h2>
              <p className="text-base font-light text-eccellere-ink/60 leading-relaxed">
                Every engagement produces tangible deliverables you own —
                living documents built to guide your team after the engagement
                ends.
              </p>
            </div>
            <ul className="space-y-4">
              {service.deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-eccellere-gold" />
                  <span className="text-sm font-light text-eccellere-ink leading-relaxed">
                    {d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── AI Maturity (Agentic AI only) ────────────────────────────── */}
      {service.maturityLevels && (
        <section className="bg-eccellere-gold-pale py-20 lg:py-28">
          <div className="mx-auto max-w-[1280px] px-6">
            <h2 className="font-display text-[clamp(28px,4vw,48px)] font-light text-eccellere-ink mb-4">
              The AI Maturity Model
            </h2>
            <p className="mb-16 text-base font-light text-eccellere-ink/60">
              Where does your organisation sit today?
            </p>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {service.maturityLevels.map((lvl) => (
                <motion.div
                  key={lvl.level}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: lvl.level * 0.08 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-eccellere-gold/25 bg-white/80 p-6"
                >
                  <div className="mb-3 text-3xl font-display font-light text-eccellere-gold">
                    {lvl.level}
                  </div>
                  <div className="mb-2 text-sm font-semibold text-eccellere-ink">
                    {lvl.label}
                  </div>
                  <p className="text-xs font-light text-eccellere-ink/60 leading-relaxed">
                    {lvl.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Sector Applications ───────────────────────────────────────── */}
      <SectorTabs applications={service.sectorApplications} />

      {/* ── Related Frameworks ───────────────────────────────────────── */}
      {relatedAssets.length > 0 && (
        <section className="bg-eccellere-cream py-20 lg:py-28">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="flex items-end justify-between mb-12">
              <h2 className="font-display text-[clamp(28px,4vw,44px)] font-light text-eccellere-ink">
                Related frameworks & tools
              </h2>
              <Link
                href="/marketplace"
                className="hidden items-center gap-1 text-sm font-medium text-eccellere-gold hover:underline sm:flex"
              >
                Browse all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedAssets.map((asset) => (
                <Link
                  key={asset.id}
                  href={`/marketplace/${asset.slug}`}
                  className="group rounded-2xl border border-eccellere-ink/10 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                >
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      asset.categoryColor
                    )}
                  >
                    {asset.category}
                  </span>
                  <h3 className="mt-3 text-sm font-medium text-eccellere-ink leading-snug group-hover:text-eccellere-gold transition-colors">
                    {asset.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-eccellere-ink/50">
                      <Star className="h-3.5 w-3.5 fill-eccellere-gold text-eccellere-gold" />
                      <span>{asset.rating}</span>
                    </div>
                    <span className="text-sm font-semibold text-eccellere-ink">
                      ₹{asset.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <FaqAccordion faqs={service.faqs} />

      {/* ── CTA Band ─────────────────────────────────────────────────── */}
      <section className="bg-eccellere-ink py-20 lg:py-28">
        <div className="mx-auto max-w-[1280px] px-6 text-center">
          <h2 className="font-display text-[clamp(28px,5vw,60px)] font-light text-eccellere-cream mb-4">
            Ready to transform?
          </h2>
          <p className="mb-10 text-lg font-light text-white/50 max-w-xl mx-auto">
            Book a free 30-minute discovery call. We&apos;ll listen to where
            you are, tell you what we&apos;d do, and give you a fair view of
            whether we&apos;re the right fit.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-eccellere-gold text-white hover:bg-eccellere-gold-dark px-10"
            >
              <Link href="/contact">Book a Free Discovery Call</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-white/20 text-white hover:bg-white/10"
            >
              <Link href="/marketplace">Browse the Marketplace →</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SectorTabs({ applications }: { applications: SectorApplication[] }) {
  const [active, setActive] = useState(0);
  const app = applications[active];

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6">
        <h2 className="font-display text-[clamp(28px,4vw,48px)] font-light text-eccellere-ink mb-4">
          Sector applications
        </h2>
        <p className="mb-10 text-base font-light text-eccellere-ink/60">
          How we apply this discipline in your sector.
        </p>
        <div className="flex gap-2 flex-wrap mb-10">
          {applications.map((a: SectorApplication, i: number) => (
            <button
              key={a.sector}
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                i === active
                  ? "bg-eccellere-gold text-white"
                  : "border border-eccellere-ink/20 text-eccellere-ink/60 hover:border-eccellere-gold hover:text-eccellere-gold"
              )}
            >
              {a.sector}
            </button>
          ))}
        </div>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid gap-8 lg:grid-cols-2"
        >
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-eccellere-gold">
              Key challenges
            </h3>
            <ul className="space-y-2 mb-8">
              {app.challenges.map((c: string) => (
                <li
                  key={c}
                  className="flex items-start gap-2 text-sm text-eccellere-ink/70"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-eccellere-gold" />
                  {c}
                </li>
              ))}
            </ul>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-eccellere-gold">
              What we do
            </h3>
            <ul className="space-y-3">
              {app.useCases.map((uc: string) => (
                <li
                  key={uc}
                  className="flex items-start gap-2 text-sm text-eccellere-ink/70"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-eccellere-gold" />
                  {uc}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-eccellere-gold-pale p-8 border border-eccellere-gold/20">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Client story
            </p>
            <p className="font-display text-lg italic font-light text-eccellere-ink leading-relaxed">
              &ldquo;{app.caseStudySnippet}&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FaqAccordion({ faqs }: { faqs: ServiceFaq[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="bg-eccellere-gold-pale py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-6">
        <h2 className="font-display text-[clamp(28px,4vw,48px)] font-light text-eccellere-ink mb-12">
          Frequently asked questions
        </h2>
        <div className="space-y-3 max-w-3xl">
          {faqs.map((faq: ServiceFaq, i: number) => (
            <div
              key={i}
              className="rounded-xl border border-eccellere-ink/10 bg-white overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
                aria-expanded={open === i}
              >
                <span className="text-sm font-medium text-eccellere-ink pr-4">
                  {faq.question}
                </span>
                {open === i ? (
                  <ChevronUp className="h-4 w-4 flex-none text-eccellere-gold" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-none text-eccellere-ink/40" />
                )}
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm font-light text-eccellere-ink/60 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
