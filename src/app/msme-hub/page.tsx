"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  TrendingUp,
  Shield,
  Clock,
  IndianRupee,
  Bot,
  Factory,
  ShoppingBag,
  Package,
  Truck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const challenges = [
  {
    icon: Clock,
    problem: "No time for 6-month projects",
    solution: "Sprint-based engagements — results in 4–6 weeks.",
  },
  {
    icon: IndianRupee,
    problem: "Can't afford Big 4 consulting fees",
    solution: "Modular pricing from ₹999. Pay only for what you use.",
  },
  {
    icon: Bot,
    problem: "Don't know where AI fits in the business",
    solution: "Free AI Readiness Assessment with sector benchmarks.",
  },
  {
    icon: TrendingUp,
    problem: "Growth stalled but don't know why",
    solution: "Diagnostic frameworks to pinpoint bottlenecks fast.",
  },
  {
    icon: Shield,
    problem: "Worried about quality at scale",
    solution: "ISO-aligned QMS templates and lean playbooks included.",
  },
  {
    icon: Zap,
    problem: "Too many tools, no clear strategy",
    solution: "One platform. AI advisor + frameworks + experts on demand.",
  },
];

const sectorCards = [
  {
    icon: Factory,
    name: "Manufacturing",
    count: 65,
    topAssets: ["Lean Implementation Guide", "QMS Template Pack", "Supply Chain Diagnostic"],
    href: "/marketplace?sector=Manufacturing",
  },
  {
    icon: ShoppingBag,
    name: "Retail",
    count: 52,
    topAssets: ["Omnichannel Strategy Kit", "Inventory Analytics", "CX Mapping Template"],
    href: "/marketplace?sector=Retail",
  },
  {
    icon: Package,
    name: "Consumer Products",
    count: 48,
    topAssets: ["D2C Launch Playbook", "Brand Strategy Toolkit", "Distribution Planning"],
    href: "/marketplace?sector=Consumer+Products",
  },
  {
    icon: Truck,
    name: "Logistics",
    count: 42,
    topAssets: ["Route Optimisation Model", "Fleet Management Kit", "Last-Mile Playbook"],
    href: "/marketplace?sector=Logistics",
  },
];

