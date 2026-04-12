"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "60%", label: "Revenue share" },
  { value: "200+", label: "MSMEs waiting" },
  { value: "Flexible", label: "Engagement" },
];

export function SpecialistCTA() {
  return (
    <section className="bg-eccellere-purple py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            For Specialists & Consultants
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-cream">
            Are you a strategy, operations, or{" "}
            <span className="italic text-eccellere-gold">AI specialist?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/50">
            Monetise your expertise. Publish frameworks, accept assignments, and
            build your reputation on India&apos;s leading consulting platform.
          </p>

          <Button asChild variant="ghostLight" size="lg" className="mt-10">
            <Link href="/specialist/register">Apply as a Specialist →</Link>
          </Button>

          <div className="mt-10 flex flex-wrap justify-center gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-mono text-xl text-eccellere-gold">
                  {s.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/40">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
