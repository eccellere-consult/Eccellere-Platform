"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Download, FileText } from "lucide-react";
import Link from "next/link";
import { CheckoutButton } from "@/components/marketplace/CheckoutButton";
import { AssetPreviewModal } from "@/components/marketplace/AssetPreviewModal";
import type { Asset } from "@/lib/marketplace-data";

interface PurchaseCardProps {
  asset: Asset;
  formatPrice: (p: number) => string;
  discount: number | null;
}

export function PurchaseCard({ asset, formatPrice, discount }: PurchaseCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      {previewOpen && (
        <AssetPreviewModal asset={asset} onClose={() => setPreviewOpen(false)} />
      )}

      <div className="rounded-lg bg-white p-6 shadow-md">
        {/* Price */}
        <div className="flex items-end gap-3">
          <span className="font-mono text-3xl font-light text-eccellere-ink">
            {formatPrice(asset.price)}
          </span>
          {asset.originalPrice && discount && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-light line-through">
                {formatPrice(asset.originalPrice)}
              </span>
              <span className="rounded bg-eccellere-teal/10 px-1.5 py-0.5 text-xs font-medium text-eccellere-teal">
                {discount}% off
              </span>
            </div>
          )}
        </div>

        <div className="mt-1 text-xs text-ink-light">Inclusive of GST</div>

        <CheckoutButton
          assetSlug={asset.slug}
          assetTitle={asset.title}
          assetFormat={asset.format}
          price={asset.price}
          className="mt-5 w-full"
        >
          Buy Now — {formatPrice(asset.price)}
        </CheckoutButton>

        <Button
          variant="outline"
          className="mt-3 w-full"
          size="lg"
          onClick={() => setPreviewOpen(true)}
        >
          Preview Sample
        </Button>

        <div className="mt-5 space-y-2.5 border-t border-eccellere-ink/5 pt-5 text-xs text-ink-mid">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-eccellere-teal" />
            14-day money-back guarantee
          </div>
          <div className="flex items-center gap-2">
            <Download className="h-3.5 w-3.5 text-eccellere-teal" />
            Instant access after purchase
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-eccellere-teal" />
            {asset.format} format
          </div>
        </div>

        <div className="mt-5 border-t border-eccellere-ink/5 pt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-light">
            Need a custom solution?
          </p>
          <p className="mt-1 text-xs text-ink-mid">
            Talk to our team for bespoke consulting or group licensing.
          </p>
          <Link
            href="/contact"
            className="mt-2 block text-xs text-eccellere-gold hover:underline"
          >
            Book a discovery call →
          </Link>
        </div>
      </div>

      {/* Rating breakdown */}
      <div className="mt-4 rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-mono text-4xl font-light text-eccellere-ink">
            {asset.rating}
          </span>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  className={`h-4 w-4 ${s <= Math.round(asset.rating) ? "fill-eccellere-gold text-eccellere-gold" : "text-eccellere-ink/10"}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="mt-0.5 text-xs text-ink-light">
              {asset.reviews} verified reviews
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