const packages = [
  {
    name: "Starter",
    price: "₹4,999",
    period: "/one-time",
    description: "Perfect for MSMEs just getting started with structured frameworks.",
    features: [
      "3 marketplace assets of your choice",
      "AI Readiness Assessment report",
      "Email support for 30 days",
      "Sector benchmarking data",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Growth",
    price: "₹14,999",
    period: "/quarter",
    description: "For businesses ready to transform operations and unlock growth.",
    features: [
      "10 marketplace assets (any category)",
      "1:1 specialist consultation (2 hrs)",
      "Custom AI readiness roadmap",
      "Priority chatbot support",
      "Quarterly review session",
      "Sector-specific benchmark report",
    ],
    cta: "Start Growing",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For MSMEs scaling fast who need dedicated advisory and custom tools.",
    features: [
      "Unlimited marketplace access",
      "Dedicated specialist team",
      "Custom framework development",
      "On-site workshops (2 per quarter)",
      "Executive dashboard & analytics",
      "SLA-backed 24hr response time",
    ],
    cta: "Talk to Us",
    featured: false,
  },
];

export default function MSMEHubPage() {
  return (
    <>
      <Header />
      <main className="bg-eccellere-cream pt-[72px]">
        {/* Hero */}
        <section className="relative overflow-hidden bg-eccellere-ink py-24 lg:py-32">
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(184,145,58,0.3) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10 mx-auto max-w-[1280px] px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                For MSMEs & Startups
              </p>
              <h1 className="mt-4 font-display text-[clamp(32px,6vw,72px)] font-light leading-[1.1] text-eccellere-cream">
                Enabling Indian MSMEs with{" "}
                <span className="italic text-eccellere-gold">
                  world-class best practices
                </span>
              </h1>
              <p className="mt-6 text-lg font-light text-white/50">
                We take the best business practices from around the world,
                contextualise them to Indian realities, and put them in the hands
                of India&apos;s growth businesses — preparing them for the imminent
                India Wave. Indian companies should disproportionately influence
                world business. We&apos;re here to make that happen.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                  <Link href="/assessment">Take Free AI Assessment</Link>
                </Button>
                <Button asChild variant="ghostLight" size="lg">
                  <Link href="/marketplace">Browse Marketplace</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Challenges → Solutions */}
        <section className="py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              We get it
            </p>
            <h2 className="mt-4 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-ink">
              Your challenges are{" "}
              <span className="italic">our design brief</span>
            </h2>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {challenges.map((item, i) => (
                <motion.div
                  key={item.problem}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="rounded bg-white p-8 shadow-sm"
                >
                  <item.icon
                    className="h-8 w-8 text-eccellere-gold"
                    strokeWidth={1.5}
                  />
                  <p className="mt-4 text-sm font-medium text-eccellere-error/70 line-through">
                    &quot;{item.problem}&quot;
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mid">
                    {item.solution}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sector toolkits */}
        <section className="bg-gold-pale py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
              Sector Toolkits
            </p>
            <h2 className="mt-4 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-ink">
              Frameworks tailored to{" "}
              <span className="italic">your industry</span>
            </h2>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {sectorCards.map((sector, i) => (
                <motion.div
                  key={sector.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link
                    href={sector.href}
                    className="group block rounded bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <sector.icon
                      className="h-10 w-10 text-eccellere-gold"
                      strokeWidth={1.5}
                    />
                    <h3 className="mt-5 text-lg font-medium text-eccellere-ink">
                      {sector.name}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-eccellere-gold">
                      {sector.count} frameworks
                    </p>
                    <ul className="mt-4 space-y-1.5">
                      {sector.topAssets.map((asset) => (
                        <li
                          key={asset}
                          className="text-sm text-ink-mid"
                        >
                          → {asset}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-eccellere-gold opacity-0 transition-opacity group-hover:opacity-100">
                      Browse <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                How It Works
              </p>
              <h2 className="mt-4 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-ink">
                From problem to solution{" "}
                <span className="italic">in 3 steps</span>
              </h2>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Start with Growth Assets",
                  desc: "Pick up diagnostic kits, best-practice playbooks, and ready-to-use frameworks from the marketplace. Cost-effective, immediate impact — no consultant required.",
                },
                {
                  step: "02",
                  title: "Power Up with Agentic AI",
                  desc: "Layer in AI to automate, optimise, and accelerate. From AI assessments to autonomous agents, build the skills and tools that multiply your team's output.",
                },
                {
                  step: "03",
                  title: "Accelerate with 1-on-1 Consulting",
                  desc: "When you need a focused push on a specific growth challenge, bring in our experts. Deep-dive engagements and hands-on implementation to move the trajectory.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="text-center"
                >
                  <span className="font-mono text-4xl text-eccellere-gold/30">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-xl font-medium text-eccellere-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-mid">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-eccellere-ink py-20 lg:py-[120px]">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
                MSME Packages
              </p>
              <h2 className="mt-4 font-display text-[clamp(28px,5vw,48px)] font-light leading-tight text-eccellere-cream">
                Transparent pricing,{" "}
                <span className="italic text-eccellere-gold">
                  no hidden costs
                </span>
              </h2>
            </div>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {packages.map((pkg, i) => (
                <motion.div
                  key={pkg.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className={`rounded p-8 ${
                    pkg.featured
                      ? "border-2 border-eccellere-gold bg-eccellere-gold/5"
                      : "border border-white/10 bg-white/[0.03]"
                  }`}
                >
                  {pkg.featured && (
                    <span className="mb-4 inline-block rounded-sm bg-eccellere-gold px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-medium text-eccellere-cream">
                    {pkg.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-mono text-3xl text-eccellere-gold">
                      {pkg.price}
                    </span>
                    <span className="text-sm text-white/40">{pkg.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-white/50">
                    {pkg.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-eccellere-gold" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={pkg.featured ? "default" : "ghostLight"}
                    className="mt-8 w-full"
                  >
                    <Link
                      href={
                        pkg.name === "Enterprise"
                          ? "/contact?type=enterprise"
                          : "/register"
                      }
                    >
                      {pkg.cta}
                    </Link>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 lg:py-24">
          <div className="mx-auto max-w-[1280px] px-6 text-center">
            <h2 className="font-display text-[clamp(28px,5vw,42px)] font-light leading-tight text-eccellere-ink">
              Ready to unlock your next phase of{" "}
              <span className="italic text-eccellere-gold">growth?</span>
            </h2>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/assessment">Start with Free AI Assessment</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/contact">Book a Call</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
