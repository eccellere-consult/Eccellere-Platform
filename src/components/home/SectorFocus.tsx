"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Factory, ShoppingBag, Package, Truck } from "lucide-react";

const sectors = [
  {
    icon: Factory,
    name: "Manufacturing",
    challenges: ["Operational efficiency", "Quality systems", "Supply chain"],
    frameworks: 65,
    href: "/sectors/manufacturing",
  },
  {
    icon: ShoppingBag,
    name: "Retail",
    challenges: ["Omnichannel strategy", "Inventory optimisation", "CX design"],
    frameworks: 52,
    href: "/sectors/retail",
  },
  {
    icon: Package,
    name: "Consumer Products",
    challenges: ["Brand building", "D2C strategy", "Distribution networks"],
    frameworks: 48,
    href: "/sectors/consumer-products",
  },
  {
    icon: Truck,
    name: "Logistics",
    challenges: ["Route optimisation", "Last-mile delivery", "Fleet management"],
    frameworks: 42,
    href: "/sectors/logistics",
  },
];

export function SectorFocus() {
  return (
    <section className="bg-gold-pale py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Sector Focus
        </p>
        <h2 className="mt-4 font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-ink">
          Deep expertise{" "}
          <span className="italic">where it matters most</span>
        </h2>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sectors.map((sector, i) => (
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
                <ul className="mt-3 space-y-1">
                  {sector.challenges.map((c) => (
                    <li key={c} className="text-sm text-ink-mid">
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-mono text-xs text-eccellere-gold">
                  {sector.frameworks} frameworks
                </p>
                <span className="mt-3 inline-block text-sm font-medium text-eccellere-gold opacity-0 transition-opacity group-hover:opacity-100">
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
