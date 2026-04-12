"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const assets = [
  {
    category: "Strategy",
    categoryColor: "bg-eccellere-gold/20 text-eccellere-gold",
    title: "MSME Growth Strategy Playbook",
    format: "PDF",
    price: "₹2,499",
    rating: 4.8,
    href: "/marketplace/msme-growth-strategy",
  },
  {
    category: "Agentic AI",
    categoryColor: "bg-eccellere-purple/20 text-eccellere-purple",
    title: "AI Readiness Assessment Toolkit",
    format: "Excel",
    price: "₹1,999",
    rating: 4.9,
    href: "/marketplace/ai-readiness-toolkit",
  },
  {
    category: "Process",
    categoryColor: "bg-eccellere-teal/20 text-eccellere-teal",
    title: "Lean Manufacturing Implementation Guide",
    format: "PDF + Template",
    price: "₹3,499",
    rating: 4.7,
    href: "/marketplace/lean-manufacturing-guide",
  },
  {
    category: "Digital",
    categoryColor: "bg-eccellere-info/20 text-eccellere-info",
    title: "E‑Commerce Launch Checklist",
    format: "Template",
    price: "₹999",
    rating: 4.6,
    href: "/marketplace/ecommerce-launch-checklist",
  },
];

export function FeaturedMarketplace() {
  return (
    <section className="bg-eccellere-cream py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Marketplace
        </p>
        <h2 className="mt-4 font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-ink">
          Proven frameworks,{" "}
          <span className="italic">ready to deploy</span>
        </h2>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {assets.map((asset, i) => (
            <motion.div
              key={asset.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link
                href={asset.href}
                className="group block rounded bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${asset.categoryColor}`}
                >
                  {asset.category}
                </span>
                <h3 className="mt-4 text-base font-medium leading-snug text-eccellere-ink">
                  {asset.title}
                </h3>
                <p className="mt-2 text-xs text-ink-light">{asset.format}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-lg font-medium text-eccellere-ink">
                    {asset.price}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-eccellere-gold">
                    <Star className="h-3 w-3 fill-current" />
                    {asset.rating}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="ghost">
            <Link href="/marketplace">
              Browse all 200+ assets in the Marketplace →
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
