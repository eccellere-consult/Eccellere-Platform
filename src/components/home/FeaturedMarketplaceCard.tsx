"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { type Asset } from "@/lib/marketplace-data";

/**
 * Animated card for the homepage Featured Marketplace strip.
 * Kept as a client component because it uses framer-motion's whileInView.
 * The data fetch lives in the parent server component.
 */
export function FeaturedMarketplaceCard({
  asset,
  index,
}: {
  asset: Asset;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link
        href={`/marketplace/${asset.slug}`}
        className="group block rounded bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      >
        <span
          className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            asset.categoryColor ?? "bg-eccellere-gold/20 text-eccellere-gold"
          }`}
        >
          {asset.category}
        </span>
        <h3 className="mt-4 text-base font-medium leading-snug text-eccellere-ink">
          {asset.title}
        </h3>
        <p className="mt-2 text-xs text-ink-light">{asset.format}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-lg font-medium text-eccellere-ink">
            ₹{(asset.price ?? 0).toLocaleString("en-IN")}
          </span>
          <span className="flex items-center gap-1 text-xs text-eccellere-gold">
            <Star className="h-3 w-3 fill-current" />
            {(asset.rating ?? 0).toFixed(1)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
