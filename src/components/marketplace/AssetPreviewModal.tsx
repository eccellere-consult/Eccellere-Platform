"use client";

import { useEffect, useRef } from "react";
import { X, Check, Star, Shield, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Asset } from "@/lib/marketplace-data";
import Link from "next/link";

interface AssetPreviewModalProps {
  asset: Asset;
  onClose: () => void;
}

export function AssetPreviewModal({ asset, onClose }: AssetPreviewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    // Prevent body scroll while modal open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Close on backdrop click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  const formatPrice = (p: number) => "₹" + p.toLocaleString("en-IN");

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-eccellere-ink/60 px-4 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-eccellere-cream shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-eccellere-ink/10 px-6 py-5">
          <div>
            <span
              className={cn(
                "inline-block rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                asset.categoryColor
              )}
            >
              {asset.category}
            </span>
            <h2 className="mt-2 font-display text-xl font-light text-eccellere-ink leading-snug">
              {asset.title}
            </h2>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-light">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-eccellere-gold text-eccellere-gold" />
                {asset.rating} ({asset.reviews} reviews)
              </span>
              <span>{asset.format}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="mt-1 rounded p-1 text-ink-light transition-colors hover:bg-eccellere-ink/10 hover:text-eccellere-ink shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-light">
              About this resource
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-mid">
              {asset.longDescription || asset.description}
            </p>
          </div>

          {/* What's included */}
          {asset.includes.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-light">
                What&apos;s included
              </h3>
              <ul className="mt-3 space-y-2">
                {asset.includes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink-mid">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-eccellere-teal" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contents preview */}
          {asset.previewItems.length > 0 && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-light">
                Contents preview
              </h3>
              <div className="mt-3 space-y-2">
                {asset.previewItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded bg-white p-3 text-sm text-ink-mid shadow-sm"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-eccellere-gold/10 text-xs font-medium text-eccellere-gold">
                      {i + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sectors */}
          {asset.sectors.length > 0 && asset.sectors[0] !== "All Sectors" && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-ink-light">
                Sectors
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {asset.sectors.map((s) => (
                  <span
                    key={s}
                    className="rounded-sm bg-eccellere-ink/5 px-2.5 py-1 text-xs text-ink-mid"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 rounded bg-white p-4 shadow-sm text-xs text-ink-mid">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0 text-eccellere-teal" />
              14-day money-back guarantee
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 shrink-0 text-eccellere-teal" />
              Instant download after purchase
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-eccellere-teal" />
              India-specific content
            </div>
          </div>
        </div>

        {/* Footer — price + CTA */}
        <div className="flex items-center justify-between gap-4 border-t border-eccellere-ink/10 px-6 py-4">
          <div>
            <span className="font-mono text-2xl font-light text-eccellere-ink">
              {formatPrice(asset.price)}
            </span>
            {asset.originalPrice && (
              <span className="ml-2 text-sm text-ink-light line-through">
                {formatPrice(asset.originalPrice)}
              </span>
            )}
            <p className="text-xs text-ink-light">Inclusive of GST</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button asChild>
              <Link href={`/marketplace/${asset.slug}`}>
                View Full Details
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
