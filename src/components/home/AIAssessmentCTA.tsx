"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const featurePills = [
  "No signup required",
  "Results in 5 mins",
  "Sector benchmarks",
  "Personalised recommendations",
  "Free",
];

export function AIAssessmentCTA() {
  return (
    <section className="bg-eccellere-ink py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            AI Readiness Assessment
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-cream">
            Where does your organisation stand on the{" "}
            <span className="italic text-eccellere-gold">
              Agentic AI readiness curve?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/50">
            5 minutes. Free. Personalised report. Sector-benchmarked.
          </p>

          <Button asChild size="lg" className="mt-10">
            <Link href="/assessment">
              Take the AI Readiness Assessment →
            </Link>
          </Button>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {featurePills.map((pill) => (
              <span
                key={pill}
                className="rounded-sm border border-white/10 px-3 py-1.5 text-xs text-white/50"
              >
                {pill}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
