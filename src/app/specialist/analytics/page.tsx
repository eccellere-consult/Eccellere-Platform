"use client";

import { useEffect, useState } from "react";
import { Download, Eye, Loader2, Star, TrendingUp } from "lucide-react";
import { inr } from "@/lib/admin/stats";

interface Data {
  views: number; purchases: number; avgRating: number | null; conversionPct: number | null; revenue: number;
  monthlySales: { key: string; label: string; value: number }[];
  assets: { id: string; title: string; status: string; totalViews: number; totalPurchases: number; averageRating: number | null; totalRevenue: number }[];
}

export default function SpecialistAnalyticsPage() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/specialist/analytics").then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setD(j); }).catch((e) => setErr(e.message || "Could not load."));
  }, []);
  if (err) return <p className="rounded bg-red-50 p-4 text-sm text-red-800">{err}</p>;
  if (!d) return <p className="py-10 text-sm text-ink-mid"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading your analytics…</p>;
  const max = Math.max(1, ...d.monthlySales.map((m) => m.value));
  const kpi = (label: string, value: string, Icon: typeof Eye) => (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-wider text-ink-light">{label}</p><Icon className="h-4 w-4 text-ink-light" /></div>
      <p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">{value}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold-deep">Analytics</p>
      <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">Performance Analytics</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {kpi("Total views", d.views.toLocaleString("en-IN"), Eye)}
        {kpi("Purchases", d.purchases.toLocaleString("en-IN"), Download)}
        {kpi("Average rating", d.avgRating !== null ? String(d.avgRating) : "No ratings yet", Star)}
        {kpi("Purchases per 100 views", d.conversionPct !== null ? `${d.conversionPct}%` : "No views yet", TrendingUp)}
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-eccellere-ink">Sales of your assets per month, last six months (₹)</h2>
        <p className="mt-1 text-xs text-ink-light">Total sales value of paid orders, before the platform fee. Total revenue to date: {inr(d.revenue)}.</p>
        <div className="mt-6 flex items-end gap-3" style={{ height: 200 }}>
          {d.monthlySales.map((m) => (
            <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-ink-light">{m.value ? inr(m.value) : "–"}</span>
              <div className="w-full rounded-t bg-eccellere-gold/70" style={{ height: `${Math.max(2, (m.value / max) * 150)}px` }} />
              <span className="text-[10px] text-ink-light">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white shadow-sm">
        <div className="border-b border-eccellere-ink/5 px-6 py-4"><h2 className="text-sm font-medium text-eccellere-ink">Per-asset performance</h2></div>
        {d.assets.length === 0 ? <p className="px-6 py-8 text-sm text-ink-mid">You have not submitted an asset yet. Once you do, its views, purchases and revenue appear here.</p> : (
          <div className="divide-y divide-eccellere-ink/5">
            {d.assets.map((a) => (
              <div key={a.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-medium text-eccellere-ink">{a.title}</p><p className="text-xs text-ink-light">{a.status.replace(/_/g, " ").toLowerCase()}</p></div>
                <div className="flex items-center gap-6 text-xs text-ink-light">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{a.totalViews}</span>
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" />{a.totalPurchases}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-eccellere-gold" />{a.averageRating && a.averageRating > 0 ? a.averageRating : "–"}</span>
                  <span className="font-mono text-sm text-eccellere-gold-deep">{inr(a.totalRevenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
