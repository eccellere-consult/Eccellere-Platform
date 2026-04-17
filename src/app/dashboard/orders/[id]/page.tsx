"use client";

import Link from "next/link";
import { ArrowLeft, Download, CheckCircle, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock order data — in production this would be fetched from the DB by ID
const order = {
  id: "ORD-2041",
  asset: "MSME Growth Strategy Playbook",
  category: "Strategy",
  specialist: "Dr. Priya Malhotra",
  specialistTitle: "Strategy Consultant",
  date: "Apr 10, 2026",
  amount: "₹4,999",
  tax: "₹900",
  subtotal: "₹4,099",
  payment: "Razorpay",
  paymentRef: "pay_PX8xqLmNKT2941",
  status: "completed",
  format: "PDF",
  size: "3.2 MB",
  description:
    "A comprehensive 80-page growth strategy playbook tailored for manufacturing and retail MSMEs, covering market expansion, operational efficiency, and digital adoption frameworks.",
  timeline: [
    { event: "Order placed", time: "Apr 10, 2026, 10:42 AM", done: true },
    { event: "Payment confirmed", time: "Apr 10, 2026, 10:43 AM", done: true },
    { event: "Asset delivered", time: "Apr 10, 2026, 10:43 AM", done: true },
  ],
};

export default function OrderDetailPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm text-ink-light transition-colors hover:text-eccellere-gold"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">
            Order Detail
          </p>
          <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">{order.asset}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-light">
            <span className="font-mono">{order.id}</span>
            <span>·</span>
            <span>{order.date}</span>
            <span>·</span>
            <span className="rounded-sm bg-eccellere-teal/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-teal">
              {order.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            Download Asset
          </Button>
          <Button variant="outline" size="sm">
            Invoice PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Asset + Timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Asset detail */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-eccellere-gold/10">
                <Package className="h-6 w-6 text-eccellere-gold" />
              </div>
              <div>
                <h2 className="font-medium text-eccellere-ink">{order.asset}</h2>
                <p className="mt-0.5 text-sm text-ink-light">
                  {order.category} · {order.format} · {order.size}
                </p>
                <p className="mt-3 text-sm text-ink-mid">{order.description}</p>
                <p className="mt-3 text-xs text-ink-light">
                  By{" "}
                  <span className="font-medium text-eccellere-ink">{order.specialist}</span>
                  {" — "}
                  {order.specialistTitle}
                </p>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-eccellere-ink">Order Timeline</h2>
            <div className="mt-5 space-y-4">
              {order.timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5 flex flex-shrink-0 items-center justify-center">
                    {step.done ? (
                      <CheckCircle className="h-5 w-5 text-eccellere-teal" />
                    ) : (
                      <Clock className="h-5 w-5 text-ink-light" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-eccellere-ink">{step.event}</p>
                    <p className="text-xs text-ink-light">{step.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Payment summary */}
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-eccellere-ink">Payment Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-ink-light">
                <span>Subtotal</span>
                <span className="font-mono">{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-ink-light">
                <span>GST (18%)</span>
                <span className="font-mono">{order.tax}</span>
              </div>
              <div className="border-t border-eccellere-ink/10 pt-3">
                <div className="flex justify-between font-medium text-eccellere-ink">
                  <span>Total Paid</span>
                  <span className="font-mono text-eccellere-gold">{order.amount}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-2 text-xs text-ink-light">
              <div className="flex justify-between">
                <span>Payment Method</span>
                <span className="text-eccellere-ink">{order.payment}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Ref</span>
                <span className="font-mono text-[10px] text-eccellere-ink">{order.paymentRef}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-eccellere-ink p-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-eccellere-gold">
              Need help?
            </p>
            <p className="mt-2 text-sm text-white/80">
              Having trouble with your asset or download? Contact our support team.
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-block text-sm text-eccellere-gold hover:underline"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
