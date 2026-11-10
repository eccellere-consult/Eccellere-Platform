"use client";

import { useEffect, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { inr } from "@/lib/admin/stats";

interface Payments {
  paidTotal: number; pendingTotal: number; thisMonthPaid: number;
  nextPayout: { amount: number; date: string } | null;
  monthly: { key: string; label: string; value: number }[];
  breakdown: { source: string; gross: number; sharePct: number }[];
  history: { id: string; grossAmount: number; platformFee: number; tdsAmount: number; netAmount: number; description: string; sourceType: string; status: string; scheduledDate: string; processedAt: string | null }[];
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const STATUS: Record<string, string> = { PROCESSED: "Paid", SCHEDULED: "Scheduled", PROCESSING: "Processing", FAILED: "Failed", ON_HOLD: "On hold", DISPUTED: "Disputed" };

export default function SpecialistPaymentsPage() {
  const [d, setD] = useState<Payments | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/specialist/payments").then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setD(j); }).catch((e) => setErr(e.message || "Could not load."));
  }, []);

  if (err) return <p className="rounded bg-red-50 p-4 text-sm text-red-800">{err}</p>;
  if (!d) return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading your earnings…</p>;
  const maxBar = Math.max(1, ...d.monthly.map((m) => m.value));

  return (
    <div className="mx-auto max-w-[1280px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold-deep">Earnings</p>
      <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">Earnings &amp; Payouts</h1>
      <p className="mt-1 text-sm text-ink-mid">Amounts are what reaches your bank, after the platform fee and tax deducted at source.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm"><p className="text-xs uppercase tracking-wider text-ink-light">Paid to you so far</p><p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">{inr(d.paidTotal)}</p><p className="mt-1 text-xs text-ink-light">{inr(d.thisMonthPaid)} this month</p></div>
        <div className="rounded-lg bg-white p-6 shadow-sm"><p className="text-xs uppercase tracking-wider text-ink-light">On its way</p><p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">{inr(d.pendingTotal)}</p><p className="mt-1 text-xs text-ink-light">Scheduled, processing or on hold</p></div>
        <div className="rounded-lg bg-white p-6 shadow-sm"><p className="text-xs uppercase tracking-wider text-ink-light">Next payout</p>
          {d.nextPayout ? (<><p className="mt-2 font-mono text-2xl font-medium text-eccellere-gold-deep">{inr(d.nextPayout.amount)}</p><p className="mt-1 flex items-center gap-1 text-xs text-ink-light"><Calendar className="h-3 w-3" />{day(d.nextPayout.date)}</p></>) : (<p className="mt-2 text-sm text-ink-mid">Nothing scheduled yet.</p>)}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-medium text-eccellere-ink">Paid per month, last six months (₹)</h2>
          <div className="mt-6 flex items-end gap-3" style={{ height: 200 }}>
            {d.monthly.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-ink-light">{m.value ? inr(m.value) : "–"}</span>
                <div className="w-full rounded-t bg-eccellere-gold/70" style={{ height: `${Math.max(2, (m.value / maxBar) * 150)}px` }} />
                <span className="text-[10px] text-ink-light">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-eccellere-ink">Where it came from</h2>
          {d.breakdown.length === 0 ? <p className="mt-4 text-sm text-ink-mid">No payouts yet.</p> : (
            <div className="mt-4 space-y-4">
              {d.breakdown.map((b) => (
                <div key={b.source}>
                  <div className="flex items-center justify-between text-sm"><span className="capitalize text-ink-mid">{b.source.replace(/[_-]+/g, " ").toLowerCase()} ({b.sharePct}%)</span><span className="font-mono text-eccellere-gold-deep">{inr(b.gross)}</span></div>
                  <div className="mt-1.5 h-2 rounded-full bg-eccellere-cream"><div className="h-full rounded-full bg-eccellere-gold" style={{ width: `${b.sharePct}%` }} /></div>
                </div>
              ))}
              <p className="text-xs text-ink-light">Before fees and tax.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white shadow-sm">
        <div className="border-b border-eccellere-ink/5 px-6 py-4"><h2 className="text-sm font-medium text-eccellere-ink">Payout history</h2></div>
        {d.history.length === 0 ? <p className="px-6 py-8 text-sm text-ink-mid">No payouts yet. When your assets sell or an assignment is completed, the payout appears here.</p> : (
          <div className="divide-y divide-eccellere-ink/5">
            {d.history.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-eccellere-ink">{p.description}</p>
                  <p className="text-xs text-ink-light">{day(p.processedAt ?? p.scheduledDate)} · gross {inr(p.grossAmount)}, fee {inr(p.platformFee)}, tax {inr(p.tdsAmount)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-sm bg-eccellere-cream px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-gold-deep">{STATUS[p.status] ?? p.status}</span>
                  <span className="font-mono text-sm text-eccellere-ink">{inr(p.netAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
