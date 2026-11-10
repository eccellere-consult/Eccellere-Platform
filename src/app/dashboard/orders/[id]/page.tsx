"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Clock, Loader2 } from "lucide-react";
import { inr } from "@/lib/admin/stats";
import { ORDER_STATUS_LABEL } from "@/lib/client/summary";

interface Order {
  id: string; orderNumber: string; status: string; subtotal: number; gstAmount: number; discountAmount: number; totalAmount: number; couponCode: string | null;
  paymentGateway: string | null; paymentMethod: string | null; gatewayPaymentId: string | null; invoiceUrl: string | null; createdAt: string; refundReason: string | null; canDownload: boolean;
  items: { quantity: number; unitPrice: number; totalPrice: number; asset: { id: string; title: string; category: string; description: string; author: { user: { name: string | null } } } }[];
  timeline: { event: string; at: string | null; done: boolean }[];
}
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [o, setO] = useState<Order | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch(`/api/dashboard/orders/${encodeURIComponent(id)}`).then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setO(j.order); }).catch((e) => setErr(e.message || "Could not load."));
  }, [id]);

  const back = (
    <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-light transition-colors hover:text-eccellere-gold-deep"><ArrowLeft className="h-4 w-4" />Back to Orders</Link>
  );
  if (err) return <div className="space-y-4">{back}<p className="rounded bg-red-50 p-4 text-sm text-red-800">{err}</p></div>;
  if (!o) return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading your order…</p>;

  return (
    <div className="space-y-6">
      {back}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold-deep">Order detail</p>
          <h1 className="mt-1 font-display text-3xl font-light text-eccellere-ink">{o.items[0]?.asset.title ?? "Order"}{o.items.length > 1 ? ` and ${o.items.length - 1} more` : ""}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-light">
            <span className="font-mono">{o.orderNumber}</span><span>·</span><span>{when(o.createdAt)}</span><span>·</span>
            <span className="rounded-sm bg-eccellere-cream px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold-deep">{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
          </div>
        </div>
        {o.invoiceUrl && <a href={o.invoiceUrl} className="inline-flex h-9 items-center rounded-sm border border-eccellere-border px-4 text-sm text-eccellere-ink hover:bg-eccellere-cream">Invoice</a>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {o.items.map((it) => (
            <div key={it.asset.id} className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="font-medium text-eccellere-ink">{it.asset.title}</h2>
              <p className="mt-1 text-xs text-ink-light">{it.asset.category.replace(/_/g, " ")}{it.asset.author.user.name ? ` · by ${it.asset.author.user.name}` : ""}</p>
              <p className="mt-3 line-clamp-4 text-sm text-ink-mid">{it.asset.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-mono text-eccellere-ink">{inr(it.totalPrice)}</span>
                {o.canDownload ? <Link href="/dashboard/library" className="text-eccellere-gold-deep underline">Open in my library</Link> : <span className="text-xs text-ink-light">Available after payment</span>}
              </div>
            </div>
          ))}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-eccellere-ink">Order timeline</h2>
            <div className="mt-5 space-y-4">
              {o.timeline.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  {s.done ? <CheckCircle className="mt-0.5 h-5 w-5 text-eccellere-gold-deep" /> : <Clock className="mt-0.5 h-5 w-5 text-ink-light" />}
                  <div><p className="text-sm font-medium text-eccellere-ink">{s.event}</p>{s.at && <p className="text-xs text-ink-light">{when(s.at)}</p>}</div>
                </div>
              ))}
              {o.refundReason && <p className="text-xs text-ink-light">Refund note: {o.refundReason}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-sm font-medium text-eccellere-ink">Payment summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-ink-light"><span>Subtotal</span><span className="font-mono">{inr(o.subtotal)}</span></div>
              {o.discountAmount > 0 && <div className="flex justify-between text-ink-light"><span>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</span><span className="font-mono">-{inr(o.discountAmount)}</span></div>}
              <div className="flex justify-between text-ink-light"><span>GST</span><span className="font-mono">{inr(o.gstAmount)}</span></div>
              <div className="flex justify-between border-t border-eccellere-ink/10 pt-3 font-medium text-eccellere-ink"><span>Total</span><span className="font-mono text-eccellere-gold-deep">{inr(o.totalAmount)}</span></div>
            </div>
            <div className="mt-5 space-y-2 text-xs text-ink-light">
              <div className="flex justify-between"><span>Payment method</span><span className="text-eccellere-ink">{o.paymentMethod ?? o.paymentGateway ?? "Not recorded"}</span></div>
              {o.gatewayPaymentId && <div className="flex justify-between"><span>Payment reference</span><span className="font-mono text-[10px] text-eccellere-ink">{o.gatewayPaymentId}</span></div>}
            </div>
          </div>
          <div className="rounded-lg bg-eccellere-ink p-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-eccellere-gold-light">Need help?</p>
            <p className="mt-2 text-sm text-white/80">Trouble with your purchase or download? Contact our support team.</p>
            <Link href="/contact" className="mt-3 inline-block text-sm text-eccellere-gold-light hover:underline">Contact support →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
