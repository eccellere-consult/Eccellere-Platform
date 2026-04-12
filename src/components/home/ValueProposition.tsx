"use client";

import { motion } from "framer-motion";
import { Lightbulb, Bot, Target } from "lucide-react";

const cards = [
  {
    icon: Lightbulb,
    title: "Best Practice Factory",
    description:
      "200+ frameworks, toolkits, and playbooks built over 30 years, available on-demand.",
  },
  {
    icon: Bot,
    title: "AI-Powered Growth",
    description:
      "Agentic AI strategy and implementation designed for the scale and budget of India's MSMEs.",
  },
  {
    icon: Target,
    title: "Results-First Consulting",
    description:
      "We don't just advise. We stay through delivery and measure outcomes.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

export function ValueProposition() {
  return (
    <section className="bg-eccellere-cream py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Why Eccellere
        </p>
        <h2 className="mt-4 text-center font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-ink">
          Built different, <span className="italic">for those who build</span>
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              className="group relative rounded bg-white p-10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Gold top border on hover */}
              <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-eccellere-gold transition-transform duration-300 group-hover:scale-x-100" />
              <card.icon className="h-8 w-8 text-eccellere-gold" strokeWidth={1.5} />
              <h3 className="mt-6 text-xl font-medium text-eccellere-ink">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-mid">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
