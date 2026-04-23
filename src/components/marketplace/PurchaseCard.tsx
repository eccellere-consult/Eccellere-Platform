"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Download, FileText, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { CheckoutButton } from "@/components/marketplace/CheckoutButton";
import { AssetPreviewModal } from "@/components/marketplace/AssetPreviewModal";
import type { Asset } from "@/lib/marketplace-data";

interface PurchaseCardProps {
  asset: Asset;
  discount: number | null;
}

function formatPrice(p: number) {
  return "\u20b9" + p.toLocaleString("en-IN");
}

export function PurchaseCard({ asset, discount }: PurchaseCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [purchased, setPurchased] = useState<string | null>(null); // order id after success
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (purchased) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle className="h-10 w-10 text-eccellere-teal" />
          <p className="font-medium text-eccellere-ink">Payment Successful!</p>
          <p className="text-xs text-ink-light">Order {purchased}</p>
          <Link
            href="/dashboard/orders"
            className="mt-2 inline-block rounded bg-eccellere-gold px-5 py-2 text-sm font-medium text-white hover:bg-eccellere-gold/90"
          >
            View My Orders
          </Link>
          <Link href="/dashboard/library" className="text-xs text-eccellere-gold hover:underline">
            Access My Library
          </Link>
        </div>
      </div>
    );
  }

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

        {checkoutError && (
          <div className="mt-3 flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {checkoutError}
          </div>
        )}

        <CheckoutButton
          assetSlug={asset.slug}
          assetTitle={asset.title}
          assetFormat={asset.format}
          price={asset.price}
          className="mt-5 w-full"
          onSuccess={(orderId) => {
            setCheckoutError(null);
            setPurchased(orderId);
          }}
          onError={(msg) => {
            setCheckoutError(msg);
          }}
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
