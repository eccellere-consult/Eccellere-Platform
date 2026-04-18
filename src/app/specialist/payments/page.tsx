"use client";

import { IndianRupee, ArrowUpRight, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const earningsMonthly = [
  { month: "Nov", value: 28 },
  { month: "Dec", value: 35 },
  { month: "Jan", value: 42 },
  { month: "Feb", value: 38 },
  { month: "Mar", value: 52 },
  { month: "Apr", value: 48 },
];

const payouts = [
  { date: "Mar 31, 2026", amount: "₹52,000", status: "paid", method: "Bank Transfer" },
  { date: "Feb 28, 2026", amount: "₹38,000", status: "paid", method: "Bank Transfer" },
  { date: "Jan 31, 2026", amount: "₹42,000", status: "paid", method: "Bank Transfer" },
  { date: "Dec 31, 2025", amount: "₹35,000", status: "paid", method: "Bank Transfer" },
];

export default function SpecialistPaymentsPage() {
  const maxBar = Math.max(...earningsMonthly.map((d) => d.value));

  return (
    <div className="mx-auto max-w-[1280px]">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eccellere-gold">Earnings</p>
      <h1 className="mt-2 font-display text-3xl font-light text-eccellere-ink">Earnings & Payouts</h1>

      {/* KPI cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-ink-light">Total Earnings</p>
          <p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">₹3,42,500</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-eccellere-teal"><ArrowUpRight className="h-3 w-3" />+26% vs last quarter</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-ink-light">This Month</p>
          <p className="mt-2 font-mono text-2xl font-medium text-eccellere-ink">₹48,250</p>
          <p className="mt-1 text-xs text-ink-light">From 3 sources</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-ink-light">Next Payout</p>
          <p className="mt-2 font-mono text-2xl font-medium text-eccellere-gold">₹48,250</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-light"><Calendar className="h-3 w-3" />Apr 30, 2026</p>
        </div>
      </div>

      {/* Chart + Breakdown */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-medium text-eccellere-ink">Monthly Earnings (₹ Thousands)</h2>
          <div className="mt-6 flex items-end gap-3" style={{ height: 200 }}>
            {earningsMonthly.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-[10px] text-ink-light">₹{d.value}K</span>
                <div className="w-full rounded-t bg-eccellere-gold/70 transition-all hover:bg-eccellere-gold" style={{ height: `${(d.value / maxBar) * 160}px` }} />
                <span className="text-[10px] text-ink-light">{d.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-eccellere-ink">Breakdown</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm"><span className="text-ink-mid">Asset Sales (60%)</span><span className="font-mono text-eccellere-gold">₹2,05,500</span></div>
              <div className="mt-1.5 h-2 rounded-full bg-eccellere-cream"><div className="h-full w-[60%] rounded-full bg-eccellere-gold" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm"><span className="text-ink-mid">Assignments (35%)</span><span className="font-mono text-eccellere-gold">₹1,19,875</span></div>
              <div className="mt-1.5 h-2 rounded-full bg-eccellere-cream"><div className="h-full w-[35%] rounded-full bg-eccellere-purple" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm"><span className="text-ink-mid">Bonuses (5%)</span><span className="font-mono text-eccellere-gold">₹17,125</span></div>
              <div className="mt-1.5 h-2 rounded-full bg-eccellere-cream"><div className="h-full w-[5%] rounded-full bg-eccellere-teal" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div className="mt-8 rounded-lg bg-white shadow-sm">
        <div className="border-b border-eccellere-ink/5 px-6 py-4">
          <h2 className="text-sm font-medium text-eccellere-ink">Payout History</h2>
        </div>
        <div className="divide-y divide-eccellere-ink/5">
          {payouts.map((p) => (
            <div key={p.date} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm text-eccellere-ink">{p.date}</p>
                <p className="text-xs text-ink-light">{p.method}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-sm bg-eccellere-teal/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-eccellere-teal">{p.status}</span>
                <span className="font-mono text-sm text-eccellere-gold">{p.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
