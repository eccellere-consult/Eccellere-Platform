"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  assetSlug: string;
  assetTitle: string;
  assetFormat: string;
  price: number; // in rupees
  className?: string;
  children?: React.ReactNode;
  onSuccess?: (orderId: string) => void;
  onError?: (message: string) => void;
}

// Minimal type for the Razorpay checkout instance
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function CheckoutButton({
  assetSlug,
  assetTitle,
  assetFormat,
  price,
  className,
  children,
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Create Razorpay order on server
      const orderRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price * 100, // convert to paise
          assetSlug,
          assetTitle,
        }),
      });

      if (orderRes.status === 401) {
        // Not logged in — redirect to sign in
        window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({ error: "Payment initiation failed" }));
        throw new Error(err.error ?? "Payment initiation failed");
      }

      const orderData = await orderRes.json();

      // 2. If mock order (dev, no Razorpay keys), simulate success
      if (orderData.mock) {
        const verifyRes = await fetch("/api/payments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayOrderId: orderData.orderId,
            razorpayPaymentId: `mock_pay_${Date.now()}`,
            razorpaySignature: "mock_signature",
            assetSlug,
            assetTitle,
            assetFormat,
            amount: price * 100,
          }),
        });
        if (!verifyRes.ok) throw new Error("Order creation failed");
        const { order } = await verifyRes.json();
        onSuccess?.(order.id);
        setLoading(false);
        return;
      }

      // 3. Load Razorpay checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        throw new Error("Unable to load payment gateway. Please try again.");
      }

      // 4. Open Razorpay modal
      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Eccellere Consulting",
        description: assetTitle,
        order_id: orderData.orderId,
        theme: { color: "#B8913A" },
        handler: async (response: RazorpayResponse) => {
          try {
            // 5. Verify payment signature server-side
            const verifyRes = await fetch("/api/payments", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                assetSlug,
                assetTitle,
                assetFormat,
                amount: price * 100,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({ error: "Verification failed" }));
              throw new Error(err.error ?? "Payment verification failed");
            }

            const { order } = await verifyRes.json();
            onSuccess?.(order.id);
          } catch (err) {
            onError?.(err instanceof Error ? err.message : "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      rzp.open();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      onError?.(message);
      setLoading(false);
    }
  }, [assetSlug, assetTitle, assetFormat, price, onSuccess, onError]);

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className={className}
      aria-label={loading ? "Processing payment…" : `Buy ${assetTitle}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing…
        </>
      ) : (
        children ?? (
          <>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Buy Now — ₹{price.toLocaleString("en-IN")}
          </>
        )
      )}
    </Button>
  );
}
