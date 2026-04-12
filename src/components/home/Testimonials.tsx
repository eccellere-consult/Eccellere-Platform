"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Eccellere's AI readiness assessment changed how we think about technology. Within 3 months, we automated 40% of our quality checks.",
    name: "Rajesh Kumar",
    title: "Managing Director",
    company: "Precision Auto Components",
    sector: "Manufacturing",
  },
  {
    quote:
      "The strategy frameworks are worth 10x what we paid. Clear, actionable, and designed for Indian businesses — not multinationals.",
    name: "Priya Sharma",
    title: "Founder & CEO",
    company: "FreshBasket D2C",
    sector: "Retail",
  },
  {
    quote:
      "We went from zero digital presence to a fully integrated omnichannel operation in 6 months. The process transformation toolkit was our blueprint.",
    name: "Anand Mehta",
    title: "COO",
    company: "SwiftShip Logistics",
    sector: "Logistics",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-eccellere-ink/5 bg-white py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Client Stories
        </p>
        <h2 className="mt-4 text-center font-display text-[clamp(28px,5vw,42px)] font-light leading-tight text-eccellere-ink">
          Trusted by leaders who{" "}
          <span className="italic">mean business</span>
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="rounded bg-eccellere-cream/50 p-8"
            >
              <Quote className="h-6 w-6 text-eccellere-gold/40" />
              <p className="mt-4 font-display text-lg italic leading-relaxed text-eccellere-ink">
                &quot;{t.quote}&quot;
              </p>
              <div className="mt-6 border-t border-eccellere-ink/5 pt-4">
                <p className="text-sm font-medium text-eccellere-ink">
                  {t.name}
                </p>
                <p className="text-xs text-ink-mid">
                  {t.title}, {t.company}
                </p>
                <span className="mt-2 inline-block rounded-sm bg-eccellere-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold">
                  {t.sector}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
