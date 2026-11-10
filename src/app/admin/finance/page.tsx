"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, IndianRupee, TrendingUp, Download, CreditCard, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inr, toCsv } from "@/lib/admin/stats";
import type { FinanceData } from "@/lib/admin/loaders";

const TYPE_TEXT: Record<string, string> = { sale: "text-eccellere-teal", payout: "text-eccellere-purple", refund: "text-eccellere-error" };
const TYPE_BG: Record<string, string> = { sale: "bg-eccellere-teal/10", payout: "bg-eccellere-purple/10", refund: "bg-eccellere-error/10" };
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function AdminFinance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/admin/finance")
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error ?? "Could not load Finance."); return d as FinanceData; })
      .then((d) => { if (live) setData(d); })
      .catch((e: Error) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);

  function exportCsv() {
    if (!data) return;
    const csv = toCsv([["Reference", "Type", "Description", "Amount (INR)", "Date"], ...data.transactions.map((t) => [t.id, t.type, t.description, t.amount, t.at.slice(0, 10)])]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "eccellere-transactions.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const kpis = data ? [
    { label: "Total revenue", value: inr(data.totalRevenue), note: `${data.collected.orders} paid order${data.collected.orders === 1 ? "" : "s"}`, icon: IndianRupee },
    { label: "This month", value: inr(data.thisMonth), note: data.monthChange ? `${data.monthChange} vs last month` : "No earlier month to compare", icon: TrendingUp },
    { label: "Pending payouts", value: inr(data.pendingPayouts.amount), note: `${data.pendingPayouts.specialists} specialist${data.pendingPayouts.specialists === 1 ? "" : "s"}`, icon: CreditCard },
    { label: "Refunds", value: inr(data.refunds.total), note: `${data.refunds.thisMonthCount} this month`, icon: Receipt },
  ] : [];
  const maxBar = data ? Math.max(1, ...data.months.map((m) => m.value)) : 1;

  return (
    <div className="min-h-screen bg-eccellere-cream">
      <header className="border-b border-eccellere-ink/5 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-6">
          <Link href="/admin" className="text-ink-light hover:text-eccellere-ink" aria-label="Back to the dashboard"><ChevronLeft className="h-5 w-5" /></Link>
          <h1 className="text-lg font-medium text-eccellere-ink">Finance</h1>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={exportCsv} disabled={!data || data.transactions.length === 0}><Download className="mr-2 h-4 w-4" />Download transactions (CSV)</Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8">
        {error && <p className="rounded bg-red-50 p-4 text-sm text-red-800" role="alert">{error}</p>}
        {!data && !error && <p className="text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading Finance…</p>}
        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-ink-light">{k.label}</p><k.icon className="h-4 w-4 text-ink-light" /></div>
                  <p className="mt-3 font-mono text-2xl font-medium text-eccellere-ink">{k.value}</p>
                  <p className="mt-1 text-xs text-ink-light">{k.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-sm font-medium text-eccellere-ink">Revenue by month (₹)</h2>
                <p className="mt-1 text-xs text-ink-light">Paid marketplace orders, last 10 months.</p>
                {data.months.every((m) => m.value === 0) ? <p className="mt-6 text-sm text-ink-light">No paid orders in the last 10 months yet.</p> : (
                  <div className="mt-6 flex items-end gap-2" style={{ height: 200 }}>
                    {data.months.map((m) => (
                      <div key={m.key} className="flex flex-1 flex-col items-center gap-1" title={`${m.label}: ${inr(m.value)}`}>
                        <span className="font-mono text-[9px] text-ink-light">{m.value ? (m.value >= 100000 ? `${(m.value / 100000).toFixed(1)}L` : `${Math.round(m.value / 1000)}k`) : "0"}</span>
                        <div className="w-full rounded-t bg-eccellere-gold/70 hover:bg-eccellere-gold" style={{ height: `${Math.max(2, (m.value / maxBar) * 160)}px` }} />
                        <span className="text-[10px] text-ink-light">{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-sm font-medium text-eccellere-ink">What was collected</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-ink-mid">Toolkit prices</dt><dd className="font-mono">{inr(data.collected.subtotal)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-mid">GST collected</dt><dd className="font-mono">{inr(data.collected.gst)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-mid">Discounts given</dt><dd className="font-mono">−{inr(data.collected.discounts)}</dd></div>
                  <div className="flex justify-between border-t border-eccellere-ink/10 pt-3 font-medium"><dt>Total paid</dt><dd className="font-mono">{inr(data.collected.total)}</dd></div>
                </dl>
                <p className="mt-4 text-[11px] text-ink-light">Marketplace orders only. Consulting engagements and subscriptions are not tracked on this screen yet.</p>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-eccellere-ink/5 px-6 py-4">
                <h2 className="text-sm font-medium text-eccellere-ink">Recent transactions</h2>
                <span className="text-xs text-ink-light">Sales, refunds and processed payouts</span>
              </div>
              {data.transactions.length === 0 ? <p className="px-6 py-8 text-sm text-ink-light">No transactions yet.</p> : (
                <div className="divide-y divide-eccellere-ink/5">
                  {data.transactions.map((t) => (
                    <div key={t.type + t.id + t.at} className="flex items-center gap-4 px-6 py-3.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${TYPE_BG[t.type]}`}>
                        {t.type === "sale" ? <TrendingUp className={`h-4 w-4 ${TYPE_TEXT[t.type]}`} /> : t.type === "payout" ? <CreditCard className={`h-4 w-4 ${TYPE_TEXT[t.type]}`} /> : <Receipt className={`h-4 w-4 ${TYPE_TEXT[t.type]}`} />}
                      </div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm text-eccellere-ink">{t.description}</p><p className="text-xs text-ink-light">{t.id}</p></div>
                      <div className="text-right"><p className={`font-mono text-sm ${TYPE_TEXT[t.type]}`}>{t.amount >= 0 ? "+" : "−"}{inr(Math.abs(t.amount))}</p><p className="text-[10px] text-ink-light">{day(t.at)}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
