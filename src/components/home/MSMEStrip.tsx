"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const pills = [
  {
    challenge: "No time for long projects",
    solution: "We work in sprints",
  },
  {
    challenge: "Can't afford Big 4 prices",
    solution: "Transparent, modular pricing",
  },
  {
    challenge: "Don't know where AI fits",
    solution: "Start with a free assessment",
  },
];

export function MSMEStrip() {
  return (
    <section className="bg-gold-pale py-20 lg:py-[120px]">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2">
        {/* Left: copy */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            For MSMEs
          </p>
          <h2 className="mt-4 font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-ink">
            Built for the realities of the{" "}
            <span className="italic">Indian growth business</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-mid">
            We understand the constraints: lean teams, tight budgets, and the
            pressure to grow fast. Every framework, tool, and engagement is
            designed for your scale.
          </p>
          <Button asChild className="mt-8">
            <Link href="/msme-hub">See the MSME Hub →</Link>
          </Button>
        </motion.div>

        {/* Right: challenge → solution pills */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          {pills.map((pill) => (
            <div
              key={pill.challenge}
              className="flex items-center gap-4 rounded bg-white p-5 shadow-sm"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-mid line-through decoration-eccellere-error/40">
                  &quot;{pill.challenge}&quot;
                </p>
              </div>
              <span className="text-eccellere-gold">→</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-eccellere-ink">
                  {pill.solution}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
