"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Asset } from "@/lib/marketplace-data";

export function FeaturedMarketplace() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/assets")
      .then((r) => r.json())
      .then((data) => {
        // API already orders by createdAt desc — take the first 4 newest
        setAssets((data.assets ?? []).slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-eccellere-cream py-20 lg:py-[120px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
          Marketplace
        </p>
        <h2 className="mt-4 font-display text-[clamp(28px,5vw,52px)] font-light leading-tight text-eccellere-ink">
          Proven frameworks,{" "}
          <span className="italic">newest first</span>
        </h2>

        {loading ? (
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded bg-white/60 shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {assets.map((asset, i) => (
              <motion.div
                key={asset.id ?? asset.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
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
            ))}
          </div>
        )}

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
