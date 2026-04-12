"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "200+", label: "Frameworks & Toolkits" },
  { value: "30+", label: "Years of Experience" },
  { value: "4", label: "Core Sectors" },
  { value: "₹0", label: "AI Assessment" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-eccellere-ink">
      {/* Dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(184,145,58,0.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 py-32 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold"
        >
          Strategy · AI · Consulting for India&apos;s MSMEs
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mx-auto max-w-4xl font-display text-[clamp(42px,8vw,90px)] font-light leading-[1.05] text-eccellere-cream"
        >
          Consulting, AI Skills &{" "}
          <span className="italic text-eccellere-gold">Business Toolkits</span>
          {" "}— Built for Growth
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-white/60"
        >
          200+ proven frameworks and on‑demand expertise in Strategy, Process
          Transformation, and Agentic AI — designed for the scale and budgets of
          India&apos;s MSMEs and startups.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button asChild size="lg">
            <Link href="/marketplace">Explore the Marketplace</Link>
          </Button>
          <Button asChild variant="ghostLight" size="lg">
            <Link href="/assessment">Take Free AI Assessment</Link>
          </Button>
        </motion.div>

        {/* Stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-20 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-mono text-2xl text-eccellere-gold">
                {stat.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/40">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-16"
        >
          <div className="mx-auto h-10 w-px bg-gradient-to-b from-eccellere-gold/60 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
