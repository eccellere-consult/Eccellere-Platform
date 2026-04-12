"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const services = [
  {
    number: "01",
    name: "Agentic AI",
    description:
      "AI strategy, implementation, and workforce enablement — purpose-built for MSMEs ready to leapfrog.",
    sectors: ["Manufacturing", "Retail", "Logistics"],
    featured: true,
    href: "/services/agentic-ai",
  },
  {
    number: "02",
    name: "Strategy",
    description:
      "Market entry, growth planning, and competitive positioning backed by 200+ proven frameworks.",
    sectors: ["All Sectors"],
    featured: false,
    href: "/services/strategy",
  },
  {
    number: "03",
    name: "Process Transformation",
    description:
      "End-to-end operational redesign — lean manufacturing, supply chain, quality systems.",
    sectors: ["Manufacturing", "Logistics"],
    featured: false,
    href: "/services/process-transformation",
  },
  {
    number: "04",
    name: "Digital",
    description:
      "Digital roadmap, ERP, e‑commerce, and data analytics for businesses going digital-first.",
    sectors: ["Retail", "Consumer Products"],
    featured: false,
    href: "/services/digital",
  },
  {
    number: "05",
    name: "Organisation Transformation",
    description:
      "People, culture, and capability building to sustain growth at scale.",
    sectors: ["All Sectors"],
    featured: false,
    href: "/services/organisation-transformation",
  },
];

export function FeaturedServices() {
  return (
    <section className="bg-eccellere-ink py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          What We Do
        </p>
        <h2 className="mt-4 font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-cream">
          Five disciplines,{" "}
          <span className="italic">one transformation platform</span>
        </h2>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {services.map((service, i) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <Link
                href={service.href}
                className={`group block h-full rounded p-6 transition-all duration-300 hover:-translate-y-1 ${
                  service.featured
                    ? "border border-eccellere-gold bg-eccellere-gold/5"
                    : "border border-white/10 bg-white/[0.03] hover:border-white/20"
                }`}
              >
                <span className="font-mono text-xs text-eccellere-gold">
                  {service.number}
                </span>
                <h3 className="mt-3 text-lg font-medium text-eccellere-cream">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {service.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {service.sectors.map((s) => (
                    <span
                      key={s}
                      className="rounded-sm bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/40"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="mt-4 inline-block text-sm text-eccellere-gold opacity-0 transition-opacity group-hover:opacity-100">
                  Explore →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
