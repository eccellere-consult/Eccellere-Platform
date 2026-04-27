"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: "01",
    icon: BookOpen,
    title: "Start Smart — Self-Help Growth Assets",
    description:
      "Pick up diagnostic kits, best-practice playbooks, and ready-to-use frameworks from the marketplace. Cost-effective, immediate, and built for India's MSME realities. No consultant required.",
    cta: { label: "Browse the Marketplace", href: "/marketplace" },
    color: "text-eccellere-gold",
    borderColor: "border-eccellere-gold",
  },
  {
    step: "02",
    icon: Zap,
    title: "Power Up — AI & Agentic Skills",
    description:
      "Layer in Agentic AI to automate, optimise, and accelerate. From AI assessments to autonomous agents, we help you build skills and deploy the right tools for your business — fast.",
    cta: { label: "Explore Agentic AI", href: "/agentic-ai" },
    color: "text-eccellere-teal",
    borderColor: "border-eccellere-teal",
  },
  {
    step: "03",
    icon: Users,
    title: "Go Further — 1-on-1 Consulting Advisory",
    description:
      "When you need a focused push on a specific growth challenge, bring in our experts. Deep-dive engagements, board-level strategy, and hands-on implementation to move the trajectory.",
    cta: { label: "Talk to a Consultant", href: "/contact" },
    color: "text-eccellere-ink",
    borderColor: "border-eccellere-ink",
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
          The Eccellere MSME Growth Path
        </p>
        <h2 className="mt-4 text-center font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-ink">
          Three steps to <span className="italic">transform your business</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base font-light leading-relaxed text-ink-mid">
          Start with proven tools. Power up with AI. Accelerate with expert advisory — at whatever pace works for your business.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              className="group relative flex flex-col rounded bg-white p-10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Coloured top border */}
              <div className={`absolute inset-x-0 top-0 h-[3px] rounded-t bg-eccellere-gold transition-all duration-300 ${
                i === 1 ? "bg-eccellere-teal" : i === 2 ? "bg-eccellere-ink" : "bg-eccellere-gold"
              }`} />

              {/* Step number */}
              <span className={`font-mono text-[11px] font-semibold uppercase tracking-[0.2em] ${step.color}`}>
                Step {step.step}
              </span>

              <step.icon className={`mt-4 h-8 w-8 ${step.color}`} strokeWidth={1.5} />

              <h3 className="mt-5 text-xl font-medium text-eccellere-ink">
                {step.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-mid">
                {step.description}
              </p>

              <div className="mt-8">
                <Button asChild variant="outline" size="sm" className={`border ${step.borderColor}`}>
                  <Link href={step.cta.href}>{step.cta.label}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
