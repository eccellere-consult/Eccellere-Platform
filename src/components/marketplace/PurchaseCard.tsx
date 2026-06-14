"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, CheckCircle, AlertCircle, Tag, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { CheckoutButton } from "@/components/marketplace/CheckoutButton";
import { AssetSamplePreviewModal } from "@/components/marketplace/AssetSamplePreviewModal";
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
  const [purchased, setPurchased] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Available coupons fetched from API
  type AvailableCoupon = {
    code: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    minOrderAmount: number | null;
    validUntil: string;
  };
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [offersOpen, setOffersOpen] = useState(false);

  useEffect(() => {
    fetch("/api/coupons")
      .then((r) => r.json())
      .then((d) => setAvailableCoupons(d.coupons ?? []))
      .catch(() => {/* silent — coupon list is optional */});
  }, []);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    couponId: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);

  const effectivePrice = appliedCoupon ? appliedCoupon.finalAmount : asset.price;

  const applyCode = async (code: string) => {
    setCouponValidating(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase(), orderAmount: asset.price }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: code.trim().toUpperCase(), couponId: data.couponId, discountAmount: data.discountAmount, finalAmount: data.finalAmount });
        setCouponInput("");
        setOffersOpen(false);
      } else {
        setCouponError(data.reason ?? "Invalid coupon");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInput("");
  };

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
      <AssetSamplePreviewModal
        slug={asset.slug}
        title={asset.title}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxPages={8}
      />

      <div className="rounded-lg bg-white p-6 shadow-md">
        {/* Price */}
        <div className="flex items-end gap-3">
          <span className="font-mono text-3xl font-light text-eccellere-ink">
            {formatPrice(effectivePrice)}
          </span>
          {appliedCoupon ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-light line-through">{formatPrice(asset.price)}</span>
              <span className="rounded bg-eccellere-teal/10 px-1.5 py-0.5 text-xs font-medium text-eccellere-teal">
                −{formatPrice(appliedCoupon.discountAmount)}
              </span>
            </div>
          ) : asset.originalPrice && discount ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-light line-through">{formatPrice(asset.originalPrice)}</span>
              <span className="rounded bg-eccellere-teal/10 px-1.5 py-0.5 text-xs font-medium text-eccellere-teal">
                {discount}% off
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-1 text-xs text-ink-light">Inclusive of GST</div>

        {/* Coupon section */}
        <div className="mt-4">
          {appliedCoupon ? (
            /* Applied state */
            <div className="flex items-center justify-between rounded-md border border-eccellere-teal/30 bg-eccellere-teal/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-eccellere-teal" />
                <span className="font-mono text-xs font-semibold text-eccellere-teal">{appliedCoupon.code}</span>
                <span className="text-xs text-ink-mid">applied — saving {formatPrice(appliedCoupon.discountAmount)}</span>
              </div>
              <button onClick={removeCoupon} className="rounded p-1 text-ink-light hover:text-eccellere-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div>
              {/* Available offers toggle */}
              {availableCoupons.length > 0 && (
                <button
                  onClick={() => setOffersOpen((o) => !o)}
                  className="flex w-full items-center justify-between rounded-md border border-eccellere-gold/30 bg-eccellere-gold/5 px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-eccellere-gold" />
                    <span className="text-xs font-medium text-eccellere-gold">
                      {availableCoupons.length} offer{availableCoupons.length > 1 ? "s" : ""} available
                    </span>
                  </div>
                  {offersOpen
                    ? <ChevronUp className="h-3.5 w-3.5 text-eccellere-gold" />
                    : <ChevronDown className="h-3.5 w-3.5 text-eccellere-gold" />}
                </button>
              )}

              {/* Offers list */}
              {offersOpen && (
                <div className="mt-1 overflow-hidden rounded-md border border-eccellere-ink/10 bg-white shadow-sm">
                  {availableCoupons.map((c) => {
                    const saving = c.discountType === "percentage"
                      ? `${c.discountValue}% off`
                      : `₹${c.discountValue} off`;
                    const eligible = c.minOrderAmount === null || asset.price >= c.minOrderAmount;
                    return (
                      <div
                        key={c.code}
                        className="flex items-center justify-between border-b border-eccellere-ink/5 px-3 py-2.5 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-eccellere-ink/5 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-eccellere-ink">
                              {c.code}
                            </code>
                            <span className="text-[11px] font-medium text-eccellere-gold">{saving}</span>
                          </div>
                          {c.description && (
                            <p className="mt-0.5 truncate text-[10px] text-ink-light">{c.description}</p>
                          )}
                          {!eligible && c.minOrderAmount && (
                            <p className="mt-0.5 text-[10px] text-amber-500">
                              Min. order {formatPrice(c.minOrderAmount)} required
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => applyCode(c.code)}
                          disabled={!eligible || couponValidating}
                          className="ml-3 shrink-0 rounded-md bg-eccellere-gold px-2.5 py-1 text-[11px] font-medium text-white hover:bg-eccellere-gold/90 disabled:opacity-40"
                        >
                          {couponValidating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Manual entry */}
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && applyCode(couponInput)}
                  placeholder={availableCoupons.length > 0 ? "Or enter code manually" : "Coupon code"}
                  className="flex-1 rounded-md border border-eccellere-ink/10 bg-eccellere-cream/50 px-3 py-2 text-sm uppercase placeholder:normal-case placeholder:text-ink-light focus:border-eccellere-gold focus:outline-none focus:ring-1 focus:ring-eccellere-gold"
                />
                <button
                  onClick={() => applyCode(couponInput)}
                  disabled={!couponInput.trim() || couponValidating}
                  className="rounded-md bg-eccellere-ink/5 px-3 py-2 text-xs font-medium text-eccellere-ink hover:bg-eccellere-ink/10 disabled:opacity-50"
                >
                  {couponValidating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                </button>
              </div>
            </div>
          )}
          {couponError && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" /> {couponError}
            </p>
          )}
        </div>

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
          price={effectivePrice}
          couponCode={appliedCoupon?.code}
          couponId={appliedCoupon?.couponId}
          discountAmount={appliedCoupon?.discountAmount ?? 0}
          className="mt-5 w-full"
          onSuccess={(orderId) => {
            setCheckoutError(null);
            setPurchased(orderId);
          }}
          onError={(msg) => {
            setCheckoutError(msg);
          }}
        >
          Buy Now — {formatPrice(effectivePrice)}
        </CheckoutButton>

        <Button
          variant="outline"
          className="mt-3 w-full"
          size="lg"
          onClick={() => setPreviewOpen(true)}
        >
          Preview Sample
        </Button>

        <p className="mt-2 text-center text-[11px] italic text-ink-light">
          Refresh the browser if preview not loaded
        </p>

        <div className="mt-5 space-y-2.5 border-t border-eccellere-ink/5 pt-5 text-xs text-ink-mid">
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
