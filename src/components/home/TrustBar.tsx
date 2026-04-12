"use client";

import { motion } from "framer-motion";

export function TrustBar() {
  const partners = [
    "IIM Alumni Network",
    "NASSCOM",
    "Startup India",
    "CII",
    "FICCI",
    "India MSME Forum",
    "Digital India",
    "Make in India",
  ];

  return (
    <section className="overflow-hidden border-y border-eccellere-ink/5 bg-eccellere-cream py-6">
      <div className="mx-auto flex max-w-[1280px] items-center gap-8 px-6">
        <p className="hidden shrink-0 text-xs uppercase tracking-[0.15em] text-ink-light lg:block">
          Trusted by growth-stage businesses across India
        </p>
        <div className="relative flex-1 overflow-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="flex gap-12 whitespace-nowrap"
          >
            {[...partners, ...partners].map((name, i) => (
              <span
                key={i}
                className="text-sm font-medium text-ink-light/60"
              >
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
